# Hoopoe (الهدهد) Project Spec
Status: B, C1 to C11 approved · D to J pending. Learning principles and the section gate: `principles.md`.
Reader: builder (Sonnet 5, Claude Code). Approved sections are binding; do not infer beyond them. `harvest §N` = findings from old code on `modular-rebuild-5`, reference only.

## B. Product

### B1 Vision
Hoopoe gets heritage speakers and beginners speaking everyday Palestinian Arabic through short daily lessons built on proven learning methods, adapting to what each learner already knows and proving progress through scored practice conversations.

### B2 Goal
- Target, all learner types: hold a 5-7 minute everyday conversation in Palestinian Arabic.
- Phase = 90 days, fixed in MVP. The plan record stores its length (`duration_days`) so later phases can differ (roadmap: phase renewal).
- Progress toward target is measured by checkpoint conversations (§C8): soft gates, fluency bands, no pass/fail.
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
MVP users: Marwan and family. Invite-only (§G).

### B5 MVP scope
- Placement, lessons, quizzes, audio
- Focused Study, My Vocabulary review, alphabet and phonics
- Checkpoint conversations (text first)
- Content quality: report-a-problem button; edits via Supabase table editor
- Basic settings: edit goals, adjust plan, harakaat toggle
- Light progress: streak, words learned, phrases learned
- Cost tracking on every Claude call
- Account deletion and export designed into the data model (UI on roadmap)

Build surfaces, not learner-facing, also in MVP scope:
- Authoring pipeline and validator suite (C5.4, C5.5)
- Audio generation script and corpus (C9.4)
- Config resolver, CI gate and `runtime_flag` allowlist (C10.6, C10.7)
- AI gateway, model allowlist and versioned prompt registry (C5.8, C5.10)
- Content tables and the Supabase editor path for edits (C5.11)

### B6 Roadmap (slot designed, not built; proof in §I)
- AI tutor (#1): in-lesson quick help, full page, modes, full learner context, saved history
- Intermediate learners
- Additional tracks: MSA; other dialects as tracks
- Speed Training
- Speaking practice: speech-to-text, later pronunciation feedback
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

### B8 MVP success criteria (4-week family test, both personas represented)
| Test | Pass |
|---|---|
| Works | Every tester completes sign in → placement → lesson with audio → quiz on their own iPhone without help; 0 lost-progress bugs; smoke tests pass on every deploy |
| Used | Median tester does 4+ sessions a week |
| Teaches | Items marked learned are recalled in later reviews at or above the §C6 threshold, read on words learned only (D132); phrases learned is progress feedback, not a success metric; every tester completes checkpoint 1; native reviewer passes sampled lessons for dialect accuracy |
| Affordable | AI and audio cost per active tester per month stays under the §C5 budget |

## C. Learning system

### C1 Journey

#### C1.1 Stages
| # | Stage | Behaviour | Detail |
|---|---|---|---|
| 1 | Invite | Admin allowlists email; invitee receives link | §G |
| 2 | Install + sign in | Link opens in iPhone Safari → one-time Add to Home Screen card → sign in inside installed app. Sign-in precedes onboarding. No guest mode | §G |
| 3 | Onboarding | Name, learner type (C1.3), goals (multi-select + free text). No dialect picker. ≤1 min | C1.3 |
| 4 | Placement | All learner types; config sets length and stop rules | §C2 |
| 5 | Plan reveal | 90-day phase: checkpoint markers, first units from goals | §C3 |
| 6 | First session | Starts directly from plan reveal | §C4 |
| 7 | Daily loop | Home → Today's session → wrap-up → Home | C1.2 |
| 8 | Checkpoint | When due, becomes Today's session | §C8 |
| 9 | Phase end | Final debrief → next 90-day phase starts at the first open after the end date, with current goals; prior plan and debriefs kept. Roadmap renewal flow replaces this step | §C3 |

Side journeys from Home: Focused Study, My Vocab review, Alphabet, Progress, Settings (edit goals, adjust plan, harakaat). All read and write one learner vocab/mastery store.

#### C1.2 Home and Today's session
- One primary action: Today's session. Next action resolves in order: resume unfinished → due checkpoint → next lesson.
- Session: due-review warm-up → new material → quiz → wrap-up. Quiz is mandatory; exit and resume allowed. Composition per §C4, §C6, §C7.
- Pacing: plan paces 1 lesson per day. No daily cap on sessions: after wrap-up the learner can start the next lesson, repeatedly. Catch-up after missed days and working ahead are both allowed. Progress advances by completed lessons; missed days never skip content. Cost is never a pacing lever.
- New material is rate-limited, sessions are not (D63, P9): new item sets are capped per calendar day (config `new_lessons_per_day`, default 3). Beyond the cap, further sessions run in consolidation mode: review, retrieval and quiz on already-introduced items, no new item set. Copy frames this as consolidation, never as a block or a warning.
- Secondary cards: Focused Study, My Vocab review, Alphabet, Progress, Settings. Order and prominence come from learner-type config.
- Script micro-steps are woven into daily sessions when placement `script_stage` calls for them, for any learner type (§C2, D26). Alphabet screen is reference and practice, never a gate.

#### C1.3 Learner type question
"When family speak Palestinian Arabic, you…": understand most / catch some words → heritage config + placement; understand little or none → beginner config. Placement may reassign (§C2). Intermediate is not offered (slot).

#### C1.4 Streak and return
- A day counts when any activity completes in the learner's local day: lesson, review, Focused Study or checkpoint.
- Missed day resets the streak. Copy never shames.
- After 7+ days away (config), the next session opens with a longer review (size per §C6).

#### C1.5 State and connectivity
- Journey position derives from server records, never device state.
- Every answer persists as given. Exit anywhere; resume at the same item on any device.
- Offline or poor connection: answers queue on device and sync on reconnect. New content requires a connection. Mechanism per §E.

#### C1.6 UX rules
- No splash. App opens to Home or the pending stage.
- Every loading, empty and error state has copy and a next action. No whole-app error screen.
- Any wait >3s shows progress copy.
- No roadmap placeholders or "coming soon" cards.
- Report a problem on every content item: lesson item, quiz item, Focused Study card, checkpoint turn.
- No learner-type conditionals in screens; config only (B3).
- Time budget: heritage sign-in to first lesson start ≤15 min including placement.

#### C1.7 Owned elsewhere
- §G: sign-in method on installed iPhone app (magic link opens in Safari, which has separate storage; leaning 6-digit email code).
- §C6: words-learned definition; return-review size.

#### C1.8 Principles check (retro, chat 6 audit, recorded chat 11)
- Discharges: P9 in part (new material rate-limited per calendar day, C1.2, D63), P17 (streak copy never shames, no scores anywhere in the loop, C1.4, C1.6).
- Defers: P1 to P4 → §C4 · P7, P8 → §C6 · P16 → §C2 · P18 → §C8.
- At risk: none. R2 is mitigated here by resume-anywhere (C1.5) and the mandatory quiz (D14).

### C2 Placement

#### C2.1 Purpose and entry
- Every learner type takes placement after onboarding (D20). One engine; learner-type config sets start band, stop rules and copy.
- Beginner run is a warm-up: typically ≤6 items, about 1 min.
- Hard cap 8 min (fits the C1.6 15-min heritage path).
- Starting needs a connection; answers queue offline per C1.5.

#### C2.2 Item bank
- Items come from a pre-built, track-scoped bank. No Claude call at runtime (D22).
- Item: stable id, `dictionary_id`, type, 3 distractor `dictionary_id`s, audio ref, status (active/retired), version.
- Distractors: same `pos` (C5.2 enum), same `level`, different `category`, and never the row's `formula_pair` partner (D130). A pair partner is trivially eliminable by anyone who knows either half.
- Source rows: `review_confidence = 3`, `register = 'neutral'` (D129, D141). Words and short phrases. `review_confidence` is the dictionary review's own 1-3 score (`dr-scoped-pass.md` §3); the legacy generation-time `confidence` column is not a selection signal anywhere. Rows at 1 or 2 are invisible to the bank build until re-review upgrades them in place, which widens the pool without republishing built items.
- Excluded despite being eligible: obligatory formulas at `level` 1 (D130). الحمد لله is known by every learner above absolute beginner, so it discriminates nothing and would inflate the ceiling. Formulas remain level 1 for teaching; they just do not measure.
- Native review before an item goes active. Audio pre-generated (§C9). Built in §J, about 100 items so repeat sets don't repeat items.
- Bands key off dictionary `level` 1-5, added in the dictionary review step (D30), defined in D127: a global ordering by how early a learner needs the item to form and survive Palestinian sentences, not by corpus frequency and not by difficulty. Fallback if `level` is missing at bank build: within-category rank percentile. `rank` is generation batch order and means nothing across categories.

#### C2.3 Item types
| Type | Stimulus | Response | Measures |
|---|---|---|---|
| Listen | Audio only | Pick English meaning (4 options + "I don't know"). If correct: "Could you say this yourself?" Yes / Not yet | Vocab ceiling, production self-rating |
| Script | Arabic with harakaat, no audio | Pick English meaning (4 options + "I don't know") | Script reading |

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

- Audio failure (A3, C9.7): a Listen item whose clip fails is dropped, does not count toward its band set, and the set tops up from the bank. More than 2 failures inside one band pauses placement and resumes later. The C9.7 swap-to-script rule does not apply here. In placement the Listen track is the measuring instrument and the Script track is a separate scored dimension, so a swap would corrupt the ceiling, which drives the plan, the level window and the store seeds.

#### C2.5 Result
- Attempt: learner, track, `attempt_no`, config version, ceiling, listening accuracy, `script_stage`, production ratio (Yes ÷ correct Listen), started/completed timestamps.
- Answer: item id, choice, correct, self-rating, `response_ms`.
- Append-only, never deleted (D28). Schema per §F.
- No grammar, category or vocab-breadth scores (D23).

#### C2.6 Reassignment (D25)
- Beginner with ceiling ≥2 → heritage config. Heritage with ceiling 0 → beginner config. Thresholds are config.
- Applied automatically. Shown at plan reveal (§C3) with one-tap undo back to the onboarding type.

#### C2.7 Consumers
- §C3: first content starts above the ceiling band; production ratio weights production emphasis; plan reveal presents the result.
- §C4, C1.2: `script_stage` sets scaffold start and whether script micro-steps run (D26).
- §C6: correct items seed the vocab store; incorrect and "I don't know" are not added. Seeded words show as "already knew", excluded from words learned. Seed values per §C6 (D27).
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

### C3 Plan

#### C3.1 Shape (D31)
- A plan is an ordered list of units, not a calendar. Progress advances by completed lessons (D15). Dates are display only: `start_date` + `duration_days` (90, D6) give the phase window and checkpoint markers.
- A unit's lesson detail resolves when the unit starts, using mastery at that moment (§C5, §C6).

#### C3.2 Unit catalogue (D32)
- Pre-built, track-scoped, native-reviewed. Building a plan costs no Claude call.
- Unit fields: stable id, title, can-do statement, categories (loaded from dictionary data, never hand-copied into prompts), level range, goal tags, status (active/retired), version.
- Each unit declares its ordered lessons. Each lesson declares 6 dictionary ids: 4 core + 2 extension (D54, §C5.3). Item sets are catalogue data, not a runtime selection.
- The catalogue covers all 46 dictionary categories or marks exclusions explicitly.
- Built in §J. Category names freeze at the end of DR.

#### C3.3 Goals to units (D33)
- Onboarding multi-select options are the catalogue goal tags.
- Free text: one cheap Claude call maps it to tags; output validated against known tag ids; unknown tags dropped. Model and `prompt_version` stored.
- On failure or no match: plan uses the multi-select only, free text kept for lesson flavour (§C5). Never blocks plan reveal.

#### C3.4 Ordering (config defaults)
| Key | Default |
|---|---|
| Core opener | First unless the ceiling already clears it |
| Goal to core ratio | 2 goal-matched units per 1 core unit |
| Level gate | Unit enters only when its minimum level ≤ learner band |
| Outline size | ~90 paced lessons |
| Append | When fewer than 10 lessons remain |
| Lessons per unit | §C4 |
| Category interleaving | No two consecutive units share a primary category unless no alternative exists at the learner's band (D70) |

Working ahead (Q5, D15): units are appended by the same rules. No separate enrichment mode.

#### C3.5 Level window (D35)
- New material comes from band ceiling+1, or band 5 when the ceiling is 5.
- Words at or below the ceiling that placement never tested appear as quick checks inside lessons; a miss reclassifies the word as new material. Format §C4, scoring and band-advance threshold §C6.
- Words the learner missed at or below the ceiling (`known_gaps`, D66) are prioritised into the first units ahead of other ceiling+1 material.

#### C3.6 Skill mix (D36)
- Mix targets across recognition, listening, production, script and culture are config per learner type × plan stage.
- Stage comes from completed lessons: 0-29 / 30-59 / 60+ (config). Never from days.
- Production share scales inversely with the placement production ratio (§C2.5); weight is config, beginner default 0 (recognition-first, harvest §3c).
- Listening share is weighted by placement listening accuracy (D67); weight is config.
- §C4 maps the mix to blocks. Replaces the old phase-ratio table (harvest §3a).

#### C3.7 Phase clock and absence (D37, closes Q5)
- The clock runs continuously. Absence costs calendar time only; content is never skipped.
- Unfinished units carry into the next phase (C3.9).
- Pause is a slot, later implemented as a plan event (break flow, §B6).

#### C3.8 Plan reveal (D38)
1. Starting point in plain words, no score.
2. Learner-type change with one-tap undo (D25).
3. 90-day goal.
4. Checkpoint markers (anchor §C8).
5. Next 3 units.
6. Start first lesson.

Full outline lives in Progress. Undo re-runs the ordering rules locally; no generation wait.

#### C3.9 Adjust plan (D39, Settings)
| Reason | Effect |
|---|---|
| Too easy | Band +1 |
| Too hard | Band −1 |
| Change focus | Edit goals, reorder unstarted units |

- Never changes completed lessons, mastery, streak, `start_date` or checkpoints. A lesson in progress finishes as generated.
- No "start fresh": destructive reset belongs with account deletion and export (§B6).
- Every change appends a plan event.

#### C3.10 Phase end (D40, D18)
- The next phase starts at the first app open after the end date, following the final debrief (§C8).
- New plan row takes current goals and current band. No re-placement.
- Unfinished units carry over. The prior plan becomes read-only; plans and debriefs are kept.

#### C3.11 Records (D41, schema §F)
- Plan: `user_id`, `track_id`, `phase_no`, `start_date`, `duration_days`, config version, goals snapshot, placement attempt id, current band.
- Plan unit: `plan_id`, unit id + version, position, status, started/completed timestamps.
- Plan events, append-only: created, reassigned, undo, adjusted, appended, phase ended, pause (slot).
- Any Claude output on this path stores `model` and `prompt_version`.

#### C3.12 Owned elsewhere
- §C4: lessons per unit, quick-check format.
- §C5: content is pre-generated and shared (C5.1); catalogue item sets per C5.3.
- §C6: band-advance rule, quick-check scoring.
- §J: unit catalogue build.

#### C3.13 Principles check (retro, chat 6 audit, recorded chat 11)
- Discharges: P11 (units are can-do statements, not grammar chapters), P10 (new material at ceiling+1, C3.5), P12 in part (D70 consecutive-category constraint), P16 (ceiling, production ratio and listening accuracy all drive ordering and mix).
- Defers: P1 to P4 → §C4 · P7 to P9 → §C6 · P13 → C5.5.
- At risk: R3 recorded in `principles.md`. Pre-generated content meets a jagged profile through quick checks (D49) and `known_gaps` (D66) rather than bespoke text.

### C4 Lesson

Replaces the 7-block generation model (harvest §3a). Lesson shape only; how content is produced is §C5.

#### C4.1 Unit to lessons (D42)
- 3 lessons per unit. Config `lessons_per_unit`; a unit may declare its own count.
- Arc: L1 introduce · L2 extend + pattern · L3 use (dialogue, recall, the unit's can-do statement).
- A plan unit completes when its lessons complete (status per C3.11). Progress advances by completed lessons (D15).

#### C4.2 Session shape
Order is fixed (C1.2). Quiz is mandatory; exit and resume anywhere (C1.5).

| Segment | Contents | Budget |
|---|---|---|
| Warm-up | Due reviews (§C6) + 1-2 quick checks (C4.9) | ~2 min |
| New material | Item set delivered in chunks of 3: introduce → recognise → recall, then cumulative retrieval across all chunks so far. Max 1 pattern, 1 dialogue, 1 culture note. Script micro-steps when `script_stage` calls (D26) | ~6-8 min |
| Quiz | §C7 | ~2 min |
| Wrap-up | C4.10 | <1 min |

- Target 10-12 min end to end; hard cap is config. The old 15-25 min lesson is retired.
- Activity budget ~8-12 activities, set by config, filled by the allocator in C4.5.
- The budget counts screens, not item-exposures (A2). Item-batched types (cumulative retrieval, dialogue, pattern) carry several items in one activity, which is how a 6-item set reaches the C4.3 exposure floor inside the cap. Counting one activity per item makes the cap and the exposure rule unsatisfiable. Worked example in C4.5.

#### C4.3 Item set (D44)
- Each lesson has one item set, declared in the unit catalogue (D54, C5.3): 6 dictionary ids, 4 core + 2 extension. Beginner config takes core (4), heritage takes all (6). The unit's level does the ceiling+1 work (C3.5); items are not selected at runtime.
- Every new-material activity and every quiz question uses only this set. Review items and quick checks are the only items from outside it.
- Each new item reaches 5 or more exposures across lesson + quiz, in at least 2 modalities (audio, script, production). Exposure count is validated when the lesson is built, not chased at runtime.
- Items are dictionary rows. An activity that needs a word outside the dictionary is a generation failure (§C5), never `[UNVERIFIED]` filler.

#### C4.4 Activity catalogue (D45)

| Activity | Stimulus → response | Graded | Notes |
|---|---|---|---|
| Review | Due item, audio or script → meaning or recall | yes | Warm-up; queue and size §C6 |
| Quick check | Audio or script → pick meaning | yes | C4.9 |
| Introduce | Audio → meaning → script per scaffold | no | First exposure in a chunk |
| Recognise | Audio or script → pick meaning, 4 options | yes | |
| Recall | English → build Arabic from word bank | yes | C4.6 |
| Pattern | Formula + 2 examples built from the item set + 1 practice | yes, local | Absorbs the old conjugation drills |
| Dialogue | 4-6 lines using the item set; learner supplies their role's lines | yes, light | |
| Culture note | Short, tied to one item in the set | no | Max 1 per lesson |
| Script micro-step | Letter or sound work | yes | Runs on `script_stage`, any learner type |

- Activity record: type, item refs, scaffold state, report-a-problem target (C1.6).
- An unknown activity type fails the lesson build. Nothing is silently skipped (harvest: old engine skipped unknown blocks and hardcoded conjugation results correct).

#### C4.5 Skill mix to activities (D50)
- Deterministic allocator, no Claude call: take the mix weights for learner type × plan stage (C3.6), multiply by the activity budget, round, then apply the C4.2 caps and the chunk structure.
- Production weight 0 (beginner default): recall activities render as recognition. The item keeps its exposure count.
- Script weight above 0, or `script_stage` below 2, adds script micro-steps.
- Culture weight resolves to at most one culture note.
- Allocator output is stored with the lesson (C4.11) so a lesson can be reproduced.

Worked example, heritage L2, item set a to f. The target shape for authoring and the reference the C5.5 exposure validator is written against:

| # | Activity | Items carried | Graded exposures |
|---|---|---|---|
| 1 | Introduce, chunk 1 | a b c | 3 |
| 2 | Recognise, chunk 1 | a b c | 3 |
| 3 | Recall, chunk 1 | a b c | 3 |
| 4 | Introduce, chunk 2 | d e f | 3 |
| 5 | Recognise, chunk 2 | d e f | 3 |
| 6 | Cumulative retrieval | a to f | 6 |
| 7 | Pattern | b d f | 3 |
| 8 | Dialogue, 5 lines | a to f | 6 |
| 9 | Culture note | c | 0, not graded |
| — | Quiz (§C7) | a to f + pattern | 7 |

9 activities inside the 8-12 budget. Every item reaches 5 or more graded exposures (a 6, b 7, c 6, d 6, e 5, f 6) across audio, script and production, so C4.3 and the C5.5 modality assertion both hold. Beginner config takes the core 4 and renders recall as recognition (production weight 0); the activity list is unchanged and only the items carried per activity shrink.

#### C4.6 Production (D46)
- Recall and pattern practice use tap-to-build from a word bank: the correct words plus distractors of the same `pos` and `level`, never a `formula_pair` partner (D130).
- Production support ladders with evidence (D68): word bank → word bank with same-pos distractor pressure → typed entry. The step is set by item mastery (§C6) and plan stage (C3.6), config per learner type. The Settings toggle forces typed on early; it never forces it off.
- Typed Arabic grades on normalised Arabic; typed romanization grades against the C4.7 standard with Levenshtein ≤2.
- All lesson grading is local. No Claude call inside a lesson, which keeps the §C5 budget predictable.
- Free production and Claude evaluation belong to checkpoints (§C8). Speaking practice stays on the roadmap (B6).
- Results feed mastery per §C6.

#### C4.7 Romanization standard (D47, closes Q7)
- One standard everywhere: Arabizi digit set. Initial map: `3` ع · `7` ح · `2` hamza · `9` ص · `6` ط · `kh` خ · `gh` غ · `sh` ش · `th` ث · `dh` ذ · long vowels `aa` `ee` `oo`.
- Stored as a data table (`romanization_map`), never as prose in a prompt. The map is frozen at the end of DR.
- Injected into every generation prompt and enforced by a validator that rejects out-of-set characters.
- Dictionary romanization is normalised to the standard during DR. The four competing schemes in the old code (harvest §3a) are retired.

#### C4.8 Scaffolds (D48, D26)

| `script_stage` | Arabic script | Harakaat | Romanization |
|---|---|---|---|
| 0 | shown | shown | shown |
| 1 | shown | shown | on tap |
| 2 | shown | on tap | on tap |

- Applies to every surface that shows Arabic: lessons, quizzes, Focused Study, My Vocabulary, checkpoints.
- The Settings harakaat toggle (B5) overrides display only; it never changes `script_stage`.
- The harakaat rung reads `arabic_vocalised` on the dictionary row, or the line's vocalised field on authored content, added in DR (D103). The same source is the TTS input (§C9.2).
- Audio is always available on tap and never autoplays (C2.8).
- The rule for advancing `script_stage` is §C6.

#### C4.9 Quick checks (D49)
- 1-2 per lesson, in the warm-up, recognition MC on a word at or below the ceiling that placement never tested (C3.5).
- A miss reclassifies the word as new material and queues it into an upcoming lesson of the current unit or the next one. Scoring and the band-advance effect are §C6.
- Quick checks never gate the lesson and never show a score.

#### C4.10 Wrap-up (D51)
- Shows: items practised, items added to vocabulary, streak (C1.4), next action.
- Next action resolves per C1.2: start the next lesson or finish for today. No daily cap (D15).
- No scores, XP or badges (B7). Copy never shames a missed day.
- No mid-lesson difficulty override. "Too easy" and "too hard" are Adjust plan (C3.9).

#### C4.11 Records (D52, schema §F)
- Lesson: `plan_unit_id`, position in unit, item ids, allocator output (activity list with types and scaffold state), config version, status (`not_started` / `in_progress` / `completed`), started and completed timestamps.
- Answer, append-only: lesson id, activity index, item id, response, correct, `response_ms`.
- Any Claude output on this path stores `model` and `prompt_version`.
- Lesson position derives from answer rows on the server, never device state (C1.5).
- `mastered` is not a lesson status. Mastery belongs to the item, §C6.

#### C4.12 Owned elsewhere
- §C5: content strategy (C5.1), generation validators (C5.5), remedial library (C5.6), runtime surface and cost budget (C5.7-C5.9).
- §C6: review queue and size, exposure to mastery mapping, quick-check scoring, `script_stage` advance, words-learned definition.
- §C7: quiz composition, results and retake.
- §C9: audio for items and dialogue lines.

#### C4.13 Principles check (retro, chat 6 audit, recorded chat 11)
- Discharges: P1 (chunks of 3), P2 (cumulative retrieval after each chunk), P3 (5 or more exposures, validated at build, worked example in C4.5), P4 (2 or more modalities per item), P5 (audio precedes script in Introduce), P6 (scaffold ladder keyed to `script_stage`, C4.8), P14 in part (production support ladders on evidence, D68), P17 (wrap-up shows capability, no scores or badges).
- Defers: ladder thresholds → C6.9 · exposure validation → C5.5 · quiz → §C7.
- At risk: none new. R2 unchanged: the build-time exposure count holds only if the learner completes the lesson, which resume-anywhere and the mandatory quiz mitigate.

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

### C6 Mastery

Owns the learner item store, the review scheduler and every "when is this learned" threshold deferred by C1 to C5. Retires the old 0-100 mastery score with +15/−10 deltas and −2/day read-time decay (harvest §2).

#### C6.1 Model (D73)
- One store per learner per track. Every surface reads and writes it: lessons, quizzes, quick checks, Focused Study, My Vocabulary, placement seeds (C1.1).
- Two separate things, never collapsed into one number: strength (box + due date, drives scheduling) and status (what the UI and B8 count).
- No decay. An item that is not due is not weak; overdue age carries the signal decay used to approximate.
- Scheduling is a module with one interface: `next(state, outcome, today) → {box, interval_days, due_on}`. The implementation is swappable; config and `scheduler_version` are stored on every event.

#### C6.2 Item store (D82)
| Field | Notes |
|---|---|
| `dictionary_id` | Nullable: custom My Vocab rows and imports have none |
| `source` | `placement` · `lesson` · `focused_study` · `custom` |
| `status` | `gap` · `active` · `learned` · `suspended` |
| `box`, `interval_days`, `due_on` | `due_on` is a date, never a timestamp (P9) |
| `already_knew` | True for placement and quick-check seeds; excluded from words learned (D27) |
| `lapses`, `last_review_at`, `first_seen_at` | |
| `evidence` | `graded` or `self_rated_only` (C6.11) |

`known_gaps` (D66) is `status = gap`, not a second table. §C3 reads it to prioritise units; an item leaves `gap` when it is introduced as new material.

#### C6.3 Scheduler (D72, D74, closes Q8)
Leitner ladder, binary outcome, config intervals. Chosen over SM-2 and FSRS: all lesson grading is local and binary (D46), so there is no 0-5 quality rating for SM-2, and FSRS needs a review history the app has never collected. Append-only `review_event` rows carry `response_ms` and box transitions, so a later FSRS fit needs no re-collection.

| Box | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| Interval (days) | 1 | 1 | 3 | 7 | 16 | 35 | 90 |

- Correct → box +1, `due_on = today + interval(new box)`, with deterministic ±10% jitter so cohorts of items introduced together do not clump.
- Incorrect → box 1. Second consecutive incorrect → box 0 and a remedial check (C6.10).
- One advance per calendar day maximum (D64, P9). Further correct answers the same day log as exposures and change nothing. This is what stops a heavy session from faking spacing.
- Box 6 items stay in rotation at 90 days. Nothing graduates out of the queue.

#### C6.4 Entering the store (D76)
| Event | Enters as |
|---|---|
| Placement item correct (D27) | box 3 · `already_knew` true · due in 7 days |
| Placement item incorrect at or below ceiling (D66) | `status = gap` · no box · §C3 prioritises into first units |
| Placement item incorrect above ceiling | not stored |
| New item set, on lesson completion | box 1 · due tomorrow · box 0 when the quiz fell below threshold (C7.6) |
| Quick check correct (C4.9) | box 3 · `already_knew` true |
| Quick check miss | `status = gap`, queued into an upcoming lesson of the current or next unit (C4.9) |
| Focused Study phrase | box 1 on session completion |
| My Vocab custom or import | box 1 · `evidence = self_rated_only` |

Quiz misses inside the introducing lesson do not shorten the first interval, which is already 1 day. They set a weakness flag used by C6.6 ordering and C6.9.

A lesson whose quiz falls below the C7.6 threshold (D90) seeds its whole item set at box 0 instead of box 1, and the set carries into the next session's warm-up in full, above the C6.6 ceiling. One extra correct review is then needed before those words can count as learned (C6.12).

#### C6.5 What counts as a review (D75)
- Graded: the warm-up Review activity, quiz questions, quick checks, My Vocab review self-ratings.
- Not graded: introduce steps, culture notes, contextual recycling appearances (D65), dialogue lines the learner did not supply, unscored practice-again attempts (C7.7).
- Unit recall questions in an L3 quiz (C7.2) on an item that is not yet due: a correct answer logs an exposure and does not advance the box; an incorrect answer still lapses it per C6.3. Same asymmetry as consolidation mode (C6.7).

Recycling is exposure, which is what P13 asks of it. It is not evidence of recall and never moves a box.

#### C6.6 Review queue (D77, D71)
- Warm-up budget 8 items, config. Ceiling 14 when due volume overflows; the remainder carries to the next session and is never dropped.
- Order: overdue age descending, then lowest box, then weakness flags from C6.4.
- Interleaving (P12): no more than 3 consecutive queue items from the same unit; the queue draws from at least 2 units whenever 2 have due items.
- Modality follows the skill mix (C3.6): a due item presents as audio recognition, script recognition or recall depending on the mix and the C6.9 ladder step.

#### C6.7 Absence and consolidation (C1.4, D63, D84)
- After 7+ days away, the first session back runs an extended warm-up, ceiling 20, and delivers no new item set. Copy frames it as picking back up, never as a penalty (P17).
- Consolidation mode (beyond `new_lessons_per_day`, D63) pulls due reviews first, then lowest-box not-yet-due items, then items from the last 3 completed units. Not-yet-due items log exposures and do not advance (C6.3).

#### C6.8 Quick checks and band advance (D83, closes C3.5 and C3.12)
- Quick-check scoring is C6.4.
- Band advances automatically when 9 of the last 10 quick checks are correct: band +1, window resets, minimum 10 completed lessons between auto-advances. Every change appends a plan event (C3.11).
- Band never moves down automatically. "Too hard" stays in Adjust plan (C3.9), because a bad week should not strip content the learner has already been given.

#### C6.9 Ladders (D79, D80)
Production step by box, modified by plan stage and learner-type config (C4.6, D68):

| Box | Step |
|---|---|
| 0-2 | Word bank |
| 3-4 | Word bank with same-pos distractor pressure |
| 5+ | Typed entry |

The Settings toggle forces typed on early; it never forces it off.

`script_stage` advance (C4.8, P6), on evidence not preference:
- 0 → 1: rolling accuracy ≥85% over the last 20 script-stimulus graded items, and ≥8 script micro-steps completed.
- 1 → 2: same accuracy bar, plus romanization reveal taps on fewer than 20% of those items. On-tap scaffolds make reliance measurable, so reliance is the evidence.
- Demote one step when rolling accuracy falls below 60% over the last 20.
- Maximum one step change per 7 days in either direction. Every change appends an event.

#### C6.10 Remedial selection (D81, D62)
- Drills declare their own triggers (`trigger_item_ids`, `trigger_pattern_ids`). No dictionary column is needed, so DR is unaffected.
- Trigger: 3 lapses matching one drill's trigger set within 14 days, where a lapse is an incorrect answer on an item at box ≥2.
- Delivery: at most 1 drill per session, inserted into the warm-up, not repeated within 14 days. The counter clears when the drill is passed and the triggering items return to box ≥2.
- If no drill matches the confusion the items stay in rotation. Drills are never generated at runtime (C5.1).

#### C6.11 My Vocabulary and Focused Study (D82)
- My Vocab review grades by self-rating (got it / not yet) and feeds the same scheduler. It is the only surface where a self-rating moves a box.
- Items whose only evidence is self-rating never count toward words learned or the B8 threshold. P7 requires demonstrated recall; a tap is not a demonstration.
- Focused Study writes to the same store, so a phrase met there is reviewed in tomorrow's warm-up. The separate `focused_<scenario>` mastery pool (harvest §2) is retired.

#### C6.12 Words learned and the B8 threshold (D78, closes C1.7)
- Learned = items at box ≥3 with at least one graded correct review at an interval of ≥3 days, and `already_knew` false. Placement and quick-check seeds show as "already knew" and are never counted.
- Counted in two figures, never one (D132). **Words learned** counts single lexemes (`pos` ∈ noun, verb, adjective, adverb, pronoun, preposition, conjunction, particle, interjection). **Phrases learned** counts `pos` ∈ formula, frame. The dictionary is not split; only the counter is (D128, D132).
- A phrase contributes nothing to words learned, ever. Mastering بدي أروح advances that row's box alone; روح receives no credit. There is no decomposition anywhere in §C6, and the D133 constituent declaration is a validator input, not an evidence path. Learning a chunk can be contextual recognition rather than knowledge of its parts, so the parts are never credited.
- B8 reads words learned only. Phrases learned is shown to the learner as progress, and is not a success metric.
- Rationale: with obligatory formulas now core to `level` 1 (D127), a single figure lets a 4-token formula count the same as a noun and can be inflated by formula-heavy units. Two figures are also better progress feedback than one.
- B8 "Teaches" = across the 4-week test, ≥80% of scheduled reviews of learned items are correct on first attempt, with a per-tester floor of 70%. One query over `review_event`; no extra instrumentation.
- Progress shows words learned, streak (C1.4) and items due. No scores, XP or percentages against a target (P17, B7).

#### C6.13 Records (schema §F)
- `learner_item` per C6.2: one row per learner × track × item.
- `review_event`, append-only: item, origin (warm-up · quiz · quick check · focused study · my vocab), correct, self-rated, `response_ms`, box before and after, `scheduler_version`, timestamp.
- `script_stage` changes and band auto-advances append plan events (C3.11).
- Answer rows (C4.11) remain the raw record. `review_event` is the scheduler's own log: derivable, but stored, so the ladder can be replayed after a config change.

#### C6.14 Owned elsewhere
- §C7: quiz composition, results and retake.
- §C8: checkpoint scoring; checkpoints log exposures only and move no boxes (D98).
- §C9: audio for review items.
- §C3: unit ordering from `known_gaps`.
- §F: `learner_item` and `review_event` schemas.

#### C6.15 Principles check
- Discharges: P7 (advancement by box; `mastered` is a property of the item, never of a lesson), P8 (ladder expands on success, contracts on failure), P9 (calendar-day intervals, one advance per day, consolidation exposures do not advance), P12 (queue interleaving constraint), P14 (production ladder keyed to box), P15 (lapse-triggered drills), P6 (`script_stage` advances on measured scaffold reliance), P16 (every placement output now has a consumer: ceiling → C3, `script_stage` → C6.9, production ratio → C3.6, listening accuracy → C3.6, misses → gaps).
- Defers: P18 → §C8.
- At risk: none new. R2 is unchanged; seeding on lesson completion rather than per activity keeps C6.4 consistent with the resume rules (C1.5).

### C7 Quizzes

Owns quiz composition, grading, results and retake. Review scheduling and boxes are §C6. Retires the client-built quiz (harvest §2): unenforced `MIN_QUESTIONS`, fixed English distractor padding, `passed` writing a lesson `mastered` status, and a results screen that promised the next lesson would adapt while nothing triggered it.

#### C7.1 What the quiz is (D85)
- End-of-lesson retrieval check over that lesson's item set (C4.3). Mandatory, exit and resume anywhere (D14, C1.5). Budget ~2 min (C4.2).
- Questions are pre-generated with the lesson and carry stable ids and `content_version` (C5.1, C5.11). No runtime Claude, no client-side question assembly.
- Distractors come from the C5.2 deterministic rule: same `pos`, level ±1, outside the item set, never a `formula_pair` partner.

#### C7.2 Composition (D86)

| Part | Count |
|---|---|
| One question per delivered item-set item | 4 beginner (core) · 6 heritage (core + extension) |
| Pattern question, when the lesson had a pattern activity | 0-1 |
| Unit recall, L3 only: items from the same unit's L1 and L2 sets | 2, catalogue build parameter |

- Built range 6-9, enforced at build on the full heritage set, core plus extension (A1). Delivered range is 4-7 beginner and 6-9 heritage, because a beginner receives 4 item-set questions where heritage receives 6 (C4.3). A lesson outside the built range fails publish. Nothing is sliced at runtime.
- One question per delivered item-set item is load-bearing and is not traded away to hold a lower ceiling: it carries the P3 exposure count, the D87 modality assertion and the C7.6 threshold. The 2 min budget in C4.2 stays a target with the hard cap in config; heritage learners answer recognition questions faster, so the wall-clock gap is smaller than the count gap.
- The unit recall count is a catalogue build parameter, default 2, not runtime config (C10.6). Changing it is a republish.
- Unit recall questions exist so the L3 "use" lesson checks the unit, not only its own set (P2). Checkpoints are 30 days apart; this is the retrieval check in between. They grade as reviews, `origin = quiz`.
- On a not-yet-due unit recall item: correct logs an exposure and does not advance the box; incorrect lapses it per C6.3. Early success is not evidence of retention at interval (P9); early failure is evidence of weakness.

#### C7.3 Question types and modality (D87)
- Types are a subset of the C4.4 activity catalogue, never a second catalogue: Recognise (audio → meaning, or script → meaning), Recall (English → build Arabic), Pattern (apply the lesson's formula).
- Each item's quiz question uses a modality its lesson exposures did not. Declared at build, asserted by the C5.5 exposure validator. P4 then holds by construction rather than by luck.
- Scaffolds follow `script_stage` on every quiz surface (C4.8).

#### C7.4 Production in the quiz (D88)
- Item-set items are not in the store yet at quiz time (they enter on lesson completion, C6.4), so the C6.9 ladder has no box to read. Fresh items are always tap-to-build word bank.
- Unit recall questions read the ladder normally, by box.
- Production weight 0 (beginner default) renders recall as recognition (C4.5); exposure counts are unaffected. The Settings typed toggle still forces typed on (C4.6).

#### C7.5 Grading and feedback (D89)
- Local and binary (D46). Typed Arabic grades on normalised Arabic; typed romanization grades against the C4.7 standard with Levenshtein ≤2.
- Feedback is immediate per question: correct form, audio on tap, bottom sheet with Continue (harvest §7d). No explanation prose in MVP, which keeps the quiz path free of runtime Claude.
- Every answer writes an answer row (C4.11) and a `review_event` (C6.13).

#### C7.6 Results (D90)
Shown after every quiz:
- The count, "5 of 6", stated once. Per lesson only. Never accumulated, never averaged, never surfaced in Progress.
- Every quiz item with its state (got it / needs another look), the correct form, audio on tap.
- The needs-another-look items named as being in tomorrow's warm-up. This is the loop the old results screen faked.
- No pass or fail verdict, and no lesson `mastered` status (C4.11).

Threshold, internal and never rendered:
- `quiz_pass_threshold`, config default 0.7, over first attempts on item-set questions only. Unit recall questions are excluded.
- At or above: the item set enters box 1 (C6.4).
- Below: the lesson still completes. No repeat, no block. The item set enters box 0 and carries into the next session's warm-up in full, above the C6.6 ceiling.

A learner reads progress at three horizons, and the quiz is the smallest of them. It is not aggregated into the other two.

| Horizon | Signal | Owner |
|---|---|---|
| This lesson | Quiz count and per-item states | C7.6 |
| This week | Words learned, phrases learned, items due, streak | C6.12, C1.4 |
| Day 30/60/90 | Checkpoint band and debrief compared to the last one | §C8 |

#### C7.7 Retake (D91)
- Practice again, from the results screen: missed items only, re-asked in a different modality with a fresh distractor draw. Unscored. It logs exposures, moves no boxes, and does not change `quiz_score` or `quiz_outcome`. Repeatable, no cap.
- The scored second chance is tomorrow's warm-up, where those items are due and a correct answer takes box 0 to box 1. Two good review days erase the difference between a strong and a weak quiz.
- No full re-sit that overwrites the result. Re-answering the same questions minutes after the answers were shown measures the answer sheet, not recall, and it would turn the one number in the app into something to grind (P17).
- Resume: exiting mid-quiz preserves answered questions; the learner returns at the first unanswered one, position derived from answer rows on the server (C4.11, C1.5). "Skip for now" is retired (D14).

#### C7.8 Records (D92)
- No quiz table and no quiz blob. Quiz questions are activities in the lesson's allocator output (C4.11); answers are the same append-only answer rows, `origin = quiz`.
- The lesson record gains `quiz_score` (first-attempt fraction on item-set questions) and `quiz_outcome` (`at_or_above` / `below`). Stored for the C6.4 routing and for analysis; the results screen renders the raw count, not a stored percentage.
- Practice-again attempts write answer rows flagged unscored and log exposures only.
- `lesson_progress.quiz_result` JSON (harvest §4a) is retired.

#### C7.9 Owned elsewhere
- §C5: question generation, distractor rule, validators, versioning.
- §C6: boxes, review queue, remedial drill selection, words learned.
- §C8: checkpoints and fluency bands.
- §C9: audio for quiz stimuli and feedback.
- §F: answer and `review_event` schemas, lesson record fields.

#### C7.10 Principles check
- Discharges: P2 (unit-level cumulative retrieval at L3), P3 and P4 (quiz exposures count toward the 5+ and are forced onto a second modality, both validated at build), P7 (a weak quiz delays "learned" through box 0; mastery stays a property of the item), P14 (word-bank floor for fresh items, box ladder for unit recall), P17 (count and item states with no verdict, no accumulation, and unscored practice instead of a grindable re-sit).
- Defers: P18 → §C8.
- At risk: none new. R2 is unchanged; the mandatory quiz is what makes the build-time exposure count real.

### C8 Checkpoints

Owns the 3 per-phase conversations, their scoring, the debrief and the fluency bands. The only surface where the learner produces free language judged as communication (P18, C4.6). Runtime Claude, 1 of the 3 surfaces in C5.7. Retires the `checkpoints` table from harvest §4a: 0 rows, read-only, no writer.

#### C8.1 What a checkpoint is (D93)
- A text conversation with a Palestinian character, scoped to what the learner has completed, followed by a debrief.
- Soft gate: must be attempted, never passed or failed, never blocks lessons or the plan.
- A completed checkpoint counts as a day of activity for the streak (C1.4).

#### C8.2 Anchor and trigger (D93, closes Q12, C1.7 and C3.12)

| Marker | Fires | Budget |
|---|---|---|
| CP1 | earlier of day 30 or lesson 30 | ~2 min, 6 learner turns |
| CP2 | earlier of day 60 or lesson 60 | ~4 min, 10 learner turns |
| CP3 | phase end only: first open on or after day 90 | ~5-7 min, 14 learner turns |

- Neither anchor works alone. The phase clock runs during absence (D37) while content advances by completed lessons (D31), so days alone put an absent learner in a conversation about material never met, and lessons alone mean a tester at 4 sessions a week never reaches CP1 inside the 4-week test B8 requires.
- CP3 is not early-triggerable. C3.10 hangs the next phase on the final debrief, and the 90-day claim in B2 is not evidenced by a debrief written at day 70. Working ahead is already rewarded with more covered units, so a stronger CP3.
- Turn counts are config; minutes are display copy only.
- A due checkpoint takes the Today's session slot (C1.2). "Not now" starts the normal lesson; the checkpoint re-offers at the next session start. If the next marker comes due first, the earlier one is recorded `superseded`.

#### C8.3 Content pack and scenario (D94)
- Assembled server-side from records. The client sends no content, no model and no budget (D58).
- Pack: completed units and their can-do statements, stored items at box >=1 with romanization, band, `script_stage`, goal tags, the `function_words` allowlist, and the previous debrief's work-on list.
- Scenario comes from an authored scenario catalogue keyed to marker and goal tags, built with the unit catalogue in §J. The character is never inventing a context above the learner's level.
- Prompt constraints: stay inside the pooled vocabulary plus at most 10% unknown words; stay in Palestinian dialect; nudge when the learner stalls; land the conversation softly rather than ending on failure. Prompt is a versioned server-side record (C5.10).

#### C8.4 Conversation mechanics (D95)
- Typed free text. No word bank, no distractors, no local grading during the conversation.
- The C4.8 scaffold ladder governs the character's script display only; it never constrains what the learner may type.
- Each character turn is written as a row before it renders, so exit and resume behave exactly as C1.5 requires. Resume returns to the last unanswered turn.
- "I'm stuck" rephrases and simplifies the last character turn, costs a turn from the budget, and is recorded. 3 consecutive stalls trigger the soft landing and the debrief runs on what exists.
- Audio on tap for every character turn, never autoplay (P5). Generation and caching §C9.
- Report a problem on every turn (C1.6).

#### C8.5 Dimensions and bands (D96)
- One evaluation call after the last turn. Bands: emerging / developing / conversational / fluent, per dimension and overall.

| Marker | Scored |
|---|---|
| CP1 | accuracy, vocabulary range |
| CP2 | + spontaneity, elaboration |
| CP3 | all four |

- Elaboration replaces harvest's speed dimension: turn length and unprompted detail. In a typed checkpoint, latency measures typing, not fluency, and it biases against the learner R1 already flags. Latency is stored unscored so speaking practice (B6) can calibrate against it.
- Communicative success is judged first. Spelling, romanization variance and word order that still communicates are never marked as errors (P18).

#### C8.6 Debrief (D97)
- Fixed order: what worked, 2-3 things to work on, band, path to the next band. Compared against the previous debrief from CP2 onward.
- Stored permanently, never overwritten. Rendered in Progress as the Day 30/60/90 horizon (C7.6). No score, no percentage, no pass or fail (P17).

#### C8.7 Mastery interaction (D98, closes C6.14)
- Checkpoints log exposures and move no boxes. A Claude judgement on free text is not the binary outcome the C6.3 ladder is built on.
- The evaluator returns dictionary ids used correctly, which log exposures, and observed confusion ids, which are stored on the debrief row only.
- Confusion ids do not feed the C6.10 remedial counter in MVP. Checkpoints are 30 days apart and the trigger is 3 lapses in 14 days, so a checkpoint can contribute at most 1 lapse to any window and can never fire a drill on its own. Stored, the ids still tell §H which drills to add to the C5.6 library and give the native reviewer something to check transcripts against. Wiring them in later is a two-way door.

#### C8.8 Cost and degrade (D99, C5.7)
- Config caps per checkpoint: max turns, max tokens per turn, 1 evaluation call.
- Turn call fails: 1 retry, then the checkpoint pauses and resumes later. Lessons are unaffected, since a checkpoint never gates them.
- Evaluation call fails, or the hard budget cap hits: the transcript is kept and the debrief renders reduced, bands withheld, items used and confusions listed from local data, retried at the next open.
- No scripted fallback checkpoint. The conversation resumes from server rows, so an outage delays a checkpoint rather than losing one, and B8 asks that CP1 be completed inside 4 weeks, not on a particular day.

#### C8.9 Records (D100, schema §F)
- `checkpoint`: user, track, plan, `phase_no`, marker, anchor fired (day / lesson), status (pending, in_progress, completed, abandoned, superseded), scenario id + version, config version.
- `checkpoint_turn`, append-only: role, text, stall flag, latency ms, `ai_call` id.
- `checkpoint_debrief`: bands per dimension, overall band, narrative sections, item ids used, confusion ids, `model`, `prompt_version`.
- Exposures write `review_event` rows with `origin = checkpoint`, box before and after unchanged (C6.13).

#### C8.10 Owned elsewhere
- §C9: audio for character turns.
- §C5: prompt registry, model policy, `ai_call` metering.
- §F: checkpoint, turn and debrief schemas.
- §H: native review of sampled transcripts; drill library additions.
- §J: scenario catalogue build.

#### C8.11 Principles check
- Discharges: P18 (free production judged as communication, the only such surface in MVP), P16 (goals and band drive the scenario; the previous work-on list drives the next), P17 (bands and prose, no score, no pass or fail).
- Defers: audio → §C9 · scenario catalogue → §J · schemas → §F.
- At risk: new recorded risk R4. Checkpoint language is runtime output, so the C5.5 validators cannot gate it the way they gate lessons and P10 rests on a prompt constraint. Mitigation: authored scenarios, pooled vocabulary in the pack, report-a-problem per turn, native review of sampled transcripts during the family test. R1 unchanged, but D96 narrows its typing bias by dropping latency from scoring.

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
| Frozen | Scheduler intervals and ladder (C6.3), mastery and words-learned thresholds (C6.12), skill mix (C3.6), band advance (C6.8), quiz threshold (C7.6), placement engine rules (C2.4) | Pinned at plan start. A change takes effect at the next phase boundary (C3.10) |
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

Owns Focused Study, My Vocabulary, and Alphabet and phonics: session shape, content source, store interaction and records. §D owns their screens, navigation and copy. Created chat 11 to close the pointers left dangling by C5.7, C6.11 and C9.8 (D122-D125).

#### C11.1 Shared rules (D122)
- Reachable from Home as secondary cards; order and prominence come from learner-type config (C1.2). Never a gate, never part of Today's session resolution.
- All three are track-scoped (C10.3), read the resolved config (C10.6) and introduce no content pipeline of their own. Their content is published through C5.4 like anything else.
- Not level-gated (D135). The C5.5 known-pool ceiling governs the guided path, where the system chooses what the learner meets. These surfaces are learner-chosen, so a learner may study above their band deliberately. The dictionary-ref, romanization, dialect and track validators still apply in full; only the level ceiling is lifted. Items met here enter the store normally and are levelled normally.
- A completed session counts as a day of activity for the streak (C1.4).
- Every item carries report-a-problem (C1.6) and follows the C4.8 scaffold ladder.
- All three write to the one `learner_item` store (C6.1). None has a private mastery pool; the `focused_<scenario>` pool from harvest §2 is retired.
- Audio is the pre-generated word clip wherever the Arabic resolves to a dictionary row, and nothing otherwise (C9.8). No sentence synthesis in MVP.

#### C11.2 Focused Study (D123)
- 6 fixed clusters (Meeting People, Family Gathering, Food & Dining, Getting Around, Daily Life, Expressing Yourself), pre-generated through C5.4 and versioned like any other content (C5.11).
- Session: around 10 phrases from the cluster, delivered through the C4.4 activity catalogue at the learner's scaffold step and production step. Graded locally. No quiz, no unit, no plan effect.
- Store: phrases enter at box 1 on session completion (C6.4), so a phrase met here is due in tomorrow's warm-up.
- Custom topic is the runtime Claude surface named in C5.7, and it is a mapping call only: free text resolves to a cluster or to dictionary categories, output validated against known ids, unknown ids dropped. The session is then assembled deterministically from published assets and dictionary rows.
- No learner-facing prose is generated at runtime here. That is what keeps D53 intact and keeps this surface behind the C5.5 validator gate rather than beside it.
- Cap: config, per user per day, metered as an `ai_call` (C5.9). Degrade: the nearest fixed cluster, stated plainly (C1.6). A custom topic that maps to nothing offers the 6 clusters rather than failing.

#### C11.3 My Vocabulary (D124)
- Rows arrive three ways: saved from a lesson, quiz or checkpoint item; added manually; imported as TSV (harvest: TSV over CSV for Arabic).
- A row that resolves to a dictionary id is an ordinary store item. A custom row has `dictionary_id` null, `source = custom` and `evidence = self_rated_only` (C6.2).
- Review grades by self-rating (got it / not yet) and feeds the same scheduler. This is the only surface where a self-rating moves a box (C6.11).
- `self_rated_only` items never count toward words learned or the B8 threshold (D78). P7 asks for demonstrated recall, and a tap is not a demonstration.
- An item that later appears in a lesson or quiz picks up graded evidence and stops being `self_rated_only`.
- Audio per C11.1. A custom row with no dictionary match is silent, and the card says so rather than presenting a dead control.
- Community pool is a slot (B6): the opt-in flag is stored, with no sharing, no upload and no UI in MVP.

#### C11.4 Alphabet and phonics (D125)
- Reference and practice, never a gate (C1.2, D16). Script instruction proper is woven into lessons as micro-steps keyed to `script_stage` (D26).
- Content is the fixed authored asset set, one per letter and sound (C5.2), published through C5.4.
- Practice items are graded, write answer rows and log `review_event` exposures, and they count toward the micro-step completion requirement in C6.9 (0 to 1 needs 8 or more).
- They do not count toward the rolling 20-item accuracy window that advances `script_stage`. That window stays lesson and quiz evidence, so scaffold fading (P6) rests on performance in real material rather than on repeat practice of a screen the learner can grind.
- Letters already met in lessons are marked. The screen never presents a locked or coming-soon state (C1.6).

#### C11.5 Records (schema §F)
- Focused Study session: user, `track_id`, cluster id and version or the mapped custom topic, `ai_call` id where a mapping call ran, items delivered, started and completed timestamps.
- My Vocabulary rows are `learner_item` rows (C6.2). No second table. `personal_vocab` with its two competing romanization columns (harvest §4a) is retired.
- Alphabet practice writes answer rows and `review_event` with `origin = alphabet`.

#### C11.6 Owned elsewhere
- §C5: cluster and asset generation, the mapping prompt, validators, versioning.
- §C6: boxes, scheduler, words learned, `script_stage` advance.
- §C9: word clips.
- §D: screens, navigation, import UX.
- §F: session and event schemas.

#### C11.7 Principles check
- Discharges: P8 and P12 extended to these surfaces (one store and one scheduler, so a Focused Study phrase interleaves into the ordinary warm-up instead of sitting in a private pool), P7 (self-rated evidence explicitly excluded from learned), P6 (alphabet practice cannot manufacture scaffold-fading evidence), P17 (no scores, no locked states).
- Defers: screens → §D · schemas → §F.
- At risk: none new. R3 unchanged: the custom topic is a mapping call rather than a generation call, so a jagged profile is still met by published content.

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
- Four figures, all C6.12: streak, words learned, phrases learned, items due. No quiz figures, no percentages, no target bars. Each is tappable (D.5).
- Secondary cards carry no badges, counts or new-dots; their order renders from the resolved config list.
- After 7+ days away, one line acknowledging the gap and a sub-line noting the longer warm-up. No re-entry modal.
- Proportions: primary card ~30% of viewport, figure strip one row under 10%, secondary grid starting above the fold.

### D.5 Progress (D164, D165, D166, D167, D168, D198)
- Progress is a history surface. Home answers what to do now; Progress answers what has been built. No primary action, no items-due figure.
- Home's figures deep-link by kind: words and phrases open My Vocabulary filtered to learned items, items due starts a review, streak opens Progress.
- Shows: the two C6.12 counters over time, plan position (phase, units done and remaining, end date), completed units as their can-do statements, streak current and longest as counts, checkpoint history, script rung. Cumulative only, never a rate, never a weekly target, never a comparison. No streak calendar grid: a grid renders every missed day as a visible gap, which breaks C1.4 by layout rather than by copy.
- Mastery internals stay internal: no box numbers, intervals or accuracy percentages. The script rung is the exception, because D.2 already makes it a visible control and C6.9 moves it on the learner's own evidence. Rungs are named for capability: `Reading with full support` · `Reading with harakaat` · `Reading unaided`. Rendered on Progress only, never inside an activity.
- Progress counts, it does not list. Completed units are the only list, and they are the capability ladder.
- Checkpoint history lists past debriefs, each opening read-only in C8.6's fixed order with the CP2 comparison as stored, never recomputed (R6). Archived turns keep audio and the D162 report control. A reduced debrief renders plainly with bands withheld, not as an error.

### D.6 Settings (D169, D170, D171)
- Closed inventory: Adjust plan, harakaat display toggle, typed answers toggle, audio Slow default, sign-out, app version string. Absent, not greyed (C1.6): export and account deletion (§B6), notifications, a general report-a-problem entry (D162 is per item; a record with no item id breaks §H), learner type (set at onboarding, its effects reachable through Adjust plan), TSV import (D.8, where the rows land).
- Settings exposes only keys that are display-only or already eventful. Nothing in Settings can redefine what a learned word, a band or a quiz outcome means (R6). Harakaat and Slow audio are display-only. Band change is eventful and appends a plan event (C3.9). The typed-answers toggle takes effect at the next activity boundary, never mid-screen, and the resolved config version is pinned on every record (D119).
- Adjust plan is a sub-screen. Too easy and too hard confirm with the effect named in capability words, never in level language, and the confirm copy states what is preserved: completed lessons, mastery, streak, checkpoints. Change focus opens goal editing and unstarted-unit reorder in one screen.
- Settings keeps the tab bar throughout. Back goes up one level.

### D.7 The activity frame (D154, D155, D156, D157, D160)
- One frame everywhere a graded activity runs: progress bar and save-and-exit, prompt line, stimulus block, response zone. An activity screen is a stimulus block plus **zero or more** response widgets, because C4.2 counts screens and item-batched types carry several items each.
- Widgets: choice (review, quick check, recognise, script micro-step), build (recall, pattern practice, dialogue turns), type (when the typed toggle is on), reveal (introduce, culture note, pattern examples). An unmapped activity type fails the lesson build rather than being skipped.
- Single-item screens use the bottom feedback sheet. Item-batched screens (dialogue, cumulative retrieval, pattern) resolve each response inline, mark and correct form beside that item, one Continue completing the screen.
- Explicit Continue always; nothing auto-advances. Correct and incorrect both render the correct form with audio on tap. Correct is labelled `Correct`, incorrect `Needs another look` — never a praise word, never a verdict word, and the same vocabulary on the results screen. The state carries a non-colour mark (D189). Motion is a token-duration fade.
- The quiz is the same frame with a different segment label, not a second engine. Segment transitions are one line, never an interstitial. Results: count stated once, every item with state, correct form and audio, needs-another-look items named as tomorrow's warm-up, then practice again and continue. No pass, fail or percentage.
- Stimulus zone scrolls; progress bar and feedback sheet are pinned. At stage 0 an item is three lines and a dialogue six, which is what makes 393×852 work. The progress bar spans the whole session including the quiz and never resets at the segment boundary. Save-and-exit confirms by naming the return point; a mid-quiz exit preserves answered questions.
- Chrome hides whenever a graded activity runs, anywhere in the app. Side surfaces keep the tab bar while browsing; the moment a session, review or practice item starts, this frame takes over.

### D.8 Entry stages and side surfaces (D158, D159, D161, D200-D209)
**Onboarding.** Three screens, one question each, no progress indicator (≤1 min, C1.1). Name, then learner type, then goals. No back out, no skip.
- The learner-type question renders C1.3's wording as two full-width choices with no headline restating it. The words heritage, beginner and intermediate never appear. Nothing promises the answer is final; placement may reassign.
- Goals are multi-select tags plus one optional free-text field on one screen, at least one tag required. The C3.3 mapping call runs after the learner continues, never as a blocking wait. Free text is `dir="auto"`. When the mapping surface is degraded the field is not offered and nothing explains why (D175).
- Hands straight to placement with no interstitial. The last control says what happens next.

**Placement (D158).** The activity frame with feedback suppressed by config, not a second engine: same choice widget, persistent "I don't know", no feedback sheet at all (C2.8). Production self-rating is a second screen after a correct Listen. Band intros are one line, no emoji. Plan reveal is one scrollable screen in the fixed C3.8 order; reassignment is worded as a better starting point with one-tap undo, never as a level change.

**Checkpoint (D159).** A transcript surface, deliberately unlike a lesson. Full screen, no item progress bar; a thin unlabelled bar tracks turns used (C8.2 makes turn counts config, minutes display copy). Named character bubbles with C4.8 script display, audio on tap, report-a-problem per turn. Learner field is free text with `dir="auto"`, no word bank, no grading affordance. "I'm stuck" states that it costs a turn before it is used. Debrief renders C8.6's fixed order, bands as words on a four-step scale, comparison from CP2. A reduced debrief renders plainly with bands withheld.

**Wrap-up (D204, D205, D206).** A screen after results, not the results screen: results closes the quiz, wrap-up closes the day. Three figures — items practised, items added to vocabulary, streak — and one primary action resolving per C1.2. No quiz count, no percentage, no per-item states. At the `new_lessons_per_day` cap the action carries D.4's consolidation copy, identically worded. The streak increments with no celebration, no animation and no mention of days missed; a broken streak shows the new count starting again with no acknowledgement that it broke.

**Focused Study (D160).** The 6 clusters plus a custom topic. A topic that maps to nothing offers the clusters in plain copy, never an error.

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
- Later passes, not gaps: D.11 variety-label strings when DR populates `form_origin`; D.11's out-of-set character list checked against the merged romanization map.

### D.15 Principles check
Discharges: **P5** tap-only audio on every surface, one control with replay, the one hard dependency routed through C9.7 (D.9, D.12) · **P6** reveal resets at the activity boundary so `script_stage` never advances on scaffolded evidence, and the rungs are named for capability (D.2, D.5) · **P17** D.4, D.5, D.8 wrap-up, D.10's zero-due state and D.11's tone rules · **P18** the checkpoint is a transcript surface with a free-text field and no grading affordance (D.8).
Defers: P1, P2, P3, P4, P8, P9, P12, P13 → C4.2, C4.3, §C6, validated at build · P7, P11 → §C6, C3.2, though D.5 now renders both as learner-facing capability · P15, P16 unchanged at D62 and §C2.
At risk: **P10** newly exposed, not newly weakened — D.8's Focused Study, My Vocabulary and TSV import sit outside the level ceiling, which D134's third regime covers deliberately; the dictionary-ref and romanization validators still apply. **P14** → R8: the typed-answer toggle is learner-set, so production-support withdrawal operates inside a ceiling the learner sets.

## E to J
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
