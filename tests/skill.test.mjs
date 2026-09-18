import assert from 'node:assert/strict'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test, { afterEach } from 'node:test'
import { fileURLToPath } from 'node:url'
import { ARTIFACT_ENTRIES, REQUIRED_ARTIFACT_FILES, SKILL_NAME } from '../scripts/artifact.mjs'
import { claimInstallLock, installPlan, installSkill } from '../scripts/install.mjs'
import { validateSkill } from '../scripts/validate.mjs'

const SOURCE_ROOT = fileURLToPath(new URL('..', import.meta.url))
const temporaryRoots = []

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function temporaryRoot() {
  const root = mkdtempSync(join(tmpdir(), 'execution-plan-integrity-skill-'))
  temporaryRoots.push(root)
  return root
}

function copyArtifact(destination) {
  mkdirSync(destination, { recursive: true })
  for (const entry of ARTIFACT_ENTRIES) {
    const target = join(destination, entry)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(join(SOURCE_ROOT, entry), target, { recursive: true })
  }
}

test('the publishable skill satisfies its enforced contract', () => {
  assert.deepEqual(validateSkill(SOURCE_ROOT), [])
  assert.equal(readFileSync(join(SOURCE_ROOT, 'SKILL.md'), 'utf8').split('\n').length <= 500, true)
})

test('installer arguments expose only explicit replacement', () => {
  assert.deepEqual(installPlan([]), { replace: false })
  assert.deepEqual(installPlan(['--replace']), { replace: true })
  assert.throws(() => installPlan(['--target', '/tmp/elsewhere']), /Usage:/)
})

test('global installation is a validated copy independent from its source', async () => {
  const root = temporaryRoot()
  const source = join(root, 'source')
  const skills = join(root, 'skills')
  copyArtifact(source)
  writeFileSync(join(source, 'references', 'unreviewed.md'), 'not part of the artifact\n')

  const destination = await installSkill({ sourceRoot: source, targetRoot: skills, lockPort: 0 })
  rmSync(source, { recursive: true })

  assert.equal(destination, join(skills, SKILL_NAME))
  assert.deepEqual(validateSkill(destination, { artifactOnly: true }), [])
  for (const file of REQUIRED_ARTIFACT_FILES) assert.equal(existsSync(join(destination, file)), true)
  assert.equal(existsSync(join(destination, 'package.json')), false)
  assert.equal(existsSync(join(destination, 'scripts')), false)
  assert.equal(existsSync(join(destination, 'references', 'unreviewed.md')), false)
})

test('an existing installation refuses implicitly and replaces only a validated artifact', async () => {
  const root = temporaryRoot()
  const source = join(root, 'source')
  const replacement = join(root, 'replacement')
  const invalid = join(root, 'invalid')
  const skills = join(root, 'skills')
  copyArtifact(source)
  copyArtifact(replacement)
  copyArtifact(invalid)
  const probe = await claimInstallLock(0)
  const port = probe.port
  await probe.release()
  await installSkill({ sourceRoot: source, targetRoot: skills, lockPort: port })

  await assert.rejects(
    installSkill({ sourceRoot: replacement, targetRoot: skills, lockPort: port }),
    /Refusing to overwrite existing skill/,
  )
  rmSync(join(invalid, 'references', 'contract.md'))
  await assert.rejects(
    installSkill({ sourceRoot: invalid, targetRoot: skills, replace: true, lockPort: port }),
    /Source skill is invalid/,
  )

  const destination = await installSkill({
    sourceRoot: replacement,
    targetRoot: skills,
    replace: true,
    lockPort: port,
  })
  assert.deepEqual(validateSkill(destination, { artifactOnly: true }), [])
})

test('the OS-held installer lock excludes concurrent installation', async () => {
  const root = temporaryRoot()
  const source = join(root, 'source')
  copyArtifact(source)
  const lock = await claimInstallLock(0)
  try {
    await assert.rejects(
      installSkill({ sourceRoot: source, targetRoot: join(root, 'skills'), lockPort: lock.port }),
      /Refusing concurrent installation/,
    )
  } finally {
    await lock.release()
  }
})

test('installation dereferences artifact symlinks before the checkout disappears', async () => {
  const root = temporaryRoot()
  const source = join(root, 'source')
  const outside = join(root, 'contract-source.md')
  copyArtifact(source)
  writeFileSync(outside, readFileSync(join(source, 'references', 'contract.md'), 'utf8'))
  rmSync(join(source, 'references', 'contract.md'))
  symlinkSync(outside, join(source, 'references', 'contract.md'))

  const destination = await installSkill({
    sourceRoot: source,
    targetRoot: join(root, 'skills'),
    lockPort: 0,
  })
  rmSync(source, { recursive: true })
  rmSync(outside)
  assert.deepEqual(validateSkill(destination, { artifactOnly: true }), [])
})

test('validation rejects metadata drift, missing references, and extra artifact files', () => {
  const metadataRoot = temporaryRoot()
  copyArtifact(metadataRoot)
  const skillPath = join(metadataRoot, 'SKILL.md')
  writeFileSync(
    skillPath,
    readFileSync(skillPath, 'utf8').replace(
      'name: execution-plan-integrity',
      'name: improvised-plan-skill',
    ),
  )
  assert.equal(validateSkill(metadataRoot).some((problem) => problem.includes('name must be')), true)

  const missingRoot = temporaryRoot()
  copyArtifact(missingRoot)
  rmSync(join(missingRoot, 'references', 'migration.md'))
  assert.equal(
    validateSkill(missingRoot).some((problem) => problem.includes('missing artifact file')),
    true,
  )

  const extraRoot = temporaryRoot()
  copyArtifact(extraRoot)
  writeFileSync(join(extraRoot, 'references', 'extra.md'), 'unreviewed\n')
  assert.equal(
    validateSkill(extraRoot, { artifactOnly: true })
      .some((problem) => problem.includes('installed artifact files differ')),
    true,
  )
})
