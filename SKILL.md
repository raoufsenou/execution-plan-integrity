---
name: execution-plan-integrity
description: Audit, consolidate, and enforce a single-source execution plan in Node repositories whose Markdown or MDX plans, audits, gate reports, roadmaps, or storyboards duplicate current status or make “what is next?” ambiguous. Use for plan-state drift and execution-document architecture, not for choosing product priorities or writing an ordinary one-off plan.
---

# Execution Plan Integrity

Establish one mechanically enforced answer to “what is next?” without deleting history or inventing
product decisions.

Read [contract.md](references/contract.md) before auditing or changing a repository. Read
[migration.md](references/migration.md) before `apply`. Use
[report-template.md](references/report-template.md) for every audit and verification report.

Reusable checker and mutation-test templates live in `assets/checker/`. Adapt them to the target's
paths and existing validation command; do not retype their parsing logic from memory.

## Invocation modes

Infer the mode from the request. With no explicit mode, use `audit`.

- `audit` — read-only inventory, authority graph, contradictions, and migration crosswalk.
- `apply` — implement a user-approved audit without changing product priority.
- `verify` — prove the register, document roles, integration, and deliberate mutation failures.

Never combine `audit` and `apply` in one uninterrupted pass. An audit ends at a user decision.

## Compatibility gate

The supported profile is:

- Node.js 22 or newer is available for the checker;
- current work is recorded in Markdown or MDX documents; and
- the repository has, or explicitly authorizes adding, an executable validation path that can invoke
  the checker.

The application framework and package manager are otherwise irrelevant. For a repository without Node,
report `UNSUPPORTED PROFILE`; do not translate the checker into another language under this skill.

## Safety and authority

- Read the target repository's instructions before any command.
- Do not run Git commands.
- Treat existing documents as somebody's work: preserve their historical content and change its
  authority classification rather than deleting it.
- `audit` is read-only.
- Never infer which conflicting item should win. Record the conflict and stop for one decision.
- Never mark work done from prose alone; require the target repository's existing evidence standard.
- Integrate with an existing lint/docs/policy gate when one exists. Do not add a public command merely
  to expose internal choreography.

## Mode: audit

1. Read repository instructions and every document that claims or implies current work, ordering,
   completion, deferral, blockers, or product decisions.
2. Identify the current authority graph: which document claims authority, which documents it delegates
   to, and where state is repeated.
3. Inventory all actionable statements. Classify each as `DONE`, `NOW`, `QUEUED`, `OPEN`, or `DEFERRED`
   only when the repository already establishes that state.
4. Build a lossless crosswalk from every old heading, number, alias, blocker, and deferred item to one
   proposed stable ID. Keep conflicts visible.
5. Identify repository-native validation and where a documentation checker belongs.
6. Produce the fixed report and stop for approval.

The audit must explicitly report:

- every plan-like document and its proposed role;
- every location that currently declares “next,” ordering, or live state;
- duplicated, conflicting, missing, and positional task identities;
- the proposed canonical document and stable `NOW` item;
- the full unfinished/deferred/decision-owned crosswalk; and
- the smallest checker and gate integration that makes the contract executable.

## Mode: apply

Require an accepted audit. Follow [migration.md](references/migration.md), preserving the accepted
crosswalk exactly.

1. Add one canonical execution register with stable IDs and exactly one `NOW` task.
2. Move every unfinished, deferred, blocked, and decision-owned item into that register without changing
   its meaning or priority.
3. Mark every audit, gate report, validation plan, storyboard, roadmap, and archive with its explicit
   noncanonical role.
4. Rewrite current-ordering language outside the register as dated historical evidence or remove only
   the authority claim, never the underlying record.
5. Adapt the checker templates from `assets/checker/` and add the repository-specific config.
6. Integrate the checker and its mutation tests into the repository's existing validation path.
7. Add a repository instruction that agents begin with the stable `NOW` ID and never create a second
   live queue.

Do not advance `NOW`, close a task, or schedule an `OPEN` item merely because the documentation was
restructured.

## Mode: verify

Run the narrow checker and mutation tests before any repository-wide gate. Prove:

1. exactly one plan-like document has role `canonical`;
2. every discovered plan-like document has exactly one configured role;
3. noncanonical documents contain no execution-register markers;
4. the canonical register has exactly one bounded block;
5. every stable ID is unique and uses the contract syntax;
6. exactly one row is `NOW` and the `NOW` pointer names it;
7. ordered task numbers are contiguous and the first unfinished task is `NOW`;
8. every `DONE` task has dated evidence, every `DEFERRED` task has a trigger, and every active task has a
   source or acceptance boundary;
9. forbidden live-sequencing headings in noncanonical documents fail the checker; and
10. the repository's ordinary validation command actually invokes the checker and mutation tests.

Then run only the target repository's relevant final gates. A documentation-only migration does not
justify unrelated product, database, browser, or deployment checks unless those gates read the changed
files.

## Stop conditions

Stop and ask one focused question when:

- two sources disagree on which task is current;
- an old item cannot be classified without a product decision;
- preserving an item would materially change its scope;
- the repository has no acceptable validation integration point; or
- the proposed migration would delete historical evidence.

Report `UNSUPPORTED PROFILE` and stop when Node.js 22 cannot be part of the repository's validation
environment.
