# Execution Plan Integrity Report

## Authority graph

| Document | Current claim | Proposed role | Delegates to |
| --- | --- | --- | --- |

## State-bearing locations

| Location | Language | Conflict or duplication |
| --- | --- | --- |

## Lossless crosswalk

| Old locations and aliases | Stable ID | State | Evidence, trigger, or owner | Conflict |
| --- | --- | --- | --- | --- |

## Proposed canonical register

- Canonical document:
- `NOW` ID:
- Ordered tasks:
- Open tasks:
- Deferred tasks:
- Decision-owned tasks:

## Enforcement integration

- Existing validation command:
- Checker location:
- Mutation-test location:
- Plan-discovery globs:

## Decision required

State exactly one decision whose answer changes the migration. Omit this section when no decision is
load-bearing.

## Verification results

| Proof | Result | Evidence |
| --- | --- | --- |
| Exactly one canonical document | | |
| Every plan-like document has exactly one role | | |
| Exactly one `NOW` pointer and row | | |
| IDs are unique and ordered positions are contiguous | | |
| First unfinished ordered task is `NOW` | | |
| Noncanonical register and sequencing are rejected | | |
| Required evidence, source, owner, and trigger cells are present | | |
| Existing validation command invokes checker and mutation tests | | |
