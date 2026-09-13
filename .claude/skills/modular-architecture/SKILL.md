---
name: modular-architecture
description: >
  Apply to ALL software development work. Enforces single-responsibility modules, dependency mapping,
  and structural guidelines. Triggers on: any project start, feature additions, refactoring, architecture
  issues, code becoming difficult to modify, files exceeding 300 lines, duplicated logic, or changes to
  one feature breaking others. Provides dependency mapping during full scans, detects circular dependencies,
  recommends when to split/extract/reorganize code. Integrates with build-protocol for scan guidance,
  specification-first for architecture patterns, and code-validation for structural checks.
---

# Modular Architecture

## Core Principle
Every piece of code belongs in a focused, single-responsibility module. Systems are built from small, composable pieces that can be understood, tested, and modified in isolation.

## When This Skill Applies

### Always Trigger For:
- Starting any new project (establishes module structure from day one)
- Adding any new feature (determines which module owns it)
- Refactoring any code (guides restructuring decisions)
- Debugging multi-file issues (maps dependencies to find root cause)
- Code review (validates structure before merging)

### Warning Signs That Trigger This Skill:
- Single file exceeds 300 lines
- Same logic appears in multiple places
- Changes to one feature break others
- Hard to find where functionality lives
- New feature doesn't fit anywhere cleanly

## Module Structure Principles

### 1. Single Responsibility
Each module has ONE clear job.

**Good:**
```
auth/
  login.js        // Handles login flow only
  session.js      // Manages session state only
  permissions.js  // Checks user permissions only
```

**Bad:**
```
auth/
  everything.js   // Login + session + permissions + user profile + password reset
```

### 2. Clear Boundaries
Modules communicate through explicit interfaces, not internal details.

**Good:**
```javascript
// lessons/api.js - Public interface
export async function fetchLesson(id) { ... }
export async function saveProgress(lessonId, data) { ... }

// lessons/internal.js - Private implementation
function validateLessonData(data) { ... } // Not exported
```

**Bad:**
```javascript
// Everything exported, no clear public vs private
export function fetchLesson(id) { ... }
export function validateLessonData(data) { ... } // Internal detail leaked
export function parseLessonResponse(json) { ... } // Internal detail leaked
```

### 3. Dependency Direction
Dependencies flow in one direction: high-level modules use low-level modules, never vice versa.

**Good:**
```
LessonView (UI)
    ↓
lessons/api (business logic)
    ↓
utils/fetch (low-level utility)
```

**Bad:**
```
utils/fetch
    ↓
LessonView (low-level utility depends on high-level UI!)
```

## Standard Module Structure

For most projects, organize into these layers:

```
src/
  components/     # UI components (React, Vue, etc.)
    shared/       # Reusable UI elements
    features/     # Feature-specific components
  
  modules/        # Business logic modules
    auth/
    lessons/
    progress/
  
  utils/          # Pure utility functions
    api.js
    storage.js
    validation.js
  
  config/         # Configuration constants
    env.js
    routes.js
  
  hooks/          # Custom React hooks (if applicable)
  
  App.jsx         # Root component
  main.jsx        # Entry point
```

## Module Design Guidelines

### Size Limits
- **File:** Max 300 lines before considering split
- **Function:** Max 50 lines before considering extraction
- **Module:** Max 5-7 related files before considering sub-modules

### Naming
- **Modules:** Singular noun (`auth/`, not `auths/`)
- **Files:** Match purpose (`login.js`, `session.js`)
- **Exports:** Descriptive verbs (`fetchUserData`, not `fetch`)

### Documentation
Each module should have a brief header comment:

```javascript
/**
 * lessons/api.js
 * 
 * Handles all lesson data fetching and persistence.
 * Used by: LessonView, ProgressTracker
 * Dependencies: utils/api, config/env
 */
```

## Dependency Mapping

When scanning during debug or refactor, build a dependency map over the affected surface — the failure path and every caller of what is changing (`build-protocol`), not the whole tree by default:

### Step 1: Scan Imports
Extract import statements across that surface:

```
LessonView.jsx imports:
  - lessons/api.js
  - progress/tracking.js
  - components/shared/Button.jsx

lessons/api.js imports:
  - utils/api.js
  - config/env.js
```

### Step 2: Build Dependency Graph
```
LessonView.jsx
  → lessons/api.js
      → utils/api.js
      → config/env.js
  → progress/tracking.js
      → utils/storage.js
  → components/shared/Button.jsx
```

### Step 3: Detect Issues

**Circular Dependencies:**
```
lessons/api.js → progress/tracking.js
progress/tracking.js → lessons/api.js
❌ CIRCULAR DEPENDENCY DETECTED
```

**Resolution:** Extract shared logic to a third module.

**Deep Nesting:**
```
ComponentA
  → ComponentB
      → ComponentC
          → ComponentD
              → ComponentE (5 levels deep)
❌ TOO DEEP
```

**Resolution:** Flatten hierarchy, use composition.

**Unused Files:**
```
File: old-helper.js
Imported by: (none)
❌ ORPHANED FILE
```

**Resolution:** Delete if confirmed unused.

## Refactoring Recommendations

### When to Split a Module

**Trigger: File exceeds 300 lines**
```javascript
// lessons/everything.js (500 lines)
// Contains: API calls, validation, formatting, caching

// Split into:
lessons/
  api.js         // API calls only
  validation.js  // Input validation
  formatting.js  // Data transformation
  cache.js       // Caching logic
```

**Trigger: Multiple responsibilities**
```javascript
// auth/auth.js
// Handles: login, logout, password reset, user profile, permissions

// Split into:
auth/
  login.js       // Login/logout flow
  password.js    // Password management
  profile.js     // User profile
  permissions.js // Permission checks
```

### When to Extract Utilities

**Trigger: Same logic in multiple files**
```javascript
// Found in LessonView.jsx, ProgressCard.jsx, ProfilePage.jsx:
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US');
}

// Extract to:
utils/formatting.js
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US');
}
```

**Trigger: Complex helper function**
```javascript
// Inside LessonView.jsx (obscures component logic):
function calculateProgressPercentage(completed, total, bonus) {
  const base = (completed / total) * 100;
  const bonusPoints = bonus * 5;
  return Math.min(base + bonusPoints, 100);
}

// Extract to:
lessons/utils.js
export function calculateProgressPercentage(completed, total, bonus) {
  const base = (completed / total) * 100;
  const bonusPoints = bonus * 5;
  return Math.min(base + bonusPoints, 100);
}
```

### When to Create Sub-Modules

**Trigger: Module has > 7 files**
```
lessons/
  api.js
  validation.js
  formatting.js
  navigation.js
  state.js
  persistence.js
  audio.js
  scoring.js (8 files, getting cluttered)

// Reorganize:
lessons/
  api/
    fetch.js
    persist.js
  content/
    formatting.js
    validation.js
  delivery/
    navigation.js
    state.js
    audio.js
    scoring.js
```

## Cross-File Consistency

### Import Organization
**Standard order:**
1. React/framework imports
2. Third-party libraries
3. Local modules (alphabetical)
4. Utilities
5. Styles

```javascript
import React, { useState } from 'react';
import { supabase } from '@supabase/supabase-js';

import { fetchLesson } from '../modules/lessons/api';
import { trackProgress } from '../modules/progress/tracking';

import { formatDate } from '../utils/formatting';
import { logEvent } from '../utils/analytics';

import './LessonView.css';
```

### Export Patterns
**Default exports:** Components, single main function per file
```javascript
export default function LessonView() { ... }
```

**Named exports:** Utilities, multiple functions per file
```javascript
export function formatDate() { ... }
export function formatTime() { ... }
export function formatDuration() { ... }
```

### File Structure Consistency
Every file follows the same pattern:

```javascript
// 1. Imports (organized as above)
import React from 'react';

// 2. Constants (if any)
const MAX_RETRIES = 3;

// 3. Helper functions (private to this file)
function helperFunction() { ... }

// 4. Main exports
export function mainFunction() { ... }

// 5. Default export (if applicable)
export default ComponentName;
```

## Integration with Other Skills

### With `specification-first`:
- PROJECT_SPEC defines module boundaries
- Architecture section is the source of truth
- Refactors must maintain spec-defined structure

### With `build-protocol`:
- Debug mode uses dependency map to trace issues
- Refactor mode uses this skill for restructuring guidance
- Build mode checks if new code fits existing modules

### With `test-driven-development`:
- Modules are unit-testable (single responsibility)
- Tests validate module contracts (public interfaces)
- Mocks replace dependencies (clear boundaries)

### With `code-validation`:
- Validates import consistency
- Detects architectural violations
- Flags circular dependencies

## Common Anti-Patterns to Prevent

### God Object/Module
**Problem:** One module does everything
```javascript
// app/core.js (1000 lines)
// Handles: auth, data, UI, routing, state, everything
```

**Solution:** Split by responsibility
```javascript
auth/
data/
ui/
routing/
state/
```

### Feature Envy
**Problem:** Module reaching into another module's internals
```javascript
// lessons/navigation.js
import { state } from '../progress/tracking'; // Accessing internal state
state.currentLesson = newLesson; // Mutating directly
```

**Solution:** Use public API
```javascript
// lessons/navigation.js
import { updateCurrentLesson } from '../progress/tracking'; // Public function
updateCurrentLesson(newLesson);
```

### Shotgun Surgery
**Problem:** One feature change requires editing many files
```javascript
// To add a new lesson type, must edit:
// - lessons/api.js
// - lessons/validation.js
// - lessons/formatting.js
// - LessonView.jsx
// - ProgressCard.jsx
// - 6 other files
```

**Solution:** Centralize related logic
```javascript
// lessons/types/
//   essay.js (all essay-specific logic)
//   audio.js (all audio-specific logic)
// Add new type = add one file
```

### Circular Dependencies
**Problem:** Two modules depend on each other
```javascript
// auth/session.js
import { trackLogin } from '../analytics/tracking';

// analytics/tracking.js
import { getUser } from '../auth/session'; // Circular!
```

**Solution:** Extract shared dependency
```javascript
// models/user.js (shared model)
export class User { ... }

// auth/session.js
import { User } from '../models/user';

// analytics/tracking.js  
import { User } from '../models/user';
```

## Refactor Decision Tree

When code feels messy, use this decision tree:

```
Is file > 300 lines?
├─ YES → Can it be split by responsibility?
│         ├─ YES → Split into focused modules
│         └─ NO → Extract utilities, simplify logic
└─ NO → Is logic duplicated across files?
          ├─ YES → Extract shared utility
          └─ NO → Is module doing multiple jobs?
                    ├─ YES → Split by single responsibility
                    └─ NO → Structure is probably fine
```

## Success Metrics

Modular architecture is working when:
- ✅ You can describe any file's purpose in one sentence
- ✅ Changes to one feature rarely touch other features
- ✅ New features have an obvious "home" module
- ✅ Tests can be written without mocking the entire system
- ✅ Code reviews focus on logic, not "where does this belong?"
- ✅ Dependency graph is a tree (or DAG), never has cycles
- ✅ Onboarding a new developer takes minutes, not hours

## Emergency Refactor Triggers

Stop and refactor immediately if:
- 🚨 Adding a feature requires changing 5+ files
- 🚨 Circular dependency detected
- 🚨 Import depth exceeds 5 levels
- 🚨 Same 10+ line block copied in 3+ places
- 🚨 File exceeds 500 lines (300 is ideal, 500 is red alert)
- 🚨 Module name is vague ("utils", "helpers", "misc")

**These are not optional.** Clean architecture compounds, messy architecture collapses.
