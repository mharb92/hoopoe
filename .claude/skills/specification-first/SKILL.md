---
name: specification-first
description: >
  Apply before implementing ANY feature. Requires complete, approved specification before
  any code is written. Triggers include: starting new features, planning builds, design
  discussions, backlog reviews, bug reports, refactor requests, or any mention of "let's build",
  "implement", "add", "broken", "messy", "refactor". Prevents costly rebuild cycles caused by
  unclear requirements. Creates persistent PROJECT_SPEC.md files, feature mini-specs, bug-fix
  mini-specs, and refactor mini-specs. Architecture specs are finished only once a walking skeleton runs.
  Works with build-protocol (happens before build/debug/refactor), integrates with modular-architecture
  (informs module design) and TDD (spec drives test cases).
---

# Specification-First Development

## Core Principle
No code is written without a complete, approved specification. This prevents costly rebuild cycles caused by unclear requirements and ensures every line of code has a documented purpose.

## When This Skill Applies

### Always Trigger For:
- Starting any new project ("I want to build [X]", "new project", "start fresh")
- Implementing any new feature ("add [X]", "let's build [Y]")
- Fixing any bug ("broken", "crash", "not working", "bug")
- Refactoring any code ("messy", "clean this up", "refactor", "hard to read")
- Planning any build ("discuss", "plan", "design", "backlog")

### Integration with Other Skills:
- Happens BEFORE `build-protocol` (spec creation → build approval)
- Happens AFTER `project-memory-protocol` (context loaded → spec created)
- Informs `modular-architecture` (spec defines structure)
- Drives `test-driven-development` (spec defines test cases)

## Spec Types

### 1. Project Spec (New Projects)

Complete specification stored as `PROJECT_SPEC.md` in project directory.

#### Creation Workflow

**Step 1: Show Project Archetypes**

Present 2-3 example project types based on user's stated goal:

```
I found 3 similar project types:

A) [Archetype Name] ([Tech Stack])
   - [Key features, 3-4 bullet points]
   
B) [Archetype Name] ([Tech Stack])
   - [Key features, 3-4 bullet points]
   
C) [Archetype Name] ([Tech Stack])
   - [Key features, 3-4 bullet points]

Which is closest to what you want? (or say "none" for custom)
```

**Example Archetypes to Keep Ready:**
- **CRUD Web App** (React + Supabase): User auth, data tables, CRUD operations, responsive design
- **PWA Mobile-First** (React + localStorage): Offline-capable, mobile-optimized, installable, push notifications
- **AI-Powered Tool** (React + Claude API): Chat interface, context management, streaming responses, token optimization
- **Dashboard/Analytics** (React + charting library): Data visualization, filtering, real-time updates, export
- **Content Site** (Next.js + CMS): Static generation, SEO, blog/docs, fast loading
- **Game/Interactive** (React/Canvas): State management, animations, scoring, persistence

**Step 2: Interview Questions (8-10 Based on Archetype)**

For CRUD/Dashboard apps:
1. "Will users need accounts, or is this single-user/local storage?"
2. "What's your database preference: Supabase, Firebase, localStorage, or other?"
3. "Mobile-first or desktop-focused?"
4. "Will data sync across devices, or stay local?"
5. "Top priority: speed, features, or simplicity?"
6. "Any real-time collaboration needed?"
7. "What data needs to persist: user prefs, full app state, or both?"
8. "Expected data volume: dozens, hundreds, or thousands of records?"

For AI-powered apps:
1. "What's the core AI task: chat, content generation, analysis, or automation?"
2. "Will conversations need to persist across sessions?"
3. "Should users be able to share/export results?"
4. "Token budget concerns: optimize for cost or response quality?"
5. "Need streaming responses or complete answers only?"
6. "Will this integrate with external APIs or data sources?"
7. "Authentication required, or open access?"
8. "Mobile or desktop primary use case?"

For PWAs/Mobile apps:
1. "Must work offline, or internet required?"
2. "What needs to sync: settings only, or full data?"
3. "Push notifications needed?"
4. "Home screen install important?"
5. "Camera/location/sensors needed?"
6. "Primary user action happens how often: hourly, daily, weekly?"
7. "Data privacy: cloud backup or device-only?"
8. "Bundle size priority: minimal (<50kb) or feature-rich?"

**Step 3: Generate Comprehensive PROJECT_SPEC.md**

Template structure (adapt based on archetype and answers):

```markdown
# Project: [Project Name]

## Overview
[2-3 sentence description of what this project does and why it exists]

## Tech Stack
- **Frontend:** [Framework + version]
- **Backend/Database:** [Service or local storage]
- **AI/APIs:** [External services, if any]
- **Build Tools:** [Vite, Next.js, etc.]
- **Hosting:** [Planned deployment target]

## Architecture

### Module Structure
[Define 3-5 core modules and their responsibilities]

Example:
- **auth/** - User authentication and session management
- **lessons/** - Lesson content delivery and navigation  
- **progress/** - User progress tracking and persistence
- **ui/** - Shared UI components and layouts
- **utils/** - Helper functions and constants

### Data Flow
[Describe how data moves through the system]

Example:
1. User authenticates → session stored in auth module
2. Lesson loaded → lessons module fetches content
3. User completes action → progress module updates state
4. State persisted → utils/storage saves to Supabase

### State Management
[How and where state is managed]

Example:
- React hooks for component state
- Context API for auth session (global)
- Local state for lesson UI (ephemeral)
- Supabase for persistence (durable)

## Coding Style

### Naming Conventions
- **Variables:** camelCase, descriptive (`currentLessonId`, not `cid`)
- **Functions:** verbNoun (`fetchUserProgress`, `updateLessonState`)
- **Components:** PascalCase (`LessonView`, `ProgressCard`)
- **Files:** Match component/module name (`LessonView.jsx`, `progress/tracking.js`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)

### Code Organization
- **One component per file** (max 300 lines before splitting)
- **Related functions grouped** (all auth helpers in auth/utils.js)
- **Imports organized:** React → third-party → local, alphabetical within groups
- **Exports at bottom** of file (unless default export component)

### Error Handling
- **User-facing errors:** Friendly messages, no stack traces
- **Developer errors:** Console.error with context
- **Network errors:** Retry with exponential backoff (max 3 attempts)
- **Validation errors:** Show inline, prevent submission

**Pattern to Follow:**
```javascript
try {
  const result = await fetchData();
  return result;
} catch (error) {
  console.error('Failed to fetch data:', error);
  showUserMessage('Could not load data. Please try again.');
  return null;
}
```

### Async Patterns
- **Always use async/await** (no raw promises with .then)
- **Handle loading states** (show spinner while fetching)
- **Race condition prevention:** Cancel stale requests, debounce user input
- **Error boundaries:** Wrap async calls in try/catch

## Constraints

### Performance
- **Bundle size:** [Target, e.g., < 100kb gzipped]
- **Load time:** [Target, e.g., < 2s on 3G]
- **Offline capability:** [Required or nice-to-have]

### Browser Support
- **Primary:** Modern Chrome, Safari, Firefox (last 2 versions)
- **Mobile:** iOS Safari 14+, Chrome Android 90+
- **No IE support**

### Accessibility
- **Keyboard navigation:** All interactive elements
- **Screen readers:** Semantic HTML, ARIA labels where needed
- **Color contrast:** WCAG AA minimum

### Security
- **Auth:** [Strategy, e.g., Supabase RLS, JWT tokens]
- **Data validation:** Sanitize all user input
- **API keys:** Environment variables, never hardcoded
- **HTTPS only** in production

## Patterns to Follow

### Component Structure (React)
```javascript
import React, { useState, useEffect } from 'react';
import { externalLib } from 'external-package';
import { localHelper } from './utils';

export default function ComponentName({ propA, propB }) {
  // State declarations
  const [state, setState] = useState(initialValue);
  
  // Side effects
  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [dependencies]);
  
  // Event handlers
  const handleEvent = async () => {
    try {
      // Logic
    } catch (error) {
      // Error handling
    }
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### API Calls
```javascript
// utils/api.js
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

### State Updates
```javascript
// Immutable updates, always
setState(prev => ({
  ...prev,
  updatedField: newValue
}));

// NOT this (mutates state):
// state.updatedField = newValue;
// setState(state);
```

## Patterns to Avoid

### Anti-Pattern: God Components
```javascript
// DON'T: 500-line component doing everything
function MassiveComponent() {
  // auth logic
  // data fetching
  // business logic
  // UI rendering
  // event handling
}

// DO: Split into focused modules
function LessonView() {
  const { user } = useAuth(); // Separate hook
  const { lesson } = useLesson(); // Separate hook
  return <LessonContent lesson={lesson} />; // Separate component
}
```

### Anti-Pattern: Prop Drilling
```javascript
// DON'T: Pass props through 5 components
<A user={user}>
  <B user={user}>
    <C user={user}>
      <D user={user} />

// DO: Use context for global state
const { user } = useAuth(); // Access anywhere
```

### Anti-Pattern: Hardcoded Values
```javascript
// DON'T:
if (attempts > 3) { ... }

// DO:
const MAX_RETRY_ATTEMPTS = 3;
if (attempts > MAX_RETRY_ATTEMPTS) { ... }
```

### Anti-Pattern: Silent Failures
```javascript
// DON'T:
try {
  await saveData();
} catch (error) {
  // Nothing, user never knows it failed
}

// DO:
try {
  await saveData();
} catch (error) {
  console.error('Save failed:', error);
  showUserMessage('Could not save. Please try again.');
}
```

## Testing Strategy
- **Unit tests:** Pure functions, utilities (optional for simple projects)
- **Integration tests:** User flows, critical paths (recommended)
- **Manual testing:** All user-facing features before release (required)

## Deployment
- **Environment:** [Vercel, Netlify, self-hosted, etc.]
- **CI/CD:** [If applicable]
- **Environment variables:** [List required vars]

## Project-Specific Notes
[Any unique requirements, gotchas, or context not covered above]

---

**Version:** 1.0  
**Created:** [Date]  
**Last Updated:** [Date]
```

**Step 4: Store and Finalize**

1. Create spec in `/home/claude/[project-name]/PROJECT_SPEC.md`
2. Show spec to user for review
3. On approval:
   - Copy to `/mnt/user-data/outputs/[project-name]/PROJECT_SPEC.md`
   - Add memory edit: `Project: [Name]. Spec at /mnt/user-data/outputs/[project-name]/PROJECT_SPEC.md`
4. Confirm: "Project spec created and saved. Ready to build when you are."

### 2. Feature Mini-Spec (New Features)

When adding a feature to an existing project, create a mini-spec that inherits from the project spec.

**Template:**

```markdown
## Feature: [Feature Name]

### Purpose
[What this feature does and why it's needed]

### Affected Modules
[Which modules from PROJECT_SPEC will be modified]

### New Components/Functions
- [List what needs to be created]

### Modified Components/Functions
- [List what needs to be updated]

### Data Changes
[New state, database fields, API endpoints]

### User Flow
1. [Step-by-step user interaction]
2. [...]

### Edge Cases to Handle
- [What if user is offline?]
- [What if data is missing?]
- [What if action fails?]

### Testing Requirements
- [What needs to be tested]

### Follows Project Patterns
- Error handling: [Per spec]
- Naming: [Per spec]
- State management: [Per spec]
```

### 3. Bug-Fix Mini-Spec (Debugging)

When a bug is reported, create a mini-spec that guides the fix.

**Template:**

```markdown
## Bug: [Brief Description]

### Expected Behavior
[What should happen]

### Actual Behavior
[What currently happens]

### Steps to Reproduce
1. [User action]
2. [User action]
3. [Bug appears]

### Affected Module(s)
[Which modules are involved]

### Error Messages (if any)
[Console errors, stack traces]

### Recent Changes
[What was modified recently in affected modules]

### Root Cause Analysis Requirements
**CRITICAL:** Before proposing ANY fix:
1. ✓ Full codebase scan completed (all files read)
2. ✓ Dependency map created (what calls what)
3. ✓ Execution path traced (entry point → crash point)
4. ✓ All code paths touching this functionality identified
5. ✓ Root cause identified with evidence from multiple files
6. ✓ Impact assessment completed (what else will this fix affect)

### Fix Constraints
- Must preserve existing functionality in other modules
- Must follow error handling patterns from PROJECT_SPEC
- Must not introduce new dependencies unless justified
- Must include test to prevent regression

### Success Criteria
- Bug no longer reproduces
- No new bugs introduced
- All existing tests still pass
- New test added to catch this in future
```

### 4. Refactor Mini-Spec (Code Improvement)

When code needs restructuring without behavior changes.

**Template:**

```markdown
## Refactor: [What's Being Refactored]

### Current State
[Describe what's messy/hard to maintain]

### Why Refactor Now
[What problems does current structure cause]

### Desired State
[What it should look like per PROJECT_SPEC]

### Affected Files
[List all files that will change]

### Behavior Preservation Requirements
**CRITICAL:** This refactor must:
1. ✓ Maintain identical functionality (no behavior changes)
2. ✓ Pass all existing tests after refactor
3. ✓ Follow architecture patterns from PROJECT_SPEC
4. ✓ Impact assessment completed (what imports this)

### Improvements Expected
- [Readability: why code will be clearer]
- [Maintainability: why changes will be easier]
- [Testability: why tests will be simpler]
- [Reusability: why code can be reused]

### Risk Level
[Low / Medium / High - based on number of files touched]

### Testing Plan
1. Run existing tests BEFORE refactor (establish baseline)
2. Refactor code
3. Run same tests AFTER refactor (must all pass)
4. Manual smoke test of affected features
```

## Spec Versioning

When a spec is updated, track the change:

```markdown
## Changelog

### v1.1 - 2026-04-05
- Added offline mode requirement
- Updated state management to use Context API
- Added accessibility constraints

### v1.0 - 2026-04-01
- Initial spec created
```

## Architecture specs are validated by a skeleton

A spec written in prose is reviewed in prose, and review catches contradictions but not an architecture that does not work. So an **architecture** spec — stack, module boundaries, runtime seams, build pipeline — is not finished when it reads well. It is finished when the thinnest possible slice of it runs.

**Build a walking skeleton before the next section depends on it:** app shell, one screen, one read, one write, every gate running, deployed where a human can open it. No features.

- The skeleton proves the **mechanism**, never the schema or the domain model. Anything it has to persist goes to a disposable probe table, dropped when the data section lands, so it cannot pre-empt decisions it isn't making.
- Name what it does **not** prove, so nobody reads it as broader assurance than it is.
- If the skeleton shows the architecture spec is wrong, the spec is revised. It is not ploughed past — the skeleton exists precisely to be allowed to say no.

The cost is one build cycle before the next section starts. The alternative is discovering the same thing after three more sections are written on top of it.

## Integration with Build Protocol

**Specification-first workflow ensures:**

1. **Before building:** Spec exists and is approved
2. **During building:** Code matches spec patterns
3. **After building:** Validation confirms spec compliance

**The spec is the contract** between user intent and Claude's implementation.

## Common Mistakes to Prevent

### Mistake: "Let's just start building and figure it out"
**Prevention:** Refuse to write code without a spec. Explain why specs prevent costly rebuilds.

### Mistake: Spec is vague ("make it user-friendly")
**Prevention:** Interview questions force concrete decisions. "User-friendly" becomes "mobile-first, touch-optimized, < 3 taps to core action."

### Mistake: Spec contradicts itself
**Prevention:** Review architectural decisions for conflicts before finalizing.

### Mistake: Spec is abandoned mid-project
**Prevention:** Mini-specs inherit from project spec, keeping patterns consistent.

## Emergency Spec Creation

If user insists on building without a full spec (rare, discouraged):

1. Create minimal spec from conversation context
2. Flag gaps: "Proceeding with incomplete spec. Auth strategy undefined. Storage location undefined."
3. Fill gaps with reasonable defaults, document assumptions
4. Warn: "This may require rework if assumptions are wrong."

**This should almost never happen.** Pushing back on spec-less building is a feature, not a bug.

## Success Metrics

Specification-first development is working when:
- ✅ Code rarely needs to be rewritten due to unclear requirements
- ✅ Architectural decisions are documented and consistent
- ✅ New developers (or Claude in new sessions) can understand the system from the spec
- ✅ Debugging is faster because expected behavior is explicit
- ✅ Features integrate cleanly because structure is pre-defined
