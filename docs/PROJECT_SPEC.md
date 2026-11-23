# Hoopoe (الهدهد) Project Spec
Status: B, C1 to C11, D and E approved · F to J pending. Learning principles and the section gate: `principles.md`.
**Lesson model rework in progress (D280, D295).** B and `principles.md` were rewritten chat 33 (block R1); C2, C6 and C8 chat 35 (block R2, the learner model). The rest of C1-C11, D and E still describe the pre-generated, native-reviewed content model until blocks R3-R6 rewrite them; where one of those sections disagrees with B or with a rework decision in the tracker, B and the tracker win.
Reader: builder (Sonnet 5, Claude Code). Approved sections are binding; do not infer beyond them. `harvest §N` = findings from old code on `modular-rebuild-5`, reference only.

## B. Product

### B1 Vision
Hoopoe gets heritage speakers and beginners speaking everyday Palestinian Arabic, Ramallah city speech first, through short lessons the model builds for each learner on proven learning methods, adapting to what each learner already knows and proving progress through scored practice conversations.

### B2 Goal
- Target per learner type, held as config (B3: no learner-type conditionals in features):

| Learner type | 90-day target at the default pace | Band (§C8.5) |
|---|---|---|
| Beginner | Survival conversation: greet, introduce yourself and your family, say what you want and what you have, ask and answer simple questions. Rehearsed exchanges with a patient listener, not open conversation | `emerging` |
| Heritage | Hold a 5-7 minute everyday conversation: narrate, give opinions, repair a misunderstanding | `conversational` |

- Default pace: 3 sittings a week of about 20 minutes, about 13 hours per phase. **Each learner's pace is set from the sittings per week they give in the "about you" step (C3.3) and revisited at the monthly check-in**; later blocks are sized from the time actually studied (C3.7); the 3-sitting figure is the fallback when none is given. **The pace is a starting setting, not a limit.** Learners may do more lessons per sitting and more sittings per week, and the planner pushes as fast as each learner's results allow; only `new_lessons_per_day` caps new material (P9, C1.2). The target describes the default pace, not a ceiling: learners who study more go further.
- Why the beginner target is modest: A1 in Arabic takes roughly 150 study hours for an English speaker (estimate, moderate-low confidence: A1 is about 60-100 guided hours for a European language, and the FSI puts Arabic in its hardest category). At the default pace A1 is a second- or third-phase goal. The estimate does not apply to heritage learners, whose skills start unevenly (understanding often well above speaking, script often near zero), so placement seeds each skill separately (§C2).
- A band is reached when the milestones it lists are met (D288), not by completing a checkpoint. The ladder carries a state below `emerging`, `starting`, so the beginner target can be missed (C6.15, C8.5).
- Phase = 90 days, fixed in MVP. The plan record stores its length (`duration_days`) so later phases can differ (roadmap: phase renewal).
- The phase is planned as blocks, each running from one checkpoint to the next, with an outcome in plain words and 2-4 can-do statements (§C3).
- Progress toward target is measured by checkpoint conversations (§C8): soft gates, fluency bands, no pass/fail. Shown as capabilities, never as numbers or pace (P17).
- Goals captured at onboarding shape topics and scenarios, not the target (§C1).
- Recorded risk R1 (D69): MVP measures a spoken goal through text checkpoints. Speaking practice (B6) closes it. See `principles.md`.

### B3 Personas
| Persona | Starting point | Core needs | Bucket |
|---|---|---|---|
| Heritage | Grew up hearing Palestinian Arabic; understands more than speaks; reads little script | Skip known material, activate passive vocab, speaking confidence | MVP |
| Beginner | No Arabic; usually a family or partner connection | Sounds and script, recognition first, small chunks, repetition, explicit simple grammar (harvest §3c) | MVP |
| Intermediate | Already converses | Range, accuracy, correction | Slot |

Learner type is config consumed by one engine. No learner-type conditionals in features.

### B4 Users and access
MVP users: three learners, Marwan and Omar (heritage) and Aya (beginner). Invite-only (§G). Every sizing, cap and user-count assumption is for three; nothing is built for use cases that do not exist, such as regional variants. The beginner path has one tester, so its findings are read as a case, not a rate.

### B5 MVP scope
- Onboarding: a ~3-minute "about you" step (why learning, who the learner will speak with, where the family is from, interests, sittings per week; a form, no family names, D344), which the learner can see, edit and delete; then placement for every learner type (§C1, §C2)
- Lessons the model builds per learner: blocks between checkpoints, each generated a set of about 6 lessons at a time from the latest learner record; six lesson types (grammar, words, story, conversation, fluency, review); a quiz in every lesson and a weekly quiz closing each set, which must be taken, not passed, and whose results shape the next set; audio
- Grammar taught explicitly along a grammar path, and verbs through Verb Lab
- Focused Study, built by code from checked data with no AI call per session: Verb Lab, topic vocabulary, situation practice (scripted exchanges written once, checked and shared), my weak spots, numbers, prices and time, call-and-response phrases, endings drills, speed rounds
- Conversation partner: typed, AI, at the learner's level, recasting errors rather than lecturing
- Tap any word for meaning, root, form and audio; a "why?" button for a short AI explanation, capped
- My Vocabulary review, alphabet and phonics
- Checkpoint conversations (text first)
- Monthly real-life check-in, about 30 seconds
- Content quality: report-a-problem everywhere; shared content (dictionary, conjugation tables, grammar path, scripted exchanges) edited via the Supabase table editor
- Basic settings: edit goals and "about you", adjust plan, harakaat toggle
- Progress as capability: streak, words learned, phrases learned, and milestones reached, shown as can-do statements per skill. Paces, percentages and on- or behind-pace readings stay internal (P17)
- Cost tracking on every Claude call. Spend cap per learner per calendar month, config: $7 soft (above it, a cheaper model) and $10 hard (above it, AI features pause; reviews, Focused Study and Verb Lab keep working)
- Account deletion and export designed into the data model (UI on roadmap)

Build surfaces, not learner-facing, also in MVP scope:
- Lesson generation pipeline: block planner, lesson generator, blocking validators and a critic pass; a failing lesson is regenerated, never shown (§C5)
- Conjugation tables for every teachable verb, the grammar path and the milestone catalogue, as versioned content
- Audio: word and verb-form clips made once and shared; sentence audio made on first play and stored, content-addressed (§C9)
- Config resolver, CI gate and `runtime_flag` allowlist (C10.6, C10.7)
- AI gateway, model allowlist and versioned prompt registry (C5.8, C5.10)
- Content tables and the Supabase editor path for edits (C5.11)

### B6 Roadmap (slot designed, not built; proof in §I)
- AI tutor (#1): full page, modes, full learner context, saved history. MVP already carries two parts of it, the "why?" button and the typed conversation partner (B5)
- Intermediate learners
- Additional tracks: MSA; other dialects as tracks
- Speed Training
- Speaking practice: speech-to-text, so the conversation partner can run by voice once Palestinian speech recognition is good enough; later pronunciation feedback
- Describe-the-picture exercises (no picture set exists yet)
- Phase renewal and break flow, incl. user-chosen phase length
- Community vocab pool (opt-in, all learners)
- Offline / download before trip; push notifications; analytics
- Phrase of the day; expanded cultural notes
- Shared progress / family view; goal event countdown
- Full content admin tool; account deletion and export UI
- Payments (tentative): slot = per-feature access rule, default all signed-in users; no billing
- Native App Store app: architecture must keep this a wrapper or port, not a rewrite (§E)

### B7 Out of scope (not on roadmap)
- Aya's course and the legacy engine
- Onboarding dialect picker
- Public signup
- Leaderboards, XP, badges
- Teacher or classroom accounts
- UI languages other than English

### B8 MVP success criteria (family test: all three learners, running until every tester has completed checkpoint 1)
| Test | Pass |
|---|---|
| Works | Every tester completes sign in → placement → lesson with audio → quiz on their own iPhone without help; 0 lost-progress bugs; smoke tests pass on every deploy |
| Used | Median tester is active on at least as many days a week as their own planned pace (B2) |
| Teaches | **Retention:** words learned (D132) and verb cells are recalled in later reviews at or above the §C6 threshold; phrases learned is progress feedback, not a metric. **Block score:** each tester's first-block score is at least 0.5 and no skill the block targets scores below the 0.25 floor. Scoring: a step milestone (grammar, verbs, conversation, script) is 0 not yet, 0.5 usable with effort, 1 met by its evidence rule; a threshold milestone (vocabulary, listening, fluency, pronunciation) scores progress from the block's start to its target, capped at 1; a skill scores the mean of its milestones; the block scores the mean of the skills it targets, equally weighted. Measured at block end. Every number here and in the evidence rules is fixed before the test starts and pass/fail is read on those; later recalibration recomputes in a separate labelled view (D289), never the result. **Checkpoint:** every tester completes checkpoint 1; its band is recorded and read against the tester's 90-day target (B2), not used as a pass bar |
| Accurate | Every report-a-problem confirmed as a language error is fixed and the affected content regenerated; confirmed errors per lesson and the validator and critic rejection rates are reported. Before launch, a one-time validation package goes to an external expert (placement grammar items, first-block lesson sentences for all three testers, a 40-row dictionary sample, a verb-table sample), and every item they mark wrong is fixed. Parents read lesson sentences if available; not a launch requirement. After launch the heritage testers are the main error sensors, so this check stays weak (R4) |
| Affordable | Every tester at or near the default pace stays under the $7 soft cap; no tester reaches the $10 hard cap |

## C. Learning system

### C1 Journey

#### C1.1 Stages
| # | Stage | Behaviour | Detail |
|---|---|---|---|
| 1 | Invite | Admin allowlists email; invitee receives link | §G |
| 2 | Install + sign in | Link opens in iPhone Safari → one-time Add to Home Screen card → sign in inside installed app. Sign-in precedes onboarding. No guest mode | §G |
| 3 | Onboarding | Name, learner type (C1.3), the "about you" form (C3.3). No dialect picker. About 3 min | C1.3, C3.3 |
| 4 | Placement | All learner types; config sets length and stop rules | §C2 |
| 5 | Plan reveal | 90-day goal and the first block: its outcome, 2-4 can-dos and its checkpoint (C3.12) | §C3 |
| 6 | First session | Starts directly from plan reveal | §C4 |
| 7 | Daily loop | Home → Today's session → wrap-up → Home | C1.2 |
| 8 | Checkpoint | When due, becomes Today's session | §C8 |
| 9 | Phase end | Final debrief → next 90-day phase starts at the first open after the end date, with current "about you"; prior plan and debriefs kept. Roadmap renewal flow replaces this step | §C3 |

Side journeys from Home: Focused Study, My Vocab review, Alphabet, Progress, Settings (edit "about you", adjust plan, harakaat). All read and write one learner vocab/mastery store.

#### C1.2 Home and Today's session
- One primary action: Today's session. Next action resolves in order: resume unfinished → return warm-up after 7+ days away (C1.4) → due checkpoint → the weekly quiz of a finished set (C3.9) → next lesson.
- Session: a sitting of about 20 minutes (C4.2): due-review warm-up → one or two lessons, each closed by its lesson check where its type has one → wrap-up. A finished set's weekly quiz is taken, never passed. Exit and resume allowed. Composition per §C4, §C6, §C7.
- Pacing (D343): the learner's sittings per week × about 2 lessons set the expected lessons per week (C3.9); the 3-sitting figure is the fallback (D314). No daily cap on sessions: after wrap-up the learner can start the next lesson, repeatedly. Catch-up after missed days and working ahead are both allowed. Progress advances by completed lessons; missed days never skip content. Cost is never a pacing lever.
- New material is rate-limited, sessions are not (D63, P9): lessons bringing new material are capped per calendar day (config `new_lessons_per_day`, default 3), counted by code from each lesson's items, not its type (C3.9). Beyond the cap, further sessions run in consolidation mode: review lessons, fluency and retrieval on already-introduced items, no new material. Copy frames this as consolidation, never as a block or a warning.
- Secondary cards: Focused Study, My Vocab review, Alphabet, Progress, Settings. Order and prominence come from learner-type config.
- Script micro-steps are woven into daily sessions when placement `script_stage` calls for them, for any learner type (§C2, D26). Alphabet screen is reference and practice, never a gate.

#### C1.3 Learner type question and "about you"
"When family speak Palestinian Arabic, you…": understand most / catch some words → heritage config + placement; understand little or none → beginner config. Placement may reassign (§C2). Intermediate is not offered (slot). The "about you" form follows (C3.3, D344).

#### C1.4 Streak and return
- A day counts when any activity completes in the learner's local day: lesson, review, Focused Study or checkpoint.
- Missed day resets the streak. Copy never shames.
- After 7+ days away (config), the next session opens with a longer review that first probes the block's milestones (size per C6.7), then offers "Refresh first" or "Jump in" when any slipped (C3.10, D348). Never forced, never framed as a penalty.

#### C1.5 State and connectivity
- Journey position derives from server records, never device state.
- Every answer persists as given. Exit anywhere; resume at the same item on any device.
- Offline or poor connection: answers queue on device and sync on reconnect. New content requires a connection. Mechanism per §E.

#### C1.6 UX rules
- No splash. App opens to Home or the pending stage.
- Every loading, empty and error state has copy and a next action. No whole-app error screen.
- Any wait >3s shows progress copy.
- No roadmap placeholders or "coming soon" cards.
- Report a problem on every content item: lesson item, lesson-check and weekly-quiz question, Focused Study card, Verb Lab item, conversation turn, checkpoint turn.
- No learner-type conditionals in screens; config only (B3).
- Time budget: heritage sign-in to first lesson start ≤15 min including placement.

#### C1.7 Owned elsewhere
- §G: sign-in method on installed iPhone app (magic link opens in Safari, which has separate storage; leaning 6-digit email code).
- §C6: words-learned definition; return-review size.

#### C1.8 Principles check (retro, chat 6 audit, recorded chat 11)
- Discharges: P9 in part (new material rate-limited per calendar day, C1.2, D63), P17 (streak copy never shames, no scores anywhere in the loop, C1.4, C1.6).
- Defers: P1 to P4 → §C4 · P7, P8 → §C6 · P16 → §C2 · P18 → §C8.
- At risk: none. R2 is mitigated here by resume-anywhere (C1.5) and the mandatory lesson check (D14, C7.1).

### C2 Placement

#### C2.1 Purpose and entry
- Every learner type takes placement after onboarding (D20). One engine; learner-type config sets start band, stop rules and copy.
- Beginner run is a warm-up: typically ≤6 items, about 1 min.
- Heritage config adds a grammar section after the word section (D305, D325, C2.4).
- Hard caps: word section 8 min; grammar section 6 min; whole placement 10 min, with the word section yielding when both run, so the C1.6 15-min heritage path still holds with the "about you" step (D325, config).
- Starting needs a connection; answers queue offline per C1.5.

#### C2.2 Item bank
- Items come from a pre-built, track-scoped bank. No Claude call at runtime (D22).
- Item: stable id, `dictionary_id`, type, 3 distractor `dictionary_id`s, audio ref, status (active/retired), version.
- Distractors: same `pos` (C5.2 enum), same `level`, different `category`, and never the row's `formula_pair` partner (D130). A pair partner is trivially eliminable by anyone who knows either half.
- Source rows: `review_confidence = 3`, `register = 'neutral'` (D129, D141). Words and short phrases. `review_confidence` is the dictionary review's own 1-3 score (`dr-scoped-pass.md` §3); the legacy generation-time `confidence` column is not a selection signal anywhere. Rows at 1 or 2 are invisible to the bank build until re-review upgrades them in place, which widens the pool without republishing built items.
- Excluded despite being eligible: obligatory formulas at `level` 1 (D130). الحمد لله is known by every learner above absolute beginner, so it discriminates nothing and would inflate the ceiling. Formulas remain level 1 for teaching; they just do not measure.
- Items go active once they pass the C5.5 validators; no native review (D280, D302). Audio pre-generated (§C9). Built in §J, about 100 word items so repeat sets don't repeat items.
- **Grammar bank (heritage, D305, D325):** two items per grammar point across stages A-C of the grammar path, about 60 items. Each item is a pair of Palestinian sentences that differ in one structure (a personal ending, agreement, verb person, `mish` where `3ind-` takes `ma`, a dropped "to be"); both written in dialect, never MSA against dialect, and the wrong option must be clear-cut, never a variant some Palestinians say. The bank is part of the pre-launch external-expert package (D315), and every item the expert marks wrong is fixed or retired before launch.
- Bands key off dictionary `level` 1-5, added in the dictionary review step (D30), defined in D127: a global ordering by how early a learner needs the item to form and survive Palestinian sentences, not by corpus frequency and not by difficulty. Fallback if `level` is missing at bank build: within-category rank percentile. `rank` is generation batch order and means nothing across categories.

#### C2.3 Item types
| Type | Stimulus | Response | Measures |
|---|---|---|---|
| Listen | Audio only | Pick English meaning (4 options + "I don't know"). If correct: "Could you say this yourself?" Yes / Not yet | Vocab ceiling, production self-rating |
| Script | Arabic with harakaat, no audio | Pick English meaning (4 options + "I don't know") | Script reading |

| Which sounds right? (heritage grammar section) | Two sentences, each with audio on tap and Arabic script with harakaat | Pick one, or "I don't know" | Grammar point known or not (seed only, C6.4) |

No typed answers, no romanization. "I don't know" scores as incorrect.

#### C2.4 Engine rules (config defaults)
| Key | Default |
|---|---|
| Bands | B1-B5 = `level` 1-5 |
| Start band | B1 (intermediate slot: higher start band) |
| Set per band | 5 Listen + 1 Script |
| Advance (Listen only) | 4-5/5 up · 3/5 one repeat set, up if ≥7/10 · 0-2/5 stop |
| Ceiling | Highest band cleared, 0-5 |
| Script track | Ends after 2 consecutive incorrect. `script_stage` 0/1/2 = 0-1 / 2-3 / 4+ Script correct |
| Stop | Ceiling found · 40 items · 8 min · beginner config also after 3 consecutive "I don't know". On cap, ceiling = highest band cleared so far |

- **Grammar section (heritage config, D305, D325):** stages A, then B, then C; within a stage, points easiest first, each tested by its 2 items. A point passes when both are correct. Two missed items in a stage end the section, since later stages depend on earlier ones. About 6-30 items, under 6 min. With two options, a guess is right half the time, so two items per point and the half-credit seed (C6.14), confirmed by production in the first lessons, carry the weight.
- Audio failure (A3, C9.7): a Listen item whose clip fails is dropped, does not count toward its band set, and the set tops up from the bank. More than 2 failures inside one band pauses placement and resumes later. The C9.7 swap-to-script rule does not apply here. In placement the Listen track is the measuring instrument and the Script track is a separate scored dimension, so a swap would corrupt the ceiling, which drives the plan, the level window and the store seeds.

#### C2.5 Result
- Attempt: learner, track, `attempt_no`, config version, ceiling, listening accuracy, `script_stage`, production ratio (Yes ÷ correct Listen), started/completed timestamps.
- Answer: item id, choice, correct, self-rating, `response_ms`.
- Append-only, never deleted (D28). Schema per §F.
- Grammar section answers (heritage): item id, grammar point, choice, correct, `response_ms`; a point passes or not per C2.4. This partly reopens D23 for heritage only (D305); there are still no category or vocab-breadth scores, and beginners get no grammar section.

#### C2.6 Reassignment (D25)
- Beginner with ceiling ≥2 → heritage config. Heritage with ceiling 0 → beginner config. Thresholds are config.
- Applied automatically. Shown at plan reveal (§C3) with one-tap undo back to the onboarding type.

#### C2.7 Consumers
- §C3: first content starts above the ceiling band; production ratio weights production emphasis; plan reveal presents the result.
- §C4, C1.2: `script_stage` sets scaffold start and whether script micro-steps run (D26).
- §C6: correct items seed the vocab store; incorrect and "I don't know" are not added. Seeded words show as "already knew", excluded from words learned. Seed values per §C6 (D27).
- §C6: grammar points passed seed the store at half credit; both items wrong seed a gap when another point in the stage passed (C6.4). §C3 reads them to skip or prioritise first-block grammar.
- §C3, §C6: items missed at or below the ceiling seed a `known_gaps` queue (D66). They are demonstrably in reach and demonstrably not known, so §C3 prioritises them into the first units. They count as new material, never as "already knew".
- §C3.6: listening accuracy weights the listening share of the skill mix (D67). §C9.6: below a config threshold it pre-selects Slow playback and offers a second play on graded listening items, as a default and never a cap (D108). Both consumers live, so C2.5 keeps the field.

#### C2.8 UX (D29)
- Intro copy: finding a starting point, not a test you can fail.
- "I don't know" always visible. No per-item right/wrong. No timer; `response_ms` recorded silently (speed slot).
- Audio plays on tap (iOS blocks autoplay); replay allowed.
- Progress bar. Report a problem on every item.
- Resume at the same item on any device (C1.5). No retake UI in MVP; attempts carry `attempt_no` for the retake slot (D28).

#### C2.9 Principles check (retro, chat 6 audit, recorded chat 11)
- Discharges: P16 (placement runs before instruction, sets a ceiling and a `script_stage`, and every output it records has a named consumer in C2.7), P5 (Listen items are audio-first, tap only, never autoplay), P17 (no score shown, "I don't know" always available, framed as finding a starting point rather than a test).
- Defers: seed values → C6.4 · consumers → §C3, §C6.
- At risk: none. D66 closed the gap the chat 6 audit found, where misses at or below the ceiling were discarded rather than queued.
- Rework R2 (chat 35): the heritage grammar section discharges P16 for grammar (every result seeds the store) and P5 (both options play audio on tap). Its accuracy rests on the external-expert check (D315), not native review; a guessed pass costs little, because the seed is half credit and production confirms it.

### C3 Plan

Owns the phase, its blocks and sets: what each block targets, how much it brings, who writes what, the story thread, the four kinds of practice, pacing and the daily cap, time away, re-planning, plan reveal, Settings and records. Rewritten chat 36 (rework R3, D333-D356) for lessons the model builds per learner (D280) on the learner model in §C6. Retires the pre-built unit catalogue (old C3.2), the goal-tagging call (old C3.3) and the unit ordering rules (old C3.4, D70's category rule moves to C3.6).

#### C3.1 Shape: phase, blocks, sets (D283, D304, D312, D327, D340)
- **Phase:** 90 days (`duration_days`, B2). **Block:** the span the planner targets, closed by a checkpoint (C8.2). **Set:** about 6 lessons, generated together from the latest learner record and closed by the weekly quiz (D304). Lessons are the unit of work; dates drive only the clocks in C3.10.
- A block is planned in one call when the previous block ends (or at plan reveal), before that block's checkpoint is taken (C8.2). Its sets are generated one at a time (§C5): the first with the block, each later one after the previous set's weekly quiz.
- **A block ends** at the first of: every milestone it targets met (C6.14), checked when each weekly quiz is completed and only after at least 2 sets (about 12 lessons); its time cap (C3.10); day 90 (C8.2). There is no lesson-count trigger (D340).
- At the time cap the lesson in progress finishes; unstarted lessons of the set are dropped, never shown, and their material goes back to the planner. Unmet targets carry over (C3.4).

#### C3.2 Block plan: what code chooses, what the model writes (D333, D342)
| Code chooses (deterministic, from the learner record and content) | The model writes (one block-plan call) |
|---|---|
| Target milestones and the bottleneck (C3.4) · amounts per skill and per set (C3.7) · the word shortlist (C3.5) · the four-kinds targets (C3.6) · the method per targeted milestone (C3.8) · the recycling list: every lesson recycles at least two earlier milestones, slipping ones first (sequencing rule 4, P13) · items kept out of graded positions (C3.9) · the story cast, once per phase | The block outcome in plain words · 2-4 can-do statements phrased for this learner from "about you" (C3.3), each mapped to target milestone ids · the story arc · words picked from the shortlist · scenarios for conversation lessons |

- Validated by code before the block is accepted: every can-do maps to at least one target id and every target is covered by a can-do; every picked word is on the shortlist; nothing targeted lacks its prerequisites at "usable with effort" (D310). Output contract and failure handling are §C5's.
- **Story thread (D342):** one cast per learner for the whole phase, one arc per block, about one episode per set. The cast uses fictional, common Palestinian given names from a fixed list (versioned content, R7), set in Palestinian places with Ramallah first (D281). Real family names are never used and never asked for. "Who you'll speak with" may shape roles and scenarios (a grandmother, a cousin), never a named person. A cast and arc summary is stored on the block record and passed to every set's generation and to the refresher (C3.10).
- **Method alternation (D324):** for comparison, the planner alternates a skill's two default methods on comparable material (consecutive grammar points of one kind, verb families of one shape), and every answer carries its method tag. A stall switch (C3.8) overrides alternation for that milestone.

#### C3.3 "About you" into the plan (D344)
- A form, not a chat, on one or two screens, about 2 minutes, every field optional: why you're learning (choices + optional text) · who you'll speak with (choices + optional text) · where the family is from (choices, shapes story places and scenarios only; dialect stays Palestinian with Ramallah first and regional variation is not tracked, D281) · interests (choices + optional text) · **sittings per week: "How many times a week can you sit down for about 20 minutes?" 1-2 / 3 / 4-5 / 6+**, default 3 when skipped. No family-names field (D342).
- No model call reads it at onboarding: it replaces the goal-tagging call (old C3.3). Its choices and length-capped free text pass to the block-plan and set calls as learner context, treated as data. It chooses topics, scenarios and can-do wording, never the grammar order or the target.
- Editable and deletable from Settings (C3.13). A deletion applies to every later generation; an already-generated, unstarted set is regenerated.
- Must fit C1.6's 15-minute heritage sign-in-to-first-lesson limit alongside a 10-minute placement (C2).

#### C3.4 Targets (D310, D311, D318, D334, D337, D353)
- A block targets a set of milestones behind 2-4 can-dos (D311), chosen in this order:
  1. **Carry-over:** unmet targets of the previous block (C6.16).
  2. **Slipping:** milestones still at half credit after slipping (D318).
  3. **The bottleneck:** the unmet milestones blocking the learner's next conversation band (sequencing rule 1), chosen from per-skill scores, error classes tagged by checkpoints and conversation lessons (rule 6) and the diagnosis in C3.8.
  4. **Independent milestones**, grammar in prerequisite order, and the word strand.
- **Grammar in prerequisite order, never stage-per-block (D334):** the planner takes the lowest unmet grammar points whose direct prerequisites are at least "usable with effort". At the beginner default (about 4.3 study hours a block) that gives 6-9 new points per block, so stage A takes about the first phase; the foundations doc's "stage A in block 1" does not hold for a beginner. Heritage learners skip points placement shows as probably known.
- **Heritage block 1 does not wait (D353):** placement-passed points sit at half credit, which already clears the prerequisite bar (D310, D325), so block 1 targets beyond them at once. The first set confirms them by production (C6.4); a miss beyond the C3.11 margin re-plans the block within one set.
- **The bottleneck is the block's lead goal, held across the block, not a quota (D337):** words, story episodes and conversation scenarios are chosen to feed it wherever they can (rule 3), and lessons teaching it directly take at most about half the block's new-material time, so independent milestones and the word strand keep moving. Checked by code at block plan.
- **Targets are fixed for the whole block (D338).** Only weekly intake changes inside it (C3.7). Slow side: the next block is re-sized and unmet targets carry over. Fast side: the block ends early (C3.1), and stretch material (C3.7) fills the wait for evidence.

#### C3.5 Word level and the word shortlist (D35, D330, D349)
- **Word level** (D330; the old vocabulary "band") is the vocabulary window. New words come from word level + 1, or level 5 when word level is 5. Advance per C6.8.
- Words at or below word level that placement never tested appear as quick checks inside lessons; a miss makes the word new material (C6.4). Placement gaps (`status = gap`, D66) are prioritised into the first block.
- **The shortlist (D349)** is built by code from trusted rows (`review_confidence` 3, C6.1) at or below word level + 1, excluding words and phrases already in the learner's store as active, learned or already known, in priority order: what the current grammar step needs (verbs while conjugation is the step, family nouns while the endings are) · the block's can-do topic words · placement gaps · frequency. About 2-3 times the block's word intake. The model picks from it (C3.2); a validator rejects any new word in a graded position that is not on it. Input prose keeps P10's own rule.

#### C3.6 Four kinds of practice and the skill mix (D36, D70, D341)
- **Four kinds (P19):** meaning-focused input (story, listening), meaning-focused output (conversation, describing your own life), language-focused study (grammar, words, review) and fluency (known material at speed). Every activity carries its kind; code sums planned active minutes per kind at block plan and actual minutes at block end.
- **Targets (D341, block keys, placeholders):** long run equal quarters. Language-focused study is capped at 40% in a phase's first block, 35% in its second and 30% from its third; no kind below 15% in any block. The four-kinds targets are block keys tuned by the monthly analysis (C6.18, C10.7).
- **Modality mix** inside lessons (recognition, listening, production, script) stays config per learner type × plan stage, stage now the block's ordinal in the phase (no lesson counts). Production share scales inversely with the placement production ratio (C2.5), beginner default 0; listening share is weighted by placement listening accuracy (D67). Detail per lesson type is §C4's.
- **Interleaving (P12, D70):** consecutive lessons do not share a primary topic category unless no alternative exists at the learner's word level.

#### C3.7 Sizing: level and rate (D313, D331, D339, D345, D347, D352)
Three controls, none of which moves another (D345):

| Control | Decides | Read from |
|---|---|---|
| **Level**, where the learner is | *Which* material: targets (C3.4) and words up to word level + 1 (C3.5) | live milestone states, word level |
| **Rate**, how fast they grow | *How much*: new material per set, targets per block, stretch | learning rate per skill (C6.16) × the active time they actually put in |
| **Evidence bar** | When material counts as usable or met | C6.14's rules, frozen; no preference or rate moves it |

- **First block (D339, placeholders):** beginner about 20 words and phrases and 1-2 grammar points per set, so about 60-100 words and phrases and 6-8 grammar points per block, about 300 by day 90 at the default pace. That is below D304's ~25-35 words and 2-3 points per set on purpose; measured capacity raises it. Heritage learners start from placement's starting point at the same per-set figures (config per learner type); tested-out material counts against none of them (D326).
- **Expected time (D352):** block 1 uses the stated sittings per week × about 20 minutes. Later blocks use the active minutes actually recorded over the last block (C6.16), automatically and invisibly, so a learner doing less than they said does not face a block of carried-over targets. The stated figure changes only by asking: at the monthly check-in (C6.18), after a block where actual sittings ran at about 60% or less of the stated figure, the learner is asked "keep planning for X a week, or plan for Y?".
- **Rate measurement (D345):** counts only genuinely new material. Placement seeds, quick-check and test-out passes and anything `already_knew` are excluded, so recognising half-known material does not inflate it. Per skill, so fast grammar never inflates verb intake.
- **Update rule (D345, block keys, placeholders):** the next block's rate estimate is 50% the last block's measurement and 50% the previous estimate. Increases are capped at +25% per block; decreases apply in full; no increase while the skill's fair-review retention is below about 80%. Rationale: heritage speed collapses when half-known material runs out (typically at verb forms), and averaging alone would react late; overload makes learners quit.
- **Inside a block (D338):** each set's intake steps by about ±20% from the weekly quiz and the set's fair-review retention: down on quiz misses above a threshold or retention under about 80%, up on near-perfect results (D308), bounded to 0.7-1.3× the block's planned per-set intake.
- **Stretch (D347):** a milestone can be met no sooner than about 11 days after teaching (C6.14), so a fast learner can finish a block's teaching long before its evidence arrives. Once every target is at least "usable with effort" and the set has room under its intake, the set draws new material from the next milestones in prerequisite order. Stretch milestones count toward the next block, which starts with them already begun; the block's targets do not change.
- **Climb preference (C3.13, D346):** multiplies per-set intake by about 1.25 / 1 / 0.8 (steeper / as planned / gentler) from the next set, inside the bounds above.

#### C3.8 Slow skills: diagnosis, stalls and methods (D316, D324, D335, D336)
- **Diagnose before reacting (D335).** A targeted milestone or skill behind its expected progress at a set or block boundary is classified from the answer log:

| Cause | Evidence (placeholders) | Response |
|---|---|---|
| Never reached | fewer than ~5 graded answers on its items | schedule it; no method change |
| Forgotten | practice reached "usable with effort" but fair reviews fail (retention under ~80%) | fewer new items, more recycling of it |
| Answered wrong | ~5+ graded answers, low accuracy, at least half the misses in one error class (C6.10) | method change, by the stall rule below |

  Too-thin evidence falls back to "never reached". A slow **ramp** skill (vocabulary, listening, fluency) gets its target re-sized to the observed rate, fewer new items and more recycling when forgotten, and new words re-aimed to feed the current step.
- **The stall rule (D336), the only automatic method switch (D316, D324):** a step milestone diagnosed "answered wrong" whose evidence is flat (no state change and no rise in practice accuracy over 4 practice sessions spanning at least 7 days, placeholders) switches to the next method in its skill's menu. The 0.25 floor stays out of the planner (D316).
- **Menus** are fixed, ordered and versioned content per step skill. Verbs: chunked high-frequency forms → the "-ing"-word bridge → shorter spaced drills → park briefly. Grammar, script letters and conversation menus are R7 content, each ending in "park briefly". **Park:** the milestone leaves new-material slots for one set but stays in reviews; points that depend on it wait on the prerequisite gate; independent points continue. Nothing is ever repeated unchanged (rule 5).
- The first two switches per milestone are automatic and logged as plan events. After two switches with no gain, the milestone is flagged to the monthly analysis and a person (Marwan or Omar) decides (C6.18).

#### C3.9 Sets, pacing and the daily cap (D63, D304, D320, D343, D355)
- **Pacing:** stated (then measured, C3.7) sittings × about 2 lessons set the expected lessons per week and the new-material expectation, never a time cap. Learners may do more; only the daily cap limits new material.
- **The daily cap counts lessons that bring new material, by code (D343):** when a lesson starts, code checks its graded items against the learner's store; the lesson counts toward `new_lessons_per_day` (default 3, C1.2) only if at least one item is not yet in the store. If test-out removes all of a lesson's new material, its count is returned. Review, speed practice, conversation on known material, test-outs and refreshers never count. Lesson-type labels are not used.
- **Weekly quiz:** a finished set makes its quiz the next thing to do, ahead of the next lesson. The next set opens with a short review of what the quiz missed (D304).
- **Due items in generated lessons (D320, D355):** at set generation, each lesson gets an expected date from the set's start and the learner's pace; an item due within 2 days of that date is kept out of that lesson's graded positions (input prose allowed). Taken far from its expected date, a lesson's answers count normally: an answer on an item due that day is its review (C6.5).

#### C3.10 Clocks, absence and return (D37, D327, D340, D348)
- **Phase clock** runs continuously; absence costs calendar time, never content. Day 90 is fixed (C8.2).
- **Block clock (D340):** a block starts at its first lesson, not when it is planned. Its cap is 30 days from that start, not counting days inside any absence of 7+ days, so a block cannot expire while the learner is away. A block still running at day 90 ends there; one that would end within 10 days of day 90 folds into it (C8.2).
- **Return after 7+ days away (D348, C1.4, C6.7):**
  1. **Probe first.** The first session back is the extended warm-up with no new material (C6.7). It asks one item per targeted milestone of the block in progress (or, between blocks, the last finished block) before overdue age ordering. After a long gap these are fair reviews, so the warm-up measures what slipped. Learners misjudge their own forgetting, so the offer waits for this evidence.
  2. **Offer.** If any of those milestones slipped, offer "Refresh first" or "Jump in", never forced, once per return. "Refresh first" is marked recommended at about a quarter or more slipping (placeholder).
  3. **The refresher** is one or two review lessons built by code with no model call: the slipping milestones' items, opening on a "previously in the story" recap from the stored arc summary, ending on items predicted to be recalled. Not new material: no weekly quiz, not counted against the daily cap.
  4. **Re-plan:** at about a third or more slipping (placeholder), a planned block whose first lesson is not yet taken is re-planned before it starts, the slipping milestones as its first targets and its intake reduced (C3.11). Mid-block, targets stay fixed (C3.4).
  5. **Jump in still repairs:** the next lessons' recycling slots take slipping milestones first (C3.2).
- A checkpoint due on return is offered after the warm-up session, not before it (C8.2).
- An unstarted set generated before a 7+ day absence is regenerated from the latest learner record before use. Generation timing is §C5's and §E's (Q35).
- Pause as a learner action stays a slot (break flow, B6).

#### C3.11 Re-planning (D312, D350)
- **The current or next block is re-planned at once when:**
  1. the block ends early (C3.1): the next block is planned immediately;
  2. the first set's checks contradict placement by a set margin: about 30% or more of placement-seeded items tested in it fail, or about 30% or more of items planned as new are tested out (placeholders). The current block is re-planned, keeping its start and cap;
  3. a return probe finds about a third or more slipping before a planned block starts (C3.10).
- **Not a re-plan:** editing "about you" rewrites topics and can-do wording for unstarted sets only; changing sittings or climb adjusts intake from the next set. Checkpoint evidence, which arrives after the next block is planned (C8.2), feeds the next sets' recycling and conversation scenarios, never the block's targets.
- Every re-plan is one block-plan call under the spend cap (D293) and appends a plan event with its trigger.

#### C3.12 Plan reveal (D38, D356)
1. Starting point in plain words, no score.
2. Learner-type change with one-tap undo (D25). Undo re-runs the planner.
3. 90-day goal.
4. The first block: its outcome and 2-4 can-dos, and when it ends at the latest (its checkpoint).
5. Start first lesson.

- **Never blocked by the model (D356):** steps 1-3 are built by code. Step 4 waits on the block-plan call with progress copy (C1.6). If the call fails, it shows the targets' plain can-do names from the milestone catalogue (C6.14) and the plan proceeds; the call is retried before the second set.
- The full plan lives in Progress.

#### C3.13 Adjust plan (D39, D346, Settings)
| Control | Effect |
|---|---|
| **How steep a climb?** Steeper · As planned · Gentler | Intake multiplier about 1.25 / 1 / 0.8 from the next set (C3.7). Steeper steps back to "as planned" with a one-line note when fair-review retention stays under the bar for 2 sets |
| **Sittings per week** | Expected lessons and intake from the next set (C3.7, C3.9) |
| **Focus** | Edit "about you": topics, scenarios and can-do wording for unstarted sets (C3.11). Never the grammar order |

- **No level control in Settings (D346).** "Too easy" stays inside lessons as test-out (C6.13), which moves level only on evidence. Replaces too easy / too hard (old D39).
- Never changes completed lessons, the item store, the streak, `start_date` or checkpoints. A lesson in progress finishes as generated. No "start fresh" (B6).
- Every change appends a plan event.

#### C3.14 Phase end (D40, D18, D327)
- The next phase starts at the first app open after the end date, following the final debrief (§C8).
- The new plan takes current "about you", word level and the live learner record. No re-placement. The unmet milestones of a block cut at day 90 open the next phase's first block (C8.2). The story cast carries into the next phase with a new arc.
- The prior plan, its blocks and debriefs become read-only and are kept.

#### C3.15 Records (D41, D351, schema §F)
Units retire. Every model output on this path stores `model` and `prompt_version`.
- **Plan** (one per phase): `user_id`, `track_id`, `phase_no`, `start_date`, `duration_days`, config version, "about you" snapshot, placement attempt id, word level at start.
- **Block:** plan id, ordinal, target milestone ids with their states at plan time, the capacity snapshot it was sized from, amounts per skill and per set, can-dos (text and milestone ids), story cast and arc summary, four-kinds targets, method per targeted milestone, stretch milestones begun, resolved block-key values (C10.7), model and prompt version, planned at, start (first lesson), cap date, paused days, end, end reason (milestones met · time cap · day-90 cut · folded into day 90 · superseded by re-plan).
- **Set:** block id, ordinal, lesson ids, per-set intake and its step from the last quiz, generated at, model and prompt version, weekly quiz id.
- **"About you":** current values, editable; a deletion clears them.
- **Plan events**, append-only: plan created · learner type reassigned · undo · block planned · block re-planned (with trigger) · block ended · block paused and resumed · method switched · milestone parked · pace changed (sittings or climb) · "about you" edited or deleted · refresh offered, taken or declined · word level advanced · script stage changed · phase ended.

#### C3.16 Owned elsewhere
- §C4, §C7 (R4): lesson types and flow, activity kind and method tags per activity, test-out offer, weekly quiz, refresher lesson flow and copy, story episode format; the Settings and onboarding screens (§D).
- §C5 (R5): block-plan and set call contracts, validators, critic, cost and budget per call, generation timing.
- §C6: evidence rules, capacity, scoring, slipping, check-in; §C8: checkpoint timing and evaluation.
- R7 and §J: milestone catalogue and its can-do names, grammar path, method menus for grammar, script letters and conversation, the fictional name list.
- §E (Q35): when and where sets are generated.

#### C3.17 Principles check
- Discharges: P10 (new words only from word level + 1 via the code-built shortlist, untaught words and due items kept out of graded positions, C3.5, C3.9); P11 (blocks framed as 2-4 can-dos, the grammar path running through them, C3.2, C3.4); P12 (consecutive lessons do not repeat a primary topic category; method alternation on comparable material, C3.2, C3.6); P13 for planning (every lesson recycles at least two earlier milestones, slipping first, C3.2); P15 at plan level (diagnosis routes "answered wrong" to a method change, never a repeat, C3.8); P16 (placement seeds, gaps and production and listening ratios all drive targets and mix, C3.4-C3.6); P17 (no pace, rate or level shown; refresher and return copy never a penalty, C3.10); P19 (four kinds checked per block by code, C3.6); P9 (new material capped per day, counted by code, C3.9); P7 (block ends and targets read milestones met on evidence; no preference moves the bar, C3.7).
- Defers: P1-P4, P20-P22 → §C4 (R4) · P3 counts and P10 for grammar → §C5 (R5) · P18 → §C8.
- At risk: none newly. R9 unchanged: keeping untaught grammar out of graded positions rests on model tags. Two weaknesses carried with mitigations, not risk rows: the sizing constants (C3.7) are untested placeholders, mitigated by asymmetric updates, the retention guard and monthly-analysis review (C6.18); the refresher is optional, so a learner who always picks "Jump in" is repaired only through recycling, mitigated by the mandatory probe warm-up and slipping-first recycling (C3.10). R3 retired (D280) and is no longer cited here.

### C4 Lesson

Owns the six lesson types, the sitting, new material and exposure, the activity catalogue and how activities are assembled and tagged, production and grading, scaffolds, quick and opening checks, the test-out flow, feedback and explanations, wrap-up and records. Rewritten chat 37 (rework R4, D357-D376) for lessons the model builds per learner (D280) inside the blocks and sets of §C3, on the learner model in §C6. Retires the unit → 3-lesson arc (D42), the fixed 6-item set (D44), the D50 activity budget and its worked example, and "no Claude call inside a lesson". How content is generated and validated is §C5 (R5).

**Three names, never mixed (D357):** the **lesson check** closes a lesson (§C7) · the **weekly quiz** closes a set (C7.9) · the **checkpoint** closes a block (§C8). "Quiz" is never used at lesson level, in copy or in records.

#### C4.1 Lesson types (D284, D303, D358)
- Six types. The set's mix comes from the block plan (C3.2, C3.6). Each type is a **fixed template**: an ordered list of activity slots declared in code. The model writes only language content into the slots (dialogue lines, story episodes, example sentences, conversation scenarios and scripted turns, culture notes). Code assembles the activities, distractors, lesson check, exposure counts and tags from the declared items and that content (C4.5). An unknown type or slot fails the set build; nothing is skipped.

| Type | Planned length | Template | Lesson check (C7.2) | Graded new material |
|---|---|---|---|---|
| Grammar | 12-15 min, or two linked parts in one sitting | C4.12 | yes | one grammar point + at most 3 supporting words |
| Words | 5-10 min | C4.13 | yes | 4-8 words and phrases |
| Story | 5-10 min | C4.14 | yes, comprehension | none |
| Conversation | 10-15 min | C4.15 | yes, from the debrief | none |
| Fluency | 5-8 min | C4.16 | none: its timed rounds are graded | none |
| Review | 5-10 min | C4.17 | none: everything in it is graded | none |

- Lengths are planning figures (config). The lesson record keeps actual active minutes (C6.19).

#### C4.2 The sitting (D283, D303, D359)
- Today's session is a **sitting** of about 20 minutes: warm-up → one or two lessons, each ending in its lesson check → wrap-up. Code fills the sitting from planned lengths: one grammar or conversation lesson, or two shorter ones. The learner may continue after wrap-up (C1.2); new material is capped per day by C3.9.
- **Warm-up:** due reviews (C6.6), the opening check (C4.9), quick checks, at most one remedial drill (C6.10) and at most one "keep it fresh" item (C4.17). Capped at about 3 minutes (config). Due items beyond the cap carry per C6.6; when the carried volume exceeds one warm-up's worth (config), the next lesson slot becomes a review lesson (C4.17). The return warm-up after 7+ days away (C6.7) and consolidation mode beyond the daily cap are exempt from the cap.
- After a set's last lesson, the weekly quiz is the next thing to do (C3.9, C7.9).
- Exit and resume anywhere; position derives from answer rows on the server (C1.5). The progress bar spans the sitting.

#### C4.3 New material and exposure (D300, D360)
- New material is declared per lesson at set generation, from the block's targets and the word shortlist (§C3): a words lesson brings 4-8 new words and phrases (beginner config the lower end), a grammar lesson one grammar point plus at most 3 supporting words. Other types bring no graded new material. Set totals are sized by C3.7.
- Graded positions use only material the learner record holds as known, plus the lesson's own new material (P10); items due within 2 days of the lesson's expected date stay out of graded positions (C3.9).
- **Exposure, counted by code at set generation, never judged by the critic (P3):** each new word or phrase gets at least 3 graded exposures in its introducing lesson and its lesson check, and at least 5 encounters across the set, in at least 2 modalities (P4). Each new grammar point is practised in at least 3 lessons across at least 2 sets. A set cannot see later sets, so the second half is a **carry-forward obligation**: the next set must include the point, checked by code when that set is generated (C3.2's recycling list). A set that fails its counts fails the build (§C5).
- Items are dictionary rows, grammar points or verb cells (C6.1). Any Arabic that resolves to none of them, the conjugation tables or the particle allowlist is a generation failure (§C5), never `[UNVERIFIED]` filler.

#### C4.4 Activity catalogue (D45, D358)

| Activity | Stimulus → response | Graded | Used in |
|---|---|---|---|
| Review | Due item → meaning or recall, in varied form (C6.5) | yes | warm-up, review |
| Opening check | The lesson's own new items → pick meaning | yes | warm-up (C4.9) |
| Quick check | Audio or script → pick meaning | yes | warm-up |
| Introduce | Audio → meaning → script per scaffold, plus one example sentence | no | words |
| Recognise | Audio or script → pick meaning, 4 options | yes | words, checks |
| Recall | English → build or type Arabic | yes | words, grammar, checks |
| Cumulative retrieval | Every chunk so far, mixed | yes | words |
| Meet | 4-6 line dialogue using the point, form highlighted, audio first | no | grammar |
| Notice | Tap the highlighted form in further lines | no | grammar |
| Explain | Canonical explanation + small table (C4.12) | no | grammar |
| Pattern table | Side-by-side forms (m/f, m/f/plural; *a tall man · the tall man · the man is tall*), one cell to fill | yes | grammar, Verb Lab |
| Transform | Change person, tense, polarity or gender | yes | grammar, Verb Lab |
| Listen and pick | Audio of a form → pick it (`biktib` / `btiktib` / `bniktib`) | yes | grammar, fluency, Verb Lab |
| About you | Build or type a sentence about your own life | yes | grammar |
| Dialogue | 4-6 lines; the learner supplies their role's lines | yes, per supplied line | grammar, words |
| Exchange script | Opening → answer → optional *il-7amdilla* → return, with literal meanings | yes, per supplied line | words, conversation (scripted) |
| Story episode | Read and listen, tap-to-explain | no | story |
| Comprehension | Question on the episode → pick | yes | story check |
| Conversation turn | Chosen, built or typed reply (C4.15) | C4.15 | conversation |
| Timed round | Tap and listen answers against a clock, never typed (P21) | yes, timed | fluency, Verb Lab, Focused Study |
| Shadowing | Hear a line, say it aloud | no | fluency |
| Retelling | Type the last episode in your own words (C4.16) | no, tagged | fluency, heritage only |
| Culture note | Short, tied to one item | no | at most 1 per lesson |
| Script micro-step | Letter or sound work | yes | any lesson, on `script_stage` (D26) |

- Activity record: type, item refs, kind, method tag, scaffold state, report-a-problem target (C1.6).

#### C4.5 Assembly: kind, method and modality (D50, D324, D341, D358)
- **Deterministic assembly, no model call:** the template's slots, the declared items and the generated content become the activity list. Stored with the lesson (C4.11), so any lesson can be reproduced.
- **Kind (D341):** every activity carries one of the four kinds of practice (C3.6), for code to sum per block. Input: story episode, comprehension, listen and pick in a story or dialogue context. Output: conversation turns, about you, supplied dialogue and exchange lines, retelling. Study: meet, notice, explain, introduce, recognise, recall, cumulative retrieval, pattern table, transform, review, checks. Fluency: timed rounds, shadowing.
- **Method (D324):** every activity carries a method tag from C6.17's closed list (for example dialogue first or table first in a grammar lesson), chosen per targeted milestone by the planner (C3.2) and written on every answer.
- **Modality:** the mix per learner type × block ordinal (C3.6). Production weight 0 (beginner default) renders recall as recognition; the item keeps its exposure count. Script weight above 0, or `script_stage` below 2, adds script micro-steps. Each new item is met in at least 2 modalities (P4), and its lesson-check question uses one its lesson did not (C7.3).
- A screen is a stimulus block plus zero or more response widgets (D.7): item-batched activities (dialogue, cumulative retrieval, pattern table, timed round) carry several items on one screen.

#### C4.6 Production and grading (D46, D263, D306, D371)
- Production support ladders per C6.9: word bank → word bank with same-`pos` distractor pressure → typed entry. Distractors are same `pos` and `level`, never a `formula_pair` partner (D130). The Settings toggle forces typed on early; it never forces it off.
- **Typed Arabic** grades on normalised script: harakaat ignored, alif and hamza seats unified, taa marbuta ≡ haa, alif maqsura ≡ yaa.
- **Typed romanization** grades on phonetic equivalence against the standard (D263), never on letter distance. Long-vowel quality and emphasis are forgiven (`oo`≡`uu`, `ee`≡`ii`, `S`≡`s`, `D`≡`d`, `T`≡`t`, `TH`≡`th`); vowel length is graded because it changes meaning; `'` and `q` are different sounds.
- **Right sound, non-standard spelling** is marked right, with error class `spelling`, and shows the standard spelling under the answer; it lapses nothing (D306, C6.10).
- Every graded answer is graded locally by code, never by the model. The only model calls inside lessons are conversation-lesson turns and evaluation (C4.15), retelling tags (C4.16) and "why?" (C4.19); none moves a box (C8.7's rule).
- Answers feed §C6 with error class, milestone ids, method tag, kind, supported and timed flags (C6.19).

#### C4.7 Romanization standard (D47, D262, closes Q7)
- One standard everywhere. The map is `docs/dr/romanization-map.md` (D262), which supersedes the original 10-symbol sketch.
- Stored as a data table (`romanization_map`), never as prose in a prompt. The map is frozen at the end of DR.
- Injected into every generation prompt and enforced by a validator that rejects out-of-set characters.
- Dictionary romanization is normalised to the standard during DR. The four competing schemes in the old code (harvest §3a) are retired.

#### C4.8 Scaffolds (D48, D26)

| `script_stage` | Arabic script | Harakaat | Romanization |
|---|---|---|---|
| 0 | shown | shown | shown |
| 1 | shown | shown | on tap |
| 2 | shown | on tap | on tap |

- Applies to every surface that shows Arabic: lessons, lesson checks, weekly quizzes, Verb Lab, Focused Study, My Vocabulary, the conversation partner, checkpoints.
- The Settings harakaat toggle (B5) overrides display only; it never changes `script_stage`.
- The harakaat rung reads `arabic_vocalised` on the dictionary row, the conjugation table's vocalised cell, or the line's vocalised field on generated content (D103). The same source is the TTS input (§C9.2).
- Audio is always available on tap and never autoplays (C2.8).
- The rule for advancing `script_stage` is §C6.

#### C4.9 Quick checks and the opening check (D49, D308, D370)
- **Quick checks:** 1-2 per sitting in the warm-up, recognition on a word at or below word level that placement never tested (C3.5). A miss makes the word new material (C6.4). Never gate a lesson, never show a score.
- **Opening check (D308):** in a phase's first two sets (config), every lesson that brings new material opens with 2-3 recognition questions on its own new items. In later sets it runs when the set's earlier answers or quick checks already hit those items. All correct → the test-out offer (C4.18). Opening-check answers enter the store only through the test-out check.

#### C4.10 Wrap-up (D51)
- Shows: items practised, items added to vocabulary, streak (C1.4), next action.
- Next action resolves per C1.2: the next lesson, the weekly quiz, or finish for today. No cap on sessions (D15); new material capped per C3.9.
- No scores, XP or badges (B7). Copy never shames a missed day.
- "Too easy" is test-out inside the lesson (C4.18); climb and sittings are Adjust plan (C3.13). There is no level control anywhere.

#### C4.11 Records (D52, D351, D375, schema §F)
- **Lesson:** set id, block id, position in set, type, expected date (C3.9), declared new items with their milestone ids, template version, assembly output (activity list with kinds, method tags and scaffold state), generated content id and `content_version` (C5.11), `model` and `prompt_version` of each generated part, config version, status (`not_started` / `in_progress` / `completed` / `tested_out`), whether it counted toward `new_lessons_per_day` (C3.9), started and completed timestamps, active minutes, `check_score` and `check_outcome` (C7.8).
- **Answer**, append-only: lesson id, activity index, item id, response, correct, supported, timed, `response_ms`, error class, milestone ids, method tag, kind. Each also writes a `review_event` (C6.19).
- **Conversation-lesson turns** are stored like checkpoint turns (C8.4), with the evaluation's output (C4.15).
- Lesson position derives from answer rows on the server, never device state (C1.5). `mastered` is not a lesson status; mastery belongs to the item and the milestone (§C6).

#### C4.12 Grammar lesson (D284, D362, D363, P20)
1. **Meet:** a 4-6 line dialogue with the story cast (C3.2) using the point, its form highlighted, audio first.
2. **Notice:** the learner taps the form in two or three more lines. Ungraded.
3. **Explain:** the point's **canonical explanation**, 3 English sentences or fewer plus a small table, in its beginner or heritage version by learner-type config (D362). Written once per grammar point, stored with the grammar path (versioned content, R7) and included in the expert validation package (D315). Lessons never generate explanation prose; they generate the examples.
4. **Controlled practice:** pattern tables with masculine and feminine (and plural) side by side, transform, recall; word bank first, per C6.9.
5. **About you:** sentences about the learner's own life, from "about you" (C3.3); never a real family name (D342).
6. **Transfer:** the point in a new context: a short exchange script or listen and pick on an unseen sentence.
7. **Lesson check** (C7.2).

- A point the grammar path marks heavy runs as two linked parts in one sitting: steps 1-3, then 4-7.
- Verb points add listen and pick, and at least one verb never seen in the cell (C6.14).
- Every new word appears in at least one example sentence.

#### C4.13 Words lesson (D360)
- New words and phrases in chunks of 3: introduce (audio → meaning → script per scaffold, with one example sentence) → recognise → recall, then cumulative retrieval across every chunk so far (P1, P2).
- Words come from the block call's picks off the shortlist (C3.5), grouped by topic. A phrase with a pair is taught as an exchange script with both halves (D130).
- Lesson check (C7.2).

#### C4.14 Story lesson (D342, D364)
- One episode of the block's arc per set, with the phase's cast, about 8-15 lines, opening with a one-line "previously" from the arc summary. Audio per line on tap (sentence audio on first play, §C9).
- **At least 95% of tokens are known to the learner record (D364).** The rest resolve to dictionary rows, are tagged for tap-to-explain and never sit in graded positions. This tightens P10's 10% default for stories only; dialogues in other lessons, conversation lessons and checkpoints keep 10%. Checked by code at set generation (§C5).
- Due items may appear (input prose, C3.9); the block's targeted items appear wherever the arc allows (C3.4).
- Lesson check: 2-4 comprehension questions and recall of 2 known words from the episode.

#### C4.15 Conversation lesson (D322, D365)
- A scenario with a goal, taken from the block's can-dos (C3.2), with one character of the cast, kept inside the learner's known items and the block's targets with at most 10% unknown words (as C8.3).
- **Turn input follows the production step (C6.9).** Until typed answers unlock, a turn is chosen (one of 2-3 replies) or built from a word bank, inside a branching scripted exchange generated and validated with the set, with no live model call; a correctly built turn is graded by code against the milestone it was written to exercise. Once typed answers unlock (heritage learners from the start), turns are free text in Arabic script or romanization (`dir="auto"`) and the character's turns are live.
- The character **recasts** errors inside its reply, saying the corrected form back, and never stops to lecture (P22). The lesson ends with a debrief: what worked, up to 3 errors each with its class and correct form. The lesson check is 2-3 recall items from those errors.
- **Evidence (D322, kept by D365):** one evaluation call, as C8.5, reports conversation milestones shown, errors by skill and class, and item ids used. Only turns the learner typed or built count as "shown"; chosen turns never do. A conversation milestone is met when shown in 2 conversations, checkpoints or conversation lessons, on different days (C6.14). Live turns log exposures and move no boxes (C8.7); error tags feed the planner's bottleneck (C3.4), not the remedial counter.
- Learner turns capped at 8-12 (config); "I'm stuck" as C8.4. Live character turns pass the code checks in C11.6 before display. If the live call is unavailable or the spend cap is reached, the lesson falls back to a scripted situation exchange (C11.2) and still completes.

#### C4.16 Fluency lesson (D368)
- Known material only: items at least "usable with effort". No new material, never counted against the daily cap (C3.9).
- **Timed rounds** on tap and listen answers, never typed (P21); listen and pick. **Shadowing:** hear a line and say it aloud, self-paced and unscored (no speech input, D321).
- **Retelling, heritage learners only (config):** type the last story episode in your own words. One model call tags errors by class as the conversation evaluation does. Never scored, never milestone evidence; items used log exposures. Beginners do not retell.
- No separate lesson check: the timed rounds are graded answers.

#### C4.17 Review lesson, the refresher and "keep it fresh" (D318, D348, D369)
- **Review lesson:** built by code, no model call. Due and overdue items beyond the warm-up cap, slipping milestones (C6.14) and carried-over items, each in varied form (C6.5). Each set's first lesson opens with a short review of what the last weekly quiz missed (D304). No separate lesson check.
- **Refresher (C3.10):** one or two review lessons built by code, opening on a "previously in the story" recap from the arc summary, then the slipping milestones' items, ending on items predicted to be recalled (box 3+, last fair review correct). No weekly quiz, not counted against the daily cap. Copy frames it as picking back up, never as a penalty (P17).
- **"Keep it fresh" (D318):** when a milestone already shown slips, one item from it appears in the warm-up under a neutral "Keep it fresh" label. Never "lost", never a badge taken away.

#### C4.18 Test-out flow (D308, D326, D370)
- **Offered** when the opening check (C4.9) is all correct, or when the learner taps "Too easy?" during a lesson with new material (D.7). Two choices: "Show what you know" / "Do the lesson".
- **The check is production only (C6.13):** type or build each new item, or produce the form in a new sentence; one question per new item, at most 8 (config).
- **Pass** (all correct, config, C6.13): the items enter per C6.4 (box 3, `already_knew`, half credit on their milestones), the lesson ends as `tested_out`, its daily-cap count is returned (C3.9), and the next lesson starts. When a set runs out, stretch material or the next set follows (C3.7, C3.11). No lesson is generated on the spot.
- **Otherwise** the lesson runs as planned with the missed items as its new material (C6.13); items produced correctly enter as test-out passes and drop out of it. No result screen; never shown as a failure.
- Near-perfect sets raise the next set's intake (C3.7).

#### C4.19 Feedback, tap-to-explain and "why?" (D323, D371)
- **Every incorrect answer** shows the correct form, audio on tap, and its error class named in plain words. The copy is written by code from templates and the conjugation tables, never by the model. Examples: wrong ending, "Right word, wrong ending: *beet-ak* is your house to a man; to a woman it's *beet-ik*." · wrong stem, "Right person, wrong verb form: past is *katab*, present is *-ktib*." · agreement, "*kbiir* goes with a man; with a woman it's *kbiire*." · wrong word, the correct word and its meaning. Spelling is marked right: "Correct. Standard spelling: …".
- **Tap-to-explain:** tap any Arabic word anywhere for meaning, root, form, person and tense, and audio, from the dictionary, the conjugation tables and the item's grammar tags. Free; no model call.
- **"Why?":** on feedback sheets, explanations and story lines. It first shows the canonical explanation of the tagged grammar point (free). "Still unclear?" runs one capped model call: a short explanation of this sentence in 3 sentences or fewer, using only material that resolves per §C5. Cap per day (config), metered as an `ai_call`; degrade: the canonical explanation only. Shown as generated, with report-a-problem (R4).

#### C4.20 Owned elsewhere
- §C3: which lessons and types each set holds, targets, words, story arc, scenarios, method per milestone, recycling list, set intake and expected dates.
- §C5 (R5): generation contracts for set content and scripted exchanges, the validators (token resolution, dialect, romanization, exposure counts and carry-forward, the story's 95% coverage, grammar tags), the critic, checks on live turns, cost and caps per call.
- §C6: boxes, evidence, error routing and milestone states. §C7: lesson check and weekly quiz. §C8: checkpoint mechanics that conversation lessons reuse. §C9: audio. §C11: Verb Lab and the conversation partner.
- R7: the canonical explanations (two versions per grammar point), the method list, heavy-point flags, scripted situations. §D: screens.

#### C4.21 Principles check
- Discharges: P1 (chunks of 3, C4.13), P2 (cumulative retrieval), P3 (exposure counted by code at set generation, carry-forward for grammar points, C4.3), P4 (2+ modalities per item; the check in a modality the lesson did not use), P5 (audio first in introduce and meet; never autoplay), P6 (scaffold ladder, C4.8), P13 (dialogues, stories and conversations recycle earlier items; every lesson recycles at least two milestones, C3.2), P14 (production ladder, C4.6), P17 (no scores; a test-out miss is never shown; "keep it fresh" is neutral), P20 (grammar lesson: meet, notice, explain in 3 sentences or fewer with a table, C4.12), P21 (transform, never-seen verbs, timed rounds on tap and listen only), P22 (conversation lessons with recasts, C4.15), P23 (every error class named by code, C4.19).
- Defers: P10's validators and P3's counting code → §C5 · P18 → §C8 · P19's sums → C3.6 · P15 → C6.10.
- At risk: P22 and P18 in conversation lessons rest on model judgement → R4. R2 widens: exposure is counted per set, so it holds only if the learner finishes the set; mitigated by the carry-forward check at the next set's generation, mandatory lesson checks in grammar, words, story and conversation lessons, and resume-anywhere. P10 in stories is tightened, not weakened (95%).

### C5 Generation

Owns how content is produced, validated and paid for. Lesson shape is §C4.

#### C5.1 Content strategy (D53, closes Q10)
- All learner-facing lesson, quiz and Focused Study content is pre-generated, shared across learners, native-reviewed and versioned. Zero Claude calls on the lesson and quiz path at runtime.
- Personalisation comes from which units are ordered (C3), which items are due (C6), which scaffolds apply (C4.8) and which activities the allocator picks (C4.5). Never from per-learner text.
- Old P2 (phase plan) and P3 (daily lesson) are retired outright, not ported.

#### C5.2 Generated vs derived
| Surface | Source |
|---|---|
| Item set | Declared in the unit catalogue (C5.3) |
| Introduce | Dictionary row + audio (§C9) |
| Recognise distractors | Deterministic: same `pos`, level ±1, outside the item set, never a `formula_pair` partner |
| Recall word bank | Item words + the same distractor rule |
| Quick check, Review | Deterministic from the vocab store (§C6) |
| Script micro-step | Fixed asset set, one per letter and sound, authored once |
| Pattern, Dialogue, Culture note | Authored by Claude offline, validated, native-reviewed |
| Remedial micro-drill | Same pipeline (C5.6) |

Generated prose per lesson is at most three artefacts. Everything else is data.

#### C5.3 Item sets in the catalogue (D54, amends C4.3)
- Each catalogue lesson declares 6 dictionary ids: 4 core + 2 extension. Beginner config takes core, heritage takes all. No duplicate rows per learner type.
- The unit's `level` does the ceiling+1 work (C3.5); items are not re-selected at runtime.
- A lesson whose declared items fail validation (retired row, level drift after DR) blocks publish of its unit version.

#### C5.4 Authoring pipeline (D55)
Run by Marwan, offline, output to content tables. Stages:
1. Unit catalogue (§J) → 2. Lesson skeletons with declared item sets → 3. Asset generation, strongest text model plus TTS (§C9.4) → 4. Validators (C5.5), blocking → 5. Native review → 6. Publish with `content_version`.

Nothing reaches a learner unreviewed. There is no ship-then-fix path.

One publish gate, all artefact types, all six stages (A5): lesson assets (pattern, dialogue, culture note), quiz questions, placement bank items (C2.2), checkpoint scenarios (C8.3), remedial drills (C5.6), script micro-step assets (C5.2), Focused Study cluster content (C11.2), audio clips (C9.4). Type-specific validators extend C5.5; they never replace it and never constitute a second review path.

#### C5.5 Validators (D56, D65), all blocking at publish
- JSON schema per artefact type. Unknown fields reject.
- Dictionary reference: the prompt receives dictionary ids; every Arabic token in the output resolves to a cited dictionary id or to the `function_words` allowlist. Unresolved tokens reject. Fixes the invented-ref bug (harvest §5).
- Known pool (P10, D134), three regimes:
  - **Graded positions** (quiz stems and options, review items, quick checks, pattern drills): hard gate, items at or below the unit level plus the lesson item set plus the allowlist. Grading on untaught vocabulary corrupts the measurement.
  - **Generated input prose** (dialogue, culture notes): the same pool plus above-level items up to a configured share, default 10%, matching the D94 checkpoint cap. Every such item must still resolve to a real dictionary id; invented tokens reject as before. Above-level items are exposures only (D75) and never move a box.
  - **Learner-directed surfaces** (C11.2, C11.3): no level gate. See C11.1.
- The unit level already does the ceiling+1 work (C4.3), so the item set is the controlled new material and the 10% cap is the incidental layer. Stacking a second uncontrolled layer on top of the item set is what the graded gate prevents.
- Contextual recycling (D65, P13): the generator receives previously-taught items for that unit path and must reuse a configured share, default 30% of non-item-set tokens.
- Romanization: every romanized string passes the C4.7 Arabizi validator. Out-of-set characters reject.
- Dialect rules: the concrete P1 checks (بدي, شو, هلق, رح + verb, عم + verb, b- prefix, urban ق → ء) run as assertions, not as prose guidance.
- Exposure: each item reaches ≥5 exposures in ≥2 modalities across lesson + quiz (C4.3).
- Modality complementarity (C7.3, D87): an item's quiz question must use a modality its lesson exposures did not. Asserted at build.
- Dictionary selection floor (D141): every dictionary row an artefact references — item, distractor, pooled token or constituent — is `review_confidence = 3`. Rows at 1 or 2 are invisible to authoring until re-review upgrades them in place.
- Pair completeness (D130): if an item set contains a `formula` that is the prompt half of an obligatory `formula_pair`, the response half is in the same set or already in the learner's store. Teaching مبروك without الله يبارك فيك rejects. **Inert until `formula_pair` is populated (D141):** the scoped DR pass does not collect pair claims, so with no pair rows this check passes vacuously. Recorded risk R7.
- Constituent resolution (D133): `formula` and `frame` rows declare their constituent dictionary ids. The pool check resolves the row as an item AND checks its constituents against the pool separately, so a level 1 frame cannot smuggle an above-level lexeme past the gate. A constituent above the pool counts against the D134 prose cap and is barred from graded positions. **Inert until constituents are collected (D141):** the dictionary-reference check above still resolves every token to a real id, so nothing invented passes; what is unguarded is an above-level lexeme inside a level 1 frame. Recorded risk R7.
- `[UNVERIFIED]` is not a valid output. Any occurrence rejects.
- Track scope (C10.3): every id an artefact references resolves inside the artefact's own track. A cross-track reference rejects.
- Type-specific sets extend the list above: placement items (distractor rule, band by `level`, one dictionary row per item, C2.2), scenarios (marker and goal tags resolve, pooled vocabulary declared, C8.3), drills (declared trigger ids resolve, C6.10), audio (C9.10).

#### C5.6 Remedial library (D62)
- Micro-drills authored in the same pipeline, keyed to confusion pairs (bid- vs 3am-, b- prefix, ق → ء, gender agreement, pronoun suffixes). Each drill declares the confusion id it treats.
- Content owned here; selection and scheduling owned by §C6.
- The library is extended when the family test surfaces a recurring confusion. Adding a drill is a content edit, not a code change.

#### C5.7 Runtime Claude surface (D57)
Exactly three in MVP. Each is capped and degrades without blocking the learner.

| Task | Trigger | Cap | Degrade |
|---|---|---|---|
| Checkpoint conversation + evaluation | §C8, 3 per phase | per checkpoint | local scoring, no narrative debrief |
| Goal free-text mapping | Onboarding, Adjust plan (D33) | 1 per edit | multi-select tags only |
| Focused Study custom topic | Learner-initiated | per user per day | nearest fixed cluster |

The 6 fixed Focused Study clusters are pre-generated (C5.1). The AI tutor is roadmap (B6) and adds no runtime surface in MVP.

#### C5.8 Model policy (D58)
- Model and token budget are chosen server-side per task from an allowlist. The client never sends `model` or `max_tokens`. Closes the open-proxy hole (harvest §5).
- Defaults: authoring = strongest available · checkpoint evaluation = mid tier · mapping tasks = cheapest tier. Changeable in config without a client release.

#### C5.9 Cost and budget (D59, closes Q9)
- One `ai_call` row per runtime call: user, task, model, tokens in and out, cost, `prompt_version`, `stop_reason`, latency ms. Schema §F.
- Per-user monthly budget, config. Soft cap degrades per C5.7. Hard cap blocks with clear copy and a next action (C1.6).
- Authoring cost is one-off and not attributed to users.
- B8 "Affordable" reads this table.

#### C5.10 Prompts and records (D60)
- Prompts live server-side as versioned records. None in the client, none as inline prose at a call site.
- One shared client: schema-validated JSON, `stop_reason` handling, bounded retry with backoff, structured error.
- Every generated content row and every runtime output stores `model` and `prompt_version`.

#### C5.11 Versioning and report-a-problem (D61)
- Content rows carry stable ids and `content_version`. A lesson record pins the version the learner saw (C4.11), so any lesson is reproducible.
- Report a problem (C1.6) targets content id + version.
- Edits publish a new version. Learners pick up the latest at the next lesson start; work in progress finishes on its pinned version.
- Dictionary edits propagate (A6). An edit to `arabic`, `romanization` or `arabic_vocalised` marks every dependent content row for revalidation and every dependent clip for regeneration under a new key (C9.1). The edit is not live to learners until the dependents republish. Mechanism §H.
- Report triage (A7): a report resolves to no change, to a content edit that publishes a new version, or to a dictionary edit that takes the path above. Owned by §H; every report carries content id, version and, where relevant, clip id.

#### C5.12 Owned elsewhere
- §C6: review scheduling, remedial drill selection, mastery thresholds.
- §C8: checkpoint prompt contract and debrief storage.
- §C9: audio generation and caching.
- §F: content, `ai_call` and prompt-registry schemas.
- §G: gateway auth, rate limiting, key handling.
- §H: authoring tooling, the native review workflow, report triage and dependent revalidation.
- §J: catalogue and item-bank build; DR dictionary review.

#### C5.13 Principles check
- Discharges: P10 (known-pool validator), P13 (recycling quota), P15 (remedial library), P3 and P4 (exposure validated at build rather than hoped for at runtime).
- Defers: P7, P8, P9 → §C6 · P18 → §C8.
- At risk: R3 recorded in `principles.md`. Pre-generation meets jagged profiles through quick checks (D49) and `known_gaps` (D66) rather than bespoke text.

### C6 Learner model

Owns the learner item store, the review scheduler, milestones and their evidence rules, per-skill state, block scoring and capacity, error classes, teaching-method results and the monthly check-in: every "when is this learned" threshold. Rewritten chat 35 (rework R2, D317-D331) for model-built lessons (D280) and the per-skill maturity model (D285-D289); C6.1-C6.12 keep their numbers so existing references hold. Retires the old 0-100 mastery score with +15/−10 deltas and −2/day read-time decay (harvest §2).

#### C6.1 Model (D73, D285, D317)
- One store per learner per track. Every surface reads and writes it: lessons, the weekly quiz, quick checks and test-out checks, Verb Lab, Focused Study, My Vocabulary, placement seeds (C1.1), and conversations (exposures and milestone evidence only, C8.7).
- Four item kinds share one scheduler (D317):

| Kind | Example | Key | Source |
|---|---|---|---|
| Word | `beet` house | `dictionary_id` | dictionary, `review_confidence` 3, or a custom row (C6.11) |
| Phrase | `ya3Tiik il-3aafye` | `dictionary_id` | dictionary, with its pair |
| Grammar point | "3ind- + ending = have" | grammar point id | grammar path (versioned content, B5) |
| Verb cell | hollow verbs · past · *we* | family × tense × person | conjugation tables (versioned content, B5) |

- **A verb cell is a rule, not one verb in one form** (D317). Mastery is measured on the rule (P21); the verb's meaning is its own word item, so a learner who knows the rule but keeps tripping on one verb still shows, through that verb's word item.
- Strength and status stay separate and are never collapsed into one number: strength (box + due date) drives scheduling; status drives display and B8. Milestones, skill scores and capacity are **derived** from the answer log (C6.14-C6.16), never stored as a second truth (D285). The only stored derived values are what a learner was shown (C6.14) and block-end snapshots (C6.16), both pinned under D289.
- No decay. An item that is not due is not weak; overdue age carries the signal decay used to approximate.
- Scheduling is a module with one interface: `next(state, outcome, today) → {box, interval_days, due_on}`. The implementation is swappable; config and `scheduler_version` are stored on every event.

#### C6.2 Item store (D82, D317)
| Field | Notes |
|---|---|
| `kind` | `word` · `phrase` · `grammar_point` · `verb_cell` |
| `ref` | `dictionary_id` for words and phrases (null for custom My Vocab rows and imports), grammar point id, or verb cell id |
| `source` | `placement` · `placement_grammar` · `lesson` · `quick_check` · `test_out` · `verb_lab` · `focused_study` · `custom` |
| `status` | `gap` · `active` · `learned` · `suspended` |
| `box`, `interval_days`, `due_on` | `due_on` is a date, never a timestamp (P9) |
| `already_knew` | True for placement, quick-check and test-out seeds; excluded from words learned (D27) |
| `lapses`, `last_review_at`, `first_seen_at` | |
| `last_exposed_at` | Last time the item appeared anywhere: a graded answer, a lesson or story line, a dialogue, Verb Lab, a conversation. Read by the fair-review rule (C6.5) |
| `evidence` | `graded` or `self_rated_only` (C6.11) |

`known_gaps` (D66) is `status = gap`, not a second table. The planner (§C3) reads it to prioritise; an item leaves `gap` when it is introduced as new material.

#### C6.3 Scheduler (D72, D74, closes Q8)
Leitner ladder, binary outcome, config intervals. Chosen over SM-2 and FSRS: all lesson grading is local and binary (D46), so there is no 0-5 quality rating for SM-2, and FSRS needs a review history the app has never collected. Append-only `review_event` rows carry `response_ms`, the real gap and box transitions, so a later FSRS fit needs no re-collection.

| Box | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| Interval (days) | 1 | 1 | 3 | 7 | 16 | 35 | 90 |

- Correct → box +1, `due_on = today + interval(new box)`, with deterministic ±10% jitter so cohorts of items introduced together do not clump.
- Incorrect → box 1. Second consecutive incorrect → box 0 and a remedial check (C6.10).
- One advance per calendar day maximum (D64, P9). Further correct answers the same day log as exposures and change nothing. This is what stops a heavy session from faking spacing.
- Box 6 items stay in rotation at 90 days. Nothing graduates out of the queue, so material met in an earlier block keeps coming back (D318).
- The expanding intervals are the measured reintroduction: each correct answer is retrieval after a longer gap, which is both stronger evidence of retention and better for it (spacing and testing effects, high confidence). Per-learner interval scaling, aimed at roughly 85-90% correct on fair reviews, is a monthly-analysis proposal (C6.18); intervals stay as above until one is approved.

#### C6.4 Entering the store (D76, D325, D326)
| Event | Enters as |
|---|---|
| Placement word item correct (D27) | box 3 · `already_knew` true · due in 7 days |
| Placement word item incorrect at or below ceiling (D66) | `status = gap` · no box · the planner prioritises it into the first block |
| Placement word item incorrect above ceiling | not stored |
| Placement grammar point passed, both its items correct (C2.4) | box 3 · `already_knew` true · `source = placement_grammar` · its milestones at half credit until production in a lesson confirms (C6.14) |
| Placement grammar point, one of two correct | not stored: the evidence is too weak either way |
| Placement grammar point, both wrong | `status = gap` when another point in the same stage passed; otherwise not stored |
| New material, on lesson completion | box 1 · due tomorrow · box 0 when the lesson's check fell below threshold (C7.6) |
| Quick check correct (C4.9) | box 3 · `already_knew` true |
| Quick check miss | `status = gap`, queued into an upcoming lesson |
| Test-out check passed (C6.13) | box 3 · `already_knew` true · `source = test_out` |
| Focused Study phrase | box 1 on session completion |
| My Vocab custom or import | box 1 · `evidence = self_rated_only` |

Verb Lab practises taught cells only, so it never seeds a cell. Misses inside the introducing lesson do not shorten the first interval, which is already 1 day. They set a weakness flag used by C6.6 ordering and C6.9.

A lesson whose check falls below the C7.6 threshold (D90) seeds its new items at box 0 instead of box 1, and they carry into the next session's warm-up in full, above the C6.6 ceiling. One extra correct review is then needed before they can count as learned (C6.12).

#### C6.5 What counts as a review, and fair reviews (D75, D320)
- Graded: the warm-up review, lesson and weekly-quiz questions, quick checks, test-out checks, Verb Lab answers, My Vocab self-ratings.
- Not graded: introduce steps, culture notes, recycling appearances (D65), story and dialogue lines the learner did not supply, unscored practice-again attempts (C7.7). These are exposures: they update `last_exposed_at` and never move a box.
- Recall questions on an item that is not yet due: a correct answer logs an exposure and does not advance the box; an incorrect answer still lapses it per C6.3. Same asymmetry as consolidation mode (C6.7).
- **The real gap (D320).** Every graded answer records `gap_days`: days since the item's `last_exposed_at`, not since its last review. A word met in yesterday's story makes today's "7-day review" a 1-day review.
- **A fair review** is a graded answer without supports (word bank, hint, reveal) whose `gap_days` is at least the interval of the box it was due from, less one day of tolerance. Only fair reviews count as retention evidence: milestones met or slipping (C6.14), capacity (C6.16) and B8 retention (C6.12). Other graded answers still move the box per C6.3. **Verb Lab answers are never retention or milestone evidence** (C11.5, D367): they move boxes and update `last_exposed_at` only.
- **Planner rule:** an item due for review within the next 2 days is kept out of graded positions in generated lessons. It may still appear in input prose (stories, dialogues). Familiarity comes from lessons and measurement from fair reviews, so the two no longer compete. The 2 days are config, low confidence.
- **Retention probes vary the form (D318):** a due grammar point or verb cell is presented in a new sentence, and a verb cell where possible with a verb the learner has not practised in that cell. A probe that repeats the teaching example measures memory of the example, not the rule.

#### C6.6 Review queue (D77, D71)
- Warm-up budget 8 items, config. Ceiling 14 when due volume overflows; the remainder carries to the next session and is never dropped. All four kinds share the queue; due verb cells also surface in Verb Lab.
- Order: overdue age descending, then lowest box, then weakness flags from C6.4, then error-class flags (C6.10).
- Interleaving (P12): no more than 3 consecutive queue items from the same block topic; the queue draws from at least 2 whenever 2 have due items.
- Modality follows the skill mix (§C3): a due item presents as audio recognition, script recognition or recall, by the mix and the C6.9 ladder step. Grammar points and verb cells present in varied form (C6.5).

#### C6.7 Absence and consolidation (C1.4, D63, D84)
- After 7+ days away, the first session back runs an extended warm-up, ceiling 20, and delivers no new material. It first asks one item per targeted milestone of the block in progress (or, between blocks, the last finished one), then follows C6.6's order, so it measures what slipped; C3.10 acts on the result (D348). Copy frames it as picking back up, never as a penalty (P17).
- Consolidation mode (beyond `new_lessons_per_day`, D63) pulls due reviews first, then lowest-box not-yet-due items, then items from the last 3 completed lessons' topics. Not-yet-due items log exposures and do not advance (C6.3).

#### C6.8 Quick checks and word level (D83, D330, closes C3.5 and C3.12)
- Quick-check scoring is C6.4.
- **The vocabulary window C3.5 calls the band is the word level** (D330), renamed so it never collides with the conversation band (C6.15). §C3 takes the term in R3.
- Word level advances automatically when 9 of the last 10 quick checks are correct: +1, window resets, minimum 10 completed lessons between auto-advances. Every change appends a plan event (C3.15).
- Word level never moves down automatically. A bad week should not strip content the learner has already been given.

#### C6.9 Ladders (D79, D80)
Production step by box, modified by plan stage and learner-type config (C4.6, D68):

| Box | Step |
|---|---|
| 0-2 | Word bank |
| 3-4 | Word bank with same-pos distractor pressure |
| 5+ | Typed entry |

The Settings toggle forces typed on early; it never forces it off. Word-bank answers are recorded as supported (C6.19), which C6.14's "met" excludes.

`script_stage` advance (C4.8, P6), on evidence not preference:
- 0 → 1: rolling accuracy ≥85% over the last 20 script-stimulus graded items, and ≥8 script micro-steps completed.
- 1 → 2: same accuracy bar, plus romanization reveal taps on fewer than 20% of those items. On-tap scaffolds make reliance measurable, so reliance is the evidence.
- Demote one step when rolling accuracy falls below 60% over the last 20.
- Maximum one step change per 7 days in either direction. Every change appends an event.

#### C6.10 Error classes and remediation (D62, D81, D323, P23)
- Every incorrect graded answer carries an error class: `wrong_ending` · `wrong_stem` · `agreement` · `wrong_word` · `spelling` (D323). Assigned by code wherever the answer can be compared with the conjugation tables, the personal-ending rules or the dictionary forms; otherwise `wrong_word` on a word item, or unclassified. The class is named to the learner (P23; copy written by code, C4.19).
- **The lapse lands on what failed:** `wrong_ending` and `agreement` lapse the grammar point or verb cell, `wrong_stem` the verb cell, `wrong_word` the word item. `spelling` with the right sound is marked right and shows the standard spelling (D306); it lapses nothing.
- **Remedial trigger:** 3 lapses of one error class on one skill within 14 days, where a lapse is an incorrect answer on an item at box ≥2. Drills declare their triggers (`trigger_item_ids`, `trigger_pattern_ids`, error class) and come from the conjugation tables, the endings rules and the C5.6 library; none is generated per learner at runtime. At most 1 drill per session, inserted into the warm-up, not repeated within 14 days. The counter clears when the drill is passed and the triggering items return to box ≥2. If no drill matches, the items stay in rotation.
- Error classes per skill feed the planner's bottleneck choice (§C3) and the method results (C6.17).

#### C6.11 My Vocabulary and Focused Study (D82)
- My Vocab review grades by self-rating (got it / not yet) and feeds the same scheduler. It is the only surface where a self-rating moves a box.
- Items whose only evidence is self-rating never count toward words learned, milestones or B8 (P7). A tap is not a demonstration.
- Focused Study writes to the same store, so a phrase met there is reviewed in tomorrow's warm-up. The separate `focused_<scenario>` mastery pool (harvest §2) is retired.

#### C6.12 Words learned and the B8 threshold (D78, D132, closes C1.7)
- Learned = items at box ≥3 with at least one fair correct review (C6.5) at a gap of ≥3 days, and `already_knew` false. Placement, quick-check and test-out seeds show as "already knew" and are never counted.
- Counted in two figures, never one (D132). **Words learned** counts single lexemes (`pos` ∈ noun, verb, adjective, adverb, pronoun, preposition, conjunction, particle, interjection). **Phrases learned** counts `pos` ∈ formula, frame. The dictionary is not split; only the counter is (D128, D132).
- A phrase contributes nothing to words learned, ever. Mastering بدي أروح advances that row's box alone; روح receives no credit. The D133 constituent declaration is a validator input, not an evidence path. Learning a chunk can be contextual recognition rather than knowledge of its parts, so the parts are never credited.
- **B8 retention** = across the family test, ≥80% of fair reviews of learned words and of verb cells are correct on first attempt, with a per-tester floor of 70%. One query over `review_event`. Phrases learned is progress feedback, not a metric.
- Progress shows words learned, phrases learned, milestones reached as can-do statements per skill (from `milestone_shown`, C6.14), streak (C1.4) and items due. No scores, XP, percentages or pace readings (P17, D287).

#### C6.13 Test out (D308, D326)
- A warm-up whose answers show a lesson's material is already known offers a short test-out check; "too easy" also offers one.
- **Production only:** typed answers or building the sentence, never recognition. Heritage learners recognise far more than they can say.
- **Pass** (all correct, config): the material's items enter at box 3, `already_knew` true, `source = test_out` (C6.4); their milestones move to half credit (C6.14); the lesson moves to harder material at once, because new material needs only half credit on its direct prerequisites (D310). Full credit comes from the ordinary fair review about 7 days later, with no extra step.
- **Fail:** the lesson runs as planned and the missed items are its new material. Never shown as a failure.
- Tested-out material counts toward neither words learned nor `new_lessons_per_day`: it is not new material.
- Lesson flow (where the offer appears, how the lesson continues) is C4.18; bigger steps after near-perfect sets are C3.7.

#### C6.14 Milestones (D285, D288, D310, D318, D319)
- **The milestone catalogue** is versioned content (B5). Each milestone: id · plain can-do name · skill (C6.15) · shape (step or threshold) · direct prerequisites · the conversation bands that list it · evidence: the items it rests on (grammar points, verb cells, word sets) or, for a threshold, the measure and target. Every graded answer records the milestone ids it exercises; lesson items carry them from generation (verb cells and personal endings by code, syntax points by model tag checked by the critic, R9).
- **Three states**, recomputed from the answer log on every read by `maturity(events, catalogue, rules) → state per milestone` (D319):

| State | Credit | Step milestone evidence (placeholders, low confidence) |
|---|---|---|
| Not yet | 0 | — |
| Usable with effort | 0.5 | 70%+ correct in its last 2 practice sessions, supports allowed; or a placement grammar pass or a test-out pass. The bar for direct prerequisites of new material (D310) |
| Met | 1 | Every item it rests on answered correctly in a fair review (C6.5) at a gap of at least 7 days, without supports; 90%+ correct on its last 10 graded answers; for verb milestones, at least one fair correct answer on a verb never seen in that cell. A new milestone can be met at the earliest about 11 days after teaching (box 1 → 4) |

- **Threshold milestones** carry a measure and target. Vocabulary: words learned plus phrases learned (C6.12, D354), so an item counts only once recalled in a fair review days after teaching; the two counters stay separate on screen. Listening: accuracy on the last 20 fair listening-stimulus reviews. Fluency: median `response_ms` on tap and listen answers on met material. Met at the target; partial progress in between (C6.16).
- **Speed limits apply only to tap and listen answers**, never typed ones: typing speed is not fluency (P21, C8.5).
- **Conversation milestones** are met when the evaluator reports the milestone shown in 2 conversations (checkpoints or conversation lessons) on different days (C8.7, D322). This is model judgement, not a binary answer; R4 covers it.
- **Slipping (D318):** a met milestone whose items fail a fair review returns to half credit in the live state. The planner works it back into upcoming lessons by recycling, not by repeating a lesson; still at half credit when the next block is planned, it becomes one of that block's targets.
- **Shown stays shown (D318, D289):** the first time a milestone is met, a `milestone_shown` row is appended and the can-do is displayed. It is never taken back on screen while the live state slips; Today may show a neutral "keep it fresh" practice item, never a lost badge (P17). The planner, scoring and B8 read the live state only.
- **Placement seeds the axes (Q34 j):** placement word seeds feed vocabulary and grammar seeds give half credit, so a heritage learner does not start at zero; `already_knew` stays separate from learned (D27).

#### C6.15 Skills and the conversation ladder (D285, D288, D321, D322)
| Skill | Shape | Scored in MVP |
|---|---|---|
| Grammar | step | yes |
| Verbs | step | yes |
| Conversation | step | yes, model-judged (C8.7) |
| Script letters | step | yes |
| Vocabulary | threshold | yes |
| Listening | threshold | yes |
| Fluency | threshold (tap and listen speed) | yes |
| Pronunciation | threshold, a few sounds as steps | **no (D321).** MVP has no speech input, so nothing measures it. Listed so the catalogue needs no reshaping when the voice partner (B6) arrives. Sound-contrast listening drills count toward listening; the monthly check-in (C6.18) is the only signal meanwhile |

- **The conversation ladder is the C8.5 band** (D288): `starting` · `emerging` (survival) · `developing` (everyday) · `conversational` · `fluent`. `starting` holds until every `emerging` milestone is met (D322), so a beginner's 90-day target can be missed (B2).
- A band is reached when every milestone it lists is met. The band is derived, never assigned by a checkpoint.
- `script_stage` (C6.9) and the script-letter milestones are separate: the stage governs scaffolds, the milestones measure decoding.

#### C6.16 Block scoring, carry-over and capacity (D310, D311, D316, D331)
- **Block bar:** the milestones a block targets (its 2-4 can-dos, D311). Step milestones score 0 / 0.5 / 1 (C6.14); threshold milestones score progress from the block's start to its target, capped at 1; a skill scores the mean of its targeted milestones; the block scores the mean of the skills it targets, equally weighted. Untargeted skills are not scored. Measured from the block's start, at block end.
- **The 0.25 per-skill floor lives only in the B8 test and the monthly analysis, never in the planner** (D316). A skill below it flags that the teaching failed, and repeats point at the method or the milestone's bar. The planner reads per-skill scores and capacity; method switches stay with the stalled-step rule.
- **Carry-over (D310):** at a block's time cap, its unmet milestones carry into the next block as its first target. A block that ends with every milestone met carries none.
- **Capacity per skill** (D331), read by the planner to size the next block (D313, §C3):
  - learning rate: new material reaching usable, and reaching met, per hour of active study (active minutes per sitting are recorded, C6.19);
  - retention: share of fair reviews correct;
  - carry-over: count of the skill's targeted milestones unmet at block end.
  Window: the last block. The first block reads placement and config defaults.
- A block-end snapshot (scores, capacity, live milestone states, catalogue and rules version) is appended and never recomputed (D289); recalibration recomputes only in a separate labelled view.
- All numbers are placeholders (low confidence), fixed before the family test; pass and fail are read on those.

#### C6.17 Teaching-method results (D324)
- Every activity carries a method tag from a closed, versioned list, for example: table first or dialogue first, chunked high-frequency forms, the active-participle bridge, transform drill, listen and pick, listening first or reading first. Lessons and Verb Lab write it on every answer.
- **Judged by outcome, never by preference or "learning style"**, which has been tested and does not predict learning (Pashler et al. 2008, high confidence). Outcomes: time for material taught by the method to reach usable, its fair-review retention, its error-class mix (C6.10). Engagement signals are logged beside them: abandoned lessons, "too easy" taps, time taken.
- **Fair comparison only:** within one learner and one skill; the planner alternates methods on comparable material (§C3); nothing is compared below about 20 items per method (placeholder). With three learners this is a per-person result, and the first month is mostly noise (moderate confidence it is useful after a couple of months).
- The only automatic switch is the stalled-step rule (sequencing rule 5, §C3). Everything else reaches the monthly analysis as a proposal (C6.18).

#### C6.18 Monthly check-in and analysis (D285, D328, D329)
- **Real-life check-in (D328):** about 30 seconds, skippable, offered at the first session on or after each 30 days from plan start, re-offered once if skipped. Questions: did you speak Arabic outside the app; with whom; for how long; how it went, 1-5; where you got stuck (optional text). After a block where actual sittings ran at about 60% or less of the stated figure, it also asks whether to keep planning for the stated figure or the actual one (C3.7, D352). Append-only; never milestone evidence; read by the monthly analysis and by R1.
- **Monthly analysis:** reads capacity, block snapshots, the floor, error classes, method results and the check-in, and proposes changes to pace, intake, weighting, method choice and per-learner interval scaling. Each change is approved by Marwan or Omar, with the other told (D329), and versioned as config (D118).
- **Key class (D329, closes R6's owed item):** the keys it tunes are **block** keys (C10.7): pinned at block start, changed only at a block boundary after approval, every block record carrying its resolved values. Evidence-rule and scoring keys (C6.14, C6.16, C6.12's B8 threshold) stay frozen and are locked for the whole family test: the analysis may only propose them, with results in a separate labelled recomputation (D289).

#### C6.19 Records (schema §F)
- `learner_item` per C6.2: one row per learner × track × kind × ref.
- `review_event`, append-only: item, origin (warm-up · lesson · weekly quiz · quick check · test-out · Verb Lab · focused study · my vocab · checkpoint · conversation), correct, supported, timed, self-rated, `response_ms`, `gap_days`, error class, milestone ids, method tag, box before and after, `scheduler_version`, timestamp.
- `milestone_shown`, append-only: milestone id, catalogue version, shown at.
- `block_snapshot`, append-only at block end, per C6.16.
- `checkin`, append-only: the C6.18 answers.
- Active minutes per sitting, on the session record (§F).
- `script_stage` changes and word-level auto-advances append plan events (C3.15).
- Answer rows (C4.11) remain the raw record. `review_event` is the scheduler's own log: derivable, but stored, so the ladder can be replayed after a config change. Milestone states, skill scores and capacity are recomputed from it.

#### C6.20 Owned elsewhere
- §C3 (written in R3): block planning and targets (C3.2, C3.4), intake sized from capacity (C3.7), diagnosis and the stall rule (C3.8), recycling and method alternation (C3.2), the 2-day rule at generation (C3.9), return after time away (C3.10).
- §C4, §C7 (R4): lesson flow, the test-out offer, the weekly quiz, error-class copy, Verb Lab.
- §C5 (R5): generation-time milestone and grammar tagging, the critic.
- §C8: checkpoint evaluation; checkpoints log exposures and move no boxes (C8.7).
- §C9: audio for review items. §F: schemas. R7 and §J: the milestone catalogue, grammar path and conjugation tables as content.

#### C6.21 Principles check
- Discharges: P7 (advancement by fair, unsupported recall; milestones met by evidence, never time spent), P8 (ladder expands on success, contracts on failure, for grammar points and verb cells too), P9 (calendar-day intervals, one advance per day, gap measured from the last exposure anywhere), P12 (queue interleaving), P14 (production ladder keyed to box; supported answers excluded from "met"), P15 (drills triggered by error class), P6 (`script_stage` advances on measured scaffold reliance), P16 (every placement output has a consumer, grammar seeds included), P21 (mastery measured on the rule: verb cells per rule, varied-form probes, a never-seen verb required, timed only on tap and listen answers), P23 (every error classified, named and routed to the item that failed).
- Defers: P3, P13 for structures → R3, R4 · P18 → §C8 · P17 display → §D (D.5).
- At risk: P7 for conversation milestones, which rest on model judgement (R4). R6's owed key class is closed by C6.18. R9 unchanged. Method results (C6.17) are noisy at three learners; mitigated by within-learner comparison, a minimum sample and human approval of every change.

### C7 Lesson checks and the weekly quiz

Owns the lesson check that closes a lesson and the weekly quiz that closes a set: composition, grading, results and practice again. Checkpoints, which close a block, are §C8. The three names are never mixed (D357). Rewritten chat 37 (rework R4). Review scheduling and boxes are §C6. Retires the client-built quiz (harvest §2): unenforced `MIN_QUESTIONS`, fixed English distractor padding, `passed` writing a lesson `mastered` status, and a results screen that promised the next lesson would adapt while nothing triggered it.

#### C7.1 What the lesson check is (D85, D361)
- A retrieval check closing a lesson, over its own material and the milestones it recycles. Taken, never passed. Mandatory where the lesson type has one (C7.2); exit and resume anywhere (D14, C1.5). Budget about 2 minutes (config cap).
- Built by code with the lesson from its declared items and generated content (C4.5). No model call, no client-side assembly. Questions carry stable ids and `content_version` (C5.11).
- Distractors: same `pos`, level ±1, outside the lesson's new material, never a `formula_pair` partner.

#### C7.2 Composition by lesson type (D361)

| Lesson type | Lesson check |
|---|---|
| Grammar | 4-6 questions on the point, at least one producing the form in a new sentence; verb points include a verb never seen in the cell |
| Words | one question per new word or phrase delivered |
| Story | 2-4 comprehension questions + recall of 2 known words from the episode |
| Conversation | 2-3 recall items from the debrief's errors |
| Fluency | none: its timed rounds are graded |
| Review | none: everything in it is graded |

- Questions on recycled items grade as reviews (C6.5): a correct answer on a not-yet-due item logs an exposure; an incorrect one lapses it.

#### C7.3 Question types and modality (D87)
- Types are a subset of the C4.4 catalogue, never a second catalogue: recognise, recall, pattern table, transform, listen and pick, comprehension.
- Each new item's question uses a modality its lesson did not, and the same holds for grammar points: a point practised in script is checked by listen and pick or by production. Declared at build, asserted by code (§C5).
- Scaffolds follow `script_stage` (C4.8).

#### C7.4 Production (D88)
- New items are not in the store yet at check time (they enter on lesson completion, C6.4), so the C6.9 ladder has no box to read: fresh items are word bank. Recycled items read the ladder by box.
- Production weight 0 (beginner default) renders recall as recognition (C4.5); exposure counts are unaffected. The Settings typed toggle still forces typed on (C4.6).

#### C7.5 Grading and feedback (D89, D263, D306)
- Local and binary, by code. Typed answers grade per C4.6: normalised Arabic script, or romanization on phonetic equivalence (D263), never letter distance.
- Feedback is immediate per question per C4.19: correct form, audio on tap, the error class named, "why?" available.
- Every answer writes an answer row (C4.11) and a `review_event` (C6.19), `origin` lesson or weekly quiz.

#### C7.6 Results (D90)
Shown after every lesson check and weekly quiz:
- The count, "5 of 6", stated once. Never accumulated, never averaged, never surfaced in Progress.
- Every item with its state (got it / needs another look), the correct form, audio on tap.
- The needs-another-look items named as being in tomorrow's warm-up.
- No pass or fail verdict, and no lesson `mastered` status (C4.11).

Threshold, internal and never rendered:
- `check_threshold`, config default 0.7, over first attempts on the lesson's new-material questions.
- At or above: the new items enter box 1 (C6.4). Below: the lesson still completes, with no repeat and no block; the new items enter box 0 and carry into the next warm-up in full, above the C6.6 ceiling.

| Horizon | Signal | Owner |
|---|---|---|
| This lesson | Lesson-check count and per-item states | C7.6 |
| This set | Weekly-quiz count and per-item states | C7.9 |
| This block | Checkpoint debrief; can-dos reached | §C8, D.5 |

#### C7.7 Practice again (D91)
- From the results screen: missed items only, re-asked in a different modality with a fresh distractor draw. Unscored. It logs exposures, moves no boxes and does not change `check_score`. Repeatable, no cap.
- The scored second chance is tomorrow's warm-up, where those items are due.
- No full re-sit that overwrites the result: re-answering minutes after the answers were shown measures the answer sheet, not recall (P17).
- Resume: exiting mid-check preserves answered questions; the learner returns at the first unanswered one (C4.11, C1.5).

#### C7.8 Records (D92)
- No lesson-check table: its questions are activities in the lesson's assembly output (C4.11), and answers are the same append-only answer rows.
- The lesson record carries `check_score` (first-attempt fraction on new-material questions) and `check_outcome` (`at_or_above` / `below`), for the C6.4 routing and for analysis.
- **Weekly quiz record:** set id, question list with its item, milestone and error-class targets, the adaptive additions and the class that triggered them, `score` on first attempts, started and completed timestamps. Answers carry `origin = weekly_quiz`.
- Practice-again attempts write answer rows flagged unscored and log exposures only. `lesson_progress.quiz_result` JSON (harvest §4a) is retired.

#### C7.9 Weekly quiz (D304, D372)
- Closes each set: the next thing to do after the set's last lesson (C3.9). **Must be taken, never passed**; no pass or fail; exit and resume anywhere.
- **Built by code** when the set's last lesson completes; no model call. About 15 questions: about half on the set's new words and phrases; at least one production question per grammar point, in a new sentence; the set's verb cells, each with a verb not practised in that cell where one exists; 1-2 items from earlier slipping milestones.
- **Adaptive:** when one error class reaches 2 misses on one skill, up to 10 more questions target that class and skill; at most 25 in total. About 5-8 minutes, never much over 10.
- Results as C7.6. The misses open the next set's first lesson (C4.17) and step its intake (C3.7). Answers are graded reviews (C6.5); fair ones count as retention evidence.

#### C7.10 Owned elsewhere
- §C5: content generation, the distractor rule, validators, versioning.
- §C6: boxes, the review queue, remedial drills, evidence.
- §C3: when the weekly quiz fires and how its results size the next set. §C8: checkpoints.
- §C9: audio for questions and feedback. §F: answer, `review_event`, lesson and weekly-quiz schemas.

#### C7.11 Principles check
- Discharges: P2 (the weekly quiz retrieves across a set's lessons), P3 and P4 (lesson-check exposures count toward the set's 5+ and are forced onto a new modality, grammar points included, validated at build), P7 (a weak check delays "learned" through box 0; mastery belongs to the item and the milestone), P14 (word-bank floor for fresh items, box ladder for recycled ones), P17 (count and item states, no verdict, no accumulation, unscored practice instead of a re-sit), P23 (feedback names the error class).
- Defers: P18 → §C8.
- At risk: none new. R2 holds where a lesson type has no separate check (fluency, review): those lessons bring no new material, so the set's exposure count does not depend on them.

### C8 Checkpoints

Owns the 3 per-phase conversations, their scoring, the debrief and the fluency bands. The only surface where the learner produces free language judged as communication (P18, C4.6). Runtime Claude, 1 of the 3 surfaces in C5.7. Retires the `checkpoints` table from harvest §4a: 0 rows, read-only, no writer.

#### C8.1 What a checkpoint is (D93)
- A text conversation with a Palestinian character, scoped to what the learner has completed, followed by a debrief.
- Soft gate: must be attempted, never passed or failed, never blocks lessons or the plan.
- A completed checkpoint counts as a day of activity for the streak (C1.4).

#### C8.2 Anchor and trigger (D93, D312, D327)
A checkpoint closes each block (D312) and the phase.

| Checkpoint | Fires | Budget |
|---|---|---|
| Block end | earlier of: every milestone the block targets met (offered early), or the block's time cap, 30 days from **that block's own start**: its first lesson, not counting days inside absences of 7+ days (C3.10, D340) | 6 learner turns for the first, 10 for the second, 14 from the third on |
| Phase end | first open on or after day 90 only; never early | 14 learner turns |

- The lesson anchor is dropped (D327): pace is per learner (D314), so a lesson count means something different for each learner.
- **Fold-in:** a block whose end would fall within 10 days of day 90 folds into the phase-end checkpoint. **Cut-off:** a block still running at day 90 ends there; its unmet milestones open the next phase's first block (C6.16).
- A fast learner can finish more than three blocks in a phase, so a phase can hold more than three checkpoints. "CP1" in B8 means the first block-end checkpoint.
- Day 90 is not early-triggerable: C3.14 hangs the next phase on the final debrief, and the 90-day target in B2 is read at 90 days.
- Turn counts and the 30-day cap are config; minutes are display copy only.
- A due checkpoint takes the Today's session slot (C1.2). "Not now" starts the normal lesson; the checkpoint re-offers at the next session start. If the next checkpoint comes due first, the earlier one is recorded `superseded`. After 7+ days away, a due checkpoint is offered after the return warm-up, not before it (C3.10). The next block is planned when the block ends, not when its checkpoint is taken (D312); the checkpoint's evidence reaches the plan after it (§C3).

#### C8.3 Content pack and scenario (D94)
- Assembled server-side from records. The client sends no content, no model and no budget (D58).
- Pack: the block's can-do statements and targeted milestones, the conversation milestones in scope for the learner's next band (C6.15), stored items at box >=1 with romanization, the derived band, `script_stage`, goal tags, the `function_words` allowlist, and the previous debrief's work-on list.
- Scenario comes from an authored scenario catalogue keyed to marker and goal tags, built with the unit catalogue in §J. The character is never inventing a context above the learner's level.
- Prompt constraints: stay inside the pooled vocabulary plus at most 10% unknown words; stay in Palestinian dialect; nudge when the learner stalls; land the conversation softly rather than ending on failure. Prompt is a versioned server-side record (C5.10).

#### C8.4 Conversation mechanics (D95)
- Typed free text. No word bank, no distractors, no local grading during the conversation.
- The C4.8 scaffold ladder governs the character's script display only; it never constrains what the learner may type.
- Each character turn is written as a row before it renders, so exit and resume behave exactly as C1.5 requires. Resume returns to the last unanswered turn.
- "I'm stuck" rephrases and simplifies the last character turn, costs a turn from the budget, and is recorded. 3 consecutive stalls trigger the soft landing and the debrief runs on what exists.
- Audio on tap for every character turn, never autoplay (P5). Generation and caching §C9.
- Report a problem on every turn (C1.6).

#### C8.5 Evaluation and the ladder (D96, D288, D322)
- One evaluation call after the last turn. It returns, for each conversation milestone in the pack, shown or not shown; errors tagged by skill and error class (C6.10); and the item ids used correctly.
- The four dimensions stay as the evaluator's internal rubric, used to tag the bottleneck: accuracy and vocabulary range on the first checkpoint, adding spontaneity and elaboration on the second, all four from the third on and at phase end. They are not a learner-facing score.
- **The band is derived, not assigned** (D288): `starting` · `emerging` · `developing` · `conversational` · `fluent`, reached when every milestone the band lists is met (C6.15). A checkpoint moves the band only through the milestone evidence it adds (C6.14).
- Elaboration replaces harvest's speed dimension: turn length and unprompted detail. In a typed checkpoint, latency measures typing, not fluency, and it biases against the learner R1 already flags. Latency is stored unscored so speaking practice (B6) can calibrate against it.
- Communicative success is judged first. Spelling, romanization variance and word order that still communicates are never marked as errors (P18).

#### C8.6 Debrief (D97)
- Fixed order: what worked, 2-3 things to work on, band, path to the next band. The band is the derived band at debrief time, pinned on the row (D289). Compared against the previous debrief from the second checkpoint onward.
- Stored permanently, never overwritten. Rendered in Progress as the block horizon (C7.6). No score, no percentage, no pass or fail (P17).

#### C8.7 Learner-model interaction (D98, D288, D322)
- Checkpoints log exposures and move no boxes. A model judgement on free text is not the binary outcome the C6.3 ladder is built on.
- Item ids used correctly log exposures (`origin = checkpoint`). Conversation milestones reported shown are milestone evidence: one is met when shown in 2 conversations, checkpoints or conversation lessons, on different days (C6.14). Skill-tagged errors feed the planner's bottleneck choice (§C3) and the method results (C6.17); they do not feed the C6.10 remedial counter, whose trigger needs binary lapses.
- Transcripts stay stored for §H drill additions and for report-a-problem follow-up. No native reviewer reads them (D280, D302).

#### C8.8 Cost and degrade (D99, C5.7)
- Config caps per checkpoint: max turns, max tokens per turn, 1 evaluation call.
- Turn call fails: 1 retry, then the checkpoint pauses and resumes later. Lessons are unaffected, since a checkpoint never gates them.
- Evaluation call fails, or the hard budget cap hits: the transcript is kept and the debrief renders reduced, bands withheld, items used and confusions listed from local data, retried at the next open.
- No scripted fallback checkpoint. The conversation resumes from server rows, so an outage delays a checkpoint rather than losing one, and B8 asks that CP1 be completed inside 4 weeks, not on a particular day.

#### C8.9 Records (D100, schema §F)
- `checkpoint`: user, track, plan, `phase_no`, block, ordinal, kind (block end / phase end), anchor fired (milestones met / time cap / phase end / folded), status (pending, in_progress, completed, abandoned, superseded), scenario id + version, config version.
- `checkpoint_turn`, append-only: role, text, stall flag, latency ms, `ai_call` id.
- `checkpoint_debrief`: derived band at debrief time (pinned), milestone ids shown, skill-tagged errors, internal dimension notes, narrative sections, item ids used, `model`, `prompt_version`.
- Exposures write `review_event` rows with `origin = checkpoint`, box before and after unchanged (C6.19).

#### C8.10 Owned elsewhere
- §C9: audio for character turns.
- §C5: prompt registry, model policy, `ai_call` metering.
- §F: checkpoint, turn and debrief schemas.
- §H: drill library additions.
- §J: scenario catalogue build.

#### C8.11 Principles check
- Discharges: P18 (free production judged as communication, the only such surface in MVP), P16 (goals and band drive the scenario; the previous work-on list drives the next), P17 (bands and prose, no score, no pass or fail).
- Defers: audio → §C9 · scenario catalogue → §J · schemas → §F.
- At risk: R4. Checkpoint language is runtime output, so the C5.5 validators cannot gate it and P10 rests on a prompt constraint; conversation milestones now also rest on the evaluator's judgement (C6.14). Mitigation: authored scenarios, pooled vocabulary in the pack, report-a-problem per turn, a milestone met only when shown in 2 conversations on different days. No native review (D302). R1 unchanged, but D96 narrows its typing bias by dropping latency from scoring.
- Rework R2 (chat 35): P16 now also runs through milestones (shown milestones and tagged errors drive the next block), and P17 holds because the band is a derived ladder state shown as can-dos, never a score.

## C9 Audio

Owns what gets audio, how clips are produced, stored, delivered, cached, played and paid for. Approved chat 10 (D101-D112).

#### C9.1 Scope and grain (D101, D102)
Audio is a pre-generated asset of the §C5.4 pipeline, not a runtime service. Exactly 1 runtime TTS surface exists (C9.8).

| Grain | Key | Generated | Read by |
|---|---|---|---|
| Word clip | `dictionary_id` | Once, at catalogue publish | Placement, Introduce, Recognise, Review, quick check, quiz, My Vocabulary |
| Line clip | Content id + `content_version` | §C5.4 stage 3 | Dialogue, pattern example, remedial drill |
| Runtime clip | Checkpoint turn text | On tap, once | That turn, then cache |

- Clips are content-addressed: key = hash of `tts_text` + provider + model + voice. A text edit produces a new key and a new clip; the old clip survives for pinned content versions (C5.11). No clip is ever generated twice.
- Placement costs nothing in audio: every Listen item resolves to one dictionary row (C2.2), phrase rows included, so the ~100-item bank reads existing word clips.
- English is never synthesised.

#### C9.2 Source text (D103)
- TTS reads a vocalised string, never bare script. Bare unvocalised Arabic is mispronounced by every provider.
- The dictionary gains `arabic_vocalised` in DR. Authored lines carry a vocalised field alongside the display string.
- `tts_text` is stored separately from display text, so dialect pronunciation can be spelled into the input while the learner sees correct orthography (urban ق → ء, vowel endings, b- prefix). The C4.8 harakaat rung reads the same vocalised source.

#### C9.3 Voice (D104, D105)
- Voice is track-scoped and chosen server-side from an allowlist, mirroring C5.8. The client never sends a voice id.
- MVP Palestinian track: 2 voices. A and B take dialogue roles; A carries every single-word clip.
- Every asset row stores provider, model and voice. A voice change regenerates under a new key. Voices never drift silently.
- `human_recorded` flag plus the same path contract: a recorded file replaces a generated clip as a content edit, no code change, no migration. MVP ships TTS only.

#### C9.4 Production
- Slots into §C5.4 as part of stage 3, gated by stage 4 validators (C9.10) and stage 5 native review.
- The authoring script is committed to the repo. It is the only place a provider key is referenced, via environment variable, and it never ships to a client.
- An audio spike runs in §J before the full corpus: 20 clips, 10 single words at `level` 1-2 and 10 dialogue lines across both voices, listened to by a native speaker. The full run is blocked on it. The spike is also what settles whether D105's recording slot needs to be used.

#### C9.5 Storage and delivery (D106)
- Supabase Storage bucket, immutable public path derived from the key. The app fetches MP3s as static assets and holds no provider URL, key or voice id.
- Client caching: Cache Storage via the service worker for persistence and offline, plus an in-memory session map. The unbounded in-memory Map that re-billed on every reload (harvest §6c) is retired.
- Lesson start prefetches the full audio manifest for the lesson and its quiz in one batch, so a connection dropped mid-lesson does not kill audio. Extends D19.

#### C9.6 Playback (D107, D108)
- Tap only, never autoplay (P5, C2.8). Replays are unlimited on every surface.
- A Slow control sets `playbackRate` 0.75 on the cached clip. Zero generation cost, no second asset.
- D67 discharged: listening accuracy sets a default, never a limit. Below a config threshold, Slow is pre-selected and a second play is offered automatically on graded listening items. No learner is capped.
- `replay_count` and `slow_used` are recorded on answer rows.

#### C9.7 Failure and fallback (D109)
- Web Speech `ar-SA` is retired outright. It is not a degraded version of the right answer: first exposure sets the pronunciation a learner encodes, and a Gulf/MSA device voice teaching Palestinian encodes the wrong one. No audio is recoverable; wrong audio is not.
- It also concealed a dead pipeline. Placement, lesson and quiz each called it directly (harvest §6c), so the ElevenLabs CORS bug went unnoticed for months. Removing it makes a broken clip loud at the spike, at the validator and in the family test.
- On failure: retry affordance, then the item continues silently and logs it. A graded listening item with no audio swaps to its script counterpart rather than being scored blind.
- Placement is the exception (A3). There the item is dropped and the band set tops up, per C2.4, because the Listen track is the instrument rather than one modality among several.

#### C9.8 Runtime surface (D110)
- Checkpoint character turns only. On tap, 1 synthesis per turn, cached under the same key so replays are free, capped per checkpoint (C8.7). Degrade is a text-only turn; the checkpoint continues.
- Runtime synthesis goes through the gateway with server-side auth and the C5.8 allowlist. The open proxy (harvest §6f) is deleted, not ported.
- Focused Study custom topics and custom My Vocabulary rows get word clips only where the Arabic resolves to a dictionary row. No sentence synthesis in MVP.

#### C9.9 Volume and cost (D111)

| Corpus | Characters, est. |
|---|---|
| Word clips, all 2,728 dictionary rows | ~35k |
| Line clips, ~90 lessons × ~12 lines | ~65k |
| Remedial drills | ~5k |
| One-off total | ~105k |
| Runtime, per learner per 90-day phase | ~3k |

- The whole corpus is a one-off spend in the low tens of dollars at per-character pricing, confirmed against live rates in §J. That is the argument against on-demand synthesis and against ever substituting a cheaper wrong-dialect voice.
- Runtime synthesis writes an `ai_call` row with `task = tts`, characters in place of tokens (C5.9). Authoring synthesis is one-off and not attributed to users. B8 "Affordable" reads both.

#### C9.10 Validators and review (D112)
Blocking at publish, extending C5.5:
- Every item and line requiring audio resolves to an asset with `status = reviewed`.
- Duration within bounds; no zero-byte or truncated clips.
- Voice inside the track allowlist; provider and model recorded.
- Native review at C5.4 stage 5 listens to 100% of word clips at `level` 1-2 and a sample above, plus every dialogue line.

#### C9.11 Records
- `audio_asset`: id, key, `tts_text`, `display_text`, `dictionary_id` nullable, `track_id` nullable, provider, model, `voice_id`, `voice_role`, `storage_path`, `duration_ms`, bytes, `human_recorded`, status, created. Schema §F.
- Content rows reference `audio_id`, never raw text. Report a problem (C1.6) targets the clip id.

#### C9.12 Owned elsewhere
- §C10: track scoping, voice allowlist as a track property, config. Discharged in C10.1 and C10.12.
- §F: `audio_asset` and `ai_call` schemas.
- §G: gateway auth, provider key handling, bucket policy, deleting the open function.
- §H: authoring tooling and the listening pass.
- §J: audio spike, corpus generation run, key rotation, live pricing check. DR: `arabic_vocalised`.

#### C9.13 Principles check
- Discharges: P5 (sound precedes script everywhere, tap only, and the model voice is Palestinian rather than a Gulf device voice), P4 (audio is a real modality rather than a silently failing one), P6 in part (the Slow default fades on listening-accuracy evidence, not on preference). D67 discharged in C9.6.
- Defers: voice fields → §C10 · schemas → §F · key and bucket policy → §G.
- At risk: R5 recorded in `principles.md`. Synthetic TTS may not be reliably Palestinian at phrase level, and the whole audio-first principle rests on clip quality. Mitigations: the §J spike before any corpus run, native listening review as a blocking gate (C9.10), the `human_recorded` override slot (D105), report-a-problem per clip.

## C10 Tracks

Owns track scoping and the engine config every earlier section defers to. Closes Q3 and Q4. Structural section: no new learner-facing behaviour, one track in MVP, no picker (B7). Approved chat 11 (D113-D121).

#### C10.1 What a track is (D113)
- A track is data: one row, one content package, one config overlay. Never an enum in code.
- Row: slug id, display name, status (`active` / `draft` / `retired`), `romanization_map` ref, dialect assertion set ref, voice allowlist (C9.3), config overlay ref.
- Content package: dictionary rows, unit catalogue, lesson and quiz assets, placement bank, scenarios, remedial drills, script micro-step assets, Focused Study clusters, audio clips, `function_words` allowlist.
- MVP: one active track, `palestinian`. Onboarding has no picker; the track resolves from the single active row. B6 additional tracks are the slot this section exists to keep cheap.

#### C10.2 Dictionary scoping (D114)
- The dictionary is track-scoped by row: `track_id` NOT NULL, all 2,728 existing rows backfilled to `palestinian` (D121).
- Rejected: a global lemma table with a `dictionary_track` join. Most of the interesting columns are variety-dependent (`romanization`, `arabic_vocalised`, `level`, `conjugation`, `register`, `confidence`), and the dialect-distinctive vocabulary that carries the pedagogy has no MSA counterpart row at all. The join would earn its complexity on the least interesting half of the lexicon while taxing every content query, every validator and every DR write.
- Cross-track concept linking (بدي to أريد) is a later additive column plus a content pass. No learner data moves. The column is not added now: an empty column with no reader is the `interleaving_config` failure pattern (harvest §2). §F names it as the extension point.
- Because `dictionary_id` implies a track, every downstream reference (`learner_item`, `audio_asset`, item sets, distractor draws) inherits scoping. A cross-track leak becomes structurally impossible rather than validator-dependent.

#### C10.3 Scoping rule (D115)
- `track_id` is stored on roots and derived on children.
- Roots: dictionary row, unit, placement bank item, scenario, remedial drill, audio asset, plan, placement attempt, `learner_item`, checkpoint, Focused Study session.
- Children: lesson, activity, quiz question, answer row, `review_event`, plan event, checkpoint turn, debrief.
- Content ids carry a track prefix (`pal.unit.market-basics`, `pal.scenario.cp1-market`), so a stray cross-track reference is visible on sight, in a validator failure and in a report-a-problem payload.
- The C5.5 track-scope validator asserts it at publish.

#### C10.4 Learner and tracks (D116)
- `learner_track`: user, track, status (`active` / `paused`), `enrolled_at`, placement attempt id, current plan id. The shape supports concurrent tracks (B6: a second track alongside Palestinian). MVP writes exactly one row per learner.
- `profiles.active_track_id` is the track Today's session serves (C1.2). With one track it is constant.
- Enrolling in a second track means its own placement, plan and store. Nothing is deleted and nothing is shared except the learner-global state in C10.5. No UI in MVP.

#### C10.5 Learner-global and track-scoped state (D117)

| Scope | State |
|---|---|
| Learner-global | `script_stage`, streak (C1.4), `new_lessons_per_day` budget (D63), monthly AI budget (C5.9) |
| Track-scoped | Ceiling, listening accuracy, production ratio, plan, `learner_item` store, words learned, checkpoints and debriefs, My Vocabulary rows |

- `script_stage` is learner-global because decoding the Arabic script is one skill and the alphabet does not change between varieties. Evidence pools across tracks: the C6.9 rolling window of 20 script-stimulus graded items counts items from any active track, and the demote rule below 60% is the safety valve if a second track's orthography proves harder than expected.
- The daily new-material limit and the AI budget are per learner, not per track, because P9 spacing and cost are properties of the person's day.
- A track config overlay may not override a learner-global key (C10.6).

#### C10.6 Config (D118)
- Config is a versioned JSON document in the repo, loaded by client and server. Not a Supabase table: a live-editable config table with no review trail is what produced `interleaving_config`, defaults written and never read (harvest §2).
- Resolution happens once per session into a frozen object: base defaults → track overlay → learner-type overlay → learner Settings (harakaat toggle, typed production on).
- Features read the resolved object. No feature branches on track or learner type. Harvest §8's headline failure was `speaker_type` and `isAya` conditionals spread across 14 files; a CI grep gate rejects `learner_type ===` and `track ===` outside the resolver.
- `runtime_flag` is a narrow override table, server-read only, restricted to an explicit allowlist of operational keys: hard budget caps and per-surface kill switches for the C5.7, C8.8 and C9.8 degrade paths. Every override logs actor and timestamp. A key not on the allowlist cannot be overridden at runtime, which is what stops the table becoming a shadow config store.
- Build parameters are not config. Catalogue shape, item set size, unit recall count (C7.2) and validator thresholds live with the authoring pipeline; changing them is a republish (C5.11).
- Track-scoped prompt fragments (dialect instruction, pooled allowlist) come from the track package and are injected by the prompt registry (C5.10).
- Every "config version" field written in C2 to C9 means the version of this resolved document.

#### C10.7 Frozen and hot keys (D119)

| Class | Keys | Behaviour |
|---|---|---|
| Frozen | Scheduler intervals and ladder (C6.3), mastery and words-learned thresholds (C6.12), milestone evidence rules and block scoring (C6.14, C6.16; locked for the whole family test), modality mix (C3.6), word-level advance (C6.8), quiz threshold (C7.6), placement engine rules (C2.4) | Pinned at plan start. A change takes effect at the next phase boundary (C3.10) |
| Block | Keys the monthly analysis tunes (C6.18): pace, intake and the sizing update rule (C3.7), four-kinds targets and skill weighting (C3.6), method choice, per-learner interval scaling | Pinned at block start. A change takes effect at the next block boundary, after approval by Marwan or Omar (D329) |
| Hot | Caps and budgets (C5.9), audio thresholds (C9.6), checkpoint turn budgets (C8.2), copy, secondary card order (C1.2) | Effective immediately |

- Frozen keys are read from the version the plan pinned, so a mid-test edit cannot silently redefine what a band, a learned word or a quiz outcome means across records already written. Recorded risk R6.
- Placement attempts pin the version at the attempt (C2.5), lessons at the lesson (C4.11), checkpoints at the checkpoint (C8.9).

#### C10.8 Adding a track (D120)
Zero code changes. This is the §I acceptance test for the B6 slot:
1. Track row with voice allowlist, romanization map and assertion set.
2. Dictionary rows imported under the new `track_id`, reviewed to the DR standard.
3. Unit catalogue, item sets, placement bank, scenarios and drills authored through C5.4.
4. Audio corpus generated under the track's voices (C9.4).
5. Config overlay for anything that differs.
6. `learner_track` row when a learner enrols.

Anything in that list that requires a code change is a C10 defect, not a track requirement. MVP builds no second track and ships no picker.

#### C10.9 Dictionary review impact (D121)
- `track_id` backfilled to `palestinian` on every row. No per-row judgement, which is what Q3 was holding open.
- `dialect_tag` normalised to a `register` enum. The existing values are already a closed set (D, M, S, SL, MSA, D-var). C2.2 filters on `register`, never on track.
- DR writes to a staging table and is promoted by in-place update, never delete and re-import.

#### C10.10 Records (schema §F)
- `track`, `learner_track`, the resolved config version pointer, `runtime_flag` with actor and timestamp.
- `track_id` on the roots listed in C10.3. `ai_call` (C5.9) gains a nullable `track_id` for per-track cost reporting.

#### C10.11 Owned elsewhere
- §E: config resolver placement, CI gate, repo layout.
- §F: `track`, `learner_track` and `runtime_flag` schemas; the `concept_id` extension point.
- §G: who may write `runtime_flag`.
- §I: the C10.8 acceptance test as the roadmap proof.
- DR: `track_id` backfill and the `register` enum.

#### C10.12 Principles check
- Discharges: none newly, by design. It protects P10 (the known-pool, dictionary-ref and allowlist validators are track-scoped, so an out-of-track word cannot enter a lesson) and P5 (the voice allowlist is a track property, so a wrong-dialect voice cannot be introduced by a config edit). The C9.12 deferral of track-scoped voice fields is discharged here.
- Defers: schemas → §F · CI gate → §E and §H · slot proof → §I.
- At risk: new recorded risk R6 in `principles.md`. Config as data means a mid-test change can redefine an outcome across records already written. Mitigation is the C10.7 frozen and hot split plus the version pinned on every record.

## C11 Side surfaces

Owns Focused Study, My Vocabulary, Alphabet and phonics, Verb Lab and the free conversation partner: session shape, content source, store interaction and records. §D owns their screens, navigation and copy. Created chat 11 (D122-D125); rewritten chat 37 (rework R4, D366, D367, D373) for Verb Lab, the conversation partner and Focused Study built by code (D298). "Why?" and tap-to-explain are C4.19.

#### C11.1 Shared rules (D122)
- Reachable from Home as secondary cards; order and prominence come from learner-type config (C1.2). Never a gate, never part of Today's session resolution.
- All are track-scoped (C10.3) and read the resolved config (C10.6). Shared content they use (situations, topic sets, conjugation tables) is versioned like any other content (C5.11).
- Not level-gated (D135): these surfaces are learner-chosen, so a learner may study above their word level deliberately. The dictionary-ref, romanization, dialect and track validators still apply in full. One exception: Verb Lab drills only cells already taught (C11.5, C6.4).
- A completed session counts as a day of activity for the streak (C1.4).
- Every item carries report-a-problem (C1.6) and follows the C4.8 scaffold ladder.
- All write to the one `learner_item` store (C6.1). None has a private mastery pool; the `focused_<scenario>` pool from harvest §2 is retired.
- Audio: the word or verb-form clip wherever the Arabic resolves to a dictionary row or table cell; sentence audio on first play for situation and conversation lines (§C9, D297).

#### C11.2 Focused Study (D123, D298, D373)
- **A menu built by code from checked, shared data, with no model call per session (D298):** Verb Lab (C11.5) · topic vocabulary (trusted dictionary rows by category, taught in chunks of 3 per C4.13) · situation practice (scripted exchanges such as ordering at a restaurant, a taxi, a shop or a family visit, written once by the model, validated, checked and shared, §C5, R7) · my weak spots (items and cells with recent lapses, by error class, C6.10) · numbers, prices and time · call-and-response phrases (from `pair`, D130) · endings drills (the personal endings on nouns, `3ind-`, `bidd-`, `ma3-`) · speed rounds (timed, tap and listen only, P21).
- Sessions of about 5-10 minutes through C4.4 activities at the learner's scaffold and production step, graded locally. No lesson check, no plan effect. Items enter per C6.4 (box 1 on completion), so a phrase met here is due in tomorrow's warm-up.
- **Custom topic, kept (D373):** free text (for example "I'm going to a restaurant tonight") goes to one capped mapping call that resolves it to a situation, a topic-vocabulary set or dictionary categories; output is validated against known ids and unknown ids are dropped. The session is then built by code. No learner-facing prose is generated here.
- **A topic that maps to nothing** is acknowledged plainly: the learner is told it isn't covered yet and has been noted for a future content batch, and is offered the nearest situations. The miss is logged (`custom_topic_miss`) and read when content batches are planned (R7, §H).
- Cap per user per day (config), metered as an `ai_call` (C5.9). Degrade: the menu without the custom-topic field, stated plainly (C1.6).

#### C11.3 My Vocabulary (D124)
- Rows arrive three ways: saved from a lesson, lesson check, weekly quiz or checkpoint item; added manually; imported as TSV (harvest: TSV over CSV for Arabic).
- A row that resolves to a dictionary id is an ordinary store item. A custom row has `dictionary_id` null, `source = custom` and `evidence = self_rated_only` (C6.2).
- Review grades by self-rating (got it / not yet) and feeds the same scheduler. This is the only surface where a self-rating moves a box (C6.11).
- `self_rated_only` items never count toward words learned or the B8 threshold (D78). P7 asks for demonstrated recall, and a tap is not a demonstration.
- An item that later appears in a lesson, lesson check or weekly quiz picks up graded evidence and stops being `self_rated_only`.
- Audio per C11.1. A custom row with no dictionary match is silent, and the card says so rather than presenting a dead control.
- Community pool is a slot (B6): the opt-in flag is stored, with no sharing, no upload and no UI in MVP.

#### C11.4 Alphabet and phonics (D125)
- Reference and practice, never a gate (C1.2, D16). Script instruction proper is woven into lessons as micro-steps keyed to `script_stage` (D26).
- Content is the fixed authored asset set, one per letter and sound (C5.2), published through C5.4.
- Practice items are graded, write answer rows and log `review_event` exposures, and they count toward the micro-step completion requirement in C6.9 (0 to 1 needs 8 or more).
- They do not count toward the rolling 20-item accuracy window that advances `script_stage`. That window stays lesson, lesson-check and weekly-quiz evidence, so scaffold fading (P6) rests on performance in real material rather than on repeat practice of a screen the learner can grind.
- Letters already met in lessons are marked. The screen never presents a locked or coming-soon state (C1.6).

#### C11.5 Verb Lab (D284, D317, D367)
- **Content:** the conjugation tables, built once per teachable verb and checked by code against a model (versioned content, R7). Every drill comes from the tables, so drills cost nothing and are always correct. No model call.
- **Grids:** the "-ing" words (masculine, feminine, plural) first, then present, past and the other tenses as the grammar path teaches them.
- **Drills run only on taught cells** (C6.4): cells met in a lesson, or proved by test-out or placement. A table the learner has not been taught is readable as reference, with the point's canonical explanation (C4.12), but never drilled.
- Drills: transform (person, tense, polarity) · listen and pick · fill the cell · timed rounds (tap and listen only, P21) · verbs never seen in a cell. "Root + form → word" waits until after MVP: it belongs to the next phase's verb forms.
- Due verb cells are listed first in the Lab and also come up in the daily warm-up (C6.6).
- **Evidence (D367):** Lab answers are graded and move boxes per C6.3, and carry method tags (C6.17). They never count toward milestone states (neither the "usable with effort" practice sessions nor "met"), capacity or B8 retention. Every Lab answer updates `last_exposed_at`, so free practice restarts the gap before the next fair review (C6.5) and can delay "met"; accepted, because that gap is the real memory gap.

#### C11.6 Conversation partner (D284, D366)
- Free, typed, outside the plan, reachable from Home. The learner picks a scenario (situations from C11.2 and the block's can-dos) or types a topic; the character comes from the story cast or is neutral.
- Kept at the learner's level: known items and grammar points from the learner record, at most 10% unknown words, Palestinian with Ramallah first (D281). Replies in Arabic script with romanization per scaffold (C4.8); the learner types Arabic script or romanization (`dir="auto"`).
- Recasts errors inside replies and never lectures (P22); an optional short debrief at the end names up to 3 errors with their class and correct form.
- **Session length:** aim for 12-15 learner turns (about 8-12 minutes), the length needed for an exchange with a goal and a debrief. A hard per-session turn cap and the sessions-per-day cap are config, set from R5's cost test under the spend cap (D293): above the soft cap a cheaper model, above the hard cap the surface pauses with plain copy (C1.6).
- **Checks on every reply** before display, by code: every Arabic token resolves to the dictionary, the conjugation tables or the particle allowlist; MSA grammar words are blocked (D281); romanization is in scheme. One regeneration on failure; a second failure is shown with report-a-problem. Replies are shown as generated (R4).
- **Never milestone evidence (D366):** items used correctly log exposures (`origin = conversation`), no box moves, and error tags go to the debrief and the monthly analysis only, never the planner.
- Transcripts are stored; report-a-problem on every turn (C1.6).

#### C11.7 Records (schema §F)
- Focused Study session: user, `track_id`, menu item or mapped custom topic with its version, `ai_call` id where a mapping call ran, items delivered, started and completed timestamps. `custom_topic_miss`: user, text, timestamp.
- Verb Lab session: grids and drills used, started and completed timestamps; answers write `review_event` with `origin = verb_lab` and are excluded from milestone, capacity and B8 reads.
- Conversation-partner session: scenario or topic, turns as C8.4, per-reply check results and regenerations, `model`, `prompt_version` and `ai_call` ids, debrief.
- My Vocabulary rows are `learner_item` rows (C6.2). No second table. `personal_vocab` with its two competing romanization columns (harvest §4a) is retired.
- Alphabet practice writes answer rows and `review_event` with `origin = alphabet`.

#### C11.8 Owned elsewhere
- §C5: situation and topic-set generation, the mapping prompt, live-reply checks, validators, versioning, cost.
- §C6: boxes, scheduler, words learned, `script_stage` advance, evidence rules. C4.19: "why?" and tap-to-explain.
- §C9: word, verb-form and sentence clips. R7: conjugation tables, situations, topic sets.
- §D: screens, navigation, import UX. §F: session and event schemas.

#### C11.9 Principles check
- Discharges: P8 and P12 extended to every side surface (one store and one scheduler, so a Focused Study phrase or a Verb Lab cell interleaves into the ordinary warm-up), P7 (self-rated items and Verb Lab answers excluded from milestones, learned and B8), P6 (alphabet practice cannot manufacture scaffold-fading evidence), P17 (no scores, no locked states; untaught tables are readable, not locked), P21 (Verb Lab: rules practised across verbs, timed only on tap and listen), P22 (the partner recasts at the learner's level).
- Defers: screens → §D · schemas → §F · reply checks and cost → §C5.
- At risk: P22 and P10 in the partner rest on prompt constraints and code checks on live, model-written replies → R4.

## D. UX
Target 393×852, single column, iPhone Safari PWA. Screens only; mechanisms are §E to §J (D.14).

### D.1 Foundations (D142, D143)
- One dark theme, fixed. No `prefers-color-scheme`, no toggle. A light theme is a later values file, not a rework.
- Tokens in three layers, primitive → semantic → component. Components consume the semantic layer only; touching a primitive is a lint failure.
- Warm near-black surfaces, off-white text. Never `#000` or `#FFF`: fine Arabic marks halate.
- Accent splits: `accent-fill` keeps brand green under buttons, `accent-on-dark` lightens for text, icons and borders.
- Elevation is lighter surfaces, never shadows. Gold sparing and decorative.
- Lora display Latin, DM Sans body, Noto Naskh Arabic learning face. Arabic carries its own size and line-height tokens; harakaat clip at Latin line-heights.
- Build fails on a `style=` attribute in a component, a duplicate selector, or a colour literal outside the primitive layer.
- Motion from tokens; `prefers-reduced-motion` honoured (D190).

### D.2 Arabic rendering (D144, D145, D146, D151)
- One component renders Arabic on every surface. It owns `dir`, `lang`, font, the C4.8 rung, the harakaat override, the audio affordance, the D162 report target and the D192 accessible name. It takes a dictionary id or authored line ref and resolves display from `script_stage` and resolved config. A caller cannot pass a display flag.
- Reveal is per occurrence and resets at the activity boundary. A session-long reveal would let `script_stage` advance on scaffolded evidence (P6). The hidden rung is a labelled control, not an invisible hit area. The Settings harakaat toggle is display-only.
- Arabic and Latin are never concatenated into one string: separate elements, each with its own `dir` and `lang`, bidi-isolated, stacked rather than inlined. Digits render Latin (D47).
- Two Arabic faces, one component picks. **Amiri, display:** wordmark الهدهد, screen and unit titles, culture-note headers, 28px and up. **Noto Naskh, learning:** everything the learner decodes, including the alphabet screen. The same word never appears in both faces on one screen; a dictionary word in a title slot takes the learning face. Discretionary and contextual ligatures off on the learning face. Lam-alef is obligatory and unswitchable, so it gets a named script micro-step (D26) rather than appearing unannounced. Learning face preloaded, display face lazy (D194).

### D.3 Input and navigation (D147, D148, D149, D150)
- One Arabic input. Fixed RTL for Arabic-only answers; `dir="auto"` where either language is legitimate (checkpoint turns, notes, onboarding free text). Autocorrect, autocapitalise, spellcheck **and smart punctuation** off: iOS substitutes a typographic apostrophe, and the romanization standard uses `'` and `-`, so every glottal answer would fail the C4.6 check invisibly. Word bank orders RTL and renders through D.2.
- Three tabs: Home, Progress, Settings. Session and Checkpoint are full screen with chrome hidden; entry stages likewise, with no back out. Focused Study, My Vocabulary and Alphabet live in Home's card grid (C1.2 puts their order under config). At most one persistent bottom element per screen, owned by that screen. No floating action buttons. No splash, no coming-soon affordances.
- The app opens to Home, never into a session. The primary button's label carries the resolved state: Resume lesson · Start checkpoint · Start today's session. Install card appears once in Safari before sign-in; §G owns the mechanism.
- Stage resolution from server records: not signed in → auth · no profile → onboarding · no placement result → placement, resumed at its last round · no current plan → plan reveal · else Home. Back inside a tab goes up one level; back inside a session opens save-and-exit confirm. Deep links in MVP: the invite and sign-in link only.

### D.4 Home (D152, D153)
- One accent-filled element, the primary card. Its label carries the C1.2 resolved state, its sub-line gives position. At the `new_lessons_per_day` cap the label becomes Consolidate today with practice-on-known-words copy: no lock, no warning colour, no remaining-lessons counter. A due checkpoint puts Not now on the card as a visible secondary.
- Four figures, all C6.12: streak, words learned, phrases learned, items due. No lesson-check or weekly-quiz figures, no percentages, no target bars. Each is tappable (D.5).
- Secondary cards carry no badges, counts or new-dots; their order renders from the resolved config list.
- After 7+ days away, one line acknowledging the gap and a sub-line noting the longer warm-up. No re-entry modal.
- Proportions: primary card ~30% of viewport, figure strip one row under 10%, secondary grid starting above the fold.

### D.5 Progress (D164, D165, D166, D167, D168, D198, D287, D374)
- Progress is a history surface. Home answers what to do now; Progress answers what has been built. No primary action, no items-due figure.
- Home's figures deep-link by kind: words and phrases open My Vocabulary filtered to learned items, items due starts a review, streak opens Progress.
- **Skills, as can-dos (D287, D374):** one section per scored skill (C6.15) in a fixed order, each listing the milestones reached as can-do statements, read from `milestone_shown` (C6.14) and never taken back, then the next milestone named as "Next: …". Pronunciation is not listed while it is unscored (D321). No chart: a radar or "spider web" encodes a percentage by its radius even without numbers, which D287 rules out.
- **Plan:** the phase and its end date, the current block's outcome and can-dos, and past blocks as their outcome lines. Block outcomes replace the retired unit list.
- Also shows: the two C6.12 counters over time, streak current and longest as counts, checkpoint history, script rung. Cumulative only, never a rate, never a weekly target, never a comparison. No streak calendar grid: a grid renders every missed day as a visible gap, which breaks C1.4 by layout rather than by copy.
- Mastery internals stay internal: no box numbers, intervals, accuracy percentages, scores or pace. The script rung is the exception, because D.2 already makes it a visible control and C6.9 moves it on the learner's own evidence. Rungs are named for capability: `Reading with full support` · `Reading with harakaat` · `Reading unaided`. Rendered on Progress only, never inside an activity.
- Checkpoint history lists past debriefs, each opening read-only in C8.6's fixed order with the comparison as stored, never recomputed (R6, D289). Archived turns keep audio and the D162 report control. A reduced debrief renders plainly with bands withheld, not as an error.

### D.6 Settings (D169, D170, D171)
- Closed inventory: Adjust plan, harakaat display toggle, typed answers toggle, audio Slow default, sign-out, app version string. Absent, not greyed (C1.6): export and account deletion (§B6), notifications, a general report-a-problem entry (D162 is per item; a record with no item id breaks §H), learner type (set at onboarding, its effects reachable through Adjust plan), TSV import (D.8, where the rows land).
- Settings exposes only keys that are display-only or already eventful. Nothing in Settings can redefine what a learned word, a band or a lesson-check outcome means (R6). Harakaat and Slow audio are display-only. Climb, sittings and "about you" changes are eventful and append plan events (C3.13); Settings has no level control (D346). The typed-answers toggle takes effect at the next activity boundary, never mid-screen, and the resolved config version is pinned on every record (D119).
- Adjust plan is a sub-screen with C3.13's three controls: climb, sittings per week and focus ("about you"). Each confirms with the effect named in capability words, never in level language, and the confirm copy states what is preserved: completed lessons, the learner record, streak, checkpoints. Screens (D376): **climb** is one screen of three full-width choices, Steeper · As planned · Gentler, each with one line of effect ("more new material in each set" / "as planned" / "less new material, more practice"), current choice marked; **sittings per week** reuses the onboarding question's four choices; **focus** opens the "about you" form prefilled, with Delete my answers at the foot behind a one-line confirm saying later lessons stop using them. All take effect from the next set, and the confirm says so.
- Settings keeps the tab bar throughout. Back goes up one level.

### D.7 The activity frame (D154, D155, D156, D157, D160)
- One frame everywhere a graded activity runs: progress bar and save-and-exit, prompt line, stimulus block, response zone. An activity screen is a stimulus block plus **zero or more** response widgets, because C4.2 counts screens and item-batched types carry several items each.
- Widgets: choice (review, quick check, opening check, recognise, comprehension, listen and pick, script micro-step), build (recall, pattern table, transform, about you, dialogue and exchange turns), type (when the typed toggle is on or the production step is typed), reveal (introduce, meet, explain, culture note), **notice** (tap the highlighted form in a line), **reader** (story episode: line by line, audio per line, tap-to-explain on every word), **timed** (choice or listen and pick against a visible draining bar, no number shown), **shadow** (play the line, then Done). Conversation lessons and the conversation partner use the checkpoint's transcript surface (D.8), not this frame. An unmapped activity type fails the lesson build rather than being skipped (D376).
- Single-item screens use the bottom feedback sheet. Item-batched screens (dialogue, cumulative retrieval, pattern) resolve each response inline, mark and correct form beside that item, one Continue completing the screen.
- Explicit Continue always; nothing auto-advances. Correct and incorrect both render the correct form with audio on tap. Correct is labelled `Correct`, incorrect `Needs another look` — never a praise word, never a verdict word, and the same vocabulary on the results screen. Under `Needs another look` sits the error-class line written by code (C4.19); a right-sound spelling shows `Correct` with a "Standard spelling: …" line. A "Why?" text control sits on the sheet (C4.19). The state carries a non-colour mark (D189). Motion is a token-duration fade.
- **"Too easy?"** is a text control beside save-and-exit, shown only on lessons that bring new material; it opens the test-out offer (C4.18) as a bottom sheet with "Show what you know" and "Do the lesson". A test-out miss gets no result screen.
- The lesson check and the weekly quiz are the same frame with a different segment label (`Lesson check`, `Weekly quiz`), not a second engine. Segment transitions are one line, never an interstitial. Results: count stated once, every item with state, correct form and audio, needs-another-look items named as tomorrow's warm-up, then practice again and continue. No pass, fail or percentage.
- Stimulus zone scrolls; progress bar and feedback sheet are pinned. At stage 0 an item is three lines and a dialogue six, which is what makes 393×852 work. The progress bar spans the whole sitting including lesson checks and never resets at a segment boundary. Save-and-exit confirms by naming the return point; a mid-check exit preserves answered questions.
- Chrome hides whenever a graded activity runs, anywhere in the app. Side surfaces keep the tab bar while browsing; the moment a session, review or practice item starts, this frame takes over.

### D.8 Entry stages and side surfaces (D158, D159, D161, D200-D209)
**Onboarding.** Name, then learner type, one question per screen, then the "about you" form (C3.3) on two screens, every field optional; no progress indicator (about 3 min, C1.1). No back out.
- The learner-type question renders C1.3's wording as two full-width choices with no headline restating it. The words heritage, beginner and intermediate never appear. Nothing promises the answer is final; placement may reassign.
- "About you" replaces the goal tags (D344): choices plus optional free text per field, no model call at onboarding, free text `dir="auto"`. Sittings per week defaults to 3 when skipped. Screens (D376): **1. Why and who** — why you're learning, as multi-select chips plus an optional line; who you'll speak with, the same. **2. Where and how often** — where the family is from (chips from a short content list of Palestinian regions plus "outside Palestine" and "not sure", R7), interests (chips plus an optional line), and sittings per week as four full-width choices (1-2 / 3 / 4-5 / 6+). One line under the form says the answers shape topics and stories and can be edited or deleted in Settings. Each screen has Continue and a text Skip.
- Hands straight to placement with no interstitial. The last control says what happens next.

**Placement (D158).** The activity frame with feedback suppressed by config, not a second engine: same choice widget, persistent "I don't know", no feedback sheet at all (C2.8). Production self-rating is a second screen after a correct Listen. Band intros are one line, no emoji. Plan reveal is one scrollable screen in the fixed C3.12 order; reassignment is worded as a better starting point with one-tap undo, never as a level change.

**Checkpoint (D159).** A transcript surface, deliberately unlike a lesson. Full screen, no item progress bar; a thin unlabelled bar tracks turns used (C8.2 makes turn counts config, minutes display copy). Named character bubbles with C4.8 script display, audio on tap, report-a-problem per turn. Learner field is free text with `dir="auto"`, no word bank, no grading affordance. "I'm stuck" states that it costs a turn before it is used. Debrief renders C8.6's fixed order, bands as words on a four-step scale, comparison from CP2. A reduced debrief renders plainly with bands withheld.

**Wrap-up (D204, D205, D206).** A screen after results, not the results screen: results closes the lesson check, wrap-up closes the sitting. Three figures — items practised, items added to vocabulary, streak — and one primary action resolving per C1.2. No lesson-check count, no percentage, no per-item states. At the `new_lessons_per_day` cap the action carries D.4's consolidation copy, identically worded. The streak increments with no celebration, no animation and no mention of days missed; a broken streak shows the new count starting again with no acknowledgement that it broke.

**Focused Study (D160, D373).** The C11.2 menu as a list of full-width rows, Verb Lab first, with a custom-topic field at the top ("What's coming up? e.g. ordering at a restaurant"). A topic that maps to nothing says so in one line ("Not covered yet. We've noted it for a future batch.") and lists the nearest situations, never an error. When the mapping surface is degraded the field is not offered.

**Verb Lab (D376).** A list of verb families, each opening a grid of tenses × persons. Taught cells are drillable; untaught tables open as reference with the explanation and no drill control, never locked or greyed (C1.6). Due cells sit in a "Due" row at the top. Drills run in the D.7 frame with chrome hidden. No counts, percentages or mastery colours on cells.

**Conversation partner (D376).** The checkpoint transcript surface below, with a scenario picker first (situations, then "something else" as free text). The thin bar tracks turns toward the session aim; End and debrief is always available. A reply that failed its checks twice carries the report control in place, with no warning banner. At the daily cap the card says when it is next available.

**Return after time away (D348, D376).** After the probe warm-up, one card: "Some things slipped while you were away", with "Refresh first" (marked Recommended when C3.10 says so) and "Jump in". No counts, no list of what slipped.

**My Vocabulary (D161).** TSV import is a paste box first, file picker second: TSV off a phone is pasted more often than filed. Either route lands on a preview table with per-row status (matched, custom, rejected); nothing is written until confirm. Custom rows with no match render silent with a one-line reason, not a dead control. One line on the surface says self-rated items don't count toward words learned. Lists order on the Arabic or the English gloss, never on romanization (D185).

**Alphabet (D207, D208, D209).** A grid of letters in Arabic alphabetical order, each opening a detail view. Letters already met carry a mark; unmet letters render identically, with no lock and no coming-soon state. No tabs, no separate phonics section. A letter detail shows the four contextual forms, the sound, audio on tap, and practice; the isolated form is not privileged. Lam-alef gets its own entry. Practice runs in the D.7 frame with chrome hidden, writes `review_event` with `origin = alphabet`, counts toward the C6.9 micro-step requirement and not toward the rolling accuracy window, and says nothing about either. Always available, never gated by letters met.

### D.9 Report a problem and audio (D162, D163)
- Report-a-problem sits in the same position on every activity screen: an overflow control on the stimulus block, one tap plus an optional note, never blocking, confirming inline rather than by toast. Same component and record shape on Focused Study cards, My Vocabulary rows, alphabet items, checkpoint turns and archived debriefs, so §H triage reads one table.
- Audio is one button, replay always available. Where placement listening accuracy is below the C9.6 threshold, Slow is pre-selected and a second play offered on graded listening items, as a default the learner can switch off and never a cap (D108). Present on every surface that plays a clip.

### D.10 System states (D175-D181)
- **Degrade vocabulary, one across all five paths** (the three C5.7 surfaces, audio, the C5.9 caps). A degrade announces itself only when the learner's own request went unfulfilled or the task in front of them changed. Otherwise silent and logged. Copy never names the mechanism, provider, model or cost.

| Path | Learner sees |
|---|---|
| Goal mapping falls back to tags | nothing |
| Custom topic falls back to nearest cluster | one line |
| Checkpoint turn fails after retry | one line, paused, with when it resumes |
| Evaluation fails, reduced debrief | one line, no error framing |
| Audio fails, non-graded item | retry affordance only |
| Audio fails, graded listening item | one line; the task changed |
| Soft budget cap | nothing beyond the degrade itself |
| Hard budget cap | one line, capacity for today, never spend |

- **No toasts anywhere.** Every confirmation, degrade line and error renders in place, attached to the thing it concerns, and stays until the learner moves on.
- **Three loading tiers by elapsed time.** Under 300ms nothing renders. 300ms-3s a skeleton in the final layout, shaped to the content, no spinner. Beyond 3s the skeleton gains progress copy naming what is happening and an out where one exists (C1.6). No full-screen blocking spinner at any tier; chrome state never changes because something is loading. Arabic skeletons use the Arabic line-height tokens.
- **Empty states** carry copy, and a next action wherever an action exists on that screen. Where the only way to fill the surface is to use the app normally, the copy states what will appear and offers nothing. Inventory: My Vocabulary (has import), Focused Study with no match (has clusters), Progress before the first lesson, checkpoint history before CP1, learned counters at zero. Zero items due is not an empty state: it is the finished state (P17).
- **Errors render at the smallest scope that owns the failure**: item, then screen, never app (C1.6). An item error leaves the rest of the screen usable. A screen error keeps the tab bar and offers retry plus a way back. No codes, no technical cause. Where the failure concerns a content item, the D.9 report control is in its usual position.
- **Offline** is not a feature in MVP (§B6). Answers queue and sync on reconnect; a session already loaded runs to the end of its loaded content. Anything needing new content stops with copy and a retry. The connection indicator appears only when there is unsynced work or the learner has just hit something that needs a connection, never as a standing readout. Unsynced work is stated as held safely, not as a warning. Sync runs silently unless it exceeds 3s.
- No state introduces a second persistent bottom element, changes chrome visibility, or moves the report control.

### D.11 Copy, tone and naming (D182-D187)
- **Tone.** Second person, present tense, sentence case. The app never says "we". No exclamation marks, no emoji, no praise adjectives — a right answer gets a neutral label, not "Great". Capability over effort (P17). One line where possible, two sentences maximum in any state. Numbers as digits. A missed day is never mentioned as a lapse.
- **Learner-facing glossary:** session, lesson, unit, plan, checkpoint, review, word, phrase, streak, alphabet. A unit is presented by its can-do statement; the bare word is a structural label only.
- **Never in learner-facing copy:** box, interval, scheduler, item, item set, mastery, level, threshold, accuracy, confidence, ceiling, band, track, config, learner type, persona, placement band, `already_knew`, script stage. Band *values* render as words (C8.6); the word "band" does not. The rung renders as a name (D.5), not a stage or a number. "Level" is banned outright, including in the D173 sense.
- **Fixed names:** Hoopoe, wordmark الهدهد. Home, Progress, Settings, Focused Study, My Vocabulary, Alphabet. Referenced by exact name everywhere; no abbreviations, no icon-only tab labels.
- **Arabizi presentation.** Romanization renders in DM Sans, never Lora, never italic, never letter-spaced, never small-caps, never monospace: every one of those distorts the digit and apostrophe symbols. Always lowercase and restricted to `a-z`, `2 3 6 7 9`, `'`, `-` (romanization map rule 4), so any other character on screen is a data signal. The apostrophe is U+0027 and the copy pipeline never runs romanization through a typographic quote filter. A romanized token never breaks and never truncates: it wraps at whitespace only, and a narrow container grows or reflows rather than clipping, because the digraph breaker (`as-hal`), sun-letter assimilation (`ish-shams`) and the five-long-vowel contrast (`beet` vs `biit`) all mean a break or an ellipsis changes the word. Lists never sort on the romanization field: word-initial `2` puts every glottal-initial word ahead of the alphabet. Romanization never appears without its Arabic (C4.8) and renders through D.2.
- A row whose `form_origin` is `regional_variant` renders a short variety label beside its romanization, from the row, never inferred at display time: the target variety writes `2` for both hamza and ق, and rural and Hebron rows write `q`, `k` or `g`.

### D.12 Accessibility (D188-D193)
- **Targets** 44×44pt minimum, hit area allowed to exceed the visible mark. Named as at-risk: the reveal rung, the report control, the audio button, word bank tiles. Adjacent targets carry a minimum gap; item-batched screens stack several response controls in one column.
- **Contrast** 4.5:1 body, 3:1 large text and any meaningful control boundary, measured against the **lightest** surface token in the elevation set, not the base. A CI check computes ratios from the token files and fails the build. Gold never carries text meaning alone. No state distinguished by colour alone, including results item states and checkpoint bands.
- **Motion** conveys no information alone. Under `prefers-reduced-motion` the feedback fade resolves instantly and the progress bar steps; no state becomes unreachable, no copy changes. It is a token swap, not a second code path.
- **Dynamic type**: content scales across the full supported range, chrome scales to a cap. Pinned elements together never exceed a fixed share of the viewport; the stimulus zone absorbs the remainder by scrolling. The feedback sheet grows to its content then scrolls internally rather than pushing Continue off screen. Arabic scales on its own tokens with the line-height **ratio** preserved, or harakaat clip. Word bank tiles reflow and keep RTL order. No supported size drops a control or truncates a romanized token.
- **Screen readers**: the D.2 component owns the accessible name. The name is the vocalised string (`arabic_vocalised`, the same source as TTS). Romanization is hidden from assistive tech entirely — a Latin voice reads `2awlaad` as a number followed by nonsense. The English gloss carries meaning in the accessible tree. The reveal rung announces its state; the audio control names what it plays.
- **Audio dependency**: every affordance is tap-only (P5). The one hard dependency is a graded listening item, and C9.7's swap to the script counterpart is the accommodation. A config key sets that swap as a standing preference: defined, unpopulated, no Settings control in MVP.

### D.13 Assets (D194-D197)
- **Fonts**, four families, self-hosted, never a third-party CDN. Subset by codepoint, retaining layout tables: Arabic shaping runs on GSUB and GPOS, so a glyph subset produces disconnected letters, a broken lam-alef and mispositioned harakaat. `init`, `medi`, `fina`, `rlig` and `mark` retained explicitly, with a rendering test (a joined word, a lam-alef, a fully vocalised string) run whenever a font file changes. The learning face subsets to the whole Arabic block, not to current content, and drops its Latin coverage. One weight per family by default. Learning face preloaded with `font-display: block` — a system Arabic fallback may misposition or omit harakaat, so a swap would show a wrong rendering and then correct it — and the display face lazy with `swap`.
- **Mascot**: SVG source, transparent background, legible on dark and light backdrops so a later light theme is not a redraw. Raster exports generated from the SVG. Decorative everywhere: hidden from assistive tech, never the sole carrier of meaning, never the only content in an empty state. No animation. Placement is a closed list: onboarding, empty states, wrap-up, app icon. Not Home.
- **PWA**: icons at 192 and 512, a maskable 512 respecting the 40% safe zone, a 180 Apple touch icon. No text in any icon. `background_color` and `theme-color` both the base surface value; status bar style dark, so launch never flashes white. No badge icon in MVP.
- **Repo and licensing**: source assets and built outputs both committed, in separate folders; outputs are not generated in CI, because the workflow is browser-only and a CI-only build step cannot be debugged. Regeneration happens in a cloud session and lands as a commit with the command recorded beside the output. All four families are OFL: license shipped, original font names preserved. Audio assets are C9.5 and D106.

### D.14 Owned elsewhere
- **§E**: the offline queue and sync mechanism, the config resolver, native-app portability (B6).
- **§F**: every record shape referenced here, including the three nullable D173 fields and the D193 audio-swap key.
- **§G**: invite, install, sign-in (C1.1 stages 1-2; sign-in precedes onboarding, and D.6 holds only sign-out), and the D.3 install card mechanism, for which D.13 supplies assets only.
- **§H**: triage of the D.9 records, including archived debriefs.
- **§I**: the D174 proof obligation.
- **§J**: the R5 TTS spike, which D.12's audio dependency rests on and does not resolve.
- **R7**: the region list for "about you", situation and topic sets, verb-family names (D.8).
- Later passes, not gaps: D.11 variety-label strings when DR populates `form_origin`; D.11's out-of-set character list checked against the merged romanization map.

### D.15 Principles check
Discharges: **P5** tap-only audio on every surface, one control with replay, the one hard dependency routed through C9.7 (D.9, D.12) · **P6** reveal resets at the activity boundary so `script_stage` never advances on scaffolded evidence, and the rungs are named for capability (D.2, D.5) · **P17** D.4, D.5 (can-dos per skill, never a chart, score or pace), D.8 wrap-up, return card and Verb Lab without mastery colours, D.10's zero-due state and D.11's tone rules · **P18** the checkpoint is a transcript surface with a free-text field and no grading affordance (D.8) · **P23** the error class named on the feedback sheet (D.7).
Defers: P1, P2, P3, P4, P8, P9, P12, P13 → C4.3, C4.13, §C6, counted at set generation · P7, P11 → §C6, C3.2, though D.5 now renders both as learner-facing capability · P15, P16 unchanged at D62 and §C2.
At risk: **P10** newly exposed, not newly weakened — D.8's Focused Study, My Vocabulary and TSV import sit outside the level ceiling, which D134's third regime covers deliberately; the dictionary-ref and romanization validators still apply. **P14** → R8: the typed-answer toggle is learner-set, so production-support withdrawal operates inside a ceiling the learner sets.

## E. Architecture
Mechanisms behind §B to §D. Record shapes are §F, auth and RLS are §G, when a gate runs is §H; §E defines only the client seam to what §G owns. Approved chats 22, 23 and 27 (D212-D223, D229-D238, D249-D259).

### E.1 Stack and dependency budget (D212, D214, D215)
- TypeScript everywhere. esbuild is the only bundler, pinned exactly. No dev server, no framework CLI.
- Dependencies, closed for MVP. Runtime: `preact`, `@supabase/supabase-js`. Build: `typescript`, `esbuild`. Tools-only, never shipped: a HarfBuzz wasm shaper and `@resvg/resvg-js` (E.14).
- View layer is Preact with TSX, hooks only, no state library. The deciding reason is singular: item-batched screens (D154) resolve a response inline while a sibling Arabic input holds focus and a caret, and D147 rides on exact keystrokes. A template-string re-render destroys that node; VDOM diffing keeps it. esbuild compiles TSX natively, no plugin.
- Shared components expose no `class` and no `style` prop. Layout belongs to the parent's wrapper, which is what makes D143's `style=` ban survive a component library. Plain CSS files, no CSS-in-JS.
- `tsc`: `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `isolatedModules`. `any` and non-null `!` banned.
- esbuild strips types and checks nothing, so `tsc --noEmit` is a separate blocking gate (E.15): a green build proves nothing about types.
- Every external payload — Supabase row, edge response, model JSON — crosses **one typed parse boundary** taking `unknown` and returning a result type, never a cast. That covers schema drift and AI-output parsing together.
- `dist/` is gitignored and built on every push (E.12). Built assets are committed (E.14); the bundle is not.

### E.2 Repo layout and runtimes (D216, D217)
- `src/{lib,config,domain,data,ui/{tokens,components,screens,app},sw}` plus `assets/ shared/ supabase/functions/ tools/ docs/`.
- Import matrix: `lib`→nothing · `config`→`lib` · `domain`→`lib`,`config` · `data`→`lib`,`config`,`domain`,`shared` · `ui/components`→`lib`,`config`,`domain`,`ui/tokens`, **never `data`** · `ui/screens`,`ui/app`→everything above · nothing imports `ui` or `tools`.
- No barrel files. Imports static, relative, explicit extensions. `import()` only at split points declared in the build script, which the lint reads.
- **No top-level `let`/`var` in `src/`**: module-level mutable state in engines is harvest's whole-state-sync failure. The single named exception is the store instance (E.4).
- Tokens are authored in one machine-readable source and the CSS custom properties are generated at build, because E.15's contrast gate computes ratios from them and the colour-literal lint needs them parseable.
- Three runtimes, closed list: **browser** (the whole app, a static PWA, no server of ours) · **Supabase Edge Functions in Deno** (model policy, prompts, gateway, `runtime_flag` reads — everything the client must not hold) · **Node in a cloud session** (`tools/`: build, lints, DR, authoring, never shipped).
- Edge-function source lives in `supabase/functions/` in this repo. No runtime code is shared between browser and Deno: `shared/` holds type declarations and constants only, type-checked by both.

### E.3 App shell, boot and routing (D229)
- No router library. **The app is a single history entry**: no `pushState`, no hash. Boot reads the URL once for §G's sign-in token, then `replaceState` strips it. A history stack would let iOS swipe-back leave a session without the D157 save-and-exit confirm.
- Back is in-app only. Each route declares `back: Route | 'confirm-exit' | null` — one level up (D.3), not a previous-screen stack.
- `Route` is a closed typed union carrying its own params; screens switch exhaustively, so a route with no screen is a `tsc` error.
- **Each route declares `chrome: 'tabs' | 'none'`** and the shell reads it. No screen can toggle chrome, which makes alphabet practice and the in-session quiz their own routes rather than flags — D144's no-display-flag rule applied to navigation.
- Boot: auth session → if none, auth route → one `loadBootstrap()` returning profile, track, `learner_track`, plan pointer, placement pointer and the resolver inputs in one round trip → D.3 stage resolution. §F decides whether that is a view, an RPC or N selects.
- Screen-scoped Preact error boundary, plus an item-scoped one inside item-batched screens, because D.10 forbids an app-level error screen.

### E.4 State ownership and the store seam (D230)
- Four owners: server records are canonical (C1.5) and the client holds a cache only · resolved config is immutable per session · route and ephemeral UI state are hooks · unsynced answers are the outbox.
- `lib/store.ts` is a small `createStore` + `useStore` over `useState`/`useEffect`. **Never `useSyncExternalStore`**, which is `preact/compat` and pulls in the React shim against E.1's budget.
- `domain/app-store.ts` holds the single instance and is E.2's named exception. Its location is forced, not chosen: `ui/components` may import only `lib`, `config`, `domain`, `ui/tokens`, and `lib` cannot hold a domain-typed value.
- Store contents, closed: `route`, `bootstrap`, `config`, `activity`, `outbox` summary, `connectivity`.
- **Entry rule: a value enters the store only if two sibling subtrees need it or it must survive unmount.** Everything else is a hook. That rule is what stops the whole-state-sync failure returning as one god object.
- No generic `set`. Two action exports: `navActions` (route only, importable anywhere in `ui/`) and `dataActions` (importable only from `data/**` and `ui/app/**`).
- **The store seam is the only channel from `ui/components` to `data/`.** It is why a component reaches audio playback without an `onPlay` prop threaded through every caller, which is the decay D144 exists to prevent.

### E.5 Data access seam (D231)
- `src/data/` is the only module importing `@supabase/supabase-js`. One client, not exported.
- Every read crosses E.1's parse boundary as `unknown → Result<DomainValue, DataError>` through a hand-written parser that **maps row to domain inside the parser**, so no generated DB type leaves `data/` and a schema rename is one compile error rather than silent drift.
- `DataError = {kind: 'offline' | 'auth' | 'server' | 'parse'}`. Nothing throws across the seam; screens map `kind` to D.10 copy tiers.
- **Write split is binary, so there is no per-call judgement**: an append-only learner event (answer, `review_event`, report) goes through the outbox; anything the next render needs an id from (profile create, plan create, lesson start) is a direct call that fails loudly.
- No Realtime in MVP, stated so it is not wired.

### E.6 Offline queue and sync (D232, D180)
- IndexedDB, one object store — not localStorage, which is synchronous, ~5MB and has no transactional append, which is how an answer goes missing between two paints.
- Entry: client uuid as the server's idempotency key, monotonic `seq`, `kind`, payload, `createdAt`, `attempts`.
- **Flush is serial in `seq` order and stops on the first failure**, because a `review_event` references an answer.
- Triggers: boot, `online`, `visibilitychange` to visible, after any successful direct call, and a backoff timer while non-empty. Never a poll when empty.
- A 4xx other than 401/408/429 is poison: moved to a `dead` store, never retried, **keeps the indicator lit and files through the same §H report path**, because D180's "held safely" is false for a dropped answer.
- Connectivity derives from request outcomes, never from `navigator.onLine`, which reports true on a captive portal. `onLine === false` is only a fast-path skip; `online` is only a flush trigger.
- The indicator's conditions are exactly D180's two — outbox non-empty, or a request failed offline on this screen — clearing on next success or route change, so it is provably never a standing readout. Sync over 3s renders through the same tier hook as loading.
- **Boot flush is time-boxed from `hot` config.** On timeout the position resolves from server records with pending entries applied as a **forward-only local overlay**, discarded the moment the flush lands. That overlay is the single place C1.5's "never device state" is bent, and only ever by events already durably queued.

### E.7 Service worker (D233, D254)
- Registers on the production path only, as a build-time constant (E.10), so a preview bundle contains no registration call at all.
- Precaches the E.10-emitted list — shell, fonts, token CSS, mascot — cache-first keyed by build hash, so a new build invalidates wholesale.
- Audio cache-first and never revalidated, because C9.5 paths are immutable. Capped by entry count with LRU eviction, cap in config; the current lesson's manifest is never evicted.
- **Every Supabase request is network-only and never cached**: a cached API response is the whole-state-sync failure in a new place.
- **No wildcard navigation fallback. A request not in the precache list goes to network, navigations included.** Previews nest under the production scope, so a production service worker controls preview URLs whether or not previews register one; the SPA fallback that would serve production's shell at a preview path exists to support path routing, and E.3 has none. Offline still works, because a navigation to the production start URL is an exact precache hit. A test asserts a preview-path navigation is not served from cache.
- The service worker does no sync and no queueing; E.6 is in-page. It is a cache and nothing else, which is also what makes it removable for E.16.

### E.8 Config resolver and pinning (D234, D238, C10.6, C10.7)
- `src/config/` holds TS modules, not JSON, so the document type-checks: base plus track overlays plus learner-type overlays.
- **The version is the content hash of the resolved document, emitted by the build.** A hand-bumped version can be missed, and a missed bump silently reuses one version across two documents, which is what R6 pins against.
- `resolveConfig(track, learnerType, settings)` is pure, total and deep-freezes its output. Order: base → track → learner type → Settings.
- **A track overlay's type excludes the C10.5 learner-global keys**, so C10.5's prohibition is a compile error rather than a runtime check.
- The resolver returns **two objects, `frozen` and `hot`**, not one, so C10.7's classes are mechanical per key instead of a judgement at every read site.
- **The client never reads `runtime_flag`** (C10.6 is server-read only). A kill switch reaches the client only as a degraded gateway response.
- **The pinning record carries the resolved frozen document itself, not a version pointer.** A pointer has no runtime reader: a client on a later build cannot resolve a historical version, so the scheduler would read current frozen intervals for a plan pinned two versions back — the exact drift R6 exists to stop. A `src/config/` edit therefore cannot retroactively alter any record already written, and any build can read any record. The version hash is stored beside it for attribution. §F chooses the column; §E requires only that the document travels with the record.

### E.9 AI gateway and audio seams (D235, D236)
- **Gateway.** `data/gateway.ts`, one function `callGateway(task, input, {signal})` over the closed C5.7 task set. **The request type has no `model` and no `max_tokens` field**, so C5.8's client-never-sends rule is structural rather than a review item.
- Three-way result: `ok` | `degraded(reason)` | `failed`. **A degrade is a value, not an error**, because D.10 requires the learner path to continue and a throw puts it in the error branch.
- The client retries a transport failure once and **never retries a degrade**, which would double-bill; bounded retry with backoff is server-side per C5.10. Every call is abortable and every caller ties the signal to unmount, so a checkpoint turn cannot bill after save-and-exit. A per-task client deadline comes from `hot` config; a deadline hit is `failed`, not `degraded`. No streaming in MVP. `ai_call` rows are written server-side only.
- **Audio.** `audioUrl(key)` is a pure function in `domain/` over a bucket base in `config/`: the path derives from the key, so there is no lookup round trip and no provider URL, key or voice id in the client.
- Three tiers: Cache Storage → **bounded** in-memory LRU → network. Object URLs are revoked on eviction, or the leak replaces it. `prefetchManifest(keys)` fires at lesson start and is never awaited, so playback does not wait on it.
- **One app-scoped `HTMLAudioElement`, unlocked on the first tap and reused for every clip**, because iOS ties playback to the gesture-unlocked element. It is held through the E.4 store seam rather than at module scope, so E.2's exception stays at exactly one. Slow is `playbackRate = 0.75` on that element, no second asset.
- The audio module reports failure only; the **screen** decides C9.7's swap to the script counterpart, because the audio module must not know what is graded.

### E.10 Build script (D249, D250, D212)
- `tools/build/` is an orchestrator plus six emitters: `build.mjs` (CLI, orchestration, the single writer) · `tokens.mjs` · `bundle.mjs` (esbuild plus metafile) · `html.mjs` · `manifest.mjs` · `precache.mjs` · `config-hash.mjs`. The token emitter is a module rather than inline code because E.15's contrast gate reads it too.
- It emits: the bundle, `index.html` with hashed refs and the D194 font preload, the PWA manifest from `BRAND`, the generated token CSS, the service-worker precache list, and the E.8 config content hash.
- **One flag, `--base-path`, is the only difference between a production build and a preview build.** It reaches the manifest `scope` and `start_url`, the HTML refs and the service-worker scope, and never becomes a module constant that `domain` or `ui` reads.
- **Service-worker registration is an esbuild `define`, not a runtime `location.pathname` check**, so the preview bundle has no registration call after dead-code elimination. A structural guarantee rather than a conditional one.
- **Declared split points: none.** E.2's mechanism stays and the list is empty. A chunk fetched mid-session on a flaky connection is D180's failure in a new place, and the service worker precaches the shell anyway.
- **esbuild is passed `tsconfig`**, so JSX settings have one source. Two configs that must agree is the same failure class as a hand-bumped config version.
- **The build is a pure function of the tree plus `--base-path`**: no timestamps, no generated ids, hashes from content only. G-BUILD builds twice into separate directories and diffs them; **the first is deployed and the second discarded.** Nondeterminism would churn the E.8 config hash, and a churning hash is the R6 drift D238 exists to stop, so this is the cheapest available protection of the pinning record.

### E.11 Lints and type-check projects (D251, D252, D218, D237)
- **The lints parse; they do not grep.** TypeScript's compiler API for TS and TSX, a small scanner for CSS. A grep is evaded by property access, and — the sharper half — a comment or a string containing `style=` fails a grep lint, and a false positive in a blocking gate is how a gate gets switched off.
- `tools/lint/graph.mjs` builds one import graph from the TS program. Cycles, the layer matrix, unused exports, barrel files, banned imports and the declared split-point list all read that one graph, so a rule is about ten lines.
- **Every finding prints its decision id** (`D216 layer violation: …`). A rule that cannot say what it enforces gets deleted instead of fixed.
- **No suppression comments.** E.2's and E.6's named exceptions are paths in the lint config, reviewable in one file, never annotations at the site.
- Unused-export roots: the build script's entry list, test files, **and `shared/`**, whose Deno consumer the `src/` program cannot see.
- Three `tsc --noEmit` projects: `src/` and `supabase/functions/` in full, and `tools/` as `allowJs` plus `checkJs` over JSDoc covering `tools/build/` and `tools/lint/` only. `tools/dr/` is excluded: twelve modules with 111 passing tests, never shipped, and DR ends. Converting it would gate §E on DR and buy nothing.
- **`tools/lint/` is replaced by ESLint plus typescript-eslint at 600 lines**, excluding tests. D218 made hand-rolled lints the reversible call at "a few hundred lines", which is unmeasurable and therefore never fires.

### E.12 Hosting, CI and previews (D213, D253, D254)
- GitHub Pages, built by GitHub Actions from source. One vendor, no new account, and the deploy configuration is a workflow file in the repo rather than dashboard state — untracked infrastructure is a named harvest failure. Site serves at `/hoopoe/`; a custom domain later is a DNS change.
- **Served source is a `gh-pages` branch**: production at the branch root, previews in `pr-<n>/` directories, deploys as scoped commits. Pages' artifact deploy replaces the whole site, so production and previews cannot coexist in it. This does not reintroduce what D212 removed: those bytes are never on `main`, never a merge source and never reviewed as one tree with source, which is what the drift class requires.
- Workflows: `ci.yml` runs the gates job and the build job on `pull_request` and on push to `main`, then deploys; `cleanup.yml` deletes `pr-<n>/` on PR close, or the branch grows forever.
- **Deploy only when `head.repo.full_name == github.repository`, and on `pull_request`, never `pull_request_target`.** Otherwise a fork PR runs untrusted code holding the `gh-pages` write token.
- Concurrency: per-ref with cancel-in-progress for gates; a single serialized group for `gh-pages` pushes with cancel-in-progress **false**, because it is one branch with many writers.
- Actions pinned by commit SHA, not tag — the same argument as E.1's exact esbuild pin, applied where the supply-chain surface actually is. Node pinned in `.nvmrc`. `npm ci` from a committed lockfile.
- **`npm run gate:*` is the only invocation path.** The workflow calls nothing else, so CI and a cloud session cannot drift in how a gate runs. `npm run gates` runs all seven.
- A PR's preview build **is** G-BUILD, so the preview is the artefact of the gate passing. The preview URL is posted as one comment, updated in place.
- Previews write to the **production** Supabase project. D222's disposable probe table covers the walking skeleton; §G owns it in general.
- The workflow builds static output and never touches the database, so it does not reintroduce the reason Supabase's GitHub integration is disconnected.

### E.13 Generated DB types (D214, D255)
- `tools/db/gen-types.sh` **is** the recorded command — a script that gets run, not prose beside a file that drifts. It writes `src/data/database.types.ts`, committed.
- Generation runs in a cloud session against `pniwgnjljpkiimssortp`. It reaches `api.supabase.com`, which is not on the `hoopoe-dr` Custom network list, so the host and a Supabase access token are a §J prerequisite. There is no local alternative: `--local` needs Docker and `--db-url` needs a different host on a non-HTTPS port.
- Nothing outside `src/data/` sees a generated DB type (E.5).
- **The gate is a reminder, not a proof.** G-DBTYPES fails a PR touching `supabase/migrations/**` without touching the types file; a whitespace touch passes it, and a hand-edited types file still compiles. CI holds no database credentials by design (§G), so this limit is recorded rather than engineered away.
- The walking skeleton (D222) is **not** blocked on it: E.5's parsers take `unknown`, and the generated types are authoring convenience inside `data/`.

### E.14 Assets (D194, D197, D257, D258)
- `assets/src/` holds sources — TTF, mascot SVG, OFL licences — and `assets/build/` holds outputs. Both committed, in separate folders. Outputs are not generated in CI: assets are built rarely and reviewed by eye, and a CI-only build step cannot be debugged.
- `tools/assets/` holds the generators, and **the toolchain is Node-only**: a HarfBuzz wasm subsetter and `@resvg/resvg-js`, not `fonttools`/`pyftsubset`. A Python step would be a fourth runtime against E.2's closed list of three.
- **Fonts** subset by codepoint, retaining layout tables. Arabic shaping runs on GSUB and GPOS, so a glyph subset gives disconnected letters, a broken lam-alef and mispositioned harakaat. `init`, `medi`, `fina`, `rlig` and `mark` retained explicitly. The learning face subsets to the whole Arabic block and drops Latin coverage. Learning face preloaded with `font-display: block`; display face lazy with `swap`. All four families are OFL: licence shipped, original names preserved.
- **The regeneration session emits a shaping trace** — glyph ids and positions for D.13's three strings, a joined word, a lam-alef and a fully vocalised string — to `assets/build/fonts/<family>.shaping.json`, committed beside the font. CI re-runs the same trace and diffs it. A feature-table assertion alone cannot catch mispositioned harakaat, since GPOS present does not mean marks are right.
- **Mascot and icons**: SVG source, rasters generated from it, PWA icons at 192 and 512, a maskable 512 respecting the 40% safe zone, a 180 Apple touch icon. No staleness gate: a stale raster is visible, and eye review is what D197 accepts for these.
- **The build copies and hashes `assets/build/`; it never generates.** The precache list therefore derives from a real directory listing.

### E.15 Gate contract (D218, D237, D250, D251, D256, D257)
Seven gates, closed. §E names each gate and what fails it; §H owns when each runs.

| gate | what runs | fails on |
|---|---|---|
| G-TYPES | `tsc --noEmit`, three projects (E.11) | any type error, `any`, a non-null `!` |
| G-TEST | `node --test` | any failing case |
| G-LINT | `tools/lint/` | any rule below |
| G-BUILD | the build twice, outputs diffed (E.10) | a build error, or a diff between the two builds |
| G-DBTYPES | changed-path check | `supabase/migrations/**` changed and `src/data/database.types.ts` did not |
| G-CONTRAST | ratios computed from the token source | a role below its floor · a semantic token with no role · a component token aliasing a primitive |
| G-FONTRENDER | font tables plus the shaping-trace diff | a missing layout feature · incomplete Arabic coverage · any shaping-trace diff |

G-LINT rules: import cycle · layer violation against E.2's matrix · unused export · barrel file · top-level `let`/`var` in `src/` outside the named exception · empty `catch` or `.catch(() => {})` · `style=` in a component · duplicate CSS selector · colour literal outside the primitive layer · `import()` outside a declared split point · `dataActions` imported outside `data/**` or `ui/app/**` · `@supabase/supabase-js` or `fetch(` outside `data/**` · `localStorage` or `indexedDB` outside the two persistence modules named in the lint config · any `preact/compat` import · **a leading-slash URL literal in `src/`** (E.16) · the config-literal rule: `learner_type ===`, `track ===`, `.learnerType ===`, `switch (learnerType)` and the literals `'heritage'`, `'beginner'`, `'palestinian'` anywhere outside `src/config/`, because a bare grep is evaded by property access.

G-CONTRAST detail: 4.5:1 body, 3:1 large text and any meaningful control boundary, measured against the **lightest** surface token in the declared elevation set, not the base, because elevation is lighter surfaces. **Each semantic token declares a role** — `body-text`, `large-text`, `boundary` or `decorative` — and the gate reads roles rather than a hand-maintained pair list, whose failure mode is a new token silently unchecked. **A token with no role fails**: default-deny is the load-bearing half. **A component-layer token may only alias a semantic token**, or it would carry no role and still not be a colour literal, so nothing would check it.

### E.16 Portability and the native-app path (D259, B6)
The B6 target is a **Capacitor wrapper of the same bundle**, and §E commits to the properties that keep it a wrapper rather than a rewrite, not to the vendor. Four already hold and one is new:
- **No server of ours** (E.2), so there is no backend to port.
- **Single history entry, no URL routing** (E.3). A native shell has no address bar; a hash- or path-routed app needs a routing rewrite. This buys the most.
- **Every platform capability already sits behind a named seam** — storage (E.6), audio (E.9), network (E.5). A wrapper replaces a seam implementation, not call sites.
- **The service worker is a cache only and removable without behaviour change** (E.7). A wrapper ships assets natively and registers none.
- **New: every asset reference in the bundle is relative**, enforced by the G-LINT leading-slash rule. A wrapper serves from `capacitor://localhost`, where one absolute path breaks the app, and it is the only item here that is expensive to retrofit. `--base-path` is build-time and reaches only the manifest, the HTML and the service-worker scope.

Explicitly not done now: no Capacitor dependency, no native project in the repo, no abstraction layer over native APIs. Sign-in on an installed app (Q13) and push notifications are §G and B6, not §E.

### E.17 Owned elsewhere
- **§F**: every record shape §E moves — the outbox payloads, the E.8 pinning column, `loadBootstrap`'s shape as a view, an RPC or N selects, and the D222 `skeleton_probe` table that is dropped when §F lands.
- **§G**: auth, RLS, the two sign-in deep links, the gateway's server side, and preview builds writing to the production project.
- **§H**: when each E.15 gate runs, who deploys edge functions, and the report path E.6's poison entries file through.
- **§J**: the `api.supabase.com` prerequisite for E.13, and enabling Pages on the repo before the first deploy.
- **§I**: the B6 wrapper proof, which E.16 makes cheap and does not itself demonstrate.

### E.18 Principles check
Discharges: none newly — §E is mechanism, and every principle it touches is discharged in §C or §D. What it does discharge is **R6's mitigation** (E.8): the pinning record carries the resolved frozen document, so a `src/config/` edit cannot retroactively redefine a band, a learned word or a quiz outcome for records already written, and the build emits the version hash rather than a person remembering to bump it.
Defers: P1, P2, P3, P4, P12, P13, P15, P16 → §C, untouched by §E · **P5** → C9 and D.12, with E.9 supplying tap-only playback, the single unlocked element and the C9.7 swap decided by the screen rather than by the audio module · **P6** → C4.8 and D.2, with E.4's ownership rule keeping `script_stage` server-canonical so a rung cannot advance on device state · P11, P17, P18 → §C and §D.
At risk: **P7, P8, P9** → E.6's boot overlay. A timed-out boot flush resolves position from server records with pending entries applied as a forward-only local overlay, the single place C1.5's "never device state" is bent, and mastery, intervals and the daily rate limit all read position. Mitigated by its bounds rather than by wording: pending-only, forward-only, discarded the moment the flush lands, and every entry in it is an event already durably queued, so the overlay can only show the position the server is about to hold. Not recorded as a new risk on that basis. **P14 → R8 unchanged**, and **P10 → R7** unchanged, both owned outside §E.

## F to J
Not yet specified.

Owed to §F by DR (D127-D132), recorded here so they are not lost when §F is written:
- `dictionary` columns: `level`, `arabic_vocalised`, `register`, `form_origin`, `track_id`.
- Tables: `formula_pair`, `function_words`, `dictionary_review` (staging, DR-only).
- `dialect_tag` retired; `pos` values `Phrase` and `Expression` retired (D128).
- `rank` retained as historical generation order, no longer a difficulty signal.
- Edit versioning for all of the above remains Q16.

Owed to §F by §D:
- `unit.descriptor_ref` and `plan.target_descriptors`, nullable, unpopulated in MVP (D173).
- Audio-swap standing preference key, defined and unpopulated, no Settings control in MVP (D193).
