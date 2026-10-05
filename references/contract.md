# Execution Plan Integrity Contract

## One authority

Exactly one plan-like document has role `canonical`. It alone owns current work, ordering, and state.
Every other plan-like document has one of these roles:

| Role | Meaning |
| --- | --- |
| `evidence` | Dated audit, gate report, or finding record. |
| `validation` | Scenario or verification coverage; may report its own results but cannot order product work. |
| `design` | Storyboard, prototype, or design input. |
| `archive` | Retained historical backlog or superseded plan. |

Roles use an `execution-role` marker in syntax valid for the document format. Markdown may use an HTML
comment; MDX uses a JSX comment.

## Stable task identity

A task ID matches `[A-Z][A-Z0-9-]+`. It is semantic and permanent, for example
`AUTH-STRUCT-TABLES`; a heading number such as “Section 11 item 5” is never an identity.
`IDLE` and `NONE` are reserved pointer states and cannot be task IDs.

Old section numbers, aliases, blocker numbers, and audit findings belong in a source crosswalk. Reordering
or rewriting a document must not rename a task.

## Task kinds

Every row declares what kind of completion it can claim:

| Kind | Meaning |
| --- | --- |
| `IMPLEMENTATION` | Production behavior is reachable by its required consumers. |
| `MIGRATION` | Data, protocol or configuration state is transformed and verified. |
| `OPERATIONS` | A repeatable operational capability is installed and exercised. |
| `DESIGN` | A design artifact or product contract is settled; delivery is not implied. |
| `DECISION` | A choice and its reasoning are recorded; delivery is not implied. |
| `VALIDATION` | Existing behavior is evaluated; implementation is not implied. |
| `DOCUMENTATION` | Documentation is corrected or produced; implementation is not implied. |

The kind is part of the stable task contract. A design, decision, validation or documentation task may
close, but cannot satisfy an implementation claim without a separate implementation-like task and proof.

## States

The state vocabulary is closed:

| State | Meaning | Required evidence |
| --- | --- | --- |
| `DONE` | Completed under the repository's evidence standard and semantic closure protocol. | Completion date and matching closure proof. |
| `NOW` | The single current task. | Scope and completion boundary. |
| `QUEUED` | Ordered after `NOW`. | Scope and source. |
| `OPEN` | Known work with no authorized position. | Owner or decision needed. |
| `DEFERRED` | Intentionally inactive. | Explicit trigger or decision that reactivates it. |

`IDLE` is deliberately not a task-row state. It describes the register, while unresolved tasks retain the
more informative `OPEN` or `DEFERRED` state.

The `NOW` pointer has exactly three valid forms:

- a stable task ID when exactly one ordered row is `NOW`; every ordered row before it is `DONE` and every
  row after it is `QUEUED`;
- `IDLE` when no ordered work remains unfinished, no row is `NOW`, and at least one unordered `OPEN` or
  `DEFERRED` task remains, but no task is currently authorized and executable; or
- `NONE` only when every ordered row is `DONE`, no row is `NOW` or `QUEUED`, and no unordered `OPEN` or
  `DEFERRED` task remains.

`IDLE` requires exactly one single-line `IDLE REASON` and one single-line `RESUME WHEN` field inside the
register. The first explains the present absence of an executable task; the second names an observable
decision, event, or dependency change that permits work to resume. Together they must name at least one
backticked stable ID from the remaining `OPEN` or `DEFERRED` rows. Placeholder text is invalid. These
fields are forbidden under an active task pointer or `NONE`.

## Canonical register

The live register is bounded by exact markers:

```markdown
<!-- execution-register:start -->

`NOW`: `AUTH-STRUCT-TABLES`

| Order | ID | Kind | State | Work and completion boundary | Source or evidence |
| ---: | --- | --- | --- | --- | --- |
| 1 | `AUTH-STRUCT-SERVER-FIRST` | `IMPLEMENTATION` | `DONE` | ... | Completed 2026-09-18; closure proof. |
| 2 | `AUTH-STRUCT-TABLES` | `IMPLEMENTATION` | `NOW` | ... | Audit finding 5.2. |

| ID | Kind | State | Work | Trigger or owner |
| --- | --- | --- | --- | --- |
| `GATE-RTL` | `VALIDATION` | `DEFERRED` | ... | Revisit only by maintainer decision. |

<!-- execution-register:end -->
```

When the ordered work above is complete but `GATE-RTL` remains deliberately inactive, the pointer portion
instead reads:

```markdown
`NOW`: `IDLE`
`IDLE REASON`: No validation capability is currently selected; `GATE-RTL` remains deferred.
`RESUME WHEN`: The maintainer explicitly selects `GATE-RTL` after recording the required product analysis.
```

The surrounding document may retain architecture, decisions, phase history, and rationale. Those sections
must say they are historical when their old status language could be mistaken for live state.

## Lossless migration

Before changing authority, map every actionable statement to exactly one of:

- a stable task ID;
- a completed item with dated evidence;
- a deferred item with its trigger;
- a decision-owned item with its owner; or
- an explicit conflict requiring maintainer resolution.

No item disappears because it was duplicated, stale, inconvenient, or outside the former sequence.
Deduplication chooses one owner and retains every old location in the crosswalk.

## Semantic closure

Every `DONE` task has one machine-readable proof at the configured path `<proof-directory>/<TASK-ID>.json`.
The proof must match the row's task ID, kind and completion date and must contain:

- every authoritative requirement with a stable requirement ID;
- the source of each requirement;
- current repository evidence for each requirement;
- meaningful verification with a result and date;
- zero unverified acceptance items; and
- an implementation disposition.

Implementation-like tasks additionally require an exact implementation ledger, reachable integration
trace and falsification evidence. Non-implementation tasks must track implementation by stable task IDs or
cite why implementation is not required. The full schema and evidence standard are in
`completion-proof.md`.

## Enforcement

The installed `execution-plan-integrity` skill is the sole checker and mutation-test implementation.
Repositories retain only `.execution-plan-integrity.json`, the canonical register, role markers, and
closure proofs. They must not copy or fork the checker, add a repository-local mutation suite, or wire a
user-specific skill path into their ordinary validation commands.

The checker must discover the configured plan-like documents and fail when:

- there is not exactly one canonical document;
- a document is unclassified or has multiple roles;
- a noncanonical document contains register markers or a forbidden live-sequencing heading;
- the register is missing, duplicated, malformed, or empty;
- IDs repeat or violate the stable syntax;
- the pointer and `NOW` row disagree;
- ordered positions are not contiguous;
- the first unfinished ordered task is not `NOW`;
- `IDLE` lacks tracked unresolved work, its reason, its resume condition, or a reference to that work;
- `IDLE` is used while ordered work remains or its metadata is retained under another pointer state;
- `NONE` is used while ordered or unordered work remains;
- a task kind is absent or invalid;
- required evidence, source, owner, or trigger cells are empty;
- a `DONE` row lacks a valid matching closure proof;
- a proof has missing requirements, nonexistent repository evidence or unverified items;
- an implementation-like proof lacks a ledger, integration trace or falsification evidence; or
- a non-implementation proof neither tracks implementation nor explains why it is not required.

The checker belongs inside an existing lint, docs, policy, or validation gate. The target repository's
command surface remains authoritative.
