// Pure matching for the external dictionary comparison (D275,
// docs/dr/external-compare.md §3-4). No I/O, no model: everything here is free
// and deterministic, and it writes the discrepancy text the CSV carries.
//
// Normalised forms exist for matching only; no stored value is ever rewritten.

const MARK = /[ً-ْٰ]/;
const MARKS_G = /[ً-ْٰ]/g;
const TATWEEL_G = /ـ/g;
const SHADDA = 'ّ';
const SUKUN = 'ْ';
const MARK_NAME = {
  'ً': 'an', 'ٌ': 'un', 'ٍ': 'in', 'َ': 'a', 'ُ': 'u',
  'ِ': 'i', [SUKUN]: 'sukun', 'ٰ': 'aa',
};

// --- §3 tiers ---------------------------------------------------------------
/** T1: harakaat and tatweel stripped. */
export const skeleton = (s) => (s ?? '').replace(MARKS_G, '').replace(TATWEEL_G, '').trim();

/** T2: T1, alif forms folded, ة → ه, word-final ى/ا/ي one class, spaces collapsed. */
export const fold = (s) => skeleton(s)
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ة/g, 'ه')
  .replace(/[ىاي](?=\s|$)/g, 'ا')
  .replace(/\s+/g, ' ')
  .trim();

/** T3: T2 with a leading definite article stripped. */
export const stripArticle = (s) => {
  const f = fold(s);
  return /^ال\S{2,}/.test(f) ? f.slice(2) : f;
};

export const TIERS = [
  { tier: 'T0', key: (s) => (s ?? '').trim() },
  { tier: 'T1', key: skeleton },
  { tier: 'T2', key: fold },
  { tier: 'T3', key: stripArticle },
];

export const TIER_NOTE = {
  T0: '', T1: '', T2: 'spelling folded (alif/hamza seat, taa marbuta or final ى/ا/ي)',
  T3: 'matched without the article ال',
};

// --- §4.3 harakaat ----------------------------------------------------------
/** Letters with the marks sitting on each; spaces are kept as letters. */
export function letters(s) {
  const out = [];
  for (const ch of (s ?? '').replace(TATWEEL_G, '').trim()) {
    if (MARK.test(ch)) { if (out.length) out[out.length - 1].marks.add(ch); }
    else out.push({ ch, marks: new Set() });
  }
  return out;
}

// Drops a leading ال. The shadda a sun letter takes after it belongs to the
// article's assimilation (الثّامن), not to the word, so it is dropped too.
const dropArticle = (ls) => {
  if (!(ls.length > 3 && ls[0].ch.replace(/[أإآٱ]/, 'ا') === 'ا' && ls[1].ch === 'ل')) return ls;
  const [first, ...rest] = ls.slice(2);
  const marks = new Set(first.marks);
  marks.delete(SHADDA);
  return [{ ch: first.ch, marks }, ...rest];
};

const describe = (marks) => {
  const v = [...marks].filter((m) => m !== SHADDA).map((m) => MARK_NAME[m]).join('+');
  return (marks.has(SHADDA) ? 'shadda' + (v ? '+' : '') : '') + (v || (marks.has(SHADDA) ? '' : 'none'));
};

/**
 * Compares harakaat letter by letter. Only letters marked on both sides count:
 * a missing mark is not a difference (about half the source is lightly
 * vocalised). Shadda on one side against a vowel without it on the other is a
 * difference: gemination is phonemic.
 * Returns { compared, diffs: [{ pos, ours, theirs }] }, or null if the two
 * words cannot be aligned letter for letter.
 */
export function compareHarakaat(ours, theirs, { article = false } = {}) {
  let a = letters(ours), b = letters(theirs);
  if (article) { a = dropArticle(a); b = dropArticle(b); }
  if (a.length !== b.length) return null;
  let compared = 0;
  const diffs = [];
  a.forEach((la, i) => {
    const lb = b[i];
    if (!la.marks.size || !lb.marks.size) return;
    compared++;
    const sa = la.marks.has(SHADDA), sb = lb.marks.has(SHADDA);
    const va = [...la.marks].filter((m) => m !== SHADDA).sort().join('');
    const vb = [...lb.marks].filter((m) => m !== SHADDA).sort().join('');
    if (sa !== sb || (va && vb && va !== vb)) {
      diffs.push({ pos: i + 1, letter: la.ch, ours: describe(la.marks), theirs: describe(lb.marks) });
    }
  });
  return { compared, diffs };
}

export const harakaatText = (diffs, ours, theirs) =>
  'harakaat: ' + diffs.map((d) => `letter ${d.pos} (${d.letter}): ours ${d.ours}, theirs ${d.theirs}`).join('; ') +
  ` (${ours} / ${theirs})`;

// --- §4.2 gloss -------------------------------------------------------------
// Glosses use American spelling (Marwan, chat 31). British spellings in the
// source are normalised before comparing and before anything is exported.
const US_WORDS = {
  yoghurt: 'yogurt', theatre: 'theater', centre: 'center', metre: 'meter', litre: 'liter', fibre: 'fiber',
  defence: 'defense', offence: 'offense', licence: 'license', moustache: 'mustache', aeroplane: 'airplane',
  grey: 'gray', programme: 'program', tyre: 'tire', jewellery: 'jewelry', cheque: 'check', pyjamas: 'pajamas',
  mum: 'mom', catalogue: 'catalog', dialogue: 'dialog', plough: 'plow', mould: 'mold', sceptical: 'skeptical',
  practise: 'practice', analyse: 'analyze', analysed: 'analyzed', travelled: 'traveled', travelling: 'traveling',
  traveller: 'traveler', cancelled: 'canceled', cancelling: 'canceling', storey: 'story', cosy: 'cozy',
};
const OUR_STEMS = /\b(colo|flavo|neighbo|favo|hono|labo|behavio|humo|rumo|harbo|odo|vapo|armo|parlo|savo|endeavo|glamo|clamo|rigo|vigo|valo|splendo|tumo)ur/gi;
const ISE_STEMS = /\b(organ|real|recogn|apolog|memor|summar|categor|priorit|custom|minim|maxim|critic|visual|final|special|civil|global|modern|normal|character|emphas|sympath|util|stabil|legal|fertil|steril|symbol|harmon|agon|colon|terror|author|jeopard|mobil|neutral|popular|standard|subsid|vapor|hospital|immun|capital|central|familiar|general|natural|patron|revolution)is(e|ed|es|ing|ation|ations)\b/gi;

export function americanise(text) {
  return (text ?? '')
    .replace(/[A-Za-z]+/g, (w) => {
      const us = US_WORDS[w.toLowerCase()];
      if (!us) return w;
      return w[0] === w[0].toUpperCase() ? us[0].toUpperCase() + us.slice(1) : us;
    })
    .replace(OUR_STEMS, '$1r')
    .replace(ISE_STEMS, '$1iz$2');
}

const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'be', 'is', 'it', 'one', 'someone', 'something', 'sth', 'sb']);

/** Normalised senses of an English gloss. */
export function senses(gloss) {
  return americanise(gloss ?? '').toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\be\.?t\.?c\.?/g, ' ')
    .split(/\s*(?:\/|,|;|\bor\b)\s*/)
    .map((s) => s.replace(/[^a-z' -]/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/^(?:to|a|an|the) /, '').trim())
    .filter((s) => s.length > 0);
}

const words = (s) => s.split(' ').filter((w) => w && !STOP.has(w));
const containsWords = (big, small) => {
  const b = ` ${big} `, sw = words(small);
  return sw.length > 0 && sw.join('').length >= 3 && b.includes(` ${sw.join(' ')} `);
};

/** 'agree' if any sense is equal, or one contains the other as whole words. */
export function glossCheck(ours, theirs) {
  const A = senses(ours), B = senses(theirs);
  for (const a of A) for (const b of B) {
    if (a === b || containsWords(a, b) || containsWords(b, a)) return 'agree';
  }
  return 'disagree';
}

// --- §4.4 flag --------------------------------------------------------------
/** Verb against non-verb only. Their blank category is not compared. */
export function posGap(ourPos, theirCategory) {
  const t = (theirCategory ?? '').trim().toLowerCase();
  if (!t || !ourPos) return false;
  return (String(ourPos).toLowerCase() === 'verb') !== (t === 'verb');
}

// --- §4.1-4.5 categorise ----------------------------------------------------
const MAX_CANDIDATES = 3;
const byPriority = (theirCategory) => (a, b) =>
  (b.mvp - a.mvp) ||
  (Number(!posGap(b.pos, theirCategory)) - Number(!posGap(a.pos, theirCategory))) ||
  (a.id - b.id);

function buildIndexes(ours) {
  const tiers = TIERS.map(() => new Map());
  const sensesIdx = new Map();
  const add = (map, k, o) => { if (!k) return; if (!map.has(k)) map.set(k, new Set()); map.get(k).add(o); };
  for (const o of ours) {
    for (const [i, { key }] of TIERS.entries()) {
      add(tiers[i], key(o.arabic), o);
      if (o.vocalised) add(tiers[i], key(o.vocalised), o);
    }
    for (const s of senses(o.english)) add(sensesIdx, s, o);
  }
  return { tiers, sensesIdx };
}

function letterMatchRow(t, o, tier) {
  const ourAr = o.vocalised || o.arabic;
  const gloss = glossCheck(o.english, t.meaning);
  const h = compareHarakaat(ourAr, t.word, { article: tier === 'T3' });
  const parts = [];
  if (TIER_NOTE[tier]) parts.push(TIER_NOTE[tier]);
  if (gloss === 'disagree') parts.push(`gloss differs: "${o.english}" / "${t.meaning}"`);
  if (h === null) parts.push('harakaat not aligned (letter counts differ)');
  else if (h.diffs.length) parts.push(harakaatText(h.diffs, ourAr, t.word));
  let category;
  if (gloss === 'disagree') category = 'meaning_mismatch';
  else if (h && h.diffs.length) category = 'harakaat_variant';
  else if (tier === 'T2' || tier === 'T3') category = 'spelling_variant';
  else category = 'same';
  return { category, tier, discrepancy: parts.join('; '), harakaat_compared: h ? h.compared : null };
}

/**
 * One output row per (their entry, our id) pair, plus `onlyOurs` for ids no
 * entry of theirs reached. `ours`: { id, arabic, vocalised, english, pos,
 * level, romanization, confidence, mvp }. `theirs`: deduped entries with
 * { word, transliteration, meaning, category, ... }.
 */
// A bound morpheme (ـــكُم, ... ـــي) is not a lexeme and is not compared.
export const isBoundMorpheme = (word) => /\u0640|\.\.\./.test(word ?? '');

export function categorise(theirs, ours) {
  const { tiers, sensesIdx } = buildIndexes(ours);
  const rows = [];
  const touched = new Set();
  const skipped = theirs.filter((t) => isBoundMorpheme(t.word));
  for (const t of theirs) {
    if (isBoundMorpheme(t.word)) continue;
    let hit = null;
    for (const [i, { tier, key }] of TIERS.entries()) {
      const c = tiers[i].get(key(t.word));
      if (c && c.size) { hit = { tier, cands: [...c] }; break; }
    }
    if (hit) {
      const agreeing = hit.cands.filter((o) => glossCheck(o.english, t.meaning) === 'agree');
      const chosen = (agreeing.length ? agreeing : hit.cands).sort(byPriority(t.category)).slice(0, MAX_CANDIDATES);
      for (const o of chosen) {
        touched.add(o.id);
        rows.push({ theirs: t, ours: o, pos_gap: posGap(o.pos, t.category), ...letterMatchRow(t, o, hit.tier) });
      }
      continue;
    }
    const byGloss = new Set();
    for (const s of senses(t.meaning)) for (const o of sensesIdx.get(s) ?? []) byGloss.add(o);
    if (byGloss.size) {
      for (const o of [...byGloss].sort(byPriority(t.category)).slice(0, MAX_CANDIDATES)) {
        touched.add(o.id);
        rows.push({ theirs: t, ours: o, category: 'different_word', tier: null,
          discrepancy: `same gloss, different word: ours ${o.vocalised || o.arabic}, theirs ${t.word}`,
          pos_gap: posGap(o.pos, t.category), harakaat_compared: null });
      }
      continue;
    }
    rows.push({ theirs: t, ours: null, category: 'only_theirs', tier: null,
      discrepancy: 'not in our dictionary', pos_gap: false, harakaat_compared: null });
  }
  const onlyOurs = ours.filter((o) => !touched.has(o.id));
  return { rows, onlyOurs, skipped };
}

/** §4.5: exported unless `same` with no flag. */
export const isExported = (r) => r.category !== 'same' || r.pos_gap;
/** §4.5: categories that reach the model. */
export const MODEL_CATEGORIES = new Set(['harakaat_variant', 'meaning_mismatch', 'different_word', 'only_theirs']);
