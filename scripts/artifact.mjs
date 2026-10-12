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
  'SKILL.md': 'b0b5c363315843f701a38df1c4d5854d520f9ce4b6ef6b35b99256a7a833c98a',
  'agents/openai.yaml': 'd9322ee1351bdce6770eb1994f18a8bb485fc97abdd0bc56e356acc44c3c93cb',
  'references/contract.md': '6c68f76075b16ac6ab6649196c9d1f3e21e9980108d413874aa0f111c7b7c58f',
  'references/migration.md': '4e9717756f2b6774d90e0f5659b9c84fd2ec0333a01fc50a570ab981bbbb20e4',
  'references/report-template.md': 'b63505bdf6bf442a858ed744e6af12e9877ee389358ee5cdaf040723e9b13d46',
  'references/completion-proof.md': '4df6b983157edd50b4008c32256f997026b024e99835240bb44da866ee7a2b41',
  'assets/checker/check-execution-plan.mjs': 'dbb20557c3cd248d16eb6b6ed0ddc13b47bd0ec6386463dc7521dd988e9682a4',
  'assets/checker/completion-proof.mjs': 'b8dbc8450eda8c852f1ed968368d0893b1f8eb5795dd048d2f1310ed1a97fdda',
  'assets/checker/execution-register.mjs': '9872c4009295e3fb6e4cddce40d10a43b75ae6a93b7d2fbb147a647d52ed446e',
  'assets/checker/execution-register.test.mjs': '26621f7a20c1a93c9b4fe4041c2a3e2cf5a1c1472851bb10360d0b5616168938',
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
  'the canonical document stays within the contract\'s word limit;',
  'each fact has one home: the current step only in the `NOW` row, each decision in force in one current',
  'the repository instruction from apply step 7 is in place and instruction files hold no execution',
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
  'Canonical document stays within the word limit',
  'Each fact has one home',
  'Repository instruction is in place and instruction files hold no execution state',
  'Skill-owned mutation suite passes and checker accepts the target config',
])
