export const SKILL_NAME = 'execution-plan-integrity'

export const ARTIFACT_ENTRIES = Object.freeze([
  'SKILL.md',
  'agents/openai.yaml',
  'references/contract.md',
  'references/migration.md',
  'references/report-template.md',
  'references/completion-proof.md',
  'assets/checker/check-execution-plan.mjs',
  'assets/checker/completion-proof.mjs',
  'assets/checker/execution-register.mjs',
  'assets/checker/execution-register.test.mjs',
])

export const REQUIRED_ARTIFACT_FILES = ARTIFACT_ENTRIES

export const ARTIFACT_SHA256 = Object.freeze({
  'SKILL.md': 'f211212cecf656888ec0e2037e318d24e44e686eea1276c4147765568d469f54',
  'agents/openai.yaml': 'd9322ee1351bdce6770eb1994f18a8bb485fc97abdd0bc56e356acc44c3c93cb',
  'references/contract.md': '1c8184c2210e6432245c4098244ae25ee1ef04907ccc683f298a79aaa2c6f818',
  'references/migration.md': 'c1d67327c2b15543ef48cf7f421f037db20170329ad9915d0717d707953af11d',
  'references/report-template.md': '7f82ef40f8366f77105b5ef3323e7223758e8b24503c3567b7a782d461f3b766',
  'references/completion-proof.md': '0c613ef5f9c0e548f27d54e112176ff06965edf9a34463361f14be7fcd1e1be9',
  'assets/checker/check-execution-plan.mjs': 'fefaf055696287ff74b42397bcfed60c6f04d0bdb59a864d3bce2ae0a18c6475',
  'assets/checker/completion-proof.mjs': '9a328c61c65f6daec9fa686b04cf0f52be84f93cdbca7acbc082329b8a28548d',
  'assets/checker/execution-register.mjs': '9872c4009295e3fb6e4cddce40d10a43b75ae6a93b7d2fbb147a647d52ed446e',
  'assets/checker/execution-register.test.mjs': 'eaf97ae2a6796fe926b0e0c5071916d67f86bc27ba71e06b6540b9868a80fe7c',
})

export const SKILL_VERIFICATION_PROOFS = Object.freeze([
  'exactly one plan-like document has role `canonical`;',
  'every discovered plan-like document has exactly one configured role;',
  'noncanonical documents contain no execution-register markers;',
  'the canonical register has exactly one bounded block;',
  'every stable ID is unique and uses the contract syntax;',
  'the pointer names the single `NOW` row, is `IDLE` only with tracked unresolved work plus a reason and',
  'ordered task numbers are contiguous and the first unfinished task is `NOW`;',
  'every task declares its kind and every `DONE` task has a matching v2 closure proof;',
  'every proof enumerates requirements, repository evidence and meaningful verification, reports no',
  'implementation-like proofs contain an exact file ledger, reachable integration trace and',
  'non-implementation completions track implementation successors by stable ID or cite the recorded',
  'every `DEFERRED` task has a trigger and every active task has a source or acceptance boundary;',
  'forbidden live-sequencing headings in noncanonical documents fail the checker;',
  'the register holds only the pointer, `IDLE` fields, and task-table rows;',
  'the global mutation suite passes and the global checker accepts the target\'s standard config.',
])

export const REPORT_VERIFICATION_PROOFS = Object.freeze([
  'Exactly one canonical document',
  'Every plan-like document has exactly one role',
  'Pointer names one `NOW` row, a justified `IDLE` state, or a valid terminal `NONE` state',
  '`IDLE` reason and resume condition name tracked unresolved work',
  'IDs are unique and ordered positions are contiguous',
  'First unfinished ordered task is `NOW`',
  'Noncanonical register and sequencing are rejected',
  'Required evidence, source, owner, and trigger cells are present',
  'Every task declares an outcome kind',
  'Every `DONE` row has a matching semantic closure proof',
  'Every requirement has repository evidence and meaningful verification',
  'Implementation proofs contain ledger, reachability and falsification',
  'Non-implementation completion has an explicit implementation disposition',
  'No closure proof contains an unverified acceptance item',
  'Terminal `NONE` is rejected while ordered work, unordered work, or untracked selected delivery remains',
  'Register holds only the pointer, `IDLE` fields, and task-table rows',
  'Skill-owned mutation suite passes and checker accepts the target config',
])
