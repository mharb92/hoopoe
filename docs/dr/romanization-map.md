# Romanization map — D47 Arabizi standard

Spec source: `PROJECT_SPEC.md` §C4.7 (D47, completed D141). This file is the single source of truth for romanization during DR. `prompt.mjs` injects it verbatim into `<<ROMANIZATION>>`. The `romanization_map` table is seeded from this file when the map freezes at the end of DR.

Target variety: urban Palestinian. Rows that are themselves rural or Hebron variants romanize their own pronunciation, not the urban one.

---

## 1. Consonants

| Arabic | write | Arabic | write |
|---|---|---|---|
| ا | see §2 | ض | `9'` |
| ب | `b` | ط | `6` |
| ت | `t` | ظ | `6'` |
| ث | `th` | ع | `3` |
| ج | `j` | غ | `gh` |
| ح | `7` | ف | `f` |
| خ | `kh` | ق | `2` (see §1.1) |
| د | `d` | ك | `k` |
| ذ | `dh` | ل | `l` |
| ر | `r` | م | `m` |
| ز | `z` | ن | `n` |
| س | `s` | ه | `h` |
| ش | `sh` | و | `w` as consonant, see §2 as vowel |
| ص | `9` | ي | `y` as consonant, see §2 as vowel |

Hamza in every seat (ء أ إ ؤ ئ) is `2`.

Taa marbuta ة is `a` after a back or emphatic consonant (خ ص ض ط ظ ع غ ق ر), `e` elsewhere. Examples: `lugha`, `3aafye`.

Alif maqsura ى is `a`.

Tanwin ـً is `an`. Example: `3afwan`.

Loanword sounds keep their Latin letters: `p`, `v`, `g`.

### 1.1 The glottal stop

One symbol, `2`, for both hamza and urban ق. They are the same sound in the target variety, and the Arabic script is on screen at every `script_stage` (§C4.8), so the romanization never has to recover the spelling.

Write it everywhere it is pronounced, including word-initially: `2awlaad`, not `awlaad`.

A row that is itself a rural or Hebron variant writes what that variant says: `q`, `k` or `g`, with the variety named in `notes`.

The apostrophe is an emphatic modifier only, in `9'` and `6'`. It is never a glottal stop.

## 2. Vowels

Short: `a`, `i`, `u`.

Long: `aa`, `ee`, `ii`, `oo`, `uu`.

Five long vowels, not three. Palestinian contrasts /eː/ with /iː/ and /oː/ with /uː/, so `beet` and `biit` are different words. Never collapse them.

## 3. Rules

1. **Shadda** doubles the letter, `2` included: `wassa3`, `3a22ad`.
2. **Definite article** is `il-`, always hyphenated, assimilating to sun letters: `il-bint`, `ish-shams`, `it-talj`.
3. **Digraph breaker.** Insert `-` where two letters would otherwise read as a digraph: `as-hal` for أسهل, not `ashal`.
4. **Allowed character set** is `a-z`, `2 3 6 7 9`, `'`, `-`. The validator rejects anything else. No capitals, no diacritics, no other punctuation.

## 4. What is a rule fix and what is a judgement

Deterministic, and therefore handled by `rulefix.mjs` rather than the model:

- Scheme substitutions where the source symbol is unambiguous, for example `'` used as a glottal stop becomes `2`.
- Tatweel and stray character removal.
- Case folding to lowercase.

**Not** deterministic, and therefore the model's judgement per row in prompt field 5:

- **Vowel length.** The pre-DR data conflates `oo` with `uu` and `ee` with `ii`, so only reading the Arabic and knowing the word resolves it. The scoped prompt's instruction not to flag what a rule fix covers does not apply here.
- Taa marbuta `a` against `e`, where the preceding consonant is ambiguous.
- Any case where the existing romanization disagrees with the Arabic rather than just with the scheme. Flag those, do not silently rewrite.
