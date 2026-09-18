import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ARTIFACT_SHA256,
  REPORT_VERIFICATION_PROOFS,
  REQUIRED_ARTIFACT_FILES,
  SKILL_NAME,
  SKILL_VERIFICATION_PROOFS,
} from './artifact.mjs'

const SOURCE_ROOT = fileURLToPath(new URL('..', import.meta.url))

function frontmatterValue(markdown, key) {
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(markdown)?.[1] ?? ''
  return new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(frontmatter)?.[1]?.trim() ?? ''
}

function filesBelow(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return filesBelow(root, path)
    return [relative(root, path).split(sep).join('/')]
  })
}

function includesNormalized(text, expected) {
  return text.replace(/\s+/g, ' ').includes(expected.replace(/\s+/g, ' '))
}

export function validateSkill(root = SOURCE_ROOT, { artifactOnly = false } = {}) {
  const problems = []
  for (const file of REQUIRED_ARTIFACT_FILES) {
    const path = join(root, file)
    if (!existsSync(path) || !statSync(path).isFile()) problems.push(`missing artifact file: ${file}`)
  }
  if (problems.length > 0) return problems

  for (const file of REQUIRED_ARTIFACT_FILES) {
    const actual = createHash('sha256').update(readFileSync(join(root, file))).digest('hex')
    if (actual !== ARTIFACT_SHA256[file]) problems.push(`artifact checksum changed: ${file}`)
  }
  if (artifactOnly) {
    const discovered = filesBelow(root).toSorted()
    const expected = [...REQUIRED_ARTIFACT_FILES].toSorted()
    if (JSON.stringify(discovered) !== JSON.stringify(expected)) {
      problems.push(`installed artifact files differ: expected ${expected.join(', ')}`)
    }
    for (const file of REQUIRED_ARTIFACT_FILES) {
      if (lstatSync(join(root, file)).isSymbolicLink()) {
        problems.push(`installed artifact must not contain a symlink: ${file}`)
      }
    }
  }

  const skill = readFileSync(join(root, 'SKILL.md'), 'utf8')
  const lines = skill.split('\n').length
  if (lines > 500) problems.push(`SKILL.md has ${lines} lines; maximum is 500`)
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1]
  if (!frontmatter || (skill.match(/^---$/gm) ?? []).length !== 2) {
    problems.push('SKILL.md must contain one valid frontmatter block')
  } else {
    for (const field of ['name', 'description']) {
      if ((frontmatter.match(new RegExp(`^${field}:`, 'gm')) ?? []).length !== 1) {
        problems.push(`SKILL.md frontmatter must define ${field} exactly once`)
      }
    }
  }
  if (frontmatterValue(skill, 'name') !== SKILL_NAME) {
    problems.push(`SKILL.md name must be ${SKILL_NAME}`)
  }
  const description = frontmatterValue(skill, 'description')
  if (description.length === 0 || description.length > 1024) {
    problems.push('SKILL.md description must contain 1–1024 characters')
  }
  for (const term of ['execution plan', 'Node', 'Markdown']) {
    if (!description.includes(term)) problems.push(`SKILL.md description must name ${term}`)
  }

  for (const mode of ['audit', 'apply', 'verify']) {
    const matches = skill.match(new RegExp(`^## Mode: ${mode}$`, 'gm')) ?? []
    if (matches.length !== 1) problems.push(`SKILL.md must define Mode: ${mode} exactly once`)
  }
  for (const invariant of [
    'Never combine `audit` and `apply` in one uninterrupted pass. An audit ends at a user decision.',
    'Do not advance `NOW`, close a task, or schedule an `OPEN` item merely because the documentation was restructured.',
    'Report `UNSUPPORTED PROFILE` and stop when Node.js 22 cannot be part of the repository\'s validation environment.',
  ]) {
    if (!includesNormalized(skill, invariant)) problems.push(`SKILL.md must preserve: ${invariant}`)
  }

  const verifySection = skill.slice(skill.indexOf('## Mode: verify'), skill.indexOf('## Stop conditions'))
  const verificationNumbers = [...verifySection.matchAll(/^(\d+)\. /gm)].map((match) => Number(match[1]))
  if (JSON.stringify(verificationNumbers) !== JSON.stringify(Array.from({ length: 10 }, (_, i) => i + 1))) {
    problems.push('SKILL.md verification matrix must contain ordered proofs 1–10')
  }
  for (const proof of SKILL_VERIFICATION_PROOFS) {
    if (!includesNormalized(skill, proof)) {
      problems.push(`SKILL.md verification matrix must preserve: ${proof}`)
    }
  }

  const contract = readFileSync(join(root, 'references/contract.md'), 'utf8')
  for (const term of [
    '`canonical`',
    '`evidence`',
    '`validation`',
    '`design`',
    '`archive`',
    '`DONE`',
    '`NOW`',
    '`QUEUED`',
    '`OPEN`',
    '`DEFERRED`',
  ]) {
    if (!contract.includes(term)) problems.push(`contract.md must define ${term}`)
  }
  for (const invariant of [
    'Exactly one plan-like document has role `canonical`.',
    'There is exactly one `NOW` pointer and one `NOW` row.',
    'No item disappears because it was duplicated, stale, inconvenient, or outside the former sequence.',
  ]) {
    if (!includesNormalized(contract, invariant)) problems.push(`contract.md must preserve: ${invariant}`)
  }

  const migration = readFileSync(join(root, 'references/migration.md'), 'utf8')
  for (const heading of [
    '## 1. Freeze the authority graph',
    '## 2. Build the crosswalk',
    '## 3. Select the authority',
    '## 4. Migrate without reprioritizing',
    '## 5. Adapt the checker',
    '## 6. Prove failure, then success',
  ]) {
    if (!migration.includes(heading)) problems.push(`migration.md must define ${heading}`)
  }

  const report = readFileSync(join(root, 'references/report-template.md'), 'utf8')
  for (const heading of [
    '## Authority graph',
    '## State-bearing locations',
    '## Lossless crosswalk',
    '## Proposed canonical register',
    '## Enforcement integration',
    '## Decision required',
    '## Verification results',
  ]) {
    if (!report.includes(heading)) problems.push(`report-template.md must define ${heading}`)
  }
  for (const proof of REPORT_VERIFICATION_PROOFS) {
    if (!report.includes(`| ${proof} |`)) {
      problems.push(`report-template.md verification matrix must include ${proof}`)
    }
  }

  const checker = readFileSync(join(root, 'assets/checker/check-execution-plan.mjs'), 'utf8')
  const parser = readFileSync(join(root, 'assets/checker/execution-register.mjs'), 'utf8')
  for (const proof of ['requiredGlobs', 'execution-role:', 'proposed sequencing', 'checkExecutionRegisterText']) {
    if (!checker.includes(proof)) problems.push(`checker template must preserve ${proof}`)
  }
  for (const proof of ['REGISTER_START', 'repeats execution ID', 'first incomplete task', 'has no completion date']) {
    if (!parser.includes(proof)) problems.push(`register parser must preserve ${proof}`)
  }

  const openai = readFileSync(join(root, 'agents/openai.yaml'), 'utf8')
  for (const value of [
    'display_name: "Execution Plan Integrity"',
    'short_description: "Enforce one trustworthy execution-plan source"',
    'default_prompt: "Use $execution-plan-integrity',
    'allow_implicit_invocation: true',
  ]) {
    if (!openai.includes(value)) problems.push(`agents/openai.yaml must preserve ${value}`)
  }

  const links = [...skill.matchAll(/\]\(([^)]+)\)/g)]
    .map((match) => match[1].split('#')[0])
    .filter((target) => target.endsWith('.md'))
  for (const target of links) {
    if (!target.startsWith('references/') || target.slice('references/'.length).includes('/')) {
      problems.push(`SKILL.md reference must be one level below the skill: ${target}`)
      continue
    }
    if (!existsSync(join(dirname(join(root, 'SKILL.md')), target))) {
      problems.push(`SKILL.md reference does not exist: ${target}`)
    }
  }
  for (const file of REQUIRED_ARTIFACT_FILES.filter((path) => path.startsWith('references/'))) {
    if (!links.includes(file)) problems.push(`SKILL.md must link directly to ${file}`)
  }
  if (/\\/.test(skill)) problems.push('SKILL.md contains a Windows-style path separator')
  return problems
}

function main() {
  const problems = validateSkill()
  if (problems.length > 0) {
    process.stderr.write(`Skill validation failed:\n${problems.map((problem) => `- ${problem}`).join('\n')}\n`)
    return 1
  }
  process.stdout.write('Skill validation passed.\n')
  return 0
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main()
