# Native spot check — 40 rows (dr-scoped-pass.md §2, D210)

Sampled from the 42 rows at `review_confidence = 3` after 360 of 2,728 rows judged,
20 of them carrying a long vowel against the 20 D210 requires. Deterministic sample (seed 360).

**Caveat worth knowing before you start.** D245 defers the `review_confidence` cut to a post-loop
re-scoring, so this samples the *current* all-H rule — the most-confident rows in the pass. That makes
it a harder test than the final pool, not an easier one: if these are dirty, everything downstream is.

For each row mark **OK** or **WRONG** in the last column, and write what is wrong if it is.
Vowel length in the romanization is the sharpest thing to check — nothing verifies it mechanically (R7).

| # | id | arabic | vocalised | romanization | english | lvl | why that level | pos/register/origin | OK / WRONG |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1218 | طَابِق | طَابِق | `6aabi2` | floor / story (of building) | 3 | needed to describe buildings and give addresses | noun / neutral / msa_shared_dialect_pron |  |
| 2 | 1250 | سُوق | سُوق | `suu2` | market / bazaar | 2 | everyday place noun needed for daily errands | noun / neutral / msa_shared_dialect_pron |  |
| 3 | 2202 | قَرَار | قَرَار | `2araar` | decision | 3 | abstract noun for discussing plans and choices | noun / neutral / msa_shared_dialect_pron |  |
| 4 | 239 | كِيفْكُم؟ | كِيفْكُم | `keefkum` | how are you? (to pl.) | 1 | obligatory greeting, plural half needed week one | formula / neutral / dialect |  |
| 5 | 1736 | بَطَّارِيَّة | بَطَّارِيَّة | `ba66aariyye` | battery | 3 | topic vocabulary for devices, beyond situational survival | noun / neutral / dialect |  |
| 6 | 1490 | جَدِيد | جْدِيد | `jdiid` | new | 2 | core descriptive adjective needed for ordinary daily conversation | adjective / neutral / msa_shared_dialect_pron |  |
| 7 | 614 | قَام | قَام | `2aam` | got up / stood up | 2 | daily routine verb needed for ordinary conversation | verb / neutral / msa_shared_dialect_pron |  |
| 8 | 285 | اللَّه يْبَارِكْ فِيك | اللَّه يْبَارِك فِيك | `allah ybaarik fiik` | God bless you (reply to mabrook, to m.) | 1 | obligatory reply half of a core blessing pair | formula / neutral / dialect |  |
| 9 | 1097 | حَمَّام | حَمَّام | `7ammaam` | bathroom | 2 | household necessity, asked for constantly by learners | noun / neutral / msa_identical |  |
| 10 | 1407 | فَيَضَان | فَيَضَان | `faya9'aan` | flood | 4 | specific disaster noun, lower frequency | noun / neutral / msa_identical |  |
| 11 | 1424 | قَطِيع | قَطِيع | `2a6ii3` | flock / herd | 4 | low-frequency rural/animal vocabulary | noun / neutral / msa_shared_dialect_pron |  |
| 12 | 884 | مَرِيض | مَرِيض | `marii9'` | sick / ill | 2 | core health adjective needed for ordinary daily conversation | adjective / neutral / msa_identical |  |
| 13 | 812 | خَالَة | خَالَة | `khaale` | maternal aunt | 2 | core kinship term used in everyday conversation and address | noun / neutral / msa_shared_dialect_pron |  |
| 14 | 504 | قَال | قَال | `2aal` | said | 2 | reporting verb needed for ordinary conversation | verb / neutral / msa_shared_dialect_pron |  |
| 15 | 354 | طَالَمَا | طَالَمَا | `6aalama` | as long as | 4 | formal connector; formal register caps at level four | conjunction / formal / msa_identical |  |
| 16 | 1116 | سِجَّادَة | سِجَّادَة | `sijjaade` | rug / carpet | 4 | specific household furnishing, lower frequency | noun / neutral / msa_shared_dialect_pron |  |
| 17 | 2298 | ثَانَوِيَّة | ثَانَوِيَّة | `thanaawiyye` | high school | 3 | education topic vocabulary, working middle | noun / neutral / msa_shared_dialect_pron |  |
| 18 | 1001 | حَلِيب | حَلِيب | `7aliib` | milk | 2 | core food item, needed for ordinary daily conversation | noun / neutral / msa_shared_dialect_pron |  |
| 19 | 323 | هَيْك | هَيْك | `heek` | like this / so / that's it | 2 | high-frequency discourse adverb needed early for ordinary talk | adverb / neutral / dialect |  |
| 20 | 448 | حَبِيبْتِي | حَبِيبْتِي | `7abiibti` | my dear / my love (to f.) | 2 | very common endearment, needed early in daily interaction | noun / neutral / msa_shared_dialect_pron |  |
| 21 | 2158 | حَكَى | حَكَى | `7aka` | spoke/said (dialect) | 2 | core dialect speech verb for ordinary conversation | verb / neutral / dialect |  |
| 22 | 402 | أَيْوَا | أَيْوَا | `2aywa` | yes | 1 | affirmative particle; unavoidable from the first week | particle / neutral / dialect |  |
| 23 | 1369 | جَبَل | جَبَل | `jabal` | mountain / hill | 3 | landscape noun, needed for describing places rather than surviving | noun / neutral / msa_identical |  |
| 24 | 429 | اسْمِي... | اسْمِي | `ismi` | my name is... | 1 | self-introduction frame, needed in week one | frame / neutral / msa_shared_dialect_pron |  |
| 25 | 2119 | اللَّه يِلْعَن أَبُو... | اللَّه يِلْعَن أَبُو | `allah yil3an 2abu` | damn the father of... (= damn...) | 3 | slang register caps at three; strong curse frame | frame / slang / dialect |  |
| 26 | 2167 | جِدًّا | جِدًّا | `jiddan` | very (MSA/formal) | 4 | formal intensifier; formal register caps at level four | adverb / formal / msa_identical |  |
| 27 | 1406 | زَلْزَلَة | زَلْزَلَة | `zalzale` | earthquake | 4 | specific weather/disaster noun, lower frequency | noun / neutral / msa_shared_dialect_pron |  |
| 28 | 148 | هَسَّا | هَسَّا | `hassa` | now (variant) | 2 | regional variant sits above level-one base هلّأ | adverb / neutral / regional_variant |  |
| 29 | 115 | نُصّ | نُصّ | `nu99` | half | 2 | needed for time, quantities, ordinary daily conversation | noun / neutral / dialect |  |
| 30 | 197 | مَرَّة | مَرَّة | `marra` | once / one time | 2 | basic frequency noun used in everyday talk | noun / neutral / msa_identical |  |
| 31 | 45 | بَسّ | بَسّ | `bass` | but / only / enough | 1 | core connector needed in week one to link clauses | conjunction / neutral / dialect |  |
| 32 | 1494 | مُرَبَّع | مُرَبَّع | `murabba3` | square (shape) | 4 | specific shape term, lower frequency | adjective / neutral / msa_identical |  |
| 33 | 1544 | ...مِن | مِن | `min` | than (comparison) | 2 | comparison preposition needed for ordinary daily description | preposition / neutral / msa_identical |  |
| 34 | 264 | يِسْلَمُو | يِسْلَمُو | `yislamu` | thanks (casual) | 2 | everyday casual thanks formula, very frequent | formula / neutral / dialect |  |
| 35 | 1689 | سِعِر | سِعِر | `si3ir` | price | 2 | shopping noun needed for ordinary daily transactions | noun / neutral / msa_shared_dialect_pron |  |
| 36 | 469 | لِلْأَسَف | لِلْأَسَف | `lil-2asaf` | unfortunately | 3 | common discourse adverb, working middle | adverb / neutral / msa_identical |  |
| 37 | 585 | زَعَل | زِعِل | `zi3il` | got upset / angry | 2 | core emotion verb needed in ordinary daily conversation | verb / neutral / msa_shared_dialect_pron |  |
| 38 | 128 | وَقْت | وَقْت | `wa2t` | time | 2 | core time noun needed for ordinary daily conversation | noun / neutral / msa_shared_dialect_pron |  |
| 39 | 27 | عَلَى | عَلَى | `3ala` | on / onto | 1 | core preposition, sentence machinery strand A | preposition / neutral / msa_shared_dialect_pron |  |
| 40 | 686 | قَصّ | قَصّ | `2a99` | cut (with scissors) | 3 | common transitive verb, working middle | verb / neutral / msa_shared_dialect_pron |  |
