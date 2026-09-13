# Hoopoe Live Schema Snapshot

**Captured:** Sep 11, 2026, read-only, from branch `modular-rebuild-5`.

**Method:**
- Table names come from `.from()` calls in the code.
- Columns come from each table's first row.
- Row counts come from the API.
- No values were recorded.

| Table | Exists | Rows | Columns |
|---|---|---|---|
| `dictionary` | yes | 2728 | id, rank, arabic, romanization, english, pos, category, root, conjugation, gender, dialect_tag, notes, confidence, created_at |
| `profiles` | yes | 4 | email, name, speaker_type, dialect, goals, placement_level, placement_score, vocab_pool_opt_in, created_at, updated_at, placement_rounds_completed, placement_date, push_enabled, push_time, custom_goals |
| `personal_vocab` | yes | 20 | id, email, arabic, romanization, english, notes, context, source, shared_to_pool, created_at, mastery_score, is_dialect, is_msa, updated_at, last_reviewed, transliteration |
| `production_progress` | yes | 4 | email, current_stage, unlocked_at, lessons_in_stage, ready_for_next, created_at, updated_at |
| `interleaving_config` | yes | 4 | email, enabled, threshold_lessons, threshold_mastery, mix_ratio_new, mix_ratio_weak, mix_ratio_strong, last_interleaved_lesson, created_at, updated_at |
| `ai_tutor_sessions` | yes | 4 | id, email, messages, created_at, updated_at |
| `special_courses` | yes | 4 | email, config, created_at |
| `lesson_progress` | yes | 0 | empty, columns unreadable |
| `phase_plans` | yes | 0 | empty, columns unreadable |
| `focused_sessions` | yes | 0 | empty, columns unreadable |
| `weak_words` | yes | 0 | empty, columns unreadable |
| `user_stats` | yes | 0 | empty, columns unreadable |
| `user_preferences` | yes | 0 | empty, columns unreadable |
| `unit_progress` | yes | 0 | empty, columns unreadable |
| `placement_test_results` | yes | 0 | empty, columns unreadable |
| `push_subscriptions` | yes | 0 | empty, columns unreadable |
| `checkpoints` | yes | 0 | empty, columns unreadable |

## Findings for the spec
1. **Everything is keyed by `email`,** not a stable user ID. There is no track scoping anywhere. Both are one-way doors the rebuild fixes.
2. **`profiles` has no `placement_profile` column,** but `home.js`, `generation.js` and `focused-study.js` read `profile.placement_profile`. Unless it's stored elsewhere, the heritage plan and progress features have nowhere to persist the placement result. The harvest should confirm.
3. **`phase_plans` and `lesson_progress` are empty.** No v2 plan or lesson progress has ever been saved.
4. **`personal_vocab` now has `transliteration` and `source`.** The May bug #2 is fixed in the database, but the table carries both `romanization` and `transliteration`.
5. **Real data volume is tiny:** 4 profiles, 20 vocab words. Migrating it is optional. Only the dictionary must carry over.
6. **All 17 tables are readable with the public anon key,** which confirms RLS is off. Profile emails are exposed.
