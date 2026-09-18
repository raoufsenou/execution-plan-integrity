# Execution Plan Integrity

A Codex skill that turns scattered plans, audits, gate reports, roadmaps, and storyboards into one
mechanically enforced execution authority without discarding their history.

## What it enforces

- one canonical execution register;
- permanent semantic task IDs;
- exactly one `NOW` task;
- closed states: `DONE`, `NOW`, `QUEUED`, `OPEN`, and `DEFERRED`;
- explicit roles for every plan-like document;
- a lossless crosswalk before migration; and
- mutation-tested enforcement inside the repository's existing validation path.

The skill never chooses product priority or silently resolves contradictory sources. Audit is read-only
and ends at a maintainer decision before apply.

## Supported profile

- Node.js 22 or newer;
- execution state stored in Markdown or MDX; and
- an existing validation path, or explicit approval to add one.

The application framework and package manager do not matter.

## Project layout

```text
SKILL.md                                      Installed workflow
agents/openai.yaml                           Codex UI metadata
references/contract.md                       Closed roles, states, and invariants
references/migration.md                      Lossless migration procedure
references/report-template.md                Audit and verification report
assets/checker/check-execution-plan.mjs       Adaptable repository checker
assets/checker/execution-register.mjs         Stable register parser
assets/checker/execution-register.test.mjs    Mutation-test template
scripts/install.mjs                           Safe global copy
scripts/validate.mjs                          Package validator
tests/skill.test.mjs                          Validator and installer regressions
```

Only the workflow, UI metadata, references, and checker assets are installed. Development scripts and
tests stay in this repository.

## Validate

```bash
pnpm test
pnpm lint
```

## Install globally

```bash
pnpm install:global
```

The default destination is `$CODEX_HOME/skills/execution-plan-integrity`, or
`~/.codex/skills/execution-plan-integrity` when `CODEX_HOME` is unset. An existing installation is never
overwritten implicitly. After validating a newer checkout:

```bash
pnpm install:global -- --replace
```

Codex skill packaging follows the official [Build skills documentation](https://developers.openai.com/codex/skills/).

## Use

```text
$execution-plan-integrity audit
$execution-plan-integrity apply
$execution-plan-integrity verify
```

With no mode, the skill performs the read-only audit and stops for a decision.
