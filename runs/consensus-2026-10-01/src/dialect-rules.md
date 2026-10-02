# Dialect rules

**Target: Palestinian Arabic, with Ramallah city speech as the priority.** Where Palestinian regions differ, prefer the Ramallah form and name the difference in `reasoning`. A form that Palestinians commonly use still counts as `palestinian` even if Ramallah says it differently: regional variation is not tracked, so do not penalise it.

## Preference order
1. **Palestinian**: what Palestinians naturally say in everyday conversation, the Ramallah form first where regions differ. Words of MSA origin that Palestinians genuinely use in conversation (جامعة university, حكومة government, مستشفى hospital) count as Palestinian.
2. **Pan-Levantine**: acceptable only when there is no more Palestinian way to say it.
3. **Other Levantine** (Lebanese- or Syrian-specific) and **MSA** (formal or written Arabic nobody says in conversation) are flagged, with the Palestinian word given instead.

These hold in nearly every case, not absolutely. Real speech has give, so explain any exception in `reasoning`.

## Markers of Palestinian speech (what the app checks for)
| Meaning | Palestinian | Not this |
|---|---|---|
| want | بدّي `biddi` | أريد |
| what | شو `shu` | ماذا، ايش |
| now | هلّأ `halla'` | الآن |
| will (future) | رح + verb `ra7` | سوف، سـ |
| doing right now | عم + verb `3am` | — |
| present tense | بـ prefix: بحكي `ba7ki`, بتحكي `bti7ki` | أحكي alone |
| ق | usually a glottal stop: قهوة `'ahwe`, قال `'aal` | `q`, except words that keep [q]: قرآن `qur'aan`, religious and formal borrowings |
| not | مش `mish` (with nouns, adjectives, "-ing" words) · ما (with verbs, بدّ- and عند-) | ليس |
| where | وين `ween` | أين |
| this | هاد `haad` / هاي `haay` | هذا، هذه |
| very | كتير `ktiir` | جدًا، مرّة (Gulf) |

## Notes
- Some dictionary rows are deliberately formal or MSA, and their English says so (for example "where (MSA/formal)"). For those rows, mark `dialect` as `msa` and judge whether the entry is accurate as MSA; do not treat the label itself as an error.
- Vowel the Arabic the way Palestinians pronounce it, not the MSA way: no case endings, Palestinian vowels (كِيف `keef`, not كَيْفَ `kayfa`).
