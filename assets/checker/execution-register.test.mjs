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

function register(rows, pointer = 'TASK-TWO', open = '', pointerMetadata = '') {
  return `<!-- execution-role: canonical -->
<!-- execution-register:start -->
\`NOW\`: \`${pointer}\`
${pointerMetadata}
| Order | ID | Kind | State | Work | Source or evidence |
| ---: | --- | --- | --- | --- | --- |
${rows.join('\n')}
${open ? `
| ID | Kind | State | Work | Trigger or owner |
| --- | --- | --- | --- | --- |
${open}` : ''}
<!-- execution-register:end -->
`
}

function completionProof(overrides = {}) {
  return {
    schema: 1,
    taskId: 'TASK-ONE',
    taskKind: 'IMPLEMENTATION',
    outcome: 'IMPLEMENTED',
    completedAt: '2026-09-18',
    requirements: [{
      id: 'REQ-TASK-ONE',
      statement: 'The implementation is reachable from its consumer.',
      source: { path: 'docs/execution-plan.md', anchor: 'TASK-ONE' },
      evidence: [{ path: 'src/task-one.mjs', symbol: 'taskOne' }],
      verification: [{
        kind: 'test',
        command: 'node --test test/task-one.test.mjs',
        result: 'passed',
        checkedAt: '2026-09-18',
      }],
    }],
    implementationLedger: ['src/task-one.mjs', 'test/task-one.test.mjs'],
    integration: [{
      entryPoint: 'taskOne()',
      implementation: 'src/task-one.mjs#taskOne',
      consumer: 'test/task-one.test.mjs',
    }],
    falsification: [{
      assertion: 'Removing the return value fails the focused test.',
      kind: 'mutation',
      evidence: 'The focused test failed under the deliberate mutation.',
      result: 'passed',
    }],
    implementationDisposition: { status: 'DELIVERED' },
    unverified: [],
    outOfScope: [],
    ...overrides,
  }
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'execution-plan-integrity-'))
  temporaryRoots.push(root)
  const files = {
    'docs/execution-plan.md': register([
      '| 1 | `TASK-ONE` | `IMPLEMENTATION` | `DONE` | Earlier work. | Completed 2026-09-18; closure proof. |',
      '| 2 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Current work. | Audit finding. |',
      '| 3 | `TASK-THREE` | `IMPLEMENTATION` | `QUEUED` | Later work. | Audit finding. |',
    ]),
    'docs/audit.md': '<!-- execution-role: evidence -->\n# Dated audit\n',
    'plans/board/plan.mdx': '{/* execution-role: design */}\n# Storyboard\n',
    'docs/execution-proofs/TASK-ONE.json': `${JSON.stringify(completionProof(), null, 2)}\n`,
    'src/task-one.mjs': 'export const taskOne = () => true\n',
    'test/task-one.test.mjs': "import assert from 'node:assert/strict'\nassert.equal(true, true)\n",
    '.execution-plan-integrity.json': `${JSON.stringify({
      schema: 2,
      canonical: 'docs/execution-plan.md',
      completionProofs: { directory: 'docs/execution-proofs' },
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
    '| 1 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Current. | Finding. |',
    '| 2 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Duplicate. | Finding. |',
  ])
  const findings = checkExecutionRegisterText(text)
  assert.ok(findings.includes('execution plan repeats execution ID TASK-TWO'))
  assert.ok(findings.includes('execution plan must have exactly one NOW row; found 2'))
})

test('rejects a mismatched pointer and queued work before NOW', () => {
  const text = register([
    '| 1 | `TASK-ONE` | `IMPLEMENTATION` | `QUEUED` | Wrongly first. | Finding. |',
    '| 2 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Current. | Finding. |',
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

test('rejects a repository-local checker or mutation-suite copy', () => {
  const root = fixture()
  writeFileSync(join(root, 'check-execution-plan.mjs'), 'export const duplicate = true\n')
  const findings = checkExecutionProject({ root })
  assert.ok(findings.includes(
    'check-execution-plan.mjs duplicates the global execution-plan-integrity implementation',
  ))
})

test('rejects missing completion evidence and deferred triggers', () => {
  const text = register(
    [
      '| 1 | `TASK-ONE` | `IMPLEMENTATION` | `DONE` | Earlier. | report without date |',
      '| 2 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Current. | Finding. |',
    ],
    'TASK-TWO',
    '| `TASK-LATER` | `VALIDATION` | `DEFERRED` | Later work. | |',
  )
  const findings = checkExecutionRegisterText(text)
  assert.ok(findings.includes('execution plan completed task TASK-ONE has no completion date'))
  assert.ok(findings.includes('execution plan task TASK-LATER has no evidence, source, owner, or trigger'))
})

test('rejects a mixed-version row with no v2 task kind', () => {
  const text = register([
    '| 1 | `TASK-ONE` | `DONE` | Old schema row. | Completed 2026-09-18; report. |',
    '| 2 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Current. | Finding. |',
  ])
  const findings = checkExecutionRegisterText(text)
  assert.ok(findings.includes('execution plan task TASK-ONE has invalid kind DONE'))
})

test('ignores supporting tables inside the bounded register', () => {
  const text = register([
    '| 1 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Current. | Finding. |',
  ]).replace(
    '| Order | ID | Kind | State | Work | Source or evidence |',
    '| Step | Substep ID | Cursor | Boundary |\n'
      + '| ---: | --- | --- | --- |\n'
      + '| 1 | `SUBSTEP-ONE` | Completed 2026-09-18 | Historical detail. |\n\n'
      + '| Order | ID | Kind | State | Work | Source or evidence |',
  )
  assert.deepEqual(checkExecutionRegisterText(text), [])
})

test('accepts terminal NONE only after every ordered task is done and no unordered work remains', () => {
  const complete = register([
    '| 1 | `TASK-ONE` | `IMPLEMENTATION` | `DONE` | Earlier. | Completed 2026-09-18; proof. |',
  ], 'NONE')
  assert.deepEqual(checkExecutionRegisterText(complete), [])

  const incomplete = register([
    '| 1 | `TASK-ONE` | `IMPLEMENTATION` | `DONE` | Earlier. | Completed 2026-09-18; proof. |',
    '| 2 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Current. | Finding. |',
  ], 'NONE')
  const findings = checkExecutionRegisterText(incomplete)
  assert.ok(findings.includes('execution plan NOW pointer is NONE but found 1 NOW row(s)'))
  assert.ok(findings.includes('execution plan NOW pointer is NONE but ordered task TASK-TWO is NOW'))

  const unresolved = register(
    ['| 1 | `TASK-ONE` | `IMPLEMENTATION` | `DONE` | Earlier. | Completed 2026-09-18; proof. |'],
    'NONE',
    '| `TASK-LATER` | `VALIDATION` | `DEFERRED` | Later work. | Revisit by decision. |',
  )
  assert.ok(checkExecutionRegisterText(unresolved).includes(
    'execution plan NOW pointer is NONE but unordered task TASK-LATER is DEFERRED; use IDLE',
  ))
})

test('accepts IDLE when only tracked unordered work remains', () => {
  const metadata = '`IDLE REASON`: No delivery task is authorized; `TASK-LATER` remains deferred.\n'
    + '`RESUME WHEN`: The maintainer explicitly selects `TASK-LATER`.'
  const deferred = '| `TASK-LATER` | `VALIDATION` | `DEFERRED` | Later work. | Revisit by decision. |'
  const afterCompletedWork = register(
    ['| 1 | `TASK-ONE` | `IMPLEMENTATION` | `DONE` | Earlier. | Completed 2026-09-18; proof. |'],
    'IDLE',
    deferred,
    metadata,
  )
  assert.deepEqual(checkExecutionRegisterText(afterCompletedWork), [])

  const beforeAnyOrderedWork = register([], 'IDLE', deferred, metadata)
  assert.deepEqual(checkExecutionRegisterText(beforeAnyOrderedWork), [])
})

test('accepts an IDLE project whose completed work retains semantic proof', () => {
  const root = fixture()
  writeFileSync(join(root, 'docs/execution-plan.md'), register(
    ['| 1 | `TASK-ONE` | `IMPLEMENTATION` | `DONE` | Earlier. | Completed 2026-09-18; closure proof. |'],
    'IDLE',
    '| `TASK-LATER` | `IMPLEMENTATION` | `OPEN` | Candidate delivery. | Maintainer selection required. |',
    '`IDLE REASON`: No delivery task is authorized; `TASK-LATER` remains open.\n'
      + '`RESUME WHEN`: The maintainer selects and orders `TASK-LATER`.',
  ))
  assert.deepEqual(checkExecutionProject({ root }), [])
})

test('rejects IDLE without a reason or resume condition', () => {
  const text = register(
    [],
    'IDLE',
    '| `TASK-LATER` | `VALIDATION` | `OPEN` | Candidate work. | Maintainer selection required. |',
  )
  const findings = checkExecutionRegisterText(text)
  assert.ok(findings.includes('execution plan IDLE requires exactly one IDLE REASON; found 0'))
  assert.ok(findings.includes('execution plan IDLE requires exactly one RESUME WHEN condition; found 0'))
})

test('rejects IDLE when no unordered task remains', () => {
  const text = register(
    ['| 1 | `TASK-ONE` | `IMPLEMENTATION` | `DONE` | Earlier. | Completed 2026-09-18; proof. |'],
    'IDLE',
    '',
    '`IDLE REASON`: No task is active.\n`RESUME WHEN`: A new task is selected.',
  )
  assert.ok(checkExecutionRegisterText(text).includes(
    'execution plan NOW pointer is IDLE but no OPEN or DEFERRED task remains',
  ))
})

test('rejects IDLE while ordered work remains', () => {
  const text = register(
    ['| 1 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Current. | Accepted scope. |'],
    'IDLE',
    '| `TASK-LATER` | `VALIDATION` | `DEFERRED` | Later work. | Revisit by decision. |',
    '`IDLE REASON`: `TASK-LATER` is deferred.\n`RESUME WHEN`: Select `TASK-LATER`.',
  )
  const findings = checkExecutionRegisterText(text)
  assert.ok(findings.includes('execution plan NOW pointer is IDLE but found 1 NOW row(s)'))
  assert.ok(findings.includes('execution plan NOW pointer is IDLE but ordered task TASK-TWO is NOW'))
})

test('rejects IDLE metadata that does not name tracked work', () => {
  const text = register(
    [],
    'IDLE',
    '| `TASK-LATER` | `VALIDATION` | `DEFERRED` | Later work. | Revisit by decision. |',
    '`IDLE REASON`: No task is authorized.\n`RESUME WHEN`: An external dependency changes.',
  )
  assert.ok(checkExecutionRegisterText(text).includes(
    'execution plan IDLE metadata must name at least one OPEN or DEFERRED task ID',
  ))
})

test('rejects stale IDLE metadata while a task is current', () => {
  const text = register(
    ['| 1 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Current. | Accepted scope. |'],
    'TASK-TWO',
    '',
    '`IDLE REASON`: `TASK-LATER` was deferred.\n`RESUME WHEN`: Select `TASK-LATER`.',
  )
  assert.ok(checkExecutionRegisterText(text).includes(
    'execution plan has IDLE metadata while NOW pointer is TASK-TWO',
  ))
})

test('rejects a DONE task without a closure proof', () => {
  const root = fixture()
  rmSync(join(root, 'docs/execution-proofs/TASK-ONE.json'))
  const findings = checkExecutionProject({ root })
  assert.ok(findings.includes('TASK-ONE is DONE but has no closure proof at docs/execution-proofs/TASK-ONE.json'))
})

test('rejects mismatched, nonexistent, and unverified proof claims', () => {
  const root = fixture()
  const proof = completionProof({
    taskKind: 'DESIGN',
    requirements: [{
      ...completionProof().requirements[0],
      evidence: [{ path: 'src/does-not-exist.mjs', symbol: 'missing' }],
    }],
    unverified: ['REQ-MANUAL'],
  })
  writeFileSync(join(root, 'docs/execution-proofs/TASK-ONE.json'), `${JSON.stringify(proof, null, 2)}\n`)
  const findings = checkExecutionProject({ root })
  assert.ok(findings.includes('docs/execution-proofs/TASK-ONE.json taskKind DESIGN does not match IMPLEMENTATION'))
  assert.ok(findings.includes('TASK-ONE requirement 1 evidence 1 does not exist: src/does-not-exist.mjs'))
  assert.ok(findings.includes('docs/execution-proofs/TASK-ONE.json has 1 unverified acceptance item(s)'))
})

test('rejects implementation completion without reachability or falsification', () => {
  const root = fixture()
  const proof = completionProof({ integration: [], falsification: [] })
  writeFileSync(join(root, 'docs/execution-proofs/TASK-ONE.json'), `${JSON.stringify(proof, null, 2)}\n`)
  const findings = checkExecutionProject({ root })
  assert.ok(findings.includes('TASK-ONE has no reachable integration trace'))
  assert.ok(findings.includes('TASK-ONE has no falsification evidence'))
})

test('rejects design completion that does not track implementation or a no-work decision', () => {
  const root = fixture()
  writeFileSync(join(root, 'docs/execution-plan.md'), register([
    '| 1 | `TASK-ONE` | `DESIGN` | `DONE` | Settle the design. | Completed 2026-09-18; closure proof. |',
    '| 2 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Implement it. | Design decision. |',
  ]))
  const proof = completionProof({
    taskKind: 'DESIGN',
    outcome: 'DESIGNED',
    implementationDisposition: { status: 'DELIVERED' },
  })
  writeFileSync(join(root, 'docs/execution-proofs/TASK-ONE.json'), `${JSON.stringify(proof, null, 2)}\n`)
  const findings = checkExecutionProject({ root })
  assert.ok(findings.includes('TASK-ONE implementationDisposition must be TRACKED or NOT-REQUIRED for DESIGN'))
})

test('accepts design completion when an implementation task owns delivery', () => {
  const root = fixture()
  writeFileSync(join(root, 'docs/execution-plan.md'), register([
    '| 1 | `TASK-ONE` | `DESIGN` | `DONE` | Settle the design. | Completed 2026-09-18; closure proof. |',
    '| 2 | `TASK-TWO` | `IMPLEMENTATION` | `NOW` | Implement it. | Design decision. |',
  ]))
  const proof = completionProof({
    taskKind: 'DESIGN',
    outcome: 'DESIGNED',
    implementationDisposition: { status: 'TRACKED', taskIds: ['TASK-TWO'] },
  })
  writeFileSync(join(root, 'docs/execution-proofs/TASK-ONE.json'), `${JSON.stringify(proof, null, 2)}\n`)
  assert.deepEqual(checkExecutionProject({ root }), [])
})

test('rejects a non-implementation task tracked as the delivery successor', () => {
  const root = fixture()
  writeFileSync(join(root, 'docs/execution-plan.md'), register([
    '| 1 | `TASK-ONE` | `DESIGN` | `DONE` | Settle the design. | Completed 2026-09-18; closure proof. |',
    '| 2 | `TASK-TWO` | `DOCUMENTATION` | `NOW` | Document it. | Design decision. |',
  ]))
  const proof = completionProof({
    taskKind: 'DESIGN',
    outcome: 'DESIGNED',
    implementationDisposition: { status: 'TRACKED', taskIds: ['TASK-TWO'] },
  })
  writeFileSync(join(root, 'docs/execution-proofs/TASK-ONE.json'), `${JSON.stringify(proof, null, 2)}\n`)
  const findings = checkExecutionProject({ root })
  assert.ok(findings.includes('TASK-ONE implementationDisposition task TASK-TWO is DOCUMENTATION, not implementation-like'))
})
