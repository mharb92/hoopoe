# Teaching foundations (reference for the rework)

Reference, not state. `docs/spec-tracker.md` wins, and decisions D281-D295 override this file wherever the two differ. Source: the "Hoopoe teaching foundations" doc (https://claude.ai/artifact/K2uuhUy3pKRUAethTE2GKv), approved by D294, reconciled here with chat 32's later decisions. The rework blocks R1-R7 (D295) turn this into spec prose; nothing here is spec until a block lands it.

## 1. Stance and goals
- Arabic is taught as a skill to build (grammar, verbs, conversation), not a word list. Grammar and verbs are the foundation; words fill it in.
- **Learners (D282, D292):** Aya (beginner); Marwan and Omar (heritage).
- **90-day goals (D286):** beginner, survival conversation, the `emerging` band (greetings, introduce yourself and your family, say what you want and have, simple questions). Heritage, 5-7 minutes, the `conversational` band. Pace: 3 sittings a week of about 20 minutes, about 13 hours per phase. Learners who study more go further.
- **Dialect (D281):** Palestinian, with Ramallah city speech as the priority; pan-Levantine only as a fallback. Regional variation is not tracked. These rules hold in nearly every case, not absolutely: an MSA-origin word Palestinians really say counts; MSA grammar words (ليس، سوف، ماذا، هذا، أين) are blocked in lessons; an exception carries a written reason.

## 2. Principles: proposed additions and amendments (adopted in R1)
P1-P18 stay. Proposed additions:
- **P19 Four strands (Nation).** Each block balances meaning-focused input, meaning-focused output, language-focused study, and fluency practice. Checked per block, not per lesson. Early blocks lean to study; later ones to input, output and fluency.
- **P20 Notice, then explain.** A grammar point is met first in input with the form highlighted, then explained in English in 3 sentences or fewer, plus a small table.
- **P21 Automaticity.** Grammar moves from declarative to proceduralised to automatic through varied practice; mastery is measured on the rule, not the word; the automatic stage gets timed practice.
- **P22 Interaction.** Regular conversation with a partner at the learner's level, who recasts errors rather than lecturing.
- **P23 Diagnostic feedback.** Every error is classified and named, and the skill that failed is the one reviewed.

Proposed amendments:
- **P3/P4** (exposure, multi-modality) cover grammar points as well as words.
- **P10** (i+1): graded positions never use an untaught word or grammar point; input prose may, with tap-to-explain.
- **P11:** can-do goals choose topics and scenarios; the grammar path runs through them.
- **P13** (recycling): structures as well as words.

Risk changes (Q34 i): P10 for grammar rests on model tagging checked by the critic, which needs a new recorded risk. R4 now covers all lessons and loses its native-review mitigation. R3 retires. R5 loses its native-listening mitigation. R7 can partly close.

## 3. What is tracked: the learner model (D285)
| Kind | Example | Source |
|---|---|---|
| Word | `beet` house | dictionary, `review_confidence` 3 |
| Phrase | `ya3Tiik il-3aafye` | dictionary, with its pair |
| Grammar point | "3ind- + ending = have" | grammar path (§5) |
| Verb cell | hollow verbs · past · *we* | conjugation tables (§6) |
| Milestone | `V-PRES-ALL` | milestone catalogue (§4) |

All kinds share one scheduler (C6, extended). Maturity is derived from the answer log, never stored as a second truth. Every answer records the milestones it exercises.

## 4. Maturity model (D285-D289)
**Skill shapes.** Steps: grammar, verbs, conversation, script letters. Ramps with thresholds: vocabulary, listening, fluency (speed), pronunciation (a few sounds are steps).

**Conversation ladder (D288)** = the C8.5 checkpoint bands: `emerging` (survival) · `developing` (everyday: routine, plans, yesterday) · `conversational` (5-7 minutes, narrate, opinions, repair misunderstandings) · `fluent` (spontaneous, abstract topics, verb forms used freely). Each band lists the milestones it needs.

**A milestone** carries: id · plain name · shape (step or threshold) · prerequisites · evidence rule. Example evidence rule, a placeholder until calibrated: 90% correct across at least 3 sessions over at least 7 days, under a response-time limit, including verbs never seen conjugated. Evidence decides, never time spent.

**Placeholders, not facts:** the evidence numbers above; vocabulary thresholds (~300 survival / ~1,000 everyday / ~2,000-3,000 comfortable, borrowed from English coverage research, low confidence for Palestinian Arabic); the grammar order (teaching convention plus the class worksheets, moderate confidence).

**Sequencing rules:**
1. Bottleneck first: each block targets the unmet milestones blocking the next conversation band.
2. Steps get massed, then spaced, practice; the next dependent step may start once the current one is used with effort, and automaticity continues in reviews and Verb Lab.
3. Ramps run continuously, chosen to feed the current step (verbs while conjugation is the step, time words with the past tense).
4. Every lesson recycles at least two earlier milestones.
5. A stalled step (evidence flat after several sessions) switches method or is parked briefly; it is never repeated unchanged.
6. Conversation lessons and checkpoints work as integration tests; their skill-tagged errors pick the next bottleneck.
7. The strand mix shifts with level (P19).

**Display (D287):** capabilities only. Milestones show as can-do statements; the per-skill view is marked by milestones reached. Paces, percentages and on- or behind-pace readings are internal. Placement seeds the axes, so a heritage learner does not start at zero, and `already_knew` stays separate (D27).

**History (D289):** what a learner was shown stays pinned (R6, D.5); analysis may recompute under a new definition in a separate, labelled view.

**Calibration:** checkpoint errors tagged to skills; a 30-second monthly real-life check-in (spoke Arabic outside the app? with whom, how long, how it went 1-5, where stuck); a monthly analysis proposing pace and weighting changes for Marwan to approve, versioned as config (D118). With three learners this calibrates per person over time, not across a population.

## 5. Grammar path (about 70 points, prerequisites between them)
| Stage | When | Content |
|---|---|---|
| A | block 1 | pronouns, with *you* m/f from day 1 · no "to be" (`ana mabsuuT`) · `haada`/`haadi`/`haadol` · `il-` and assimilation · gender and agreement · the personal endings (`-i -ak -ik -o -ha -na -kum -hum`) on family words, `3ind-`, `bidd-`, `ma3-` · question words · `fii`/`ma fii` · "-ing" words (active participles: `raayi7`, `jaay`, `'aa3id`, `waa'if`, `laabis`, `shaayif`, `saakin`, `naayim`) · negation: `mish` for everything except `3ind-`/`bidd-`, which take `ma` |
| B | block 2 | plural "-ing" forms · present tense of regular verbs, a few persons at a time · `3am` · `ra7` · `bidd-` + verb · verb negation · imperative · basic object endings · numbers and time · `illi` |
| C | block 3 | past tense, all persons · hollow, final-vowel and doubled verbs · `kaan` + present · comparatives · idafa · plurals, including irregular (`kbiir` → `kbaar`) |
| D | next phase | verb forms II-X as meaning shifts (`3ilim` → `3allam` → `t3allam`) · participles in full · `iza`/`law` · `-l-` endings · broken plural patterns |

The personal endings come first because the same eight endings recur on nouns, `3ind-`, `bidd-`, `ma3-` and later as verb objects. "-ing" words come before conjugation because they need only m/f/plural endings yet cover much daily talk; the class worksheets (Lingua Verna Levantine Foundations, weeks 4-11) taught this way and reached week 11 without conjugation.

## 6. Verb Lab
- First grid: "-ing" words, m/f/plural, in block 1. Then the conjugation map: verb family × tense × person, tracked per rule ("hollow, past, *we*").
- Drills: transform (person, tense, polarity) · listen and pick (`biktib`/`btiktib`/`bniktib`) · fill the cell · root + form → word · timed rounds · verbs never seen conjugated.
- Conjugation tables per teachable verb are built once, checked by rule-based code against a model, and disagreements go to a CSV (Q36). Drills come from the tables: free and always correct.
- Due verb cells appear in the daily warm-up; the Lab is also open for free practice.

## 7. Lessons and blocks (D283)
- **Cadence:** 10-minute lessons, about two per sitting, planned at 3 sittings a week; exit and resume anywhere; learners may continue past the plan, with `new_lessons_per_day` still capping new material (P9).
- **Blocks** span checkpoint to checkpoint (C8.2 anchors, lesson anchor rescaled). A block plan: outcome in plain words, 2-4 can-dos, its grammar points, its words, a story thread with recurring characters, and a four-strands balance. Planned in one call; lessons generated a week at a time from the latest learner model.
- **Lesson types:** grammar (meet in dialogue → notice → explain ≤3 sentences → controlled practice → meaningful practice about your own life → transfer → check) · words (chunks of 3, cumulative retrieval) · story (~95% known words, audio, tap-to-explain) · conversation (scenario with a goal, partner recasts, error debrief) · fluency (known material, speed, shadowing, retelling) · review.
- **Soft targets, checked by the critic, not hard limits:** one new grammar point or 4-8 new words per lesson; 5+ exposures per new word across the block; each grammar point practised in 3+ lessons across 2+ weeks.
- **Borrowed formats (class worksheets):** m/f (and plural) side by side · pattern tables (a tall man / the tall man / the man is tall) · exchange scripts (opening → answer → optional *thank God* → return, with literal meanings) · every new word in at least one example sentence. Describe-the-picture waits until after the first version (D294).
- **Onboarding:** a ~3-minute "about you" chat or form (why learning, who they will speak with, where the family is from, interests, weekly time, optional family names), then placement. The learner can see, edit and delete it.

## 8. Feedback, speaking and audio
- Tap any word: meaning, root, form, person/tense, audio (from dictionary and tables, free). A "why?" button: a short runtime explanation, capped.
- Errors classified (wrong ending, wrong stem, agreement, wrong word, spelling) and named; the matching item or cell is updated.
- Conversation partner, typed, in MVP (D284); voice when dialect speech recognition is good enough.
- Audio: word and verb-form clips made once and shared; sentence audio on first play, content-addressed so nothing is paid twice; TTS reads fully vowelled Palestinian spelling; each new clip transcribed back and compared; a one-time native listen of ~20 clips before choosing a voice; a custom voice from a Palestinian family member is the best option (D105's slot). Shadowing in fluency lessons; minimal-pair sound drills (ع/ء, ح/ه, ق/ك, emphatics).

## 9. Accuracy without a native reviewer
Hard checks: every Arabic token resolves to the dictionary, a conjugation table or the particle allowlist · romanization scheme · dialect assertions · no untaught material in graded positions. Then a critic pass (a second Claude call) for naturalness, grammar, dialect and level. A failing lesson is regenerated, never shown. Report-a-problem everywhere. One-time human review by CSV notes: the grammar path, conjugation-table disagreements, the dictionary sample (D290).

## 10. Cost (D293)
Cap per learner per month: $10 hard, $7 soft (cheaper model above it). Chat-32 estimates per learner per month: lessons $3-5, conversation partner $1-3, sentence audio $1-3 unpriced. R5's generation test replaces these. Verb Lab drills cost nothing.
