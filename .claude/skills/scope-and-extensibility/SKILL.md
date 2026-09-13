---
name: scope-and-extensibility
description: >
  Governs what to build now vs later AND how to shape what we build so future features are cheap.
  Apply during planning, specs, backlog/roadmap reviews, feature requests, schema or data model design,
  architecture decisions, and milestone reviews. Triggers include "we might need", "future-proof",
  "eventually", "just in case", "make it extensible", "make it configurable", "add later", "roadmap",
  "MVP scope", "new user type", "schema", "data model". Core rule: YAGNI governs feature scope, never
  architectural shape. Works with specification-first, modular-architecture, data-migrations,
  build-protocol, and test-driven-development.
---

# Scope & Extensibility

## Core principle

Every decision answers two separate questions:

1. **Scope:** what do we build now? Be strict. Build only what the current milestone needs.
2. **Shape:** how do we structure what we build so the next feature is cheap? Design for change.

YAGNI applies to question 1 only. Deferring a feature is usually cheap. Deferring a structural decision is often expensive. Never use "we don't need it yet" to justify a shape that blocks known future work.

---

## 1. Classify every idea into one of three buckets

| Bucket | Test | Action |
|---|---|---|
| **Build now** | Current milestone is incomplete or broken without it | Spec it, build it |
| **Design the slot** | Named on the written roadmap | Design the extension point: registration point, config slot, interface, and any schema fields that would be a one-way door if added later. No UI, no logic, no placeholder screens |
| **Ignore** | Speculative: "might", "someday", unnamed users | Don't design for it. General practices (section 3) are enough |

- The roadmap is a written list in the project spec. Items enter it only by the user's decision, never by Claude's suggestion alone.
- Moving an item between buckets is a user decision.

---

## 2. Cost-of-change test

Before deferring any decision, classify it.

**Two-way doors (cheap to defer):** feature logic, UI and layout, copy, settings, new tables, new nullable columns, performance tuning, swapping a library that sits behind an adapter.

**One-way doors (decide at spec time, before the first line of code):**

- **Identity and auth:** real auth provider, stable user IDs. Never key data on email or display name.
- **Data ownership:** every user-owned row carries an owner ID. Access rules (e.g. row-level security) on from day one.
- **Scoping keys:** decide what data is per user vs per user + something else (track, course, workspace, profile). Example: if progress is stored per user and a second learning track is added later, the whole data layer gets rewritten. Adding a `track_id` now, defaulting to the only track, costs almost nothing.
- **Schema conventions:** ID type, `created_at`/`updated_at` on every table, naming, enum strategy, soft vs hard delete.
- **Contracts:** interfaces between modules and request/response shapes of external and server functions. Version them.
- **Content and data versioning:** stored or generated content carries version and source fields.
- **Privacy lifecycle:** one user's data must be fully deletable and exportable. All user data reachable through the owner ID, no orphan copies.
- **Migration workflow:** schema changes live as versioned files in the repo (see data-migrations).
- **Validation boundary:** all external data (AI output, API responses, database rows) is validated where it enters the app.
- **Observability hook:** logging and cost tracking built into shared services.
- **Text direction and localization,** if the app is multilingual or RTL.

**Unsure which door?** Ask: "If we reverse this in 6 months with real user data, what changes?" If the answer involves migrating many rows or editing many modules, it's a one-way door.

---

## 3. Extensibility practices (the default shape)

- **Config over conditionals.** Variations (user types, tiers, tracks) are data definitions read by one engine. Red flag: the same type check appears in 2+ files.
- **Registries for things that multiply.** Routes, features, exercise or content types, settings. Adding one = a new file + one registration line.
- **Features as self-contained modules.** Each owns its UI, logic, data access and tests. Features talk to core only through shared services and never import another feature's internals (see modular-architecture).
- **One thin adapter per external service** (database, AI, TTS, payments). The single place for auth headers, retries, timeouts, validation, error handling and logging. Concrete code, not abstract hierarchies.
- **Additive schema evolution.** Add tables and nullable columns with defaults. Don't reshape existing ones (see data-migrations).
- **JSON columns only for genuinely variable per-type payloads,** with a type and version field. Never for core fields.
- **Generic core data models.** E.g. mastery tracked per item regardless of which feature taught it, with a `source` field. New features write to the same model.
- **Types generated from the schema,** strict typing, no escape hatches.
- **Feature flags** for per-user or per-group enablement, so features can ship to testers first.
- **Stable identifiers.** Never key on display text, emails or array positions.
- **Tests are the real future-proofing.** Without them nothing is safely changeable.

**Rule of three:** inside code, abstract only on the third concrete use. Never apply the rule of three to one-way doors.

---

## 4. Over-engineering red flags

- Interface or base class with one implementation and no named second
- Plugin systems for unnamed features
- Config options nobody asked for
- Scaling for traffic you don't have (caching layers, sharding, microservices)
- Generic framework code before 2 concrete features need it
- Slots designed for speculative items
- UI or logic built for a slot

**Test:** name the specific roadmap item or current requirement this serves. If you can't, remove it.

---

## 5. Roadmap proof (required in every project spec)

| Roadmap item | Slot designed | Files a future build adds | Core changes needed | Door type |
|---|---|---|---|---|

- **Target for "core changes needed":** a registration line or config entry. Anything more is a design issue to resolve, or to accept explicitly with the user.
- **Unnamed future features:** verify the architecture against the standard shapes. If each plugs in without core edits, it's extensible beyond the roadmap:
  1. A new feature module
  2. A new variation (user type, tier, track)
  3. A new exercise or content type
  4. A new consumer of core data (reads or writes progress)
- **Known core-touching changes:** list the kinds of change that will touch core regardless (e.g. auth model changes, real-time features between users, platform change such as a native app, payments), so they're recognized as big jobs when they come up.

---

## 6. Workflow checkpoints

- **Planning:** sort every idea into the 3 buckets. Roadmap changes only by user decision.
- **Spec:** run the cost-of-change test on every structural decision, decide all one-way doors, complete the roadmap proof table.
- **Build:** implement only build-now items. Slots exist only as registration points, interfaces and one-way-door schema fields. No dead code.
- **Milestone review:** re-run the roadmap proof against the actual code. Flag scattered conditionals, cross-feature imports and bypassed adapters.

---

## 7. Phrases to watch

| Phrase | Response |
|---|---|
| "We might need..." / "just in case" / "eventually" | Ignore bucket, unless it's on the roadmap |
| "Let's make it configurable / generic" | Name the second use, or don't |
| "We'll add auth / ownership / deletion later" | One-way door. Decide now |
| "Just check the user type here" | Config over conditionals |
| "Add a placeholder screen for X" | Slots have no UI |

---

## Integration

- **specification-first:** the roadmap list, roadmap proof table and one-way-door decisions live in the project spec
- **modular-architecture:** module boundaries, dependency direction, file size
- **data-migrations:** mechanics of schema and state changes
- **build-protocol:** only approved build-now items get built
- **test-driven-development:** tests are what make future change safe
