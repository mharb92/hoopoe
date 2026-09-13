# Hoopoe learning principles
Standing reference · created chat 6 · binding on every spec section from C6 and on the Phase 2 build package.

## Why this exists
B through C4 were approved on sound instincts but without a stated checklist. A retro-audit in chat 6 found seven gaps, four of which should have been caught at C1 and C2. This file makes the check explicit and cheap. Chat 11 added retro check blocks to C1 to C4 (C1.8, C2.9, C3.13, C4.13) recording what that audit found, so the discharge trail is uniform across every section.

## The set

| # | Principle | What it requires in practice | Discharged by |
|---|---|---|---|
| P1 | Chunking | New items arrive in groups of ~3, not as a list | C4.2 |
| P2 | Cumulative retrieval | Each chunk is retrieved again after the next chunk lands | C4.2 |
| P3 | Exposure count (Nation) | 5+ encounters per item before it is treated as taught | C4.3, validated at build |
| P4 | Dual coding / multi-modality | Each item met in ≥2 of audio, script, production | C4.3 |
| P5 | Audio-first | Sound precedes script for every new item; audio never autoplays | C2.3, C4.4, C4.8, C9.1, C9.6 |
| P6 | Scaffold fading | Support is withdrawn on evidence, not on preference | C4.8 (`script_stage` ladder) |
| P7 | Mastery learning | Advancement is by demonstrated recall, not coverage | C6 |
| P8 | Spaced repetition | Review intervals expand on success, contract on failure | C6 |
| P9 | Spacing effect | Intervals are measured in calendar days, never in sessions; new material is rate-limited per day | D63, D64 |
| P10 | Comprehensible input (i+1) | Three regimes, not one (D134). Graded items: hard gate at or below the unit level. Generated input prose: same pool plus a capped share of above-level items that still resolve to real dictionary rows, default 10%, matching D94. Learner-directed surfaces: no level gate at all. The unit level is already learner ceiling+1 (C4.3), so the item set is the controlled +1 and the cap is the incidental one | C3.5, C5.5 validator, C11.1 |
| P11 | Functional-notional syllabus | Units are can-do statements, not grammar chapters | C3.2 |
| P12 | Interleaving | Review mixes items across units; consecutive units do not repeat a primary category | C6, D70 |
| P13 | Contextual recycling | Earlier vocabulary reappears inside new dialogues and patterns, not only in the review queue | D65 |
| P14 | Generation effect / desirable difficulty | Production support is withdrawn as mastery rises | D68 |
| P15 | Error-driven remediation | Known confusions get targeted drills, not another pass of the same lesson | D62 |
| P16 | Diagnostic before instruction | Placement sets a ceiling and a script stage, and every output it records drives something | C2, D66, D67 |
| P17 | Intrinsic motivation | Progress is shown as capability; no scores, XP, badges or shaming copy | B7, C1.4, C4.10 |
| P18 | Communicative output | The learner produces language for a purpose, judged as communication | C8.5, C8.6 (text in MVP) |

## Recorded risks

| id | Risk | Mitigation | Closes |
|---|---|---|---|
| R1 (D69) | B2 targets a 5-7 minute spoken conversation; MVP measures it through text checkpoints only. Text output over-credits learners who read well and under-credits heritage speakers who speak better than they type | Production self-rating at placement (D24); checkpoints scored on communicative success, not typing; latency stored but unscored (D96) | Speaking practice, B6 roadmap item 1 |
| R2 | P3 exposure counts are validated at build, so they hold only if the learner completes the lesson | Resume-anywhere (C1.5); quiz mandatory (D14) | — |
| R4 | Checkpoint language is runtime output (C8.3), so the C5.5 validators cannot gate it as they gate lessons. P10 rests on a prompt constraint | Authored scenarios, pooled vocabulary in the content pack, report-a-problem per turn, native review of sampled transcripts in the family test | Never fully; revisit if the family test surfaces above-level character turns |
| R5 (C9.13) | P5 now rests on synthetic TTS being reliably Palestinian at phrase level. Input spelling (C9.2) fixes segment-level dialect, not prosody or rhythm | §J spike of 20 clips before any corpus run; native listening review blocking at publish (C9.10); `human_recorded` override slot (D105); report-a-problem per clip id | Recorded human audio for the flagged set, if the spike or family test calls for it |
| R6 (C10.12) | Config is data (D118), so a mid-test change can redefine what a band, a learned word or a quiz outcome means across records already written | Frozen and hot key classes (D119); frozen keys pinned at plan start and changed only at a phase boundary; every record pins the resolved config version; `runtime_flag` limited to an operational allowlist | Never fully; the pinning makes any drift attributable rather than silent |
| R3 | Pre-generated content (D53) means a learner's jagged profile is met by the quick-check path (D49) and `known_gaps` (D66), not by bespoke text | Accepted; revisit only if family test shows systematic mismatch | — |
| R7 (D141, extended D210) | The scoped DR pass collects no `pair` or `constituents`, so two C5.5 validators are inert. P10 is unguarded against an above-level lexeme inside a level 1 frame, and strand C of P11 can be broken by teaching a formula without its obligatory response half. Separately, `review_confidence` is model self-report, so a confidently wrong row scores 3 and reaches learners. **D210 adds the sharpest instance:** vowel length in romanization is pure model judgement that nothing can verify mechanically, because Arabic script does not disambiguate it either (و is both `oo` and `uu`, ي is both `ee` and `ii`), so `arabic_vocalised` cannot cross-check it and no deterministic rule can be written | `review_confidence = 3` floor on every authored reference; dictionary-reference validator still rejects invented tokens; obligatory level 1 formulas are already excluded from the placement bank (D130); 40-row native spot check sampled from the 3s, in front of the family test, at least 20 of those rows carrying a long vowel (D210); pilot check P10 catches wholesale pass-through of the conflated source values by flip rate; report-a-problem per item | Second DR pass populates pairs and constituents and applies triaged corrections, at a phase boundary under C10.7 |
| R8 (D170, D.15) | The typed-answer toggle is a learner-set Settings key, so P14's withdrawal of production support operates inside a ceiling the learner sets. A learner can hold the easiest production mode indefinitely | Toggle pinned per record via the resolved config version, so the evidence is attributable rather than silent; D68 withdrawal still operates within the selected mode; checkpoints are free text with no word bank (D159) and therefore unaffected; B8 "Teaches" reads review correctness, not production mode | Never fully; the family test shows whether anyone holds it, and the answer is then a config-side floor rather than removing the control |

## The gate
Every section proposal from C6 onward, and the Phase 2 build package, ends with a principles check:

```
### Cn.x Principles check
Discharges: P_, P_ (one line each on how)
Defers: P_ → §__
At risk: P_ (why, and the mitigation or the recorded risk id)
```

A section that discharges nothing and defers everything is not finished. A section that puts a principle at risk without naming a mitigation or filing a risk row does not get approved.
