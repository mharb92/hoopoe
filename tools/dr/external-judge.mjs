// Model step of the external dictionary comparison (D275,
// docs/dr/external-compare.md §5). Only the rows the script cannot settle reach
// the model, and the model returns a short verdict code, never prose.
//
// Transport is judge-cli (D260), so the run spends Claude Code allowance and
// refuses to start while DR_ANTHROPIC_KEY is in the environment.

import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { callClaudeCli } from './judge-cli.mjs';
import { parseObjects } from './judge.mjs';
import { MODEL_CATEGORIES, americanise } from './external-match.mjs';
import { exportCsvs, summarise, scriptRows } from './external-compare.mjs';

export const MODEL = 'claude-opus-5-5'; // D273
export const BATCH_SIZE = 60;
export const effortFor = (category) => (category === 'harakaat_variant' ? 'medium' : 'low');

export const VERDICTS = {
  harakaat_variant: ['keep_ours', 'both_valid', 'ours_wrong'],
  meaning_mismatch: ['keep_ours', 'ours_wrong', 'same_sense'],
  different_word: ['keep_ours', 'both_valid', 'ours_wrong'],
  only_theirs: ['add', 'skip'],
};
const DIALECTS = ['pal', 'lev_other', 'msa', 'unsure'];
const CONFS = ['H', 'M', 'L'];
const ARABIC_ONLY = /^[؀-ۿ\s]+$/;

export const SYSTEM = `You compare entries from two Levantine Arabic dictionaries. OURS is a Palestinian Arabic dictionary for learners. THEIRS is a pan-Levantine dictionary, with no dialect marking, that may include Lebanese, Syrian or Jordanian forms and MSA. Your only job is to say, for each row, whether OURS is correct Palestinian Arabic as spoken day to day, and whether THEIRS is Palestinian.

Rules:
- Palestinian here means everyday urban and village Palestinian speech. A form that is only Lebanese, Syrian, Jordanian or MSA is not Palestinian, even if a Palestinian would understand it.
- Harakaat: some differences are regional (for example kasra against fatha in a verb stem). Say both_valid only if both are heard in Palestinian speech. If OURS is the only Palestinian form, say keep_ours.
- Glosses: our verbs are glossed in the past tense and theirs as infinitives. That is not a meaning difference.
- Do not judge romanization, level or register. Do not suggest improvements beyond the verdict.
- When unsure, lower c; never guess ours_wrong.

Verdicts, by category:
- harakaat_variant: keep_ours | both_valid | ours_wrong
- meaning_mismatch: keep_ours | ours_wrong | same_sense (the glosses are worded differently but mean the same thing)
- different_word: keep_ours | both_valid | ours_wrong
- only_theirs: add (Palestinian, a real lexeme, worth adding) | skip (not Palestinian, MSA-only, or not a lexeme)
keep_ours: ours is correct Palestinian; theirs is another region's form, MSA, or an error. ours_wrong: ours is wrong or not Palestinian; put the Palestinian form in fix.

Reply with one JSON object per line, in input order, and nothing else:
{"k":"<key>","v":"<verdict>","d":"pal|lev_other|msa|unsure","c":"H|M|L","fix":"<Arabic, only if v=ours_wrong>","n":"<note, max 12 words, only if v=ours_wrong or add>"}
d is THEIRS' dialect.`;

export function buildUser(category, rows) {
  const lines = rows.map((r) => JSON.stringify({
    k: r.k,
    ours: r.ours ? { ar: r.ours.vocalised || r.ours.arabic, en: r.ours.english, pos: r.ours.pos } : null,
    theirs: { ar: r.theirs.word, tr: r.theirs.transliteration, en: americanise(r.theirs.meaning), pos: r.theirs.category },
    diff: r.discrepancy,
  }));
  const extra = category === 'only_theirs' ? ' For these rows ours is null.'
    : category === 'different_word' ? ' For these rows ours is the entry with the matching gloss.' : '';
  return `Category: ${category}.${extra} Each line is one row:\n${lines.join('\n')}`;
}

/** Returns an error string, or null when the object is valid for its row. */
export function validateVerdict(obj, category) {
  if (!VERDICTS[category].includes(obj.v)) return `v: ${obj.v} not valid for ${category}`;
  if (!DIALECTS.includes(obj.d)) return `d: ${obj.d} not a dialect code`;
  if (!CONFS.includes(obj.c)) return `c: ${obj.c} not H/M/L`;
  if (obj.v === 'ours_wrong' && !(typeof obj.fix === 'string' && ARABIC_ONLY.test(obj.fix.trim()))) return 'fix: missing or not Arabic script';
  if (obj.v !== 'ours_wrong' && obj.fix) return 'fix: only allowed with ours_wrong';
  if (obj.n && String(obj.n).split(/\s+/).length > 12) return 'n: over 12 words';
  return null;
}

async function callBatch(category, rows, callImpl) {
  const res = await callImpl({ message: { system: SYSTEM, user: buildUser(category, rows) }, model: MODEL, effort: effortFor(category) });
  if (res.stopReason && res.stopReason !== 'end_turn') throw new Error(`stop_reason ${res.stopReason}`);
  const byKey = new Map();
  for (const obj of parseObjects(res.raw)) if (obj && typeof obj.k === 'string') byKey.set(obj.k, obj);
  return { byKey, usd: res.usd ?? 0 };
}

/**
 * Runs one category batch with one repair call for missing or invalid keys
 * (§5 checks). Throws on anything still unresolved: the run stops and reports.
 */
export async function judgeBatch(category, rows, callImpl = callClaudeCli) {
  let usd = 0;
  const out = {};
  const settle = (byKey) => {
    const bad = [];
    for (const r of rows) {
      if (out[r.k]) continue;
      const obj = byKey.get(r.k);
      const err = obj ? validateVerdict(obj, category) : 'missing';
      if (err) bad.push({ r, err }); else out[r.k] = { v: obj.v, d: obj.d, c: obj.c, ...(obj.fix ? { fix: obj.fix.trim() } : {}), ...(obj.n ? { n: String(obj.n) } : {}) };
    }
    return bad;
  };
  const first = await callBatch(category, rows, callImpl);
  usd += first.usd;
  let bad = settle(first.byKey);
  let repaired = 0;
  if (bad.length) {
    repaired = bad.length;
    const second = await callBatch(category, bad.map((b) => b.r), callImpl);
    usd += second.usd;
    bad = settle(second.byKey);
  }
  if (bad.length) {
    const e = new Error(`${bad.length} rows unresolved after repair: ${bad.slice(0, 3).map((b) => `${b.r.k} ${b.err}`).join('; ')}`);
    e.partial = { out, usd };
    throw e;
  }
  return { verdicts: out, usd, repaired };
}

export function planBatches(rows, done = {}) {
  const batches = [];
  for (const category of MODEL_CATEGORIES) {
    const todo = rows.filter((r) => r.category === category && !done[r.k]);
    for (let i = 0; i < todo.length; i += BATCH_SIZE) batches.push({ category, rows: todo.slice(i, i + BATCH_SIZE) });
  }
  return batches;
}

export async function judgeRun(runId, { spendCap = 15, callImpl = callClaudeCli, env = process.env } = {}) {
  if (env.DR_ANTHROPIC_KEY) throw new Error('DR_ANTHROPIC_KEY is set: run with env -u DR_ANTHROPIC_KEY (D260)');
  const dir = path.join('runs', runId);
  const vFile = path.join(dir, 'verdicts.json');
  const log = (msg) => { const line = `${new Date().toISOString()} ${msg}`; console.log(line); appendFileSync(path.join(dir, 'judge.log'), line + '\n'); };
  const rows = JSON.parse(readFileSync(path.join(dir, 'script-rows.json'), 'utf8'));
  const state = existsSync(vFile) ? JSON.parse(readFileSync(vFile, 'utf8')) : { usd: 0, verdicts: {} };
  const batches = planBatches(rows, state.verdicts);
  log(`start: ${batches.length} batches, ${Object.keys(state.verdicts).length} rows already judged, $${state.usd.toFixed(4)} spent, cap $${spendCap}`);
  for (const [i, b] of batches.entries()) {
    if (state.usd >= spendCap) { log(`stop: spend cap reached at $${state.usd.toFixed(4)}`); break; }
    try {
      const { verdicts, usd, repaired } = await judgeBatch(b.category, b.rows, callImpl);
      Object.assign(state.verdicts, verdicts);
      state.usd += usd;
      log(`batch ${i + 1}/${batches.length} ${b.category} (${effortFor(b.category)}): ${b.rows.length} rows, ${repaired} repaired, $${usd.toFixed(4)}, total $${state.usd.toFixed(4)}`);
    } catch (e) {
      if (e.partial) { Object.assign(state.verdicts, e.partial.out); state.usd += e.partial.usd; }
      writeFileSync(vFile, JSON.stringify(state, null, 1) + '\n');
      log(`stop: batch ${i + 1} ${b.category}: ${e.message}`);
      throw e;
    }
    writeFileSync(vFile, JSON.stringify(state, null, 1) + '\n');
  }
  const snap = JSON.parse(readFileSync(path.join(dir, 'ours.json'), 'utf8'));
  const theirs = JSON.parse(readFileSync(path.join(dir, 'theirs-deduped.json'), 'utf8'));
  const sr = scriptRows({ ours: snap, theirs });
  exportCsvs(runId, sr.rows, sr.onlyOurs, snap, state.verdicts);
  const judged = sr.rows.filter((r) => state.verdicts[r.k]);
  const tally = (f) => judged.reduce((m, r) => { const k = f(r); m[k] = (m[k] ?? 0) + 1; return m; }, {});
  const summary = {
    ...summarise(sr),
    judged: judged.length,
    verdicts_by_category: tally((r) => `${r.category}: ${state.verdicts[r.k].v}`),
    ours_wrong_by_our_confidence: tally((r) => (state.verdicts[r.k].v === 'ours_wrong' ? `@${r.ours?.confidence}${r.ours?.mvp ? ' mvp' : ''}` : 'other')),
    their_dialect: tally((r) => state.verdicts[r.k].d),
    usd: +state.usd.toFixed(4),
  };
  writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 1) + '\n');
  log(`done: ${judged.length} judged, $${state.usd.toFixed(4)}`);
  return summary;
}
