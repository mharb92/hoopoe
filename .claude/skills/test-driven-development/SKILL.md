---
name: test-driven-development
description: >
  RED-GREEN-REFACTOR cycle for all features, bug fixes, and refactors. Write failing test BEFORE code,
  implement minimal code to pass, then refactor. Bug fixes get reproduction tests (RED → fix → GREEN).
  Refactors must pass all tests before AND after (safety net). Regression prevention through permanent
  test coverage.
  Integrates with build-protocol (tests before implementation), specification-first (spec drives tests),
  and code-validation (validates test coverage).
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

## Green tests are not always done

A test suite only checks what it can see. Where a module's real output is consumed by something outside the suite — a model, an external API, a rendering engine, another service — green tests prove the module behaves as the test author imagined, not that the thing on the other side accepts it.

**So a module with an external consumer is done when one real exchange succeeds, not when its tests pass.** Write the tests first as always; then make one live call, one real render, one real request, before calling it finished.

The failure this prevents: a prompt builder whose tests assert the strings it assembles, passing whether or not those strings ever told the model what to return. Every test was green and the first live call came back in an invented shape. The same shape of gap exists wherever the assertion and the consumer are different readers of the same output.

State it in the done-when. "Suites pass" is the wrong bar for these modules; "suites pass and one live exchange validated" is the right one.

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
- ✅ Modules with an external consumer are proven by one real exchange, not by green tests alone
- ✅ Confidence to change code
- ✅ Regressions are rare
