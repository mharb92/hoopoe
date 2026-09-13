# Hoopoe Harvest

Branch `modular-rebuild-5` @ `7dc0b14` (May 1 2026) · live Supabase read Sep 11 2026 · docs treated as claims.
Legend: **H** heritage-only · **B** beginner-only · **S** shared · `file:line` = evidence · ⟶ = rule for rebuild.

## 1. Source inventory

41 files, 26,819 lines (CSS 4,012; JS 22,540). No README, no tests, no migrations, no Edge Function source.

| Path | Lines | Purpose | Verdict |
|---|---|---|---|
| index.html | 31 | Entry; CDN supabase-js + papaparse; fonts Lora/DM Sans/Amiri | carry concept |
| manifest.json | 22 | PWA manifest; icon paths point to non-existent `icons/` | carry concept |
| sw.js | 16 | Push + notificationclick only, no fetch/cache | carry concept |
| icon-192.png / icon-512.png | bin | Byte-identical, both 1075×1083, 2 MB | discard |
| css/styles.css | 4012 | Two competing design systems | carry concept (tokens) |
| js/app.js | 210 | Bootstrap, welcome, post-auth routing, global error screen | carry concept |
| js/router.js | 227 | Switch router, Aya routes, placeholder routes | discard |
| js/state.js | 375 | `AppState`, `load()`, `save()` fan-out, 30s autosync | discard |
| js/storage.js | 33 | localStorage wrapper | discard |
| js/config.js | 13 | URLs, anon key, VAPID public key, model, `AYA_EMAILS`, voice id | carry concept (names only) |
| js/database.js | 780 | All Supabase CRUD, 46 exports | carry as reference code (dictionary query, mastery decay) |
| js/auth.js | 73 | Email-in-localStorage login + guest | discard |
| js/onboarding.js | 198 | name → speaker → goals → dialect → summary | carry concept |
| js/api.js | 40 | Claude wrapper, never imported | discard |
| js/generation.js | 642 | v2 phase plan + lesson gen; legacy unit gen | carry as reference code (prompts, ratios) |
| js/placement-v2.js | 771 | Dictionary-sourced 8×8 placement | carry as reference code |
| js/lesson-engine.js | 585 | 7 block renderers, save/resume | carry as reference code |
| js/quiz-engine.js | 502 | Client-built quiz from lesson blocks | carry as reference code |
| js/focused-study.js | 522 | 6 scenarios + custom topic | carry as reference code (scenario map, split) |
| js/my-vocab.js | 634 | List, add, flip-study, CSV import, pool prompt | carry concept |
| js/ai-tutor.js | 722 | Floating modal + page chat, mastery extraction | carry concept |
| js/home.js | 606 | Home/Progress/Settings tabs, adjust plan | carry concept |
| js/alphabet-screen.js | 166 | Letter grid + 4-form detail + audio | carry concept |
| js/push.js | 339 | Permission, subscribe, time picker | carry concept |
| js/lesson.js | 496 | Legacy TEACH 3 → cumulative PRACTICE → self-assess | carry concept (beginner chunking) |
| js/quiz.js | 356 | Legacy 3-stage script fading quiz | carry concept (fading) |
| js/placement-screen.js | 565 | Legacy static placement | discard |
| js/flashcards.js | 212 | Legacy flashcards over `UNITS`, 3 modes | discard |
| js/vocab.js | 137 | Legacy phrase browser over `UNITS` | discard |
| js/aya.js | 352 | Aya splash, phonics, cultural cards, notes | discard (phonics screen idea → alphabet/phonics) |
| js/data/alphabet.js | 34 | 28 letters × 4 forms + example | carry as reference code (needs content check) |
| js/data/aya-course.js | 187 | `AYA_UNITS`, `PHONICS_DATA`, `CULTURAL_CARDS`, `MARWAN_NOTES` | discard |
| js/data/focused-contexts.js | 91 | Deprecated contexts, not imported | discard |
| js/data/hoopoe-icons.js | 25 (859 KB) | 5 base64 PNG + 3 SVG placeholders | carry concept (extract PNG files) |
| js/data/placement.js | 306 | Legacy static placement questions | discard |
| js/data/units.js | 88 | 1 beginner unit, 12 phrases | discard |
| js/utils/audio.js | 77 | ElevenLabs proxy → Web Speech fallback, Map cache | carry as reference code |
| js/utils/date.js | 15 | June 5 2026 countdown | discard (idea → goal countdown) |
| js/utils/rtl.js | 15 | Auto `dir` on inputs | carry as reference code |
| js/utils/ui.js | 36 | Toast, loading, error | carry concept |

**Remnants and dead code**
- Monolith: sw.js:8 notification URL → `arabic_mastery_app.html`.
- Old-version keys: localStorage `arabic_app_v3`, `arabic_pscores`, `ai_tutor_history` (state.js:102,285-289).
- Unused files: api.js, data/focused-contexts.js. Placeholder routes `unit-overview`, `enrichment` (router.js:144-149); `speed-training` card is a no-op (home.js:560).
- Dead exports (not imported anywhere): `callClaude`, `evaluatePlacement` (api.js); `initApp`, `handleAppError` (app.js); `AYA_EMAILS`, `APP_VERSION` (config.js); `generateLesson`*, `generatePostPlacement`, `generateNextLesson`, `prefetchNextUnit`, `getMasteryContext` (generation.js; *used internally only); `loadPhrasesMastery`, `getDictionaryCategories`, `queryDictionaryByCategory`, `loadPhasePlan`, `loadLessonProgress` (database.js); `checkVocabDuplicate`, `saveWordToVocab`, `handleCSVImport` (my-vocab.js); `renderPushSettings` (push.js); `reset`, `getUser`, `isAya`, `hasCompletedPlacement`, `startAutoSync`, `stopAutoSync` (state.js); `getCurrentRoute` (router.js); `isArabic` (rtl.js).
- Written, never read: `AppState.dynamicUnits` (generation.js:449-450), `interleavingConfig`, `productionProgress`, `stats` (state.js only), `preferences.harakat_enabled` / `audio_autoplay` (home.js:569,579).
- Duplicated helpers: `levenshtein` ×3, `shuffleArray` ×2, local `playAudio` ×3, `escapeAttr` ×2 (lesson-engine, quiz-engine, placement-v2).
- ⟶ One implementation per helper in a shared module; lint for unused exports in CI.

## 2. Implemented requirements

### Auth · S
- Identity = email typed into a field, stored in localStorage `arabic_app_email`, no verification (auth.js:39-45). `user.id` = email (state.js:115).
- Guest = `guest@app.com`, localStorage only (auth.js:60-64, state.js:98-106).
- On login `special_courses` looked up by email → `isAya` (auth.js:50-54). `AYA_EMAILS` exists in client config (config.js:8) but is unused.
- `load()` runs at startup and again after auth (app.js:22,135).
- Any unhandled promise rejection replaces the whole app with an error screen (app.js:187-193).
- ⟶ Real auth provider, UUID owner, errors handled per feature.

### Onboarding · S
- Welcome splash 2s, once per device (app.js:34-37,125-127).
- Steps: name → speaker type (`heritage` / `beginner` / `intermediate`) → goals (family, travel, culture, work, heritage, other + free text) → dialect (palestinian, levantine, egyptian, gulf, other) → summary (onboarding.js:9,63-71,93-101,134-141).
- Complete when `name && speaker_type && goals.length > 0` (app.js:75-84).
- Dialect is stored but only feeds legacy unit gen (generation.js:466); v2 hardcodes Palestinian (generation.js:32-34).
- `intermediate` routes to legacy placement and lessons (home.js:541-552).

### Placement v2 · H
- Beginners and Aya skip placement; others see it until a score exists (home.js:62-66). Heritage → v2, everyone else → legacy (home.js:547-553).
- 8 rounds × 8 questions; advance at ≥5/8; stop on fail or after round 8 (placement-v2.js:16-18,470-474).
- Round categories fixed per round (placement-v2.js:21-31). Rank limits 200 → 2728 (:33) only apply if the primary query returns <8 entries (:140-143), because primary categories ignore rank (database.js:428-433). **Difficulty curve is not enforced.**
- Question slots per round: 4 recognition, 1 production, 1 grammar_intuition, 1 listening, 1 script_comfort (placement-v2.js:36). Grammar falls back to recognition when the entry has no `conjugation` (:190-198). script_comfort = same Arabic→English MC as recognition (:219-224).
- Distractors: 3 English glosses from the same pool (:231-243).
- Typed eval: strip harakat (U+064B–065F, U+0670); exact Arabic, or romanization with Levenshtein ≤2 (:407-423).
- Scores: each dimension = round(correct/total × 5); `vocab_breadth` = count of categories >50% correct, unbounded (:540-559). 8 level labels (:566). `mapCeilingToLevel`: ≤2→0, ≤4→1, 5→2, ≤7→3, 8→4 (:581-587).
- Resume via localStorage `arabic_placement_v2_state` (:69-80,699-706). Guard if already placed (:69); retake deletes profile (:688).
- All tested words → `personal_vocab` at mastery 80 (correct) / 20 (wrong), source `placement_v2` (:520-530).
- Result writes camelCase + `placement_profile` into profile (:511-514); those columns don't exist, so the profile upsert fails (see 4).

### Home · S (conditionals)
- Cards: My Vocab, Focused Study for all; Alphabet for beginners (Phonics for Aya); Speed Training "coming soon" otherwise; AI Tutor for all (home.js:99-112).
- Continue → `lesson-v2` if heritage, else legacy `lesson` (home.js:541-543).
- Progress tab (H): day in phase = ceil(days since `start_date`); week = min(ceil(day/7), 4); display capped at 30 (home.js:241-245,304).
- Adjust plan (H): 4 reasons `too_easy`, `too_hard`, `different_focus` (+text), `start_fresh` (home.js:360-369) → `generatePhasePlan` with performance hardcoded to zeros (home.js:448-460). Doesn't set `revised` or `revision_history`; resets `start_date` (generation.js:153-160).
- Settings: harakat toggle default on, audio autoplay default off (home.js:513-517). Neither is read anywhere.
- No streak or words-learned counter exists in code.

### Lesson v2 · H
- Current lesson = latest `lesson_progress` row with status `not_started` / `in_progress` by `created_at` (database.js:608-620).
- Status → `in_progress` on open (lesson-engine.js:34-38); progress saved after every block (:419-442) and on exit (:483-491).
- Unknown block type is skipped (:104-107).
- Phrase block → `personal_vocab` mastery 15, source `lesson_v2` (:493-503).
- Pattern practice and production graded locally: normalised exact Arabic or romanization Levenshtein ≤2 (:505-527). No Claude evaluation.
- Conjugation drills tap-to-reveal, results hardcoded true (:247). Dialogue `practice_role` not used, `role_play_attempted: false` (:289). Listening auto-plays after 500 ms (:336).
- Finish → `completed`; quiz optional via "Skip for now" (:444-481).
- No lesson → "generate" → full `renderGenerationScreen` (new phase plan + day-1 lesson) (:564-585). **`generateNextLesson` is never called.**
- Generation (generation.js:176-331): 8 target blocks × phase ratios, min 1 phrase (:208-214). Rank threshold `RANK_THRESHOLDS[min(ceiling_round, 4)]` = {0/1: 500, 2: 1000, 3: 2000, 4+: 2728} (:30,187), so ceiling round ≥4 gets the full dictionary. Mastery context: 20 mastered, 15 reinforcing, 10 weak (:225-228). Lesson id = `lesson_<YYYY-MM-DD>_<email prefix>` (:230): one per day, later ones overwrite.
- Remedial rule (unreachable): last completed quiz `passed === false` → remedial with `weak_areas` (:371-377). Day in phase clamped 1-30 (:363-366).

### Quiz v2 · H
- `PASS_THRESHOLD` 0.7, `MIN_QUESTIONS` 5, `MAX_QUESTIONS` 7 (quiz-engine.js:11-13). Min not enforced: `slice` returns fewer if fewer blocks (:123-124).
- Question per block: phrase → MC; pattern → typed; conjugation → typed (first drill); listening → MC audio; production → typed. Dialogue and culture produce none (:47-118).
- MC distractors from lesson glosses, padded with fixed English words (:125-142).
- Every answer → `updateMasteryWithReview(source 'quiz_v2')` (:328-346).
- Pass → `mastered`; fail → `completed` + `weak_areas` (:380-410). Results screen promises next lesson adapts (:412-440); nothing triggers it.

### Mastery · S
- Delta +15 / −10; `ai_tutor` +5 / 0; clamp 0-100 (database.js:678-690).
- Matches on `email + arabic` only (unique key includes `english`); update-only, never inserts (:681-707).
- Decay −2/day at read time; missing `last_reviewed` = 30 days (:728-733). Buckets >80 mastered, 30-80 reinforcing, <30 weak (:736-738). Lesson prompt says "30-60 reinforce" (generation.js P3).
- No scheduled reviews; no interval table.

### Focused Study · S
- 6 scenarios with category lists (focused-study.js:20-63) + `Common Verbs`, `Prepositions` always added as related (:17).
- Rank threshold: placement ceiling ≤2→500, ≤4→1000, ≤6→2000, else 2728; legacy level fallback (:71-89).
- Session split by past sessions for scenario: 0 → 10 new; 1-3 → 7 new + 3 review; 4+ → 5 + 5; unused review slots become new (:91-97,200). Past count always 0 because inserts fail (see 4).
- Review = lowest mastery rows with source `focused_<scenario>` (database.js:766-777).
- Prompt pool = first 60 rank-ordered entries (:212,302). Custom topic: Claude maps to 3-6 primary + 1-3 related categories (:273), fixed 10 phrases (:308), id slug ≤30 chars (:321).
- Generated phrases saved at mastery 0 (:393-403). Shape `{ar, rom, en, context}` differs from lesson shape.

### My Vocabulary · S
- Pool opt-in modal once per device, **non-beginners only** (my-vocab.js:31-35).
- Study mode = prev/next flip, no grading, no mastery update (:394-449).
- CSV import via papaparse, rows need `arabic` + `english` (:502-505). Delete by id + email (database.js:112-117).

### Alphabet / phonics · B (card), route open to all
- 28 letters, each with name, transliteration, 4 positional forms, example word (data/alphabet.js). Detail view with audio (alphabet-screen.js:69-120).
- Phonics exists only inside Aya's course (aya.js:197, data/aya-course.js:113).

### Audio · S
- `speakArabic`: POST `{text, voice_id}` to `ELEVENLABS_FUNCTION_URL`, no auth header (utils/audio.js:27-35). Non-OK or throw → Web Speech `ar-SA`, rate 0.75 (:38-47,70-77).
- Cache = unbounded in-memory Map of blobs, lost on reload (:9,45).
- v2 placement, lesson and quiz bypass it with their own Web Speech calls (placement-v2.js:708, lesson-engine.js:529, quiz-engine.js:458).

### AI tutor · S
- Floating 💬 button appended to `<body>` on every screen (ai-tutor.js:33-51).
- Each call sends system prompt + **latest message only** (:452-466). History persisted to `ai_tutor_sessions`, one row per email (database.js:176-186).
- Extraction on close: ≥4 messages, 5-min cooldown, ≤30 items, silent failure, toast (ai-tutor.js:268-269,315-325).

### Persistence · S
- `save()` writes localStorage then sequentially upserts profile, every unit_progress row, weak_words, placement results, tutor history, preferences, stats, production progress, interleaving config (state.js:194-256). Called after most actions and every 30s (state.js:327-332).
- `beforeunload` writes localStorage only (state.js:357-372).
- ⟶ Persist per domain action with explicit writes; no whole-state sync.

### Legacy beginner engine · B (removed in rebuild, concepts only)
- Lesson: TEACH 3 phrases → PRACTICE cumulative → next 3 → self-assessment low/medium/high (lesson.js:3,50,206-210,370-414).
- Quiz: Stage 1 harakaat + romanization 75%; Stage 2 harakaat only 75%; Stage 3 bare script 80% × 2 consecutive (quiz.js:2-5,253-274).

## 3. Pedagogy

### 3a. As implemented

**Placement (H)** — see 2. Dictionary-sourced, 8 fixed category sets escalating from Greetings/Pronouns/Numbers to Idioms/Slang/Sentence Patterns; 6 dimensions (recognition, production, grammar_intuition, script_comfort, listening, vocab_breadth) + `category_scores` + `tested_items`. No Claude call.

**Phase plan (H)** — 3 phases × 30 days × 4 weeks. One Claude call per phase (P2). Each week: theme, skills, primary/related categories (must match the 46 dictionary names), target patterns, heritage notes. Content ratios by phase (generation.js:24-28):

| Phase | phrases | patterns | dialogues | conjugation | production | culture |
|---|---|---|---|---|---|---|
| 1 | .30 | .30 | .15 | .10 | .10 | .05 |
| 2 | .20 | .25 | .25 | .10 | .15 | .05 |
| 3 | .10 | .15 | .35 | .05 | .30 | .05 |

Only phase 1 is ever generated; nothing advances phases.

**Lesson blocks (H)** — 7 types, one Claude call per lesson (P3), ~8 blocks, 15-25 min, vocabulary constrained to a dictionary pool with `[UNVERIFIED]` marking:

| Block | Fields | Interaction | Graded |
|---|---|---|---|
| phrase | arabic, romanization, english, audio_text, context, dictionary_ref | read + audio | no |
| pattern | pattern_name, formula, 3 examples, practice_prompt/answer | typed practice | local fuzzy |
| conjugation | verb_base, root, forms (past/present per pronoun), drill_prompts | tap-to-reveal | hardcoded true |
| dialogue | title, 4-6 lines, practice_role | read | no |
| culture_note | title, content | read | no |
| listening | audio_text, 3 options | MC | yes |
| production | prompt_english, 1-3 acceptable_answers, evaluation_notes | typed | local fuzzy |

**Quiz types (H)** — MC (Arabic → English), typed (pattern / drill / production), listening MC. Built client-side from blocks, 70% gate.

**Mastery (S)** — word score 0-100 with ±deltas and read-time decay; lesson status `not_started → in_progress → completed → mastered`. No spaced-repetition intervals, no due dates, no review queue. "Interleaving" exists only as `interleaving_config` defaults (`enabled:false`, `threshold_lessons:5`, `threshold_mastery:0.65`, mix ratio columns) written by `save()` and never read (state.js:173,254).

**Focused Study clusters (S)**

| Scenario | Primary categories |
|---|---|
| Meeting People | Greetings, Farewells, Politeness, Question Words, Pronouns, Conversational Fillers |
| Family Gathering | Family, Emotions, Blessings & Wishes, Culture & Customs, Personality, Religion |
| Food & Dining | Food & Drink, Cooking, Money & Shopping, Politeness, Numbers |
| Getting Around | Transportation, Directions, City & Places, Motion Verbs, Numbers, Time |
| Daily Life | Daily Routine Verbs, Household, Clothing, Body, Health & Medical, Days & Months |
| Expressing Yourself | Emotions, Adjectives (Abstract), Adjectives (Physical), Exclamations, Idioms & Expressions, Slang |
| Custom | Claude-mapped 3-6 primary + 1-3 related |

All add `Common Verbs`, `Prepositions`. 12 of 46 categories appear in no scenario: Adverbs, Animals, Colors, Communication, Conjunctions, Connectors & Discourse, Education, Nature & Weather, Particles, Professions, Sentence Patterns, Technology.

**Alphabet / phonics** — `ALPHABET_DATA`: 28 letters × {name, transliteration, isolated/initial/medial/final, example word + meaning}; no hamza, taa marbuta, harakaat, or sun/moon letters. Phonics (Aya only): 5 sounds ع ح خ ق ر, each with description, example, tip (data/aya-course.js:113-146).

**Romanization** — four schemes in use: P1 (`3`=ع, `7`=ح, ق=`'`, aa/ee/oo); P6 (`2/3/7/9`); alphabet.js (`ḥ`); Aya phonics (`'ayn`, `hubb`). Dictionary scheme not audited.
⟶ One romanization spec, stored as data, injected into every prompt and validator.

**Legacy beginner pedagogy (B, worth carrying)** — 3-item chunks with cumulative retrieval and self-rated confidence (lesson.js); script fading across 3 stages with rising thresholds (quiz.js).

### 3b. Designed, never built

| Item | Design intent | Source | Status |
|---|---|---|---|
| Checkpoint conversations | Day 30/60/90 (or early via enrichment); 2 / 4 / 5-7 min; soft gate, must attempt, no pass/fail; Claude plays a Palestinian character tailored to goals, stays in dialect, nudges, soft landing if stuck; debrief order: what worked → 2-3 things to work on → fluency band (emerging / developing / conversational / fluent) → (Day 60+) speed → path to next band; debriefs saved permanently and compared to previous | https://claude.ai/chat/e99b8e2a-91db-4212-ada6-c9163f7b3406 | proposed by Claude, approved by Marwan ("I like this all") |
| Checkpoint dimensions | Day 30 accuracy + vocab; Day 60 adds spontaneity + speed; Day 90 all four | same | proposed by Claude |
| Enrichment mode | When content runs out before checkpoint: interleaved review, daily i+1 reading, daily output prompt, early checkpoint unlock | same | proposed by Claude |
| Speed / fluency | Silent latency tracking from Phase 1; shown in Phase 2; timed flashcards from 8s tightening; hot streak = 5 fast correct; phrase-level prompts later | same | proposed by Claude |
| Speed Training | Pimsleur graduated-interval oral recall | same; https://claude.ai/chat/fb0b70fe-e370-4245-b602-86a6cca7cd31 | proposed by Claude; on Marwan's backlog |
| Speaking practice | Layer 1 typed output evaluated by Claude → Layer 2 Web Speech STT → Layer 3 pronunciation analysis later | e99b8e2a | proposed by Claude, no decision found |
| In-session repetition | 3 new items at a time, cumulative review, 5-7 exposures (Nation), audio-first, blocking for beginners / interleaving for intermediate+ | fb0b70fe | proposed by Claude (partly built in legacy lesson.js) |
| Phase length | Fixed 90-day phase, then renewal where user picks next duration and goals | e99b8e2a | decided by Marwan |
| Renewal flow | 7 screens: celebration → pace reflection → evolved goals → duration (30/60/90/180) + daily time → proposed milestones with "redo from feedback" → generating → ready | e99b8e2a | proposed by Claude, HTML mockup built |
| Break flow | Duration (few days / 1-2 wks / month+), soft reminder, no streak guilt, 5-question weak-word refresher after 3+ weeks | e99b8e2a | proposed by Claude |
| Production eval | Pattern = local fuzzy; production = Claude correct/partial/incorrect + explanation | consolidated_handover.md §4 | designed, not built |
| Mid-lesson "too easy" override | Deferred; feedback feeds next generation | handover §4 | deferred |

### 3c. What beginners need that the v2 engine lacks

| Need | v2 today | Evidence |
|---|---|---|
| Entry without placement | Lesson path requires `placement_profile`; beginners routed to legacy | home.js:62-66,541-543 |
| Learner-type-neutral prompts | P1 hardcodes heritage context ("don't waste time teaching vocabulary they already recognize"); P2/P3 say "heritage learner" | generation.js:59-63,102,232 |
| Script before script-dependent tasks | No link between alphabet/phonics and lessons; blocks assume reading Arabic | alphabet-screen.js standalone |
| Scaffold fading (romanization → harakaat → bare script) | Romanization always shown; harakat toggle unused | home.js:569; legacy quiz.js:2-5 |
| Small chunks, repeated exposure | Each item appears once in lesson + maybe once in quiz | lesson-engine.js; legacy lesson.js:50,206 |
| Recognition-first ratios | Phase 1 ratios push production for heritage | generation.js:25 |
| Lower starting vocab band | Minimum rank threshold 500 | generation.js:30 |
| Explicit, simple grammar explanation | Prompt asks for intuition-based grammar ("you already say هاد") | generation.js:62 |
| Scheduled review | No interval scheduling or review queue | database.js:713-740 |
| Dialect-accurate audio | Web Speech `ar-SA` only | lesson-engine.js:529 |
| Phonics content | 5 sounds, Aya-only | data/aya-course.js:113 |

⟶ Learner type is config (ratios, thresholds, scaffolds, prompt fragments) consumed by one engine, never an `if (speaker_type)` in features.

## 4. Data model

OpenAPI schema endpoint is blocked for the anon key (401). Columns below are **sampled** (keys of a real row) or **probed** (`select=<col>&limit=0` returned 200; list covers only names tried, so a table may have more). No values were read except dictionary aggregates.

### 4a. Tables (17 live = 17 referenced)

| Table | Rows | Scope key | Columns | Code-vs-schema |
|---|---|---|---|---|
| profiles | 4 | `email` | sampled: email, name, speaker_type, dialect, goals, placement_level, placement_score, vocab_pool_opt_in, placement_rounds_completed, placement_date, push_enabled, push_time, custom_goals, created_at, updated_at | Upsert spreads whole `AppState.profile` (database.js:19). Code writes `placement_profile` (no column at all), `placementLevel`, `placementRoundsCompleted`, `placementDate` (placement-v2.js:511-514), `pushEnabled`, `pushTime` (push.js:219-220), `customGoals` (onboarding.js:122), `vocabPoolOptIn` (my-vocab.js pool modal) → whole upsert rejected, logged only (database.js:20) |
| personal_vocab | 20 | `email`; unique (email, arabic, english) per docs | sampled: id, email, arabic, romanization, transliteration, english, notes, context, source, shared_to_pool, mastery_score, is_dialect, is_msa, last_reviewed, created_at, updated_at | Handover Bug 2 fixed (transliteration, source exist). Two romanization columns. Mastery update ignores `english` (database.js:681-701) |
| dictionary | 2,728 | global | sampled: id, rank, arabic, romanization, english, pos, category, root, conjugation, gender, dialect_tag, notes, confidence, created_at | No track/dialect/version column (probed `track`, `dialect`, `updated_at` absent) |
| special_courses | 4 | `email` | sampled: email, config, created_at | Bespoke course gate; removed in rebuild |
| ai_tutor_sessions | 4 | `email` (one row, overwritten) | sampled: id, email, messages, created_at, updated_at | Full transcripts, publicly readable |
| production_progress | 4 | `email` | sampled: email, current_stage, unlocked_at, lessons_in_stage, ready_for_next, created_at, updated_at | Defaults written by `save()`, no consumer |
| interleaving_config | 4 | `email` | sampled: email, enabled, threshold_lessons, threshold_mastery, mix_ratio_new, mix_ratio_weak, mix_ratio_strong, last_interleaved_lesson, created_at, updated_at | Defaults written by `save()`, no consumer |
| phase_plans | 0 | `user_email` + `phase_id` | probed: id, phase_id, phase_number, user_email, start_date, end_date, day_90_goal, content_ratios, weeks, revised, revision_history, generated_at, created_at | Shapes match; zero rows = v2 never persisted for any user (or cleared) |
| lesson_progress | 0 | `user_email` + `lesson_id` | probed: id, lesson_id, user_email, phase_id, week, day_in_phase, theme, estimated_minutes, is_remedial, remedial_context, lesson_content, status, current_block_index, block_results, quiz_result, started_at, completed_at, created_at; no `updated_at` | `lesson_id` = date + email prefix (generation.js:230) |
| focused_sessions | 0 | `email` | probed: id, email, completed_at, scenario; no created_at | Insert adds `contextName`, `isCustom`, `phrasesCount`, `timestamp` (focused-study.js:412-418) → fails |
| push_subscriptions | 0 | `email` | probed: email, subscription, preferred_time, timezone, created_at, updated_at | Code sends `preferredTime` (push.js:214) → fails |
| unit_progress | 0 | `email` + `unit_id` | probed: email, unit_id, stage, consec, mastered, updated_at | Legacy writes `lastReviewed` (lesson.js:439-443), no such column → fails |
| checkpoints | 0 | `email` | probed: id, email, created_at, checkpoint_type, data | Read only (database.js:72-77); no writer |
| weak_words | 0 | `email` | probed: email, words, updated_at | Legacy only |
| placement_test_results | 0 | `email` | probed: id, email, level, score, test_data, completed_at | v2 placement never writes it |
| user_preferences | 0 | `email` | probed: email, harakat_enabled, audio_autoplay, theme, created_at, updated_at | Written only when toggled; values never read |
| user_stats | 0 | `email` | probed: email, current_streak, longest_streak, last_study_date, achievements, created_at, updated_at | No writer anywhere |

### 4b. One-way-door findings

| Door | Finding | Evidence | ⟶ Rule |
|---|---|---|---|
| Identity | Email is the user id; unverified; two column names (`email`, `user_email`); typing someone's email loads their data | state.js:115, auth.js:39-45, database.js:496-620 | Supabase Auth, `user_id uuid` FK on every user-owned row |
| Scoping | No track or course key on vocab, plans, lessons, sessions, placement; dictionary has no dialect/track column | 4a | `track_id` on every learner-progress row and on content, defaulting to Palestinian |
| Ownership / access | RLS disabled; anon key read confirmed on all 17 tables incl. transcripts and course configs; feature gating by email in client | config.js:2,8; live reads | RLS on day one, policies per table, no client-side role lists |
| Timestamps | Inconsistent `created_at` / `updated_at` (lesson_progress lacks updated_at; focused_sessions, unit_progress, weak_words lack created_at) | 4a | Both timestamps on every table via migration template |
| Versioning | Generated plans/lessons store no model, prompt version, or dictionary version; no migrations in repo | generation.js:150-160,303-318 | `model`, `prompt_version`, `content_version` on generated rows; versioned SQL migrations in repo |
| Contracts | Row shape = whatever `AppState` holds, spread into upserts | database.js:19,35,213,246,279,312 | Typed row mappers + validation at the boundary |
| Deletability / export | One user spans 16 email-keyed tables with no FK/cascade, plus localStorage copies (`arabic_app_v3`, placement state) and generated JSON blobs | state.js:176-189 | All user data reachable from `user_id` with `on delete cascade`; export = one query per owned table |
| Uniqueness | `onConflict: 'email'` assumes unique constraints that aren't visible in repo | database.js:19-318 | Constraints declared in migrations, not assumed by client |

### 4c. Dictionary

- **Schema:** `id` (serial PK), `rank` (1-2728, unique, no gaps), `arabic`, `romanization`, `english`, `pos`, `category`, `root`, `conjugation`, `gender`, `dialect_tag`, `notes`, `confidence`, `created_at`.
- **Rows:** 2,728.
- **dialect_tag:** D 1,277 · M 1,119 · S 210 · SL 63 · MSA 50 · D-var 9.
- **confidence:** 5 = 2,422 · 4 = 272 · 3 = 34 (none <3).
- **pos:** Noun 979 · Phrase 879 · Verb 352 · Adjective 235 · Expression 87 · Adverb 71 · Pronoun 31 · Preposition 30 · Conjunction 30 · Particle 20 · Interjection 14.
- **Categories (46):** Adjectives (Abstract) 128 · Adjectives (Physical) 43 · Adverbs 40 · Animals 33 · Blessings & Wishes 89 · Body 36 · City & Places 75 · Clothing 31 · Colors 20 · Common Verbs 196 · Communication 51 · Conjunctions 17 · Connectors & Discourse 55 · Conversational Fillers 39 · Cooking 29 · Culture & Customs 61 · Daily Routine Verbs 24 · Days & Months 27 · Directions 28 · Education 54 · Emotions 43 · Exclamations 32 · Family 66 · Farewells 22 · Food & Drink 115 · Greetings 51 · Health & Medical 70 · Household 131 · Idioms & Expressions 115 · Money & Shopping 86 · Motion Verbs 26 · Nature & Weather 74 · Numbers 67 · Particles 23 · Personality 41 · Politeness 39 · Prepositions 27 · Professions 68 · Pronouns 30 · Question Words 18 · Religion 28 · Sentence Patterns 227 · Slang 74 · Technology 41 · Time 97 · Transportation 41.
- Category list is also hardcoded in P2 and P5 prompts (generation.js:144, focused-study.js:270). ⟶ Load categories from data, never duplicate in prompts by hand.

## 5. AI generation

All calls: Edge Function `claude`, model `claude-sonnet-4-20250514` (config.js:6), sent from the browser with client-chosen `model` and `max_tokens`. Prompts verbatim in `harvest-prompts.md`.

| # | Purpose | Call site | Inputs | Expected output | Parsing / validation | Failure handling | max_tokens |
|---|---|---|---|---|---|---|---|
| P2 | Phase plan | generation.js:146 | placement dims, category strengths (>0.7) / weaknesses (<0.4), goals, phase ratios, prev performance | JSON `{phase_id, content_ratios, weeks[4]}` | Strip ``` fences + `JSON.parse` (:581-583); no shape or category validation | Throws → retry screen (:437) or toast (home.js adjust) | 2000 |
| P3 | Daily lesson | generation.js:296 | week plan, dictionary pool TSV (all primary ranks + ≤30 related), mastery lists, remedial context | JSON lesson `{blocks[], vocab_items, patterns_taught}` | Same; only `lesson_id` overwritten; blocks unvalidated; unknown types skipped at render | Throws → retry screen | 3000 |
| P4 | Legacy beginner unit ×2 | generation.js:522 | level, speaker type, goals, dialect, topic hint | JSON `{id, title, subtitle, phrases[12]}` | `phrases` is array | null; result stored in `dynamicUnits`, never read | 2000 |
| P5 | Custom topic → categories | focused-study.js:256 | topic text, category list | JSON `{primary[], related[]}` | Fences + parse; `primary` non-empty; names not checked | "Failed to generate custom session" | 300 |
| P6 | Scenario phrases | focused-study.js:338 | scenario name, 60-entry pool, review phrases | JSON array `{ar, rom, en, context}` | Array non-empty | null → error message | 2000 |
| P7 | Tutor mastery extraction | ai-tutor.js:280 | full transcript | JSON `{demonstrated:[{arabic, english, correct}]}` | Array check, slice 30 | Silent `console.warn` | 1000 |
| P8 | Tutor chat | ai-tutor.js:355, :657 | system prompt + latest message | Free text | None; rendered into HTML (ai-tutor.js:130) | Generic "Failed to get response" | 1000 |
| P9 | Placement eval (dead) | api.js:34 | question, answer | "correct" / "incorrect" | `includes('correct')` also true for "incorrect" | n/a | 50 |

**Strong**
- P1 dialect rules are concrete and testable (بدي, شو, هلق, رح + verb, عم + verb, b- prefix, urban ق → ء) and the dialect-tag guide matches the dictionary's actual tags.
- Generation is grounded in the dictionary with an `[UNVERIFIED]` marker and an exact category list.
- Quiz is built client-side from lesson blocks, so answers aren't pre-generated.
- Phase ratios, thresholds and scenario maps are data, not prose.
- P7's "student-only, include correct form when wrong" rule is a good extraction contract.

**Fragile**
- No shared client: 6 hand-rolled fetches, no `stop_reason` check, no `usage` capture, no retries, no schema validation.
- P3 asks for `dictionary_ref: dict_NNN` but the pool lines omit `id` (generation.js:201-203), so refs are invented.
- `[UNVERIFIED]` is never parsed or shown; unverified words render as normal content.
- Category names returned by P2/P5 aren't validated; a miss yields an empty pool with only a console warning (generation.js:197) and the lesson is still generated.
- Primary categories are unbounded (e.g. Sentence Patterns 227 + Common Verbs 196), so P3 prompt size swings widely against a fixed 3000-token output budget.
- Prompt says reinforce 30-60, code buckets 30-80.
- P1-P3 are heritage-only by wording; P4 and P6 carry separate, weaker dialect instructions; four romanization schemes across prompts and data.
- P8 is stateless per message and its learned/weak context is always empty (ai-tutor.js:426-446).
- P7 results mostly no-op (update-only by `arabic`), yet the toast reports "N words updated" (ai-tutor.js:323).
- The client picks model and token budget, so the proxy is open to anyone with the public anon key.

**User-visible failure paths** (runtime unverified): retry screen after P2/P3 parse or HTTP errors (generation.js:437,593-626); "Failed to regenerate plan" toast; custom-topic failure message; misleading extraction toast; tutor verbosity (handover Bug 6).

⟶ One server-side AI gateway: model + token allowlist per task, usage and cost row per call, schema-validated JSON output, `stop_reason` handling and retry, `prompt_version` stored with every generated row.

## 6. Integrations and infrastructure

### 6a. Auth flow
1. Module `app.js` → `load()` reads localStorage `arabic_app_email`; if absent, user is logged out (state.js:82-93).
2. Welcome splash (first run) → `initAuth()` (auth.js:5-12) → login screen if no email.
3. Login: any string in the email field → saved locally → `special_courses` lookup → `onAuthSuccess()` → `load()` again → Aya routing or onboarding or home (auth.js:39-52, app.js:54-70,134-137).
4. Guest: `guest@app.com`, localStorage only, no server writes (auth.js:59-65, state.js:98-106).
- No sign-up, password, magic link, session, or token. Supabase client created from CDN global with anon key (database.js:9-12).

### 6b. Edge Function contracts (client side only; source not in repo)

| Function | Live (OPTIONS) | Request | Response used | Notes |
|---|---|---|---|---|
| `claude` | 200, CORS `*`, allows authorization, x-client-info, apikey, content-type | POST `EDGE_FUNCTION_URL`; headers `Content-Type: application/json`, `Authorization: Bearer <anon key>`; body `{model, max_tokens, system, messages:[{role:'user', content}]}` | `data.content[0].text` or `data.response`; HTTP 402 / 429 mapped to messages only in generation.js:571-575 | Per skill a passthrough to Anthropic; client controls model and tokens; no usage returned to app |
| `elevenlabs` | **404 `NOT_FOUND` — not deployed** | POST `ELEVENLABS_FUNCTION_URL`; header `Content-Type` only (no `Authorization`); body `{text, voice_id}` (utils/audio.js:27-35) | `response.blob()` played as audio | Handover says deployed; even if redeployed, no JWT header would 401 under default verify-JWT |
| `send-push` | 200, CORS `*` | No client caller | n/a | Hourly pg_cron per skill, unverified |

⟶ Edge Function source, config and CORS live in the repo and deploy from CI; every contract has a shared request/response type.

### 6c. Audio pipeline
- Path: `speakArabic(text)` → in-memory `Map` hit → play blob; miss → ElevenLabs proxy → cache blob → play; non-OK or network error → Web Speech `ar-SA` rate 0.75 (utils/audio.js:9-77).
- Cache: unbounded, per page load, no persistence, no eviction; every reload re-requests TTS (billable characters).
- Voice: `ELEVENLABS_VOICE_ID` "Hadi N" (config.js:13); no model or language parameter sent.
- Bypass: placement-v2.js:708, lesson-engine.js:529, quiz-engine.js:458 use Web Speech directly, so ElevenLabs could never play in v2 even if deployed.
- Current reality: all audio = device `ar-SA` voice (Gulf/MSA-leaning, not Palestinian).
- ⟶ One audio service; cached audio keyed by text + voice in storage (Supabase Storage or IndexedDB); dialect voice chosen per track.

### 6d. Push
- `VAPID_PUBLIC_KEY` in config (config.js:5); private key in Supabase secrets per skill.
- Flow: `Notification.requestPermission()` (push.js:181) → `serviceWorker.register('/arabic-app/sw.js')` (:246) → `pushManager.subscribe` with VAPID key (:260-262) → `savePushSubscription({subscription, preferredTime, timezone})` (:212-216) → fails on `preferredTime` (column is `preferred_time`).
- `push-prompt` route exists (router.js:130-134) but nothing navigates to it; `renderPushSettings` is never imported. **Push is unreachable from the UI.**
- sw.js: `push` shows notification with `/arabic-app/icon-192.png`; `notificationclick` opens retired `arabic_mastery_app.html` (sw.js:1-16).

### 6e. PWA
- manifest.json: name/short_name "Arabic Mastery"/"Arabic", `start_url` `/arabic-app/`, standalone, portrait, theme `#1a6b50`, background `#faf9f6`; icons `icons/icon-192.png`, `icons/icon-512.png` → directory doesn't exist.
- index.html links root `icon-192.png` for favicon and apple-touch-icon; `<html lang="en">`; title "Arabic Mastery" (not Hoopoe).
- Both PNGs identical, 1075×1083, 2 MB. SW has no fetch handler or cache, so no offline.
- index.html does not link `manifest.json` (no `<link rel="manifest">` in the 31 lines).

### 6f. Security findings

| Severity | Finding | Evidence |
|---|---|---|
| Critical | RLS disabled; public anon key reads every table, confirmed live (profiles, transcripts, course configs) | config.js:2; live reads |
| Critical | Account takeover by typing another user's email; no auth | auth.js:39-45, state.js:115 |
| Critical | Open Claude proxy: public URL + anon key, client chooses model and `max_tokens` | generation.js:557-568 |
| High | Personal emails committed in client config (`AYA_EMAILS`) and course-gating by email | config.js:8, auth.js:50 |
| High | ElevenLabs key in git history, not rotated (per handover; history not inspected, shallow clone) | consolidated_handover.md §2, §6 |
| High | Unescaped HTML: AI output and user vocab interpolated into `innerHTML` | ai-tutor.js:130, my-vocab.js:106,358, lesson-engine block renderers |
| Medium | Client-side feature gating (`isAya`, `speaker_type`) is the only access control | home.js, router.js |
| Medium | Third-party scripts from CDN without SRI (supabase-js@2 floating major, papaparse@5) | index.html:12-13 |
| Low | VAPID public key and voice id in client (expected; fine) | config.js:5,13 |

⟶ Auth + RLS + server-held secrets before any tester beyond Marwan; sanitize all rendered AI/user text.

## 7. Design and UX assets

### 7a. Design tokens
Two `:root` systems in one stylesheet; 83 unique custom properties, 26 defined twice (`--text-muted` three times).

| Token group | System 1 (css/styles.css:11-148) | System 2 "Comprehensive UX Overhaul" (css/styles.css:1333+) |
|---|---|---|
| Brand green | `--green #1a6b50`, `--green-light #e8f4ef`, `--green-medium #4a9e7e`, `--green-dark #0d4232` | `--primary-green #1a6b50`, `--primary-green-dark #0f4436` |
| Gold / accent | `--gold #c4973a`, `--gold-light #fef7e7`, `--gold-dark #9d7422`, `--gold-deep #9A7843`, `--gold-accent #D4BC7E`, `--amber #c4793a`, `--turquoise #4DD9D6` | `--accent-gold #d4af37`, `--accent-teal #4ecdc4` |
| Surfaces / text | `--cream #faf9f6`, `--sand #f2f0eb`, `--stone #e8e5de`, `--text #2a2520`, `--text-soft #6b6760`, `--text-muted #9b9890`; olive scale 50-900 | `--bg-dark #16140f`, `--bg-dark-elevated #1e1c16`, `--text-light #f5f5dc`, `--text-muted #b8b8a0` (overrides S1) |
| Dark mode | `@media (prefers-color-scheme: dark)` remaps to `--dm-*` (`--dm-bg #16140f`, `--dm-text #f0ede6`) | Dark values applied unconditionally to some screens |
| Fonts | `--font-display 'Lora'`, `--font-body 'DM Sans'`, `--font-arabic 'Amiri'` | `--font-arabic 'Noto Kufi Arabic'` (not loaded), `--font-body` system stack, `--font-accent 'Lora'` |
| Type scale | — | `--text-hero/h1/h2` defined twice in the same block (4rem→3rem, 2.5rem→2rem, 1.75rem→1.5rem) |
| Radius | `--radius-md 12px` … | — |

- Breakpoints: `max-width` 400 (1), 640 (5), 768 (2); `hover:none and pointer:coarse` (2); `prefers-reduced-motion` (1). Mobile target iPhone 16, 393×852 (skill).
- 47 class selectors defined more than once (e.g. `.btn-primary` ×5, `.btn-secondary` ×5, `.tab-btn` ×3, `.tab-bar`, `.quiz-option`, `.stats-grid` ×2). 13 `!important`.
- 552 inline `style="…"` attributes in JS templates.
- Brand palette, per the original design chat, is teal/green + gold with Lora + DM Sans (https://claude.ai/chat/e99b8e2a-91db-4212-ada6-c9163f7b3406).
- ⟶ One token file, typed; components consume tokens; no inline styles; lint for duplicate selectors.

### 7b. RTL
- `[dir="rtl"], .arabic` base rule (css/styles.css:198); input RTL rules (:421-423).
- `handleInputDirection` switches `dir` on first typed character (utils/rtl.js:3-12); only used in legacy quiz.js:13.
- 35 inline `dir="rtl"` / `direction:rtl` in JS; `<html lang="en">` with no language tagging on Arabic spans.
- Mixed Arabic/Latin lines (romanization, English) handled ad hoc.
- ⟶ `<Arabic>` text component owning `dir`, `lang="ar"`, font and harakat display setting.

### 7c. Hoopoe icons
- Location: `js/data/hoopoe-icons.js`, 859 KB JS module imported by home.js:11.
- 5 real icons as base64 PNG: `mascot` (AI Tutor/general), `phonics`, `speed`, `focus`, `vocab` (143-205 KB each).
- 3 missing, shipped as ~450-char SVG placeholders: `ICON_LESSON`, `ICON_TEST` (Placement Test), `ICON_PRACTICE` (Today's Practice). Not referenced by any screen.
- PWA icons are not the mascot and not correctly sized.
- ⟶ Icons as optimised image files (192/512 + badge sizes) in the asset pipeline, not base64 in JS.

### 7d. UI patterns worth keeping
- Home as tabs (Home / Progress / Settings) with a 3 + 2 Hoopoe feature-card grid (home.js:60-83,99-112).
- Bottom-fixed feedback sheet with Continue after each answer (lesson-engine.js:391-417, quiz-engine.js:348-378).
- Per-lesson progress bar + "save and exit" with exact-block resume (lesson-engine.js:52-91,483-491).
- Tap-to-reveal drill cards (lesson-engine.js:239-247).
- Placement round intro screens with emoji and plain-language description (placement-v2.js:97-134,746-762).
- Skill-profile bars + collapsible weekly plan cards, current week highlighted (home.js:248-340).
- Adjust-plan reason picker with guardrail warning before regenerating (home.js:349-435).
- Tap-to-hear buttons auto-extracted from Arabic in tutor replies (ai-tutor.js:142-164).
- Resumable placement across sessions (placement-v2.js:69-80).
- Onboarding as one-question-per-screen buttons with "Other" free text (onboarding.js:36-170).

### 7e. Known UX problems
- Floating tutor button (fixed bottom-right, css/styles.css:3158-3176) overlaps Next/Continue, shows on the tutor page, uses 💬 not mascot (handover Bug 4).
- Placement renders dark-on-dark due to System 2 overrides (handover Bug 5).
- Forced 2-second welcome splash (app.js:125-127).
- Any unhandled rejection wipes the app to an error screen (app.js:187-193).
- Quiz is skippable ("Skip for now", lesson-engine.js:463) yet results claim the next lesson adapts (quiz-engine.js:412-440).
- Onboarding offers Levantine/Egyptian/Gulf/Other dialects the content ignores (onboarding.js:134-138).
- Pool opt-in modal interrupts the first My Vocab visit (my-vocab.js:31-35).
- Speed Training card does nothing on tap (home.js:560).
- Toast "N words updated" when none were (ai-tutor.js:323).
- Brand mismatch: app title and manifest say "Arabic Mastery", welcome shows 🌿 (index.html:10, app.js:109-110).

## 8. Failure patterns

| Category | Evidence | Impact | ⟶ Rebuild rule |
|---|---|---|---|
| Schema drift | camelCase keys and non-existent columns in 5 tables (4a); `onConflict` on constraints not in repo | Placement, push, focused sessions, pool opt-in, legacy progress never persist; 10 tables at 0 rows | Migrations in repo are the only schema source; generate DB types; typed row mappers |
| Silent failure | `if (error) console.error; return null` pattern across database.js (e.g. :20,:365,:706); `.catch(() => {})` (focused-study.js:418); fire-and-forget extraction (ai-tutor.js:274-330) | Breakages invisible for months; users see success toasts | Errors reach telemetry and a visible UI state; no empty catches (lint) |
| Wiring / import breaks | `generateNextLesson` never called; `dynamicUnits` never read; push route unreachable; harakat toggle unread; api.js unused; 30+ dead exports (1); history of missing exports breaking modules at load (skill "Common bugs") | Core loop and whole features dead while "built ✅" | TypeScript + bundler; unused-export and unreachable-route lint; journey tests |
| Scattered type conditionals | `speaker_type` / `isAya` checks in 14 files (home.js 15, quiz.js 12) | Beginners and intermediates fall to a dead path; every new learner type touches every feature | Learner type and track resolved once into config; features read config |
| Duplicate systems | 2 lesson engines, 2 placements, 2 quizzes; flashcards + vocab browser + My Vocab study; 2 CSS systems; 6 Claude fetches; 3 audio paths; 4 romanization schemes; 3 `levenshtein` | Fixes land in one copy; behaviour diverges (e.g. audio) | Replace-then-delete in the same change; one service per concern |
| AI output parsing | Fence-strip + `JSON.parse`, no schema, invented `dictionary_ref`, unchecked categories, no `stop_reason` (5) | Retry screens, empty pools, silent bad content | Validation boundary with schemas; typed parse result; repair/retry policy |
| Untracked infrastructure | No Edge Function source; `elevenlabs` not deployed though checklist ticked; key in git history | Audio has never worked in v2; secrets unmanaged | Functions, config, cron and secrets manifest in repo; deploy from CI |
| Untested deploys | Validation = `node --check` + regex import checker (ways-of-working); no tests; v2 loop has 0 persisted rows | "Complete" phases that never ran end to end | Smoke test of placement → plan → lesson → quiz → next lesson against a test project before merge |
| Stale docs | 20+ doc-vs-code contradictions (10a) | Sessions build on false premises | Spec and ADRs in repo; docs checked at each milestone review |
| Whole-state sync | `save()` fans out 9+ sequential upserts on every action and every 30s (state.js:194-332); module-level mutable state in engines | Load, races, one bad key fails the whole profile write | Persist per domain action; feature-scoped state |
| Calendar-coupled progression | Day in phase from `start_date`; lesson id per date (generation.js:230,363-366) | Skipped days skip content; extra lessons overwrite | Progression by completed lessons; dates only for scheduling |
| Inline styling | 552 inline style attributes; tokens bypassed | Visual inconsistency, dark-mode breakage | Components + tokens only |
| Batch builds without runtime checks | Rebuild delivered as "27/27 files complete" batches before router/app existed (https://claude.ai/chat/a87a008d-9edd-4ab2-843a-427af8a4af80) | Integration bugs discovered only after deploy | Vertical slices that run end to end before the next slice |

## 9. Feature inventory

Status is from static analysis plus live row counts; `built-unverified` unless code or data is conclusive. Chat sources: **C1** https://claude.ai/chat/e99b8e2a-91db-4212-ada6-c9163f7b3406 · **C2** https://claude.ai/chat/fb0b70fe-e370-4245-b602-86a6cca7cd31 · **C3** https://claude.ai/chat/4d4c9742-fadd-4153-96c0-238d721e5687 · **C4** https://claude.ai/chat/a87a008d-9edd-4ab2-843a-427af8a4af80

| Feature | Status | Source | Bucket | Notes worth carrying |
|---|---|---|---|---|
| Onboarding (name, type, goals, dialect) | built-unverified | onboarding.js | MVP | One question per screen; goals list; drop unsupported dialects |
| Login / identity | built-working (insecure) | auth.js | MVP | Replace with real auth; keep low-friction entry |
| Guest mode | built-unverified | auth.js:59-65 | unconfirmed | Local-only; decide if testers need it |
| Placement (dictionary-sourced, 6 dims) | built-broken | placement-v2.js | MVP | Result not persisted server-side; rank curve unenforced; beginners need an entry path |
| Phase plan generation | built-unverified | generation.js:79 | MVP | 0 rows live; ratios table; exact category constraint |
| Lesson engine (7 blocks, resume) | built-unverified | lesson-engine.js | MVP | Block registry pattern (:94-102) |
| Next-lesson progression + remedial | built-broken | generation.js:355 | MVP | Never called; progression must be lesson-count based |
| Quiz (70% gate) | built-unverified | quiz-engine.js | MVP | Client-built from blocks; enforce min questions; not skippable if gating |
| Production answer evaluation | built-unverified (local fuzzy only) | lesson-engine.js:505-527 | MVP | Claude eval designed, not built (handover §4) |
| Audio (ElevenLabs + cache) | built-broken | utils/audio.js | MVP | Function not deployed; v2 bypasses; persist cache |
| Audio fallback (Web Speech) | built-working | utils/audio.js:70-77 | MVP | `ar-SA` only |
| Focused Study scenarios | built-unverified | focused-study.js | MVP | Scenario → category map; 12 categories uncovered |
| Focused Study session scaling | built-broken | focused-study.js:91-97 | MVP | Session inserts fail, count always 0 |
| Focused Study custom topic | built-unverified | focused-study.js:251 | MVP | Validate mapped categories |
| My Vocabulary list / add / delete | built-unverified | my-vocab.js | MVP | |
| My Vocabulary review | built-broken | my-vocab.js:394-449 | MVP | Flip-only; needs graded review + scheduling |
| CSV vocab import | built-unverified | my-vocab.js:496 | unconfirmed | papaparse; header rows |
| Legacy flashcards / vocab browser | built-unverified | flashcards.js, vocab.js | discard | Fold modes (weak→strong, weak only) into My Vocab review |
| Alphabet | built-unverified | alphabet-screen.js | MVP | 28 letters × 4 forms; add hamza, taa marbuta, harakaat |
| Phonics | built-unverified (Aya only, 5 sounds) | aya.js:197, data/aya-course.js:113 | MVP | Needs full content set |
| Checkpoint conversations (text) | designed-only | C1; `checkpoints` table (no writer) | MVP | Soft gate, character roleplay, fixed debrief order, fluency bands, history compare |
| Report-a-problem button | idea | decision list; flagging design in C1 | MVP | Row per report with content ref + version |
| Content fixes via Supabase table editor | idea | decision list | MVP | Needs content tables with ids/versions |
| Edit goals | designed-only | C3 (Marwan: "build it on our next build session") | MVP | Settings entry |
| Adjust plan | built-broken | home.js:349-470 | MVP | Real performance input; write revision history |
| Harakaat toggle | built-broken | home.js:565-571 | MVP | Saved, never applied |
| Audio autoplay toggle | built-broken | home.js:575-581 | unconfirmed | Saved, never applied |
| Progress tab (phase, skill bars, weeks) | built-unverified | home.js:216-340 | MVP | Keep as light progress base |
| Streak | designed-only (schema) | `user_stats` columns, no writer | MVP | |
| Words learned | idea | decision list | MVP | Derive from vocab mastery |
| Cost tracking per Claude call | idea | decision list | MVP | Gateway writes usage rows |
| Account deletion / export (data model) | idea | decision list | MVP | Owner id + cascade (4b) |
| Dictionary re-check by newer model | idea (decided by Marwan) | project memory | MVP prerequisite, separate step | |
| 3 missing Hoopoe icons | designed-only | hoopoe-icons.js | MVP (assets) | Lesson, Placement Test, Today's Practice |
| PWA install | built-broken | manifest.json, index.html | unconfirmed | Manifest not linked; icon paths wrong |
| AI tutor chat | built-broken | ai-tutor.js | roadmap (#1) | No history sent; empty context; unescaped output |
| AI tutor mastery extraction | built-broken | ai-tutor.js:265-331 | roadmap | Update-only; misleading toast |
| AI tutor quick modal + page, shared history | built-unverified | ai-tutor.js; C2 | roadmap | Proposed by Claude; Marwan confirmed tutor is for all users |
| AI tutor modes / proactive tips | designed-only | C2 | roadmap | Proposed by Claude |
| Intermediate learners | built-broken | onboarding.js:71 → legacy | roadmap | Slot via learner config |
| Second track (e.g. MSA) | idea | decision list | roadmap | `track_id` now (4b) |
| Speed Training (Pimsleur) | designed-only | home.js:108; C1, C2 | roadmap | Latency tracking, timed recall |
| Speaking practice | designed-only | C1 | roadmap | Typed → STT → pronunciation layers (proposed by Claude) |
| Phase renewal flow | designed-only (mockup) | C1 | roadmap | 7 screens; duration choice decided by Marwan |
| Break flow | designed-only | C1 | roadmap | Refresher after 3+ weeks (proposed by Claude) |
| Enrichment mode | designed-only | C1 | unconfirmed | Proposed by Claude |
| Community vocab pool | built-broken | my-vocab.js:553, database.js:120 | roadmap | Opt-in flag only (fails to save, excludes beginners); Marwan decided flagging, uploader shown, personal weak tracking (C1) |
| Download before trip / offline | designed-only | C1 | roadmap | Idea from Marwan; download manager proposed by Claude |
| Push notifications | built-broken | push.js, sw.js | roadmap | Unreachable; save fails; stale click URL |
| Analytics | idea | handover backlog | roadmap | |
| Phrase of the day | idea (not in this branch) | C1; skill claims it | roadmap | Date-seeded pick from learned items |
| Cultural notes | built-unverified (`culture_note` block, Aya cards) | lesson-engine.js:294, data/aya-course.js:147 | roadmap (expanded) | |
| Shared progress / family view | idea | C1 (Marwan asked to see each other's progress) | roadmap | |
| Goal event countdown | built for Aya only | utils/date.js, home.js:92; C1 | roadmap | Configurable event date per user |
| Full content admin tool | idea | decision list | roadmap | |
| Account deletion / export UI | idea | decision list | roadmap | |
| Other dialects | built-broken (collected, ignored) | onboarding.js:134-138 | unconfirmed | |
| Payments | idea | decision list | unconfirmed | |
| Interleaving config | built-broken (never read) | state.js:173 | discard (concept → review scheduler) | |
| Production stage progress | built-broken (never read) | state.js | discard | |
| Aya bespoke course + post-visit screen | built-unverified / designed-only | aya.js, data/aya-course.js | discard | Personal-note and cultural-card patterns only |
| Legacy beginner units | built-broken (1 unit) | data/units.js, lesson.js, quiz.js | discard | Chunking + script fading concepts (3a) |

## 10. Contradictions and open questions

### 10a. Docs vs code (also the skill-rewrite log)
Sources: **SK** = `arabic-learning-app` skill · **HO** = consolidated_handover.md · **MEM** = project memory.

| # | Claim | Source | Truth | Evidence |
|---|---|---|---|---|
| 1 | Tutor sends full conversation history | SK | Latest message only | ai-tutor.js:452-476 |
| 2 | Tutor history session-only | SK | Persisted to `ai_tutor_sessions` (4 rows) | database.js:176-186 |
| 3 | Tutor has per-status error messages (402/429/401/403/5xx) | SK | Generic error | ai-tutor.js:452-476 |
| 4 | `getLearnedPhrases()` gives personal_vocab context | SK | Returns `[]` | ai-tutor.js:426-429 |
| 5 | Production blocks evaluated by Claude | SK, HO §4 | Local fuzzy match only | lesson-engine.js:517-527 |
| 6 | `elevenlabs` deployed; `supabase/functions/elevenlabs/index.ts` added | HO §2, §6 | Not in repo; live function NOT_FOUND | 6b |
| 7 | Audio blocked by CORS preflight | HO Bug 3, MEM | Function missing; client also sends no auth header | 6b |
| 8 | personal_vocab lacks `transliteration`, `source` | HO Bug 2, MEM | Both columns exist | 4a |
| 9 | Adjustments tracked in `revision_history` | HO §4 | Never written | generation.js:150-160 |
| 10 | Review candidates = effective mastery <60 | HO §4 | Buckets <30 / 30-80 / >80; prompt says 30-60 | database.js:736-738 |
| 11 | Placement difficulty progresses by rank 200→2728 | SK | Primary categories ignore rank | database.js:428-433 |
| 12 | 6 dimensions each 0-5 | SK, HO §4 | `vocab_breadth` is an unbounded count | placement-v2.js:559 |
| 13 | End-to-end: pass → next lesson advances, fail → remedial | SK | No next-lesson call; plan regenerated | lesson-engine.js:564-585 |
| 14 | Home renders phrase of the day, today's practice, stats strip | SK | None present | home.js:60-83 |
| 15 | Audio cache revokes URLs on eviction | SK | No eviction; unbounded | utils/audio.js:9,45 |
| 16 | `load()` called once | SK rule 9 | Called twice | app.js:22,135 |
| 17 | Push: time picker, timezone updates, working pipeline | SK | UI unreachable; subscription save fails | push.js:212-216, router.js:130 |
| 18 | Focused Study stores sessions with `scenario` | SK | Insert fails on extra columns | focused-study.js:412-418 |
| 19 | Aya phonics sounds ح خ ع غ ق | SK | Data has ع ح خ ق ر | data/aya-course.js:113-146 |
| 20 | Colour tokens `--green-l`, `--green-m`, `--green-d`, `--bg`, `--bg2` | SK | Names are `--green-light/-medium/-dark`, `--cream`, `--sand`; second token system overrides | css/styles.css:11-148,1333+ |
| 21 | Body font DM Sans | SK | System 2 switches to system font stack | css/styles.css:82,1336 |
| 22 | Beginners use legacy `UNITS` course | SK | `UNITS` has 1 unit / 12 phrases; generated units discarded | data/units.js, generation.js:449 |
| 23 | Legacy engine "stable" | SK | `unit_progress` writes fail (`lastReviewed`) | lesson.js:439-443 |
| 24 | Cost ~$2/user/month | HO §4 | Unverifiable; no usage captured anywhere | 5 |
| 25 | Deployment checklist: elevenlabs deployed ✓ | HO §6 | Not deployed | 6b |

Confirmed accurate: branch, 41 files, model string, 17 tables, dictionary 2,728 rows / 46 categories, 8×8 placement with 5/8 pass, 7 block types, 70% quiz pass, mastery deltas and decay, Focused Study scenarios and split, extraction safeguards, PWA icons identical, CSS dual system, 3 icons missing.

### 10b. Could not determine
- Edge Function source and settings: passthrough details, JWT verification, rate limits, `send-push` cron.
- RLS policies and write access (reads confirmed; writes not attempted).
- Column types, defaults, PKs, unique constraints, FKs (schema endpoint blocked); full column lists of empty tables.
- Whether zero-row tables were cleared deliberately or never written.
- Runtime behaviour: rendering, device audio, generation quality, deployed Pages build vs branch.
- Dictionary romanization scheme and harakat presence (content review out of scope).
- Git history of the ElevenLabs key (shallow clone).

### 10c. Decisions for the spec session
1. New repo vs new branch; framework and build tooling (TypeScript leaning).
2. Auth for family and testers (magic link, invite-only, guest yes/no).
3. Track model: `track_id` on content and progress; dictionary per track or tagged.
4. Engine config shape for learner type × track (ratios, thresholds, scaffolds, prompt fragments).
5. Progression unit (completed lessons vs calendar) and phase length (fixed 90 days vs chosen).
6. Beginner entry: skip placement, short diagnostic, or self-select.
7. One romanization standard; harakat default and toggle behaviour.
8. Review scheduler (Leitner, SM-2, FSRS) and what My Vocabulary review grades.
9. Production evaluation: local only vs Claude hybrid; per-user cost budget.
10. Content strategy: per-learner runtime generation vs pre-generated shared lessons with ids and versions (affects cost, review, report-a-problem).
11. Audio: Palestinian voice choice, cache storage, pre-generation.
12. AI gateway: server-side prompts, model per task, caps, cost table schema.
13. Checkpoint anchor (days vs lessons) and debrief storage.
14. PWA/offline scope in MVP.
15. Transcript retention and export scope.
16. Which content tables are editable in the Supabase table editor and how edits are versioned.
17. Migrate the 4 existing users' data or start clean.
18. **Unconfirmed:** other dialects (onboarding currently offers Levantine, Egyptian, Gulf, Other).
19. **Unconfirmed:** payments.
