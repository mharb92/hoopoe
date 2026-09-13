---
name: test-driven-development
description: >
  RED-GREEN-REFACTOR cycle for all features, bug fixes, and refactors. Write failing test BEFORE code,
  implement minimal code to pass, then refactor. Bug fixes get reproduction tests (RED → fix → GREEN).
  Refactors must pass all tests before AND after (safety net). Regression prevention through permanent
  test coverage. Progressive strictness for non-developers (errors only → add warnings → add info).
  Integrates with build-protocol (tests before implementation), specification-first (spec drives tests),
  and code-validation (validates test coverage). Optional for simple projects, recommended for production.
---

# Test-Driven Development (TDD)

## Core Principle
Tests are written BEFORE code. Every feature, bug fix, and refactor follows RED-GREEN-REFACTOR: write failing test → implement minimal code to pass → refactor for quality.

## When This Skill Applies

### Always Trigger For:
- Implementing new features
- Fixing bugs
- Refactoring code
- Adding functionality
- Modifying behavior

### Integration with Build Protocol:
- **Build mode:** Write tests BEFORE implementation
- **Debug mode:** Write reproduction test BEFORE fix
- **Refactor mode:** Tests pass BEFORE, verify AFTER

## The RED-GREEN-REFACTOR Cycle

### Phase 1: RED (Failing Test)

**For new features:**
```javascript
// BEFORE feature exists
describe('Favorites', () => {
  it('should save a lesson as favorite', () => {
    addFavorite('lesson-1');
    const favorites = getFavorites();
    expect(favorites).toContain('lesson-1');
  });
});

// Run test → FAILS ✓ RED
```

**For bug fixes:**
```javascript
// BEFORE bug is fixed
describe('Lesson Navigation', () => {
  it('should not crash when session is null', () => {
    session = null;
    expect(() => advanceLesson()).not.toThrow();
  });
});

// Run test → FAILS ✓ RED
```

### Phase 2: GREEN (Passing Test)

Write minimal code to make test pass:

```javascript
function addFavorite(lessonId) {
  const favorites = getFavorites();
  favorites.push(lessonId);
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Run test → PASSES ✓ GREEN
```

### Phase 3: REFACTOR (Improve Quality)

Clean up while keeping tests green:

```javascript
function addFavorite(lessonId) {
  if (!lessonId) throw new Error('Lesson ID required');
  
  const favorites = getFavorites();
  if (!favorites.includes(lessonId)) {
    favorites.push(lessonId);
    saveFavorites(favorites);
  }
}

// Run test → STILL PASSES ✓ GREEN
```

## TDD for Bug Fixes

### Workflow:

1. User reports bug
2. **Write reproduction test (RED)**
3. Implement fix (GREEN)
4. Verify no regression
5. Bug permanently prevented

**Example:**
```javascript
// 1. Bug: App crashes on Next click
// 2. Write test
describe('Bug Fix: Navigation Crash', () => {
  it('handles Next click when not authenticated', () => {
    session = null;
    expect(() => advanceLesson()).not.toThrow();
  });
});

// 3. Fix bug
function advanceLesson() {
  if (!session?.user) {
    showUserMessage('Please sign in');
    return null;
  }
  // ... navigation logic
}

// 4. Test passes → bug fixed
```

## TDD for Refactoring

### Safety Net Protocol:

**Before refactor:**
```bash
npm test
# Result: 47 tests pass ✓ BASELINE
```

**After refactor:**
```bash
npm test
# Result: 47 tests STILL PASS ✓ SAFE
```

**If tests fail:**
❌ NOT a refactor - it's a bug
✓ Revert changes
✓ Debug why behavior changed

## Testing Strategies for Non-Developers

### Option 1: Manual Testing
- Simple, no setup
- Fast for small changes
- Good for learning

### Option 2: Light Testing (Recommended)
- Test critical paths only
- Use Vitest or Jest
- Run before big changes

**Example:**
```javascript
// tests/favorites.test.js
test('saving a favorite works', () => {
  addFavorite('lesson-1');
  expect(getFavorites()).toContain('lesson-1');
});
```

### Option 3: Full TDD (Future Goal)
- Test-first for everything
- Automated CI/CD
- Production-ready

## Recommended Approach

**Test Critical Paths:**
- User authentication
- Data persistence
- Core user actions

**Skip for:**
- UI styling
- Throwaway prototypes
- Experiments

## Integration with Build Protocol

**BUILD MODE:**
1. Feature spec
2. **[TDD] Write failing test**
3. **[TDD] Implement (make test pass)**
4. **[TDD] Refactor**

**DEBUG MODE:**
1. Bug reported
2. Root cause found
3. **[TDD] Write reproduction test (fails)**
4. Fix bug (test passes)
5. Bug permanently prevented

**REFACTOR MODE:**
1. **[TDD] Run all tests (baseline)**
2. Refactor code
3. **[TDD] Tests still pass**
4. If fail → revert

## Success Metrics

TDD working when:
- ✅ Bugs get tests before fixes
- ✅ Features get tests before implementation
- ✅ Refactors preserve behavior
- ✅ Confidence to change code
- ✅ Regressions are rare
