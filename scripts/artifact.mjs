export const SKILL_NAME = 'execution-plan-integrity'

export const ARTIFACT_ENTRIES = Object.freeze([
  'SKILL.md',
  'agents/openai.yaml',
  'references/contract.md',
  'references/migration.md',
  'references/report-template.md',
  'assets/checker/check-execution-plan.mjs',
  'assets/checker/execution-register.mjs',
  'assets/checker/execution-register.test.mjs',
])

export const REQUIRED_ARTIFACT_FILES = ARTIFACT_ENTRIES

export const ARTIFACT_SHA256 = Object.freeze({
  'SKILL.md': '80f374278115660cb7dd72e5b0eabc625b23c4f0d23e86fbb6412f10c93dc8f4',
  'agents/openai.yaml': 'de0b9d9e7b3117723de9af74afa8ef37e44074c21895e2f73bd34a9f893d0385',
  'references/contract.md': 'e7106f0efb751cdd6fd19e4d0cf6aa07223ed3d9aca51b6dde0d84bad6923800',
  'references/migration.md': 'f8225409fe61ffcb8830fffad3aea95d95c69733da549021bb284defa092bcf9',
  'references/report-template.md': 'ea79f42ac5b80d61d048b5449d09a0fceb7bf1538488097470bf61f3191904ca',
  'assets/checker/check-execution-plan.mjs': '9779bd5a64c9907c2a78999a6a204312841cdc85a3234f5884f2e58d564e5f83',
  'assets/checker/execution-register.mjs': '56056cf950485d1effcf871806282c3b45836d4b678ce719e102533cb71d7adf',
  'assets/checker/execution-register.test.mjs': 'dc6c0b20fbac32574c09322da0b8943b3d1647645268c7b0a8c26a6b5ca5697a',
})

export const SKILL_VERIFICATION_PROOFS = Object.freeze([
  'exactly one plan-like document has role `canonical`;',
  'every discovered plan-like document has exactly one configured role;',
  'noncanonical documents contain no execution-register markers;',
  'the canonical register has exactly one bounded block;',
  'every stable ID is unique and uses the contract syntax;',
  'exactly one row is `NOW` and the `NOW` pointer names it;',
  'ordered task numbers are contiguous and the first unfinished task is `NOW`;',
  'every `DONE` task has dated evidence, every `DEFERRED` task has a trigger, and every active task has a',
  'forbidden live-sequencing headings in noncanonical documents fail the checker; and',
  'the repository\'s ordinary validation command actually invokes the checker and mutation tests.',
])

export const REPORT_VERIFICATION_PROOFS = Object.freeze([
  'Exactly one canonical document',
  'Every plan-like document has exactly one role',
  'Exactly one `NOW` pointer and row',
  'IDs are unique and ordered positions are contiguous',
  'First unfinished ordered task is `NOW`',
  'Noncanonical register and sequencing are rejected',
  'Required evidence, source, owner, and trigger cells are present',
  'Existing validation command invokes checker and mutation tests',
])
