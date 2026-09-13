---
name: build-protocol
description: >
  Three-mode system (BUILD/DEBUG/REFACTOR) that routes all development work. BUILD mode: feature spec,
  discuss, WAIT for explicit approval, build in batches. DEBUG mode: MANDATORY full codebase scan before
  ANY recommendations, root cause analysis across all files, impact assessment, auto-approved after analysis.
  REFACTOR mode: full scan, spec compliance check, behavior preservation guarantee, approval required. Never
  auto-build just because feature is designed. Debug/refactor modes prevent isolated fixes that miss root causes.
  Emergency override available with confirmation. Integrates with all other skills as central router.
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
4. **STOP - wait for explicit approval:**
   - "Let's build it"
   - "Go ahead"
   - "Build that now"
5. Build in batches
6. Validate output

**Key Rule:** NEVER auto-build. Always wait for approval.

### 2. DEBUG MODE (Fixing Broken Code)

**Triggers:** "bug", "broken", "crash", "not working", "error"

**Workflow:**
1. Load project context
2. Create bug-fix mini-spec
3. **MANDATORY: Full Codebase Scan**
   ```
   [Step 1] Scanning directory... Found 13 files
   [Step 2] Reading ALL files... ✓
   [Step 3] Mapping dependencies...
   [Step 4] Tracing execution path...
   [Step 5] Root cause analysis...
   [Step 6] Impact assessment...
   ```
4. Propose fix with evidence
5. **Auto-approved** - implement immediately
6. Validate

**Key Rule:** NO recommendations until scan complete.

### 3. REFACTOR MODE (Improving Structure)

**Triggers:** "messy", "clean up", "refactor", "hard to read"

**Workflow:**
1. Load project context
2. Create refactor mini-spec
3. **MANDATORY: Full codebase scan**
4. Spec compliance check
5. Impact assessment
6. Propose refactor plan
7. **Wait for approval**
8. Implement refactor
9. Validate (tests must pass)

**Key Rule:** Behavior preservation is sacred.

## DEBUG MODE: Detailed Workflow

### MANDATORY Full Scan

**This is NON-NEGOTIABLE:**

```
Starting full codebase analysis...

[Step 1] Scanning: Found 13 files across 3 modules

[Step 2] Reading all files:
✓ auth/login.js (218 lines)
✓ auth/session.js (156 lines)
✓ lessons/api.js (203 lines)
✓ lessons/navigation.js (189 lines)
... [all files]

[Step 3] Mapping dependencies:
LessonView.jsx → lessons/navigation.js → lessons/state.js
Dependency graph built ✓

[Step 4] Tracing crash path:
User clicks Next → handleNext() → advanceLesson() → CRASH

[Step 5] Root cause:
persistence.js line 34: session.user.id is undefined
WHY: Navigation called before auth completes
EVIDENCE: [from multiple files]

[Step 6] Impact assessment:
What else calls advanceLesson? [list]
What breaks if we add session check? [analysis]
```

### Only THEN Propose Fix

```
Root cause: Race condition between auth and navigation

Fix requires 3 files:
1. LessonView.jsx: Add loading state
2. navigation.js: Add session check
3. persistence.js: Add null check

This approach:
✓ Fixes root cause
✓ Adds defensive checks
✓ Won't break existing features

Implementing fix...
```

## Emergency Override Protocol

**User says:** "Skip the scan, just fix X"

**Response:**
```
I can skip if you're certain, but:

Past experience: Isolated fixes miss root causes
Full scan takes ~30 seconds, catches multi-file issues

Are you sure? I recommend the scan for safety.
```

**If user confirms skip:**
```
Understood. Proceeding with targeted fix.

⚠️ Warning: Without scan, I can't guarantee:
- This is actual root cause
- Fix won't break other features
- No related issues elsewhere

Proceeding anyway per your request...
```

## Integration with Other Skills

**Calls `project-memory-protocol` first:** Load context

**Calls `specification-first`:** Create mini-specs

**Calls `modular-architecture`:** During scans, build dependency map

**Calls `test-driven-development`:** Ensure tests

**Calls `code-validation`:** Validate output

## Success Metrics

Build protocol working when:
- ✅ No code without understanding context
- ✅ Bugs fixed at root cause, not symptom
- ✅ Refactors preserve behavior
- ✅ Impact assessments prevent breaking changes
- ✅ Users never say "that fix broke something else"
