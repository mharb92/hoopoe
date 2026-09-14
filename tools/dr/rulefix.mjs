// Deterministic rule-fix pass, no model (dr-prompt.md "Rule-fix pass" table).
// Operates in memory; output feeds the model prompt and is carried into the
// staging payload under payload.rule_fix (dr-runner-spec.md §7.1).

// Arabic diacritics (fathatan..sukun) plus superscript alef.
const HARAKAAT_RE = /[ً-ْٰ]/g;
// ZWSP, ZWNJ, ZWJ, BOM.
const ZERO_WIDTH_RE = /[​-‍﻿]/g;
const TATWEEL_RE = /ـ/g;
const PERSIAN_YEH = 'ی';
const PERSIAN_KEHEH = 'ک';
const ARABIC_YEH = 'ي';
const ARABIC_KAF = 'ك';
const LATIN_RE = /[A-Za-z]/;
// Arabic letters (U+0621-U+064A), excluding the harakaat block above.
const ARABIC_LETTER_RE = /[ء-ي]/;

export const DIALECT_TAG_MAP = {
  D: { register: 'neutral', form_origin: 'dialect' },
  M: { register: 'neutral', form_origin: 'msa_shared_dialect_pron' },
  S: { register: 'neutral', form_origin: 'msa_identical' },
  'D-var': { register: 'neutral', form_origin: 'regional_variant' },
  // SL and MSA are deliberately absent: those rows go to the model (dr-prompt.md).
};

export function stripHarakaat(s) {
  return typeof s === 'string' ? s.replace(HARAKAAT_RE, '') : s;
}

export function normalizeArabicChars(s) {
  if (typeof s !== 'string') return s;
  return s
    .replaceAll(PERSIAN_YEH, ARABIC_YEH)
    .replaceAll(PERSIAN_KEHEH, ARABIC_KAF)
    .replace(TATWEEL_RE, '')
    .replace(ZERO_WIDTH_RE, '');
}

export function collapseWhitespace(s) {
  return typeof s === 'string' ? s.trim().replace(/\s+/g, ' ') : s;
}

function normalizeCell(s) {
  return typeof s === 'string' ? collapseWhitespace(normalizeArabicChars(s)) : s;
}

/**
 * Precomputes flag-only duplicate detection over the whole dataset
 * (dr-prompt.md: "exact Arabic, harakaat-stripped Arabic, same English within a category").
 * Only the English check is category-scoped; the Arabic checks are global.
 * Returns Map<id, string[]> of flag names.
 */
// --- chat-26 scheme migration (romanization-map.md §4) ---------------------
// Deterministic only. ق as glottal-or-[q] is a model judgement and is never
// substituted here: migration leaves `ur'aan` and the re-judge produces
// `qur'aan`. Inventing the q would be exactly the silent rewrite §4 forbids.

// Longest first: 9' is ض, not ص followed by something.
const SCHEME_SUBS = [["9'", 'D'], ["6'", 'TH'], ['9', 'S'], ['6', 'T'], ['2', "'"]];
// Hamza-carrying vowel seats. A word-initial one takes no glottal: the onset is
// automatic in Arabic, so the symbol would carry no information. ق is not here.
const HAMZA_SEAT_RE = /^[أإآاٱ]/;

export function applySchemeSubs(s) {
  if (typeof s !== 'string') return s;
  let out = s;
  for (const [from, to] of SCHEME_SUBS) out = out.split(from).join(to);
  return out;
}

/**
 * Drops a word-initial glottal where the Arabic word begins with a hamza seat,
 * and keeps it where the word begins with ق. Token-aligned when the two strings
 * have the same word count; otherwise only the first token is safe to judge and
 * the rest is left for the model, which the prompt now instructs.
 */
export function dropInitialHamzaGlottal(rom, arabic) {
  if (typeof rom !== 'string' || typeof arabic !== 'string') return rom;
  const drop = (r, a) => (r.startsWith("'") && HAMZA_SEAT_RE.test(stripHarakaat(a)) ? r.slice(1) : r);
  const rt = rom.split(/\s+/), at = stripHarakaat(arabic).trim().split(/\s+/);
  if (rt.length > 1 && rt.length === at.length) return rt.map((r, i) => drop(r, at[i])).join(' ');
  return [drop(rt[0], at[0] ?? ''), ...rt.slice(1)].join(' ');
}

/** Old-scheme romanization -> new scheme. Both steps, in order. */
export function migrateScheme(rom, arabic) {
  return dropInitialHamzaGlottal(applySchemeSubs(rom), arabic);
}

export function buildDuplicateIndex(rows) {
  const exactArabic = new Map();
  const strippedArabic = new Map();
  const englishInCategory = new Map();

  for (const r of rows) {
    const arabic = r.arabic;
    const stripped = stripHarakaat(arabic);
    const englishKey = `${r.category} ${(r.english ?? '').trim().toLowerCase()}`;

    if (!exactArabic.has(arabic)) exactArabic.set(arabic, []);
    exactArabic.get(arabic).push(r.id);

    if (!strippedArabic.has(stripped)) strippedArabic.set(stripped, []);
    strippedArabic.get(stripped).push(r.id);

    if (!englishInCategory.has(englishKey)) englishInCategory.set(englishKey, []);
    englishInCategory.get(englishKey).push(r.id);
  }

  const flags = new Map();
  const addFlag = (id, flag) => {
    if (!flags.has(id)) flags.set(id, []);
    flags.get(id).push(flag);
  };

  for (const ids of exactArabic.values()) {
    if (ids.length > 1) ids.forEach((id) => addFlag(id, 'duplicate_exact_arabic'));
  }
  for (const ids of strippedArabic.values()) {
    if (ids.length > 1) ids.forEach((id) => addFlag(id, 'duplicate_stripped_arabic'));
  }
  for (const ids of englishInCategory.values()) {
    if (ids.length > 1) ids.forEach((id) => addFlag(id, 'duplicate_english_in_category'));
  }

  return flags;
}

/**
 * Applies the deterministic fixes to one row.
 * duplicateFlags: string[] precomputed for this row's id via buildDuplicateIndex.
 * Returns { id, fixed: {only the changed fields}, flags: string[] }.
 * rank is read but never written (retained untouched, per the frozen table).
 */
export function applyRuleFix(row, duplicateFlags = []) {
  const fixed = {};
  const flags = [...duplicateFlags];

  fixed.track_id = 'palestinian';

  const tag = row.dialect_tag;
  if (tag && Object.prototype.hasOwnProperty.call(DIALECT_TAG_MAP, tag)) {
    Object.assign(fixed, DIALECT_TAG_MAP[tag]);
  }
  // SL and MSA rows get neither field here; they go to the model.

  const normalizedArabic = normalizeCell(row.arabic);
  if (normalizedArabic !== row.arabic) fixed.arabic = normalizedArabic;

  if (typeof row.romanization === 'string') {
    const normalizedRomanization = collapseWhitespace(row.romanization);
    if (normalizedRomanization !== row.romanization) fixed.romanization = normalizedRomanization;
  }

  if (LATIN_RE.test(row.arabic)) flags.push('latin_in_arabic');
  if (typeof row.romanization === 'string' && ARABIC_LETTER_RE.test(row.romanization)) {
    flags.push('arabic_in_romanization');
  }

  return { id: row.id, fixed, flags };
}
