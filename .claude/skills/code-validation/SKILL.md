---
name: code-validation
description: >
  Post-change validation for what automated gates cannot check. Runs the project's own gates first —
  type check, tests, lint, build — and reports what they actually say, then reviews the change for spec
  compliance, unintended side effects, hardcoded values, duplication and overlong functions. Two severity
  levels (MUST FIX / CONSIDER). Auto-triggers after any code generation or modification. Integrates with
  build-protocol (validates after build/debug/refactor), specification-first (checks spec compliance) and
  modular-architecture (validates structure).
---

# Code Validation

## Core Principle
**A gate beats a self-check, every time.** Run the machine checks first and report their real output. Then review only what no machine can decide.

Never claim a check passed without running it. "Looks correct" is not a result.

## When This Skill Applies

**Auto-trigger after:** any code change — feature, bug fix, or refactor.
**Manual trigger:** "validate that", "check for issues", "review this code".

## Step 1: Run the gates

Run whatever the project defines, and report the output:

| check | typical command |
|---|---|
| types | `tsc --noEmit` |
| tests | `node --test`, `npm test`, `pytest` |
| lint / boundaries | the project's lint script |
| build | the project's build command |

**Everything a gate covers leaves this skill.** Syntax errors, undefined references, missing or misspelled imports, import/export mismatches, circular dependencies, unused exports, changed function signatures with stale callers — a compiler and a lint step catch all of these, always, for free, and they do not get tired. Do not re-check them by eye.

If the project has no gate for something checkable, the fix is to add the gate, not to add a manual check here. Say so when you spot it.

## Step 2: Review what no gate covers

### MUST FIX

**Spec violations.** The code contradicts an approved decision in the project spec — a rule the linter doesn't encode, a record written without its version pin, a screen state the spec forbids. Cite the spec section.

**Unintended side effects.** The change alters behaviour outside what it was asked to alter: a shared helper's contract, a default value another caller depends on, an extra write, a changed order of operations.

**Silent failure.** An error swallowed, a `null` returned where the caller can't distinguish it from a real value, a fire-and-forget promise. The failure has to reach both telemetry and a visible state.

### CONSIDER

**Hardcoded values.** A number or string with meaning, sitting inline. Name it, or move it to config if the project treats it as config.

**Duplication.** The same logic in a second place. One implementation per concern; replace-then-delete in the same change, never leave both.

**Overlong functions or files.** Past the project's threshold, propose the split — don't perform it inside an unrelated change.

## Step 3: Report

```
Gates:
  tsc --noEmit    ✓
  node --test     ✗  2 failing: romanization.test.ts:41, :58
  lint            ✓

MUST FIX
  - lesson-view.ts:88 writes review_event without the config version pin (spec C4.11)

CONSIDER
  - queue.ts:31 retry limit 3 inline — name it
```

Report failures with the tool's own output, not a paraphrase. If a gate could not run, say that — it is not a pass.

## Explaining to a non-developer

Say what broke, what it means, and what happens next. Three lines, no jargon:

```
The type check failed: `session.user` can be empty, and line 34 assumes it isn't.
What it means: if someone opens the app before sign-in finishes, this crashes.
Fixing it by handling the empty case before the read.
```

Severity is not a difficulty setting. Both levels apply from the first change onward: a "start with errors only, add the rest later" ladder just defers the findings that cost the most to fix later.

## Integration

- **`build-protocol`:** this runs at the validate step of every mode
- **`specification-first`:** the spec is the source for every spec-compliance finding
- **`modular-architecture`:** boundary and dependency rules belong in the lint gate, not here

## Success Metrics

Working when:
- ✅ Gate output is quoted, never assumed
- ✅ No finding duplicates something the compiler already said
- ✅ Spec violations are caught before review, with the section cited
- ✅ A missing gate becomes a new gate, not a recurring manual check
