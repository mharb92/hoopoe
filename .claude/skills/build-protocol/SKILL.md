---
name: build-protocol
description: >
  Three-mode system (BUILD/DEBUG/REFACTOR) that routes all development work. BUILD mode: feature spec,
  discuss, WAIT for explicit approval, then build one reviewable slice. DEBUG mode: targeted scan along
  the failure path before ANY recommendation, root cause analysis with file:line evidence, impact
  assessment, auto-approved after analysis. REFACTOR mode: scan the affected surface, spec compliance
  check, behavior preservation guarantee, approval required. Never auto-build just because a feature is
  designed. Debug and refactor modes prevent isolated fixes that miss root causes. Integrates with all
  other skills as central router.
---

# Build Protocol

## Core Principle
Never build blindly. Every piece of work follows: understand → plan → approve → build → validate. No code appears without explicit instruction or rigorous analysis.

## Operation Modes

### 1. BUILD MODE (New Features)

**Triggers:** "let's build", "add this feature", "implement", "create"

**Workflow:**
1. Load project context
2. Create feature mini-spec
3. Discuss approach
4. **STOP — wait for explicit approval:** "Let's build it" · "Go ahead" · "Build that now"
5. Build one reviewable slice
6. Validate: run the gates, then hand over the diff

**Key Rule:** NEVER auto-build. Always wait for approval.

### Slice, not batch

**A slice is a vertical cut that runs end to end.** Not "all the components, then all the wiring": one path a user could actually take, with its tests and its data access, working before the next slice starts. Integration bugs found at the end of a batch build are the expensive kind.

Approval is per slice, not per batch inside it. Approve the spec, approve the slice; don't gate every file within one. A branch is cheap and revertible, and a preview deploy says more than another approval round — so the reviewable unit is the branch, not the chat message.

Where the project publishes per-branch previews, the slice is done when the preview works, not when the code is written.

### 2. DEBUG MODE (Fixing Broken Code)

**Triggers:** "bug", "broken", "crash", "not working", "error"

**Workflow:**
1. Load project context
2. Create bug-fix mini-spec
3. **Targeted scan** (below)
4. Propose fix with `file:line` evidence
5. **Auto-approved** — implement immediately
6. Validate: gates green, and the failure reproduced before and passing after

**Key Rule:** No recommendation before evidence. Evidence is `file:line`, not a hypothesis.

### 3. REFACTOR MODE (Improving Structure)

**Triggers:** "messy", "clean up", "refactor", "hard to read"

**Workflow:**
1. Load project context
2. Create refactor mini-spec
3. Scan the affected surface: every caller of what is moving
4. Spec compliance check
5. Impact assessment
6. Propose refactor plan
7. **Wait for approval**
8. Implement
9. Validate (tests must pass before AND after)

**Key Rule:** Behavior preservation is sacred.

## DEBUG MODE: The Targeted Scan

Start at the failure and follow the evidence outward:

1. **Reproduce or locate it.** A failing test, a stack trace, a log line, a wrong value on screen.
2. **Search, don't read everything.** Grep the symbol, the route, the error string, the column name.
3. **Follow imports outward** from the failure point until the cause is bounded.
4. **Read fully only the files on that path.**
5. **Assess impact.** Grep for every caller of what you are about to change.
6. **State the root cause with `file:line` evidence**, then the fix.

**Widen the scan when the evidence runs out, not by default.** Reading every file first was the right default when search wasn't available. It isn't now: a full read buys noise, not safety, and it delays the first real piece of evidence.

**Stop and widen** when: the symptom contradicts the code on the path, the same bug has been "fixed" before, or the fix would touch a module the failure path never enters. Those are the signs the cause is somewhere you haven't looked.

**A test that fails is never an infrastructure flake until proven.** Prove it — same failure on a clean re-run, or green on an unrelated commit — or treat it as real.

## Validation is gates, not self-review

After any change, run the project's own checks — type check, tests, lint, build — and report what they actually say. Never assert that something passes without running it.

`code-validation` covers only what no gate can: spec compliance, side effects, judgement calls. Anything a machine can check belongs in a gate, and when you find such a rule living in a skill, move it.

## Integration with Other Skills

- **`specification-first`:** create mini-specs before any mode proceeds
- **`modular-architecture`:** during scans, build the dependency map
- **`test-driven-development`:** failing test first, always
- **`code-validation`:** after the gates, for what the gates don't cover

## Success Metrics

Build protocol working when:
- ✅ No code without understanding context
- ✅ Bugs fixed at root cause, not symptom, with evidence cited
- ✅ Refactors preserve behavior
- ✅ Each slice runs end to end before the next begins
- ✅ Gates are run, not assumed
- ✅ Users never say "that fix broke something else"
