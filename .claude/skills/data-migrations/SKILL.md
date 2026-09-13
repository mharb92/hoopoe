---
name: data-migrations
description: >
  Apply this skill whenever building or updating any app that stores persistent user data —
  in localStorage, Supabase, Firebase, or any other database. Triggers include: adding new
  fields to stored state, renaming keys, restructuring data objects, adding new database
  columns or tables, changing how progress or user data is shaped. Also apply at the START
  of any new app build that will store user state, to establish versioning from day one.
  Key phrases: "add a new field", "restructure state", "rename this key", "add a column",
  "update the schema", "change how we store", "users might lose progress".
---

# Data Migrations & State Versioning

## The core problem

When an app stores user data and the code that reads that data changes, returning users
can have a mismatch between what's stored and what the new code expects. This causes:
- Silent bugs (undefined values, missing features, wrong behaviour)
- Crashes (code tries to call a method on undefined)
- Data loss (old data ignored, user appears to have no progress)

The goal is to make every update safe for existing users — their data migrates forward
automatically, they never notice anything changed.

---

## Rule 1 — Version your state from day one

Every app that stores persistent state should have a version number baked in from the
first build. This makes future migrations possible.

**localStorage:**
```javascript
const STATE_VERSION = 1;
const STORAGE_KEY = 'app_state_v1'; // version in the key name

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ _v: STATE_VERSION, ...state }));
}
```

**Supabase:** Add a `schema_version` column to your primary user table, defaulting to 1.

When the state structure changes, bump the version number and write a migration.

---

## Rule 2 — Classify every change before making it

Before touching any stored data structure, classify the change:

| Change type | Risk | Action required |
|-------------|------|-----------------|
| Adding a new optional field | Low | Ensure code has a fallback default |
| Adding a new required field | Medium | Migration sets default for existing rows |
| Renaming a key or column | High | Migration reads old name, writes new name, deletes old |
| Restructuring an object | High | Migration transforms old shape to new shape |
| Deleting a field | Medium | Migration cleans up (or just ignore safely) |
| Changing a field's type | High | Migration converts existing values |
| Adding a new table | Low | No migration needed — new table starts empty |

---

## Rule 3 — Additive changes need default fallbacks

For low-risk additive changes, no migration function is needed — just ensure the code
handles the missing field gracefully.

**Pattern:**
```javascript
// BAD — crashes if field doesn't exist yet
function getStreak() {
  return users[activeUser].streak;
}

// GOOD — fallback default for new field
function getStreak() {
  return users[activeUser].streak ?? 0;
}
```

**For Supabase additive changes:**
```sql
-- Safe to add — existing rows get null, handle in code
ALTER TABLE unit_progress ADD COLUMN speed_ms integer;
```
Then in the app:
```javascript
const speed = row.speed_ms ?? null; // null is fine, feature just won't show
```

---

## Rule 4 — Breaking changes need a migration function

For medium/high-risk changes, write a migration that runs once on app load, detects
the old structure, and transforms it to the new structure.

**localStorage migration pattern:**
```javascript
function migrateState() {
  try {
    // Check for old version
    const oldData = localStorage.getItem('app_state_v1');
    const newData = localStorage.getItem('app_state_v2');
    
    if (oldData && !newData) {
      const old = JSON.parse(oldData);
      
      // Transform old structure to new structure
      const migrated = {
        _v: 2,
        users: old.users,
        profile: old.profile,
        // New field with sensible default derived from old data
        startDate: old.users?.marwan?.createdAt ?? Date.now(),
        // Renamed field
        dynamicUnits: old.generatedUnits ?? {}, // old name → new name
      };
      
      localStorage.setItem('app_state_v2', JSON.stringify(migrated));
      localStorage.removeItem('app_state_v1'); // clean up old key
      console.log('Migrated state from v1 to v2');
    }
  } catch(e) {
    console.warn('Migration failed — starting fresh', e);
  }
}

// Call BEFORE load(), at app init
migrateState();
load();
```

**Supabase migration pattern:**
```sql
-- Add new column with a sensible default
ALTER TABLE unit_progress ADD COLUMN attempts_v2 integer DEFAULT 0;

-- Populate from existing data
UPDATE unit_progress SET attempts_v2 = attempts WHERE attempts IS NOT NULL;

-- Once confirmed working, rename (do this in a later deploy)
-- ALTER TABLE unit_progress RENAME COLUMN attempts TO attempts_legacy;
```

---

## Rule 5 — Chain migrations for multi-version gaps

If a user hasn't opened the app in a long time, they might be multiple versions behind.
Write migrations that chain — v1→v2, then v2→v3 — so no user gets left behind.

```javascript
function migrateState() {
  runMigration_v1_to_v2();
  runMigration_v2_to_v3();
  // Add future migrations here
}

function runMigration_v1_to_v2() {
  const old = localStorage.getItem('app_state_v1');
  if (!old) return; // already migrated or fresh install
  // ... transform and save as v2 ...
  localStorage.removeItem('app_state_v1');
}

function runMigration_v2_to_v3() {
  const old = localStorage.getItem('app_state_v2');
  if (!old) return;
  // ... transform and save as v3 ...
  localStorage.removeItem('app_state_v2');
}
```

---

## Rule 6 — Test migrations before shipping

Before pushing a state change to production:

1. **Simulate the old state** — manually set localStorage to the old structure in DevTools
2. **Load the new code** — confirm it migrates cleanly and the app works
3. **Check for console errors** — any undefined access will show up
4. **Verify data integrity** — open Progress tab, confirm all fields are correct

For Supabase: run the migration SQL on a test row first, confirm the output looks right
before running on all rows.

---

## Rule 7 — Never silently lose data

If a migration fails for any reason, the fallback should be to start fresh — not to
crash the app or show corrupted state. Always wrap migrations in try/catch and log
clearly what happened.

```javascript
function migrateState() {
  try {
    // migration logic
  } catch(e) {
    console.warn('Migration failed — clearing old state and starting fresh:', e);
    // Optional: preserve a backup of the broken state for debugging
    try {
      localStorage.setItem('app_state_backup', localStorage.getItem('app_state_v1'));
    } catch(_) {}
    localStorage.removeItem('app_state_v1');
  }
}
```

---

## Quick checklist — use before every state change

Before touching any stored data structure, answer these questions:

- [ ] What version is the current state?
- [ ] What type of change is this? (additive / rename / restructure / delete)
- [ ] Do existing users have data that needs transforming?
- [ ] Have I written a migration function if needed?
- [ ] Have I added fallback defaults for any new fields?
- [ ] Have I bumped the version number?
- [ ] Have I tested by simulating the old state?
- [ ] Is the migration wrapped in try/catch?

---

## Applied to the Arabic app specifically

Current state version: `arabic_app_v3` (localStorage key)
Supabase tables: profiles, unit_progress, weak_words, checkpoints, dynamic_units

**Next migration trigger:** any change to the shape of `users[activeUser]`,
`unitProgress[unitId]`, or `pScores` objects. If adding a new field to
`unitProgress` (e.g. `speed_ms`), add a fallback default in `getUP()` and
note it does not need a migration. If renaming a field, write a migration
that reads the old name and writes the new name.

**Version bump protocol for the Arabic app:**
1. Change `STORAGE_KEY` from `arabic_app_v3` to `arabic_app_v4`
2. Write `migrateState()` that reads v3 and writes v4
3. Call `migrateState()` before `load()` in the init IIFE
4. Update this note with the new version
