---
name: skill-evolution
description: >
  Captures agreements, patterns, and decisions that should apply universally across all projects.
  When we agree on "how we do X", this proposes the edit to the relevant skill file. Triggers when
  establishing new conventions, discovering better approaches, making decisions that should persist,
  or when user says "always do it this way", "going forward", "add to protocol", or "this should
  be standard". Distinguishes universal patterns from project-specific decisions.
---

# Skill Evolution Protocol

## Core Principle

**Agreements become skills. Patterns become protocols. Experience becomes wisdom.**

When something works, it should apply to all future work, not just this project. A skill is a file in this repo, so capturing a pattern means editing that file and merging it.

---

## When to Apply

### Trigger Phrases

**Explicit universalization:**
- "Let's always do it this way"
- "Going forward, we should..."
- "This should be our standard approach"
- "Add this to the protocol"
- "Make this the default"
- "Remember this for all projects"
- "Every time we X, do Y"

**Pattern recognition:**
- "We keep having this same discussion..."
- "This is the third time we've..."
- "I always want..."
- "Never do X again"

**Skill updates:**
- "Update the [skill name] skill"
- "Add this to [skill name]"
- "This should be in the build protocol"

**Convention establishment:**
- "From now on..."
- "The rule is..."
- "Our standard is..."

### Recognition Patterns

- Repeated decisions across projects
- Having to re-explain a preference
- A successful pattern worth preserving
- A mistake worth preventing
- A workflow improvement found in practice

---

## The Universal vs. Project-Specific Test

Before touching a skill, decide scope.

**Universal (→ skill file):**
- Applies to all current and future projects
- About HOW we work, not WHAT we're building
- Process, pattern or convention
- Quality standard or requirement
- Default behaviour unless overridden

**Project-specific (→ `CLAUDE.md` or `docs/spec-tracker.md`):**
- Applies only to this project
- About WHAT this project does
- Feature, implementation or content
- Project state, status, history
- Context or a decision with a D number

| Statement | Scope | Destination |
|---|---|---|
| "All auth should use Supabase" | Universal | skill file |
| "Hoopoe uses Supabase for auth" | Project | `CLAUDE.md` |
| "Approve the slice, not each batch inside it" | Universal | `build-protocol` |
| "Hoopoe backlog: add flashcards" | Project | `docs/spec-tracker.md` |
| "Mobile-first design for all UIs" | Universal | `mobile-ux` |
| "Hoopoe has 10 lessons" | Project | `docs/PROJECT_SPEC.md` |
| "Test before implementing, no exceptions" | Universal | already in `test-driven-development` |

When in doubt, ask: "Just this project, or all of them?"

---

## How a Change Gets Made

Skills live at `.claude/skills/<name>/SKILL.md` in this repo. There is no central editor. A convention change is a file edit and a PR.

1. **Name the skill and the scope.** State which file changes and confirm it is universal, not project-specific.
2. **Propose before writing.** One line on what is added or changed, where in the file it lands, and what it will make happen differently. Wait for approval.
3. **Apply the change in the repo.** Edit the `SKILL.md` directly, frontmatter intact. Never paste the whole file into chat and never hand over edit instructions: the PR diff is what gets reviewed, and it shows the change more clearly than a full file does.
4. **Commit on a branch, merge by PR** in the browser, then delete the branch. The change takes effect in the next session that loads the skill.

### Three kinds of change

- **Add to an existing skill.** Most changes. Place it in the section that already owns the topic.
- **Refine an existing skill.** A rule that exists but misfires, or an uncovered edge case. Say what it does now and what it would do instead.
- **Create a new skill.** Only when the pattern doesn't fit any existing skill and will trigger often enough to be worth its own file. New directory, new `SKILL.md`, frontmatter with `name` matching the directory and a `description` that states its triggers, since the description is the only thing that decides whether the skill fires.

### Per-repo copies

Skills are committed per repo, so each repo holds its own copy and they drift. This is accepted, not a bug. A universal change lands here first; the same complete file is committed to another repo the next time that project is worked on. Never edit a skill on the assumption the change has propagated.

---

## Writing Skill Updates

**Be concise:**
- Yes: "Critical bugs ship immediately without batching"
- No: "When there is a bug that is critical to the system functioning and users are affected we should ship it right away instead of waiting to batch it"

**Be specific:**
- Yes: "Test mobile viewport in browser dev tools before marking UI complete"
- No: "Make sure it works on mobile"

**Be actionable:**
- Yes: "Read CLAUDE.md before proposing any build step"
- No: "Remember context when starting work"

**Include rationale only where the rule is contestable:**
- Yes: "Always use const/let, never var (prevents scope bugs)"
- Not needed for obvious rules

**Match the skill's voice:**
- `build-protocol`: direct, imperative ("Never build without approval")
- `modular-architecture`: explanatory, principled ("Each file has ONE responsibility")
- `test-driven-development`: strict ("Write code before test? Delete it.")

**Place it correctly:** core principles near the top, process in the middle, examples lower, edge cases beside the rule they qualify. Don't add top-level sections without reason.

---

## Checklist

Before proposing any skill change:

- ☐ Universal, not project-specific
- ☐ Right skill named (or a genuine gap for a new one)
- ☐ Concise and actionable, no fluff
- ☐ Fits the skill's purpose and doesn't contradict another skill
- ☐ Proposed and approved before the file is edited
- ☐ Applied in the repo and reviewable as a diff, frontmatter intact

---

## Red Flags

**Project detail in a skill.** "Hoopoe has 10 lessons organised in `lessons/`" belongs in the spec, not `modular-architecture`. Skills stay universal or they stop being portable.

**Vague rules.** "Try to write good code" is unenforceable. State the measurable criterion.

**Contradicting an existing skill.** A rule like "build features as soon as they're discussed" conflicts with `build-protocol`'s approval gate. Raise the conflict, don't add the rule.

**A skill per preference.** `comma-placement`, `bracket-style`, `spacing` as three skills is fragmentation. Group related conventions into one.

**Silent edits.** Changing a skill mid-task without proposing it first. The rule the next session inherits is the one that was written down, so it gets approved like any other deliverable.

---

## Maintenance

Signs a skill needs work: the same correction repeated, an uncovered edge case, a conflict with another skill, or a rule nobody follows any more.

Obsolete skills are deleted in a PR, not left in place. Git history is the archive. Anything that referenced the deleted skill is updated in the same PR, `CLAUDE.md` included.
