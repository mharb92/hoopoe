// Deterministic stub for the model seam, for B3's done-when: the full pipeline
// end to end with no Anthropic call and no money spent. Same return shape as
// judge.mjs. Lives under test/ so no shipped module contains a fake-data
// generator; run.mjs reaches it only via an explicit --judge-from, which itself
// requires --no-stage, so stub output can never reach dictionary_review.
//
// Values are derived from the row id, so a run is reproducible. They are
// synthetic: nothing here is a judgement about any Arabic word.

import { POS_VALUES } from '../validate.mjs';

const CONF = ['H', 'H', 'H', 'H', 'M', 'H', 'H', 'L'];
const FORM_ORIGIN_BY_TAG = { D: 'dialect', M: 'msa_shared_dialect_pron', S: 'msa_identical', 'D-var': 'regional_variant' };
const FLIP = { oo: 'uu', uu: 'oo', ee: 'ii', ii: 'ee' };

function posOf(row) {
  const p = String(row.pos ?? '').toLowerCase();
  return POS_VALUES.includes(p) ? p : 'noun';
}

// Rewrites one long vowel to its conflated partner on every third row, so P10
// sees a non-zero flip rate. A real pass decides this per word (D210).
function romanizationOf(row) {
  const src = String(row.romanization ?? 'kalima');
  if (row.id % 3 !== 0) return { value: src, changed: false };
  const m = /(oo|uu|ee|ii)/.exec(src);
  if (!m) return { value: src, changed: false };
  return { value: src.slice(0, m.index) + FLIP[m[1]] + src.slice(m.index + 2), changed: true };
}

export function stubObject(row) {
  const pos = posOf(row);
  const rom = romanizationOf(row);
  const obj = {
    id: row.id,
    level: pos === 'verb' ? 1 + (row.id % 2) : 1 + (row.id % 5),
    level_reason: 'stub judgement, derived from the row id',
    level_conf: CONF[row.id % CONF.length],
    pos,
    register: 'neutral',
    form_origin: FORM_ORIGIN_BY_TAG[row.dialect_tag] ?? 'dialect',
    enum_conf: CONF[(row.id + 3) % CONF.length],
    romanization: { value: rom.value, conf: CONF[(row.id + 1) % CONF.length], changed: rom.changed },
    arabic_vocalised: { value: String(row.arabic ?? 'كلمة'), conf: CONF[(row.id + 2) % CONF.length] },
    native_check: row.id % 17 === 0,
  };
  if (row.id % 23 === 0) {
    obj.corrections = [{ field: 'notes', current: row.notes ?? null, suggested: 'stub note',
      type: 'notes', reason: 'stub correction', conf: 'M' }];
  }
  return obj;
}

export async function judge(rows, cfg = {}) {
  const objects = rows.map(stubObject);
  const raw = JSON.stringify(objects);
  return {
    objects,
    requestedIds: rows.map((r) => r.id),
    // Shaped like a cached-system-prompt call so cost metering has all four
    // buckets to price: uncached input, a cache write on the first call of a
    // run, cache reads after it, and output that scales with the batch.
    usage: {
      input_tokens: 40 * rows.length,
      cache_creation_input_tokens: rows[0].id % 2 === 0 ? 3200 : 0,
      cache_read_input_tokens: rows[0].id % 2 === 0 ? 0 : 3200,
      output_tokens: 180 * rows.length,
    },
    model: cfg.model ?? 'claude-opus-5',
    effort: cfg.effort ?? 'high',
    stopReason: 'end_turn',
    raw,
  };
}

export default judge;
