---
name: code-validation
description: >
  Post-response validation with three severity levels (ERROR/WARNING/INFO). Auto-triggers after any code
  generation, file creation, or modification. Checks for undefined references, missing imports, syntax errors
  (ERROR level), spec pattern violations, missing error handling, hardcoded values (WARNING level), and code
  duplication, long functions, performance issues (INFO level). Offers auto-fix for simple errors. Performs
  cross-file validation, spec compliance checks, and side-effect detection. Learning-friendly explanations
  for non-developers. Integrates with build-protocol (validates after build/debug/refactor), specification-first
  (checks spec compliance), and modular-architecture (validates structure).
---

# Code Validation

## Core Principle
Every piece of code is validated before the user sees it. Catch errors, inconsistencies, and spec violations immediately.

## When This Skill Applies

### Auto-Trigger After:
- ANY code block in response
- File creation (create_file)
- File modification (str_replace)
- Feature implementation
- Bug fix implementation
- Refactor implementation

### Manual Trigger:
- "validate that"
- "check for issues"
- "review this code"

## Validation Checks

### Level 1: ERROR (Must Fix)

**Undefined References:**
```javascript
// ❌ ERROR
function handleClick() {
  processUserData(); // Not defined or imported
}
```

**Fix:**
```javascript
// ✓ Fixed
import { processUserData } from './utils';

function handleClick() {
  processUserData();
}
```

**Missing Imports:**
```javascript
// ❌ ERROR
function MyComponent() {
  const [state, setState] = useState(0); // useState not imported
}
```

**Fix:**
```javascript
// ✓ Fixed
import { useState } from 'react';

function MyComponent() {
  const [state, setState] = useState(0);
}
```

**Syntax Errors:**
```javascript
// ❌ ERROR: Missing closing brace
function fetchData() {
  if (condition) {
    return data;
  // Missing }
}
```

### Level 2: WARNING (Should Fix)

**Spec Pattern Violations:**
```javascript
// ⚠️ WARNING: Should be camelCase per spec
function FetchData() { ... }
```

**Missing Error Handling:**
```javascript
// ⚠️ WARNING: No try/catch
async function loadLesson() {
  const lesson = await fetch('/api/lesson');
  return lesson;
}
```

**Recommended:**
```javascript
// ✓ Better
async function loadLesson() {
  try {
    const lesson = await fetch('/api/lesson');
    return lesson;
  } catch (error) {
    console.error('Failed to load:', error);
    showUserMessage('Could not load. Try again.');
    return null;
  }
}
```

**Hardcoded Values:**
```javascript
// ⚠️ WARNING: Magic number
if (attempts > 3) { giveUp(); }
```

**Recommended:**
```javascript
// ✓ Better
const MAX_RETRY_ATTEMPTS = 3;
if (attempts > MAX_RETRY_ATTEMPTS) { giveUp(); }
```

### Level 3: INFO (Suggestions)

**Code Duplication:**
```javascript
// ℹ️ INFO: Duplicated logic
function formatUserDate(date) {
  return new Date(date).toLocaleDateString('en-US');
}
function formatLessonDate(date) {
  return new Date(date).toLocaleDateString('en-US');
}
```

**Suggestion:** Extract to shared utility

**Long Functions:**
```javascript
// ℹ️ INFO: 75 lines (consider splitting at 50)
function processLessonData(data) {
  // ... 75 lines
}
```

## Validation Workflow

### Step 1: Parse Code Blocks
Extract all code from response

### Step 2: Run Checks

For each block:
1. Syntax check (ERROR)
2. Reference check (ERROR)
3. Import check (ERROR)
4. Spec compliance (WARNING)
5. Best practices (INFO)

### Step 3: Report Results

```
Code Validation Results:

❌ 1 ERROR (must fix):
  - Line 23: Undefined function `processData`

⚠️ 2 WARNINGS (should fix):
  - Line 45: Missing error handling
  - Line 67: Hardcoded value `3`

ℹ️ 1 INFO (suggestion):
  - Function is 75 lines (consider splitting)

[Fix errors automatically?]
```

### Step 4: Auto-Fix (Optional)

```
I can fix:
1. Add missing import
2. Add try/catch
3. Extract constant

Apply all fixes? (errors + warnings)
Apply only critical? (errors only)
Show me first? (manual review)
```

## Cross-File Validation

**Import/Export Matching:**
```javascript
// File A: lessons/api.js
export function fetchLesson(id) { ... }

// File B: LessonView.jsx
import { fetchLessons } from '../lessons/api'; // ❌ Typo

// VALIDATION ERROR: Import name doesn't match export
```

**Function Signature Changes:**
```javascript
// BEFORE: fetchLesson(id)
// AFTER: fetchLesson(id, options) // Added param

// ⚠️ WARNING: Callers need updating
```

**Circular Dependencies:**
```javascript
// lessons/api.js → progress/tracking.js
// progress/tracking.js → lessons/api.js
// ❌ ERROR: Circular dependency
```

## Spec Compliance Validation

Load PROJECT_SPEC.md and validate:

```javascript
// Spec says: camelCase, try/catch, UPPER_SNAKE_CASE constants

// Code:
function FetchData() { // ⚠️ Should be camelCase
  const maxRetries = 3; // ℹ️ Could be constant
  await getData(); // ⚠️ Missing try/catch
}

// Validation:
⚠️ Function name violates spec (should be `fetchData`)
⚠️ Async call missing try/catch (spec requires error handling)
ℹ️ Consider `MAX_RETRIES` constant
```

## Validation for Non-Developers

Make errors educational:

```
❌ ERROR: `useState` is not defined

What this means:
  - You're using React hook without importing it
  - React needs to know where functions come from

How to fix:
  Add: import { useState } from 'react';

Why it matters:
  - JavaScript needs imports to find functions
```

### Progressive Strictness

**Week 1-2:** ERROR only
**Week 3-4:** Add WARNING
**Week 5+:** Add INFO

## Integration with Build Protocol

**BUILD MODE:**
1. Feature implemented
2. **[VALIDATION] Check for errors/warnings**
3. Fix before showing user

**DEBUG MODE:**
1. Bug fix implemented
2. **[VALIDATION] Ensure no new issues**
3. Verify fix doesn't introduce problems

**REFACTOR MODE:**
1. Refactor implemented
2. **[VALIDATION] Behavior unchanged**
3. All imports resolve, no broken references

## Success Metrics

Validation working when:
- ✅ Users never encounter undefined references
- ✅ Import errors caught before testing
- ✅ Spec violations flagged early
- ✅ Refactors proven safe
- ✅ Users learn from messages
