# Romanization map — D47 Arabizi standard

Spec source: `PROJECT_SPEC.md` §C4.7 (D47, completed D141, **scheme revised chat 26**). This file is the single source of truth for romanization during DR. `prompt.mjs` injects it verbatim into `<<ROMANIZATION>>`. The `romanization_map` table is seeded from this file when the map freezes at the end of DR.

Target variety: urban Palestinian. Rows that are themselves rural or Hebron variants romanize their own pronunciation, not the urban one.

**Two principles decide every choice below.** Capitals mean emphasis, uniformly and only that. And the romanization records **pronunciation, not spelling** — the Arabic script is on screen at every `script_stage` (§C4.8), so the romanization never has to let a reader recover which Arabic letter produced a sound.

---

## 1. Consonants

| Arabic | write | Arabic | write |
|---|---|---|---|
| ا | see §2 | ض | `D` |
| ب | `b` | ط | `T` |
| ت | `t` | ظ | `TH` |
| ث | `th` | ع | `3` |
| ج | `j` | غ | `gh` |
| ح | `7` | ف | `f` |
| خ | `kh` | ق | `'` or `q` (see §1.1) |
| د | `d` | ك | `k` |
| ذ | `dh` | ل | `l` |
| ر | `r` | م | `m` |
| ز | `z` | ن | `n` |
| س | `s` | ه | `h` |
| ش | `sh` | و | `w` as consonant, see §2 as vowel |
| ص | `S` | ي | `y` as consonant, see §2 as vowel |

**The four emphatics are capitals**: ص `S`, ض `D`, ط `T`, ظ `TH`. Capitals carry emphasis and nothing else, so the set is learnable as one rule rather than four symbols. This is the only place a capital appears.

Taa marbuta ة is `a` after a back or emphatic consonant (خ ص ض ط ظ ع غ ق ر), `e` elsewhere. Examples: `lugha`, `3aafye`.

Alif maqsura ى is `a`.

Tanwin ـً is `an`. Example: `3afwan`.

Loanword sounds keep their Latin letters: `p`, `v`, `g`.

### 1.1 The glottal stop, and ق

`'` is the glottal stop [ʔ]. It is the only thing `'` ever means.

**Hamza** (ء أ إ ؤ ئ) is always [ʔ]. **ق is judged per row** — it is [ʔ] across the native stratum and [q] in a minority of words, so it is not a fixed substitution. See §4.

| where | write | examples |
|---|---|---|
| ق realised as [ʔ] | `'` | `'ahwe` قهوة · `wa't` وقت · `da'ii'a` دقيقة · `Taabi'` طابق |
| ق realised as [q] | `q` | `qur'aan` قرآن · `il-'aqSa` الأقصى |
| hamza, medial or final | `'` | `mit'akhkher` متأخر · `halla'` هلّأ · `maa shaa'` ما شاء |
| hamza on a word-initial vowel seat (أ إ آ ا) | **nothing — write the vowel** | `awlaad` أولاد · `ana` أنا · `imbaari7` إمبارح · `aab` آب |

The last row is the one that catches people. A word-initial hamza-carrying alif is a **vowel seat**: Arabic has no vowel-initial syllable, so the glottal onset is automatic and carries no information. A word-initial ق is different — it is a consonant that happens to be realised as [ʔ], so it is written: `'ahwe`, never `ahwe`.

Inside a token the glottal is always written, including after a prefix: `il-'usbuu3` الأسبوع.

**[q] is not restricted to rural variants.** A rural or Hebron row writes what that variant says — `q`, `k` or `g` — with the variety named in `notes`, and that has always been true. What §1.1 previously got wrong is that urban Palestinian *also* keeps [q] in the MSA-borrowed, religious and proper-noun stratum. `qur'aan` is urban and is not a variant.

## 2. Vowels

Short: `a`, `i`, `u`.

Long: `aa`, `ee`, `ii`, `oo`, `uu`.

Five long vowels, not three. Palestinian contrasts /eː/ with /iː/ and /oː/ with /uː/, so `beet` and `biit` are different words. **Never collapse them in a stored value.** Learner input is a different surface and is graded more forgivingly — see §5.

## 3. Rules

1. **Shadda** doubles the letter: `wassa3`, `3a''ad`. A capital emphatic doubles whole: `Sa` + `Sa`, not `Ssa`.
2. **Definite article** is `il-`, always hyphenated, assimilating to sun letters: `il-bint`, `ish-shams`, `it-talj`.
3. **Digraph breaker.** Insert `-` where two letters would otherwise read as a digraph: `as-hal` for أسهل, not `ashal`.
4. **Allowed character set** is `a-z`, `D`, `S`, `T`, `TH`, `q`, `3 7`, `'`, `-`, **and a single space between words**. The validator rejects anything else — see `tools/dr/validate.mjs`. No diacritics, no other punctuation, and **no capitals other than the four emphatics**. Leading, trailing and doubled spaces are rejected too; `rulefix.mjs` collapses those first. The space had been missing from this list since D47 because the section was written about single words, and 879 of 2,728 rows are phrases.

Note what left the set: `2`, `6` and `9` are gone. `2` is not a glottal stop and not a [q]; the emphatics are capitals rather than digit-plus-modifier. The digit set is now `3` and `7` only.

## 4. What is a rule fix and what is a judgement

Deterministic, and therefore handled by `rulefix.mjs` rather than the model:

- Scheme substitutions where the source symbol is unambiguous: `9`→`S`, `9'`→`D`, `6`→`T`, `6'`→`TH`.
- Word-initial glottal on a hamza-carrying vowel seat: dropped, since the Arabic string says whether the word begins with أ إ آ ا or with ق.
- Tatweel and stray character removal.

**Not** deterministic, and therefore the model's judgement per row:

- **ق as [ʔ] or [q].** The native stratum glottalises and is the default; the MSA-borrowed, religious and proper-noun stratum keeps [q]. `form_origin` correlates but does not decide it — the pilot mis-tagged rows in exactly this set — so judge the word, not the tag.
- **Vowel length.** The pre-DR data conflates `oo` with `uu` and `ee` with `ii`, so only reading the Arabic and knowing the word resolves it. The scoped prompt's instruction not to flag what a rule fix covers does not apply here.
- Taa marbuta `a` against `e`, where the preceding consonant is ambiguous.
- Any case where the existing romanization disagrees with the Arabic rather than just with the scheme. Flag those, do not silently rewrite.

**Case folding is not a rule fix.** It was listed as one and never implemented, which is the only reason the capitals above are safe to introduce. Lowercasing a romanization now destroys the emphatic distinction.

## 5. Storing versus grading

These are different surfaces and the rules differ on purpose.

**Stored values** (the `romanization` column, and everything built from it) hold the scheme exactly: five long vowels uncollapsed, emphatics capitalised, ق resolved per row.

**Learner input** is graded on phonetic equivalence, never on string equality against this scheme (§C4.6, D46 as amended). The scheme is one defensible convention among several and no standard exists, so grading a learner on our notation would test the notation rather than the Arabic. Equivalence classes:

- Long-vowel quality is forgiven: `oo` ≡ `uu`, `ee` ≡ `ii`. We cannot verify our own stored value here — the source data conflates them and nothing checks it mechanically (D210, risk R7) — so a learner cannot be marked wrong against it.
- **Vowel length is graded.** `a` ≠ `aa`, `i` ≠ `ii`, `u` ≠ `uu`. Length is phonemic and contrastive: `katab` and `kaatab` are different words.
- Emphasis is forgiven: `S` ≡ `s`, `D` ≡ `d`, `T` ≡ `t`, `TH` ≡ `th`. Capitals are a notation for a sound, and requiring a capital tests typing, not Arabic. The consequence is accepted: typed romanization cannot test emphasis, and the audio and script carry that distinction instead.
- The glottal is forgiven against its absence word-initially, and `'` ≡ `q` is **not** forgiven: those are different sounds.

Romanization is a scaffold, not the target. The learner meets the real distinctions through audio (§C9) and the Arabic script (§C4.8).
