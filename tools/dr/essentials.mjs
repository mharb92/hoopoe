// Cross-references two external essentials lists against the dictionary, and
// emits the CSVs that decide what gets judged first (D265-D268).
//
// The lists are a PRIORITY signal only. Their romanization is MSA-flavoured
// (`qahooa`, `is-salamoo 3alaykoom`) and is never read: ours is better and stays.
// What they contribute is which rows a learner meets first, plus — for the
// phrase list — call-and-response adjacency, which is free `pair` evidence.
//
// Nothing here writes to the database. It produces files for a human to read
// and the id list the next judging run consumes.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

// --- Arabic normalisation for matching only --------------------------------
// The stored value is never rewritten by any of this; these forms exist so that
// قَهْوَة and قهوة are recognised as the same word across two sources that
// vowel their text differently.
const HARAKAAT = /[ً-ْٰـ]/g;
const normalise = (s) => (s ?? '').replace(HARAKAAT, '').trim();
// Second tier: fold the distinctions that two sources spell inconsistently.
const fold = (s) => normalise(s)
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/\s+/g, ' ');

export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', q = false;
  const t = text.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"' && t[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (cols, rows) =>
  [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n';

/**
 * Call-and-response halves sit on adjacent rows in the phrase list, and the
 * English marks the second one. D141 deferred `pair` to a second pass because
 * detecting it needs both halves in view; here they already are, so this is
 * evidence collected for free rather than a judgement made early.
 */
export const REPLY_RE = /\(reply\)|\(response\)|too!|reply \(/i;
export function harvestPairs(phraseRows) {
  const pairs = [];
  for (let i = 0; i < phraseRows.length - 1; i++) {
    const a = phraseRows[i], b = phraseRows[i + 1];
    if (a.Situation === b.Situation && REPLY_RE.test(b.English ?? '')) {
      pairs.push({ call_arabic: a.Arabic, call_en: a.English, reply_arabic: b.Arabic,
        reply_en: b.English, situation: a.Situation });
    }
  }
  return pairs;
}

// A bound morpheme, not a lexeme: written with tatweel in the source list.
export const isBoundMorpheme = (arabic) => (arabic ?? '').includes('ـ');
// The Details column of the word list bleeds Arabic from the adjacent card when
// one flashcard was split across two rows (لا / شكراً, آي / تي / ام).
export const isSplitCard = (details) => /[؀-ۿ]/.test(details ?? '');

export function buildIndex(dictRows) {
  const exact = new Map(), folded = new Map(), byEnglish = new Map();
  for (const d of dictRows) {
    const n = normalise(d.arabic), f = fold(d.arabic);
    if (!exact.has(n)) exact.set(n, d);
    if (!folded.has(f)) folded.set(f, d);
    const e = (d.english ?? '').toLowerCase().trim();
    if (e && !byEnglish.has(e)) byEnglish.set(e, d);
  }
  return { exact, folded, byEnglish };
}

/**
 * Three tiers, and the middle one is the point: a folded-only match means the
 * two sources spell the same word differently, which is a flag for Marwan
 * rather than a silent merge.
 */
export function matchOne(entry, index) {
  const n = normalise(entry.arabic), f = fold(entry.arabic);
  if (index.exact.has(n)) return { row: index.exact.get(n), how: 'exact' };
  if (index.folded.has(f)) return { row: index.folded.get(f), how: 'spelling-mismatch' };
  const e = (entry.english ?? '').toLowerCase().trim();
  if (e && index.byEnglish.has(e)) return { row: index.byEnglish.get(e), how: 'english-only' };
  return { row: null, how: 'missing' };
}

// --- entry point -----------------------------------------------------------

function main() {
  const [wordsPath, phrasesPath, dictPath, outDir] = process.argv.slice(2);
  if (!outDir) {
    console.error('usage: node tools/dr/essentials.mjs <words.csv> <phrases.csv> <dict.json> <outDir>');
    return 1;
  }
  const words = parseCsv(readFileSync(wordsPath, 'utf8'));
  const phrases = parseCsv(readFileSync(phrasesPath, 'utf8'));
  const dict = JSON.parse(readFileSync(dictPath, 'utf8'));
  const index = buildIndex(dict);

  // One pool, deduped across both sources. Rank is the word list's own row
  // order (1..N), which is its priority ordering; phrases carry no ordering of
  // their own and are deliberately flat (Marwan, chat 26).
  const pool = new Map();
  const add = (arabic, english, source, extra) => {
    const key = fold(arabic);
    if (!key) return;
    const prev = pool.get(key);
    if (prev) { prev.sources.add(source); Object.assign(prev, { ...extra, ...prev }); return; }
    pool.set(key, { arabic, english, sources: new Set([source]), ...extra });
  };
  words.forEach((r, i) => add(r.Word, r.Details, 'words',
    { rank: i + 1, page: Number(r.Page) || null, split_card: isSplitCard(r.Details), bound: isBoundMorpheme(r.Word) }));
  phrases.forEach((r) => add(r.Arabic, r.English, 'phrases',
    { situation: r.Situation, words_in_phrase: normalise(r.Arabic).split(/\s+/).length }));

  const matched = [], missing = [], mismatches = [], variants = [], bound = [], split = [];
  for (const e of pool.values()) {
    const row = { ...e, sources: [...e.sources].join('+') };
    if (e.bound) { bound.push(row); continue; }
    if (e.split_card) { split.push(row); continue; }
    const m = matchOne(e, index);
    if (m.how === 'missing') { missing.push(row); continue; }
    const out = { ...row, dictionary_id: m.row.id, our_arabic: m.row.arabic,
      our_romanization: m.row.romanization, our_english: m.row.english,
      our_pos: m.row.pos, our_category: m.row.category, match: m.how };
    matched.push(out);
    // Two different findings, deliberately not one bucket. A folded match is the
    // same word spelled differently. An english-only match is a DIFFERENT Arabic
    // word for the same gloss — مَنخار against our أَنْف, أُصبِع against our صْبَاع —
    // which usually means their list has the dialectal form and ours has the MSA
    // one. That is a content problem, not an orthography one.
    if (m.how === 'spelling-mismatch') mismatches.push(out);
    if (m.how === 'english-only') variants.push(out);
  }

  mkdirSync(outDir, { recursive: true });
  const bySource = (r) => (r.rank ?? 99999);
  matched.sort((a, b) => bySource(a) - bySource(b));
  missing.sort((a, b) => bySource(a) - bySource(b));

  const W = (name, cols, rows) => {
    writeFileSync(path.join(outDir, name), toCsv(cols, rows));
    console.log(`${name}: ${rows.length}`);
  };
  W('essential-matched.csv',
    ['dictionary_id', 'arabic', 'our_arabic', 'our_romanization', 'english', 'our_english',
      'our_pos', 'our_category', 'sources', 'rank', 'page', 'situation', 'match'], matched);
  W('essential-missing.csv',
    ['arabic', 'english', 'sources', 'rank', 'page', 'situation', 'words_in_phrase'], missing);
  W('essential-spelling-mismatches.csv',
    ['dictionary_id', 'arabic', 'our_arabic', 'english', 'our_english', 'match', 'sources'], mismatches);
  W('essential-different-word.csv',
    ['dictionary_id', 'arabic', 'our_arabic', 'our_romanization', 'english', 'our_english',
      'our_pos', 'sources', 'rank'], variants);
  W('essential-bound-morphemes.csv', ['arabic', 'english', 'sources', 'rank', 'page'], bound);
  W('essential-split-cards.csv', ['arabic', 'english', 'sources', 'rank', 'page'], split);
  W('essential-pairs.csv',
    ['call_arabic', 'call_en', 'reply_arabic', 'reply_en', 'situation'], harvestPairs(phrases));

  // The id list the next judging run consumes: judge these first (Marwan, chat 26).
  const ids = [...new Set(matched.map((m) => m.dictionary_id))].sort((a, b) => a - b);
  writeFileSync(path.join(outDir, 'essential-ids.json'), `${JSON.stringify(ids)}\n`);
  console.log(`essential-ids.json: ${ids.length} dictionary rows to judge first`);
  return 0;
}

if (process.argv[1] && process.argv[1].endsWith('essentials.mjs')) process.exit(main());
