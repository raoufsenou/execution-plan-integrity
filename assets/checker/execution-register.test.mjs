import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test, { afterEach } from 'node:test'
import { checkExecutionProject } from './check-execution-plan.mjs'
import { checkExecutionRegisterText } from './execution-register.mjs'

const temporaryRoots = []

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function register(rows, pointer = 'TASK-TWO', open = '') {
  return `<!-- execution-role: canonical -->
<!-- execution-register:start -->
\`NOW\`: \`${pointer}\`
| Order | ID | State | Work | Source or evidence |
| ---: | --- | --- | --- | --- |
${rows.join('\n')}
${open}
<!-- execution-register:end -->
`
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'execution-plan-integrity-'))
  temporaryRoots.push(root)
  const files = {
    'docs/execution-plan.md': register([
      '| 1 | `TASK-ONE` | `DONE` | Earlier work. | Completed 2026-09-18; report. |',
      '| 2 | `TASK-TWO` | `NOW` | Current work. | Audit finding. |',
      '| 3 | `TASK-THREE` | `QUEUED` | Later work. | Audit finding. |',
    ]),
    'docs/audit.md': '<!-- execution-role: evidence -->\n# Dated audit\n',
    'plans/board/plan.mdx': '{/* execution-role: design */}\n# Storyboard\n',
    'tools/execution-plan/config.json': `${JSON.stringify({
      schema: 1,
      canonical: 'docs/execution-plan.md',
      requiredGlobs: ['docs/*.md', 'plans/**/plan.mdx'],
      roles: {
        evidence: ['docs/audit.md'],
        design: ['plans/**/plan.mdx'],
      },
    })}\n`,
  }
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), contents)
  }
  return root
}

test('accepts one classified authority with one current task', () => {
  assert.deepEqual(checkExecutionProject({ root: fixture() }), [])
})

test('rejects duplicate IDs and multiple current rows', () => {
  const text = register([
    '| 1 | `TASK-TWO` | `NOW` | Current. | Finding. |',
    '| 2 | `TASK-TWO` | `NOW` | Duplicate. | Finding. |',
  ])
  const findings = checkExecutionRegisterText(text)
  assert.ok(findings.includes('execution plan repeats execution ID TASK-TWO'))
  assert.ok(findings.includes('execution plan must have exactly one NOW row; found 2'))
})

test('rejects a mismatched pointer and queued work before NOW', () => {
  const text = register([
    '| 1 | `TASK-ONE` | `QUEUED` | Wrongly first. | Finding. |',
    '| 2 | `TASK-TWO` | `NOW` | Current. | Finding. |',
  ], 'TASK-THREE')
  const findings = checkExecutionRegisterText(text)
  assert.ok(findings.includes('execution plan NOW pointer names TASK-THREE but the NOW row is TASK-TWO'))
  assert.ok(findings.includes('execution plan first incomplete task TASK-ONE is QUEUED, not NOW'))
})

test('rejects unclassified documents and noncanonical registers', () => {
  const root = fixture()
  writeFileSync(join(root, 'docs', 'roadmap.md'), '# Roadmap\n')
  writeFileSync(
    join(root, 'docs', 'audit.md'),
    '<!-- execution-role: evidence -->\n<!-- execution-register:start -->\n<!-- execution-register:end -->\n',
  )
  const findings = checkExecutionProject({ root })
  assert.ok(findings.includes('docs/roadmap.md must have exactly one configured execution role; found none'))
  assert.ok(findings.includes('docs/audit.md is noncanonical but contains an execution-register marker'))
})

test('rejects missing completion evidence and deferred triggers', () => {
  const text = register(
    [
      '| 1 | `TASK-ONE` | `DONE` | Earlier. | report without date |',
      '| 2 | `TASK-TWO` | `NOW` | Current. | Finding. |',
    ],
    'TASK-TWO',
    '| `TASK-LATER` | `DEFERRED` | Later work. | |',
  )
  const findings = checkExecutionRegisterText(text)
  assert.ok(findings.includes('execution plan completed task TASK-ONE has no completion date'))
  assert.ok(findings.includes('execution plan task TASK-LATER has no evidence, source, owner, or trigger'))
})
