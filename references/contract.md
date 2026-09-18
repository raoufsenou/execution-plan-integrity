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

Old section numbers, aliases, blocker numbers, and audit findings belong in a source crosswalk. Reordering
or rewriting a document must not rename a task.

## States

The state vocabulary is closed:

| State | Meaning | Required evidence |
| --- | --- | --- |
| `DONE` | Completed under the repository's evidence standard. | Completion date and evidence reference. |
| `NOW` | The single current task. | Scope and completion boundary. |
| `QUEUED` | Ordered after `NOW`. | Scope and source. |
| `OPEN` | Known work with no authorized position. | Owner or decision needed. |
| `DEFERRED` | Intentionally inactive. | Explicit trigger or decision that reactivates it. |

There is exactly one `NOW` pointer and one `NOW` row. In the ordered table, every row before `NOW` is
`DONE` and every row after it is `QUEUED`.

## Canonical register

The live register is bounded by exact markers:

```markdown
<!-- execution-register:start -->

`NOW`: `AUTH-STRUCT-TABLES`

| Order | ID | State | Work and completion boundary | Source or evidence |
| ---: | --- | --- | --- | --- |
| 1 | `AUTH-STRUCT-SERVER-FIRST` | `DONE` | ... | Completed 2026-09-18; gate report. |
| 2 | `AUTH-STRUCT-TABLES` | `NOW` | ... | Audit finding 5.2. |

| ID | State | Work | Trigger or owner |
| --- | --- | --- | --- |
| `GATE-RTL` | `DEFERRED` | ... | Revisit only by maintainer decision. |

<!-- execution-register:end -->
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

## Enforcement

The checker must discover the configured plan-like documents and fail when:

- there is not exactly one canonical document;
- a document is unclassified or has multiple roles;
- a noncanonical document contains register markers or a forbidden live-sequencing heading;
- the register is missing, duplicated, malformed, or empty;
- IDs repeat or violate the stable syntax;
- the `NOW` pointer and row disagree;
- ordered positions are not contiguous;
- the first unfinished ordered task is not `NOW`; or
- required evidence, source, owner, or trigger cells are empty.

The checker belongs inside an existing lint, docs, policy, or validation gate. The target repository's
command surface remains authoritative.
