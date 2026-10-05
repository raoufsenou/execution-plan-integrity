# Migration Procedure

Read this reference only for an approved `apply`.

## Deterministic apply state machine

Run these phases in order. Do not merge, reorder, or skip them because a repository looks simple.

1. **Preflight without target edits.** Confirm Node compatibility, repository instructions, the canonical
   path, native semantic-verification commands, the accepted crosswalk, and a proof-readiness row for every
   existing `DONE` task. Record the exact target repository and an edit ledger. If the accepted audit lacks
   the readiness rows, append a read-only migration supplement; this does not reopen product priority.
2. **Resolve proof blockers.** Classify every existing `DONE` row as `PROVABLE`,
   `AUTHORIZED-SUPERSESSION`, or `UNPROVABLE`. Do not edit the target while any row is `UNPROVABLE` or while
   a supersession lacks a later recorded maintainer decision. Ask one load-bearing question and stop.
3. **Open the migration task.** When the prior pointer is `IDLE` or `NONE`, append or reuse the stable
   `EXECUTION-PLAN-V2-MIGRATION` ordered task and make it the sole `NOW` row. This is tooling migration, not
   product prioritization. If another task is already `NOW`, do not preempt it without explicit maintainer
   direction.
4. **Install the contract mechanically.** Add the standard root config, create the proof directory, add
   task kinds, and migrate the pointer. Preserve every accepted ID, state, order, trigger, and scope. Do not
   copy checker code or mutation tests into the target repository.
5. **Reconstruct proofs in ordered-register order.** Freeze requirements first, then inspect current
   definitions, entry points, consumers, durable effects, and focused evidence. Write no proof from old
   completion prose alone. Complete every pre-existing `DONE` proof before the migration task's own proof.
6. **Prove rejection before acceptance.** Run the skill-owned mutation suite, then its checker against the
   target. Run only repository-native semantic gates, in the repository's required order.
7. **Close atomically.** After checks pass, write the migration task's proof, change it from `NOW` to `DONE`,
   and compute the pointer from register facts: `IDLE` when unordered work remains, otherwise `NONE`. Never
   select a product task during closeout. Rerun the checker after the final state edit.

If apply is interrupted, resume from the canonical migration task and edit ledger. Never restart the
classification or silently regenerate proofs whose evidence has already been inspected.

## Deterministic task-kind classification

Choose the kind from the task's accepted outcome, not its title or the files it happens to touch:

| Outcome that closes the task | Kind |
| --- | --- |
| Reachable application or library behavior for a consumer | `IMPLEMENTATION` |
| Repository, data, protocol, configuration, or test-system state is transformed | `MIGRATION` |
| A repeatable runbook or service operation is installed and exercised | `OPERATIONS` |
| A product or technical artifact is settled without delivery | `DESIGN` |
| A selection, deferral, rejection, or policy choice is recorded | `DECISION` |
| Existing behavior or evidence is evaluated without delivery | `VALIDATION` |
| Documentation truth is produced without changing another system | `DOCUMENTATION` |

For a mixed task, use `IMPLEMENTATION` if runtime delivery is part of its completion boundary; otherwise
use `MIGRATION` when it transforms repository or system state. If independently testable outcomes require
different kinds, split them only when the accepted crosswalk already authorizes the split; otherwise record
the conflict and stop.

Selector tasks are always `DECISION`. Their closure proof uses `TRACKED` for the selected implementation-
like successor. If the result was deliberately no implementation, use `NOT-REQUIRED` with the decision
record; never invent a placeholder successor.

## 1. Freeze the authority graph

List every Markdown or MDX document that contains execution-state language. Record its path, current
authority claim, intended role, and every document to which it delegates.

Do not begin by choosing a canonical file. First expose cycles and split ownership: a “master” plan that
delegates current status to an audit is not one authority.

## 2. Build the crosswalk

Use one row per distinct item and record the kind of outcome it can honestly claim:

| Old locations and aliases | Proposed stable ID | Kind | Existing state | Evidence or trigger | Conflict |
| --- | --- | --- | --- | --- | --- |

Read source definitions before merging similarly named items. If two sources disagree, keep both claims
in the row and stop for a decision.

## 3. Select the authority

Prefer the document already named by repository instructions. If none exists, propose the smallest
durable location. Do not create a new tracker while leaving an old tracker authoritative.

The canonical document owns the complete live state. Supporting documents may retain detailed evidence,
but the register must contain enough scope and acceptance information to identify the task without
consulting another document merely to discover what is current.

## 4. Migrate without reprioritizing

Create stable semantic IDs and preserve existing order. Use exactly one current task when an ordered task
is authorized and executable. Use `IDLE` when only unordered `OPEN` or `DEFERRED` work remains and no item
is currently authorized and executable; record its reason and observable resume condition. Use terminal
`NONE` only when no ordered or unordered work remains. Place known but unordered work under `OPEN`; place
intentionally inactive work under `DEFERRED` with its existing trigger.

Do not let design, decision, validation or documentation completion stand in for implementation. When
those artifacts select or require delivery, create or retain the stable implementation task that owns it.

Add explicit role banners to every plan-like document. Convert noncanonical sequencing into a dated
snapshot and point to the canonical register. Preserve findings, reasoning, and evidence.

## 5. Configure the skill-owned checker

Do not copy files from `assets/checker/` into the target. The installed skill is the only checker and
mutation-test implementation. Add one target-owned `.execution-plan-integrity.json` file containing only
repository-specific paths and roles, then invoke the global checker from the target root.

Run the skill-owned rejection suite:

```bash
node /absolute/path/to/execution-plan-integrity/assets/checker/execution-register.test.mjs
```

Run the skill-owned target checker:

```bash
node /absolute/path/to/execution-plan-integrity/assets/checker/check-execution-plan.mjs --root /absolute/path/to/repository
```

Do not add a package script or make the target's ordinary test gate depend on a user-specific global path.
Do not loosen parser invariants to accommodate malformed state; fix the register.

The config has this shape:

```json
{
  "schema": 2,
  "canonical": "docs/execution-plan.md",
  "completionProofs": {
    "directory": "docs/execution-proofs"
  },
  "requiredGlobs": ["docs/**/*plan*.md", "docs/**/*audit*.md", "plans/**/plan.mdx"],
  "roles": {
    "evidence": ["docs/**/*audit*.md", "docs/**/*gate-report.md"],
    "validation": ["docs/journey-validation-plan.md"],
    "design": ["plans/**/plan.mdx"],
    "archive": ["docs/archive/**/*.md"]
  }
}
```

The canonical path is implicitly role `canonical` and must not also match another role. Schema 2 is a
clean cutover: do not retain a schema-1 fallback that allows `DONE` without semantic closure proof.

## 6. Reconstruct completion proofs

For every existing `DONE` row, follow `completion-proof.md` against current requirements and current
implementation. Do not translate old prose into a proof without re-reading definitions, callers and
required gates.

If proof cannot be reconstructed, the migration has found an unresolved completion claim. Keep it visible
for the audit decision; do not fabricate evidence or silently grandfather it.

Use these legacy-proof rules consistently:

- `PROVABLE` means every frozen requirement has current repository evidence and either current executable
  verification or a dated repository record of verification that actually exercised it.
- `AUTHORIZED-SUPERSESSION` means a later recorded maintainer decision intentionally removed or replaced
  an exact requirement. Amend the old row's boundary to state that supersession, cite the newer stable ID
  or decision in the row and proof, and exclude only that exact superseded requirement. `outOfScope` alone
  may not hide a current contradiction.
- `UNPROVABLE` means a requirement, current integration, external/manual gate, or trustworthy dated result
  is missing. Do not keep the row `DONE`, invent an assertion, or promote it to `NOW`. Stop for the
  maintainer to decide whether to reopen, narrow by an explicit supersession decision, or discard the
  claim.
- For a historical proof, `implementationLedger` is the exhaustive current delivery ledger needed to
  satisfy the retained boundary; it is not a guessed list of every file edited in the old session. For a
  task being closed now, it remains the session's exact edit ledger.
- Never copy one generic requirement into many proofs. Split independently falsifiable acceptance clauses,
  point implementation evidence to definitions plus consumers, and name the focused evidence that would
  fail on the wrong behavior.
- Never claim a verification ran during migration when it did not. Preserve the recorded `checkedAt` date
  for historical results and distinguish those records from checks run in the current session.

## 7. Prove failure, then success

Run the mutation tests. They must demonstrate rejection of duplicate IDs, multiple `NOW` rows, a pointer
mismatch, a queued item before the current item, an unclassified document, and a noncanonical register.

Also demonstrate rejection of a missing closure proof, mismatched task kind, nonexistent evidence path,
unverified acceptance item, implementation task without integration/falsification, design completion
without a tracked implementation disposition, `IDLE` without tracked work/reason/resume condition, and
terminal `NONE` with ordered or unordered work remaining.

Then run the checker against the real repository and the existing relevant final gates. Report the stable
`NOW` ID, justified `IDLE` state, or strictly verified terminal `NONE` state last.
