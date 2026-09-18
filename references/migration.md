# Migration Procedure

Read this reference only for an approved `apply`.

## 1. Freeze the authority graph

List every Markdown or MDX document that contains execution-state language. Record its path, current
authority claim, intended role, and every document to which it delegates.

Do not begin by choosing a canonical file. First expose cycles and split ownership: a “master” plan that
delegates current status to an audit is not one authority.

## 2. Build the crosswalk

Use one row per distinct item:

| Old locations and aliases | Proposed stable ID | Existing state | Evidence or trigger | Conflict |
| --- | --- | --- | --- | --- |

Read source definitions before merging similarly named items. If two sources disagree, keep both claims
in the row and stop for a decision.

## 3. Select the authority

Prefer the document already named by repository instructions. If none exists, propose the smallest
durable location. Do not create a new tracker while leaving an old tracker authoritative.

The canonical document owns the complete live state. Supporting documents may retain detailed evidence,
but the register must contain enough scope and acceptance information to identify the task without
consulting another document merely to discover what is current.

## 4. Migrate without reprioritizing

Create stable semantic IDs, preserve existing order, and keep exactly one current task. Place known but
unordered work under `OPEN`; place intentionally inactive work under `DEFERRED` with its existing trigger.

Add explicit role banners to every plan-like document. Convert noncanonical sequencing into a dated
snapshot and point to the canonical register. Preserve findings, reasoning, and evidence.

## 5. Adapt the checker

Copy the files from `assets/checker/` into the target's repository-owned tooling and test locations.
Adapt only:

- import paths;
- the config location;
- document-discovery globs;
- role-marker syntax needed by the target formats; and
- the existing validation command that invokes the checker and tests.

Do not loosen parser invariants to accommodate malformed state. Fix the register.

The config has this shape:

```json
{
  "schema": 1,
  "canonical": "docs/execution-plan.md",
  "requiredGlobs": ["docs/**/*plan*.md", "docs/**/*audit*.md", "plans/**/plan.mdx"],
  "roles": {
    "evidence": ["docs/**/*audit*.md", "docs/**/*gate-report.md"],
    "validation": ["docs/journey-validation-plan.md"],
    "design": ["plans/**/plan.mdx"],
    "archive": ["docs/archive/**/*.md"]
  }
}
```

The canonical path is implicitly role `canonical` and must not also match another role.

## 6. Prove failure, then success

Run the mutation tests. They must demonstrate rejection of duplicate IDs, multiple `NOW` rows, a pointer
mismatch, a queued item before the current item, an unclassified document, and a noncanonical register.

Then run the checker against the real repository and the existing relevant final gates. Report the one
stable `NOW` ID last.
