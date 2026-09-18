#!/usr/bin/env node

import { existsSync, globSync, readFileSync } from 'node:fs'
import { isAbsolute, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  checkExecutionRegisterText,
  REGISTER_END,
  REGISTER_START,
} from './execution-register.mjs'

const ROLES = new Set(['evidence', 'validation', 'design', 'archive'])
const ROLE_MARKER = /execution-role: (canonical|evidence|validation|design|archive)/g
const DEFAULT_CONFIG = 'tools/execution-plan/config.json'

function portable(path) {
  return path.split(sep).join('/')
}

function safeRelativePath(value, label) {
  if (typeof value !== 'string' || value.length === 0 || isAbsolute(value)) {
    throw new Error(`${label} must be a non-empty repository-relative path.`)
  }
  const path = portable(normalize(value))
  if (path === '..' || path.startsWith('../')) throw new Error(`${label} escapes the repository.`)
  return path
}

function stringList(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || !item)) {
    throw new Error(`${label} must be a non-empty string array.`)
  }
  return value
}

export function readExecutionConfig(root, configPath = DEFAULT_CONFIG) {
  const relativeConfig = safeRelativePath(configPath, 'Config path')
  const absolute = join(root, relativeConfig)
  let config
  try {
    config = JSON.parse(readFileSync(absolute, 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read execution-plan config ${relativeConfig}: ${error.message}`)
  }
  if (config?.schema !== 1) throw new Error('Execution-plan config schema must be 1.')
  const canonical = safeRelativePath(config.canonical, 'Canonical path')
  const requiredGlobs = stringList(config.requiredGlobs, 'requiredGlobs')
  if (!config.roles || typeof config.roles !== 'object' || Array.isArray(config.roles)) {
    throw new Error('roles must be an object keyed by execution role.')
  }
  const roles = {}
  for (const [role, patterns] of Object.entries(config.roles)) {
    if (!ROLES.has(role)) throw new Error(`Unknown execution role in config: ${role}`)
    roles[role] = stringList(patterns, `roles.${role}`)
  }
  return { canonical, requiredGlobs, roles }
}

function matches(root, patterns) {
  return new Set(patterns.flatMap((pattern) => globSync(pattern, { cwd: root })).map(portable))
}

export function checkExecutionProject({ root = process.cwd(), configPath = DEFAULT_CONFIG } = {}) {
  const findings = []
  let config
  try {
    config = readExecutionConfig(root, configPath)
  } catch (error) {
    return [error.message]
  }

  if (!existsSync(join(root, config.canonical))) {
    return [`Canonical execution document does not exist: ${config.canonical}`]
  }

  const required = matches(root, config.requiredGlobs)
  required.add(config.canonical)
  const assigned = new Map([[config.canonical, new Set(['canonical'])]])
  for (const [role, patterns] of Object.entries(config.roles)) {
    for (const path of matches(root, patterns)) {
      required.add(path)
      const roles = assigned.get(path) ?? new Set()
      roles.add(role)
      assigned.set(path, roles)
    }
  }

  for (const path of [...required].toSorted()) {
    const roles = assigned.get(path) ?? new Set()
    if (roles.size !== 1) {
      findings.push(`${path} must have exactly one configured execution role; found ${[...roles].join(', ') || 'none'}`)
      continue
    }
    const role = [...roles][0]
    const text = readFileSync(join(root, path), 'utf8')
    const markers = [...text.matchAll(ROLE_MARKER)].map((match) => match[1])
    if (markers.length !== 1) {
      findings.push(`${path} must declare exactly one execution-role marker; found ${markers.length}`)
    } else if (markers[0] !== role) {
      findings.push(`${path} declares execution role ${markers[0]}; expected ${role}`)
    }
    if (role !== 'canonical' && (text.includes(REGISTER_START) || text.includes(REGISTER_END))) {
      findings.push(`${path} is noncanonical but contains an execution-register marker`)
    }
    if (role !== 'canonical' && /^#{1,6} .*proposed sequencing/im.test(text)) {
      findings.push(`${path} is noncanonical but declares a proposed-sequencing section`)
    }
    if (role !== 'canonical' && /\*\*Remaining, in order:\*\*/i.test(text)) {
      findings.push(`${path} is noncanonical but declares remaining work in order`)
    }
  }

  const canonicalText = readFileSync(join(root, config.canonical), 'utf8')
  findings.push(...checkExecutionRegisterText(canonicalText, config.canonical))
  return findings
}

export function commandPlan(args) {
  if (args.length === 0) return { configPath: DEFAULT_CONFIG }
  if (args.length === 1 && !args[0].startsWith('-')) return { configPath: args[0] }
  throw new Error(`Usage: node ${DEFAULT_CONFIG.replace('/config.json', '/check-execution-plan.mjs')} [config-path]`)
}

function main() {
  let plan
  try {
    plan = commandPlan(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    return 2
  }
  const findings = checkExecutionProject({ root: process.cwd(), configPath: plan.configPath })
  if (findings.length > 0) {
    process.stderr.write(`Execution-plan integrity failed:\n${findings.map((finding) => `- ${finding}`).join('\n')}\n`)
    return 1
  }
  const config = readExecutionConfig(process.cwd(), plan.configPath)
  process.stdout.write(`Execution-plan integrity passed: ${config.canonical}\n`)
  return 0
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main()
