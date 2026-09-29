// External dictionary comparison driver (D275, docs/dr/external-compare.md).
//
//   node --use-env-proxy tools/dr/external-compare.mjs snapshot <run_id>
//   node tools/dr/external-compare.mjs compare <run_id>
//   env -u DR_ANTHROPIC_KEY node tools/dr/external-compare.mjs judge <run_id> [--spend-cap 15]
//
// `snapshot` is the only step that reads the database; every later step reads
// the hashed snapshot, so the CSVs describe exactly the bytes that were hashed.
// Nothing here writes to the database.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseCsv, toCsv } from './essentials.mjs';
import { routeRow, cappingCorrections } from './route.mjs';
import { checkArabicScript } from './validate.mjs';
import { categorise, isExported, MODEL_CATEGORIES, americanise } from './external-match.mjs';

export const SOURCE_CSV = 'docs/dr/external/levantine-dictionary.csv';
export const SOURCE_SHA256 = 'e6fe21dbfe57cf3fa9a2badd94dd7544fd7a4929f71f1d304a2455a7d96f6881';
const ESSENTIAL_IDS = 'docs/dr/essentials/essential-ids-final.json';
const JUDGED_RUNS = ['dr-essential-o55-2026-09-27', 'dr-finalize-2026-09-27']; // D273: one 5.5 judgement per id
const REST = 'https://pniwgnjljpkiimssortp.supabase.co/rest/v1';
// §5 estimate band per model-bound row, for the dry run's projection only.
const USD_PER_ROW = [0.002, 0.004];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const runDir = (runId) => path.join('runs', runId);
const writeJson = (file, obj) => { const s = JSON.stringify(obj, null, 1) + '\n'; writeFileSync(file, s); return sha256(s); };
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/** Deduped on (Word, Meaning); topics joined; Level and Root dropped (§2). */
export function dedupeTheirs(csvRows) {
  const byKey = new Map();
  for (const r of csvRows) {
    const word = r.Word.trim(), meaning = r.Meaning.trim();
    const key = `${word}\u0000${meaning}`;
    const seen = byKey.get(key);
    if (seen) { if (r.Topic && !seen.topics.includes(r.Topic)) seen.topics.push(r.Topic); continue; }
    byKey.set(key, {
      word, meaning, transliteration: r.Transliteration.trim(), category: r.Category.trim(),
      topics: r.Topic ? [r.Topic] : [], feminine: r.Feminine, plural: r.Plural,
      superlative: r.Superlative, other_variants: r.OtherVariants,
    });
  }
  return [...byKey.values()];
}

async function pullAll(url) {
  const out = [];
  for (let off = 0; ; off += 1000) {
    const r = await fetch(url, { headers: { Range: `${off}-${off + 999}` } });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const page = await r.json();
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

async function snapshot(runId) {
  const csvText = readFileSync(SOURCE_CSV);
  if (sha256(csvText) !== SOURCE_SHA256) throw new Error(`${SOURCE_CSV}: sha256 does not match the committed source`);
  const dict = await pullAll(`${REST}/dictionary?select=id,arabic,english,pos&order=id.asc`);
  const judged = new Map();
  for (const run of JUDGED_RUNS) {
    for (const s of await pullAll(`${REST}/dictionary_review?select=dictionary_id,payload&run_id=eq.${run}&order=dictionary_id.asc`)) {
      if (judged.has(s.dictionary_id)) throw new Error(`id ${s.dictionary_id} judged twice across ${JUDGED_RUNS}`);
      judged.set(s.dictionary_id, s.payload.model);
    }
  }
  const essential = new Set(readJson(ESSENTIAL_IDS));
  const ours = dict.map((d) => {
    const m = judged.get(d.id);
    if (!m) throw new Error(`id ${d.id} has no round-2 judgement`);
    return {
      id: d.id, arabic: d.arabic, vocalised: m.arabic_vocalised?.value ?? null, english: d.english,
      pos: m.pos ?? d.pos, level: m.level, romanization: m.romanization?.value ?? '',
      confidence: routeRow(m).review_confidence, mvp: essential.has(d.id) ? 1 : 0,
      // Why a row is below 3 (D276), for the review queue.
      held_on: [
        ...(m.romanization?.conf !== 'H' ? [`romanization ${m.romanization?.conf}`] : []),
        ...(m.arabic_vocalised?.conf !== 'H' ? [`vocalised ${m.arabic_vocalised?.conf}`] : []),
        ...(m.native_check ? ['native_check'] : []),
        ...(checkArabicScript(m.arabic_vocalised?.value ?? '') ? ['vocalised has non-Arabic characters'] : []),
        ...cappingCorrections(m.corrections).map((c) => `correction ${c.type} ${c.conf}: ${c.suggested ?? ''}`.trim()),
      ],
    };
  });
  const theirs = dedupeTheirs(parseCsv(csvText.toString('utf8')));
  mkdirSync(runDir(runId), { recursive: true });
  const hashes = {
    source_csv: SOURCE_SHA256,
    ours: writeJson(path.join(runDir(runId), 'ours.json'), ours),
    theirs: writeJson(path.join(runDir(runId), 'theirs-deduped.json'), theirs),
  };
  writeJson(path.join(runDir(runId), 'hashes.json'), hashes);
  console.log(`snapshot ${runId}: ours ${ours.length}, theirs ${theirs.length} deduped`, hashes);
}

function loadSnapshot(runId) {
  const hashes = readJson(path.join(runDir(runId), 'hashes.json'));
  for (const f of ['ours', 'theirs']) {
    const file = path.join(runDir(runId), f === 'ours' ? 'ours.json' : 'theirs-deduped.json');
    if (sha256(readFileSync(file, 'utf8')) !== hashes[f]) throw new Error(`${file}: sha256 does not match hashes.json`);
  }
  return { ours: readJson(path.join(runDir(runId), 'ours.json')), theirs: readJson(path.join(runDir(runId), 'theirs-deduped.json')) };
}

/** The script rows with stable keys, as the model step and the export read them. */
export function scriptRows({ ours, theirs }) {
  const { rows, onlyOurs, skipped } = categorise(theirs, ours);
  return { rows: rows.filter(isExported).map((r, i) => ({ k: `r${i + 1}`, ...r })), onlyOurs,
    same: rows.filter((r) => !isExported(r)).length, skipped: skipped.length };
}

const count = (xs, f) => xs.reduce((m, x) => { const k = f(x); m[k] = (m[k] ?? 0) + 1; return m; }, {});

export function summarise({ rows, onlyOurs, same, skipped }) {
  const modelBound = rows.filter((r) => MODEL_CATEGORIES.has(r.category));
  return {
    same_not_exported: same,
    bound_morphemes_skipped: skipped,
    exported: rows.length,
    by_category: count(rows, (r) => r.category),
    by_category_mvp: count(rows.filter((r) => r.ours?.mvp), (r) => r.category),
    by_category_our_confidence: count(rows.filter((r) => r.ours), (r) => `${r.category} @${r.ours.confidence}`),
    pos_gap: rows.filter((r) => r.pos_gap).length,
    their_entries_exported_with_a_match: new Set(rows.filter((r) => r.ours).map((r) => `${r.theirs.word}|${r.theirs.meaning}`)).size,
    only_ours: onlyOurs.length,
    only_ours_mvp: onlyOurs.filter((o) => o.mvp).length,
    model_bound: modelBound.length,
    model_bound_by_category: count(modelBound, (r) => r.category),
    projected_usd: USD_PER_ROW.map((u) => +(u * modelBound.length).toFixed(2)),
  };
}

// --- §6 export --------------------------------------------------------------
export const DIFF_COLUMNS = ['category', 'verdict', 'their_dialect', 'conf', 'discrepancy', 'note', 'fix', 'pos_gap',
  'our_confidence', 'mvp', 'our_id', 'our_arabic', 'our_romanization', 'our_english', 'our_pos', 'our_level',
  'their_word', 'their_transliteration', 'their_meaning', 'their_category', 'their_topics', 'their_feminine',
  'their_plural', 'their_superlative', 'their_other_variants'];
const CATEGORY_ORDER = ['harakaat_variant', 'meaning_mismatch', 'different_word', 'spelling_variant', 'only_theirs', 'same'];

export function diffRecord(r, v = {}) {
  const o = r.ours, t = r.theirs;
  return {
    category: r.category, verdict: v.v ?? '', their_dialect: v.d ?? '', conf: v.c ?? '', discrepancy: r.discrepancy,
    note: v.n ?? '', fix: v.fix ?? '', pos_gap: r.pos_gap ? 'Y' : '',
    our_confidence: o?.confidence ?? '', mvp: o?.mvp ? 'Y' : '', our_id: o?.id ?? '',
    our_arabic: o ? (o.vocalised || o.arabic) : '', our_romanization: o?.romanization ?? '', our_english: o?.english ?? '',
    our_pos: o?.pos ?? '', our_level: o?.level ?? '', their_word: t.word, their_transliteration: t.transliteration,
    their_meaning: americanise(t.meaning), their_category: t.category, their_topics: t.topics.join(' | '),
    their_feminine: t.feminine, their_plural: t.plural, their_superlative: t.superlative,
    their_other_variants: t.other_variants,
  };
}

export const levelBand = (level) => (level === '' || level == null ? '' : level <= 2 ? '1-2' : level === 3 ? '3' : '4-5');
const BAND_ORDER = ['1-2', '3', '4-5', ''];

/**
 * Level band first, so level 1-2 is worked first (Marwan, chat 31), then MVP,
 * then our_confidence 3 → 1, then category, `ours_wrong` first within it.
 * Rows with no level of ours (only_theirs) sort last.
 */
export function sortRecords(recs) {
  const key = (x) => [BAND_ORDER.indexOf(levelBand(x.our_level)), Number(x.our_level) || 9, x.mvp === 'Y' ? 0 : 1,
    x.our_confidence === '' ? 9 : 3 - x.our_confidence, CATEGORY_ORDER.indexOf(x.category),
    x.verdict === 'ours_wrong' ? 0 : 1, Number(x.our_id) || 0];
  return [...recs].sort((a, b) => {
    const ka = key(a), kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
    return 0;
  });
}

export const REVIEW_COLUMNS = ['level_band', 'our_level', 'mvp', 'our_id', 'our_arabic', 'our_romanization', 'our_english',
  'our_pos', 'confidence', 'reasons', 'external_verdict', 'external_fix', 'external_note', 'their_word', 'their_meaning'];

/**
 * Every id of ours that needs review before it is taught: below 3 under D276,
 * or contradicted by the source (`ours_wrong`, which caps it at 2). Sorted by
 * level band, then level, then MVP, then id.
 */
export function reviewQueue(rows, ours, verdicts = {}) {
  const external = new Map();
  for (const r of rows) {
    const v = verdicts[r.k];
    if (r.ours && v?.v === 'ours_wrong' && !external.has(r.ours.id)) external.set(r.ours.id, { r, v });
  }
  const recs = [];
  for (const o of ours) {
    const ext = external.get(o.id);
    if (o.confidence === 3 && !ext) continue;
    recs.push({
      level_band: levelBand(o.level), our_level: o.level, mvp: o.mvp ? 'Y' : '', our_id: o.id,
      our_arabic: o.vocalised || o.arabic, our_romanization: o.romanization, our_english: o.english, our_pos: o.pos,
      confidence: ext ? Math.min(o.confidence, 2) : o.confidence,
      reasons: [...(o.held_on ?? []), ...(ext ? [`external ${ext.r.category}: ${ext.r.discrepancy}`] : [])].join('; '),
      external_verdict: ext?.v.v ?? '', external_fix: ext?.v.fix ?? '', external_note: ext?.v.n ?? '',
      their_word: ext?.r.theirs.word ?? '', their_meaning: ext ? americanise(ext.r.theirs.meaning) : '',
    });
  }
  return recs.sort((a, b) => (BAND_ORDER.indexOf(a.level_band) - BAND_ORDER.indexOf(b.level_band)) ||
    (a.our_level - b.our_level) || ((b.mvp === 'Y') - (a.mvp === 'Y')) || (a.our_id - b.our_id));
}

export function exportCsvs(runId, rows, onlyOurs, ours, verdicts = {}) {
  const dir = runDir(runId);
  const recs = sortRecords(rows.map((r) => diffRecord(r, verdicts[r.k])));
  writeFileSync(path.join(dir, 'differences.csv'), toCsv(DIFF_COLUMNS, recs));
  const oo = [...onlyOurs].sort((a, b) => (b.mvp - a.mvp) || (a.id - b.id)).map((o) => ({
    our_id: o.id, mvp: o.mvp ? 'Y' : '', our_confidence: o.confidence, our_arabic: o.vocalised || o.arabic,
    our_english: o.english, our_pos: o.pos, our_level: o.level }));
  writeFileSync(path.join(dir, 'review-queue.csv'), toCsv(REVIEW_COLUMNS, reviewQueue(rows, ours, verdicts)));
  writeFileSync(path.join(dir, 'only-ours.csv'),
    toCsv(['our_id', 'mvp', 'our_confidence', 'our_arabic', 'our_english', 'our_pos', 'our_level'], oo));
}

function compare(runId) {
  const snap = loadSnapshot(runId);
  const sr = scriptRows(snap);
  writeJson(path.join(runDir(runId), 'script-rows.json'), sr.rows);
  exportCsvs(runId, sr.rows, sr.onlyOurs, snap.ours);
  const summary = summarise(sr);
  writeJson(path.join(runDir(runId), 'summary-script.json'), summary);
  console.log(JSON.stringify(summary, null, 1));
}

async function main([cmd, runId, ...rest]) {
  if (!runId) throw new Error('usage: external-compare.mjs <snapshot|compare|judge> <run_id>');
  if (cmd === 'snapshot') return snapshot(runId);
  if (cmd === 'compare') return compare(runId);
  if (cmd === 'judge') {
    const { judgeRun } = await import('./external-judge.mjs');
    const i = rest.indexOf('--spend-cap');
    return judgeRun(runId, { spendCap: i >= 0 ? Number(rest[i + 1]) : 15 });
  }
  throw new Error(`unknown command ${cmd}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(1); });
}
