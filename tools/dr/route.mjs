// Confidence -> status routing and review_confidence derivation
// (dr-runner-spec.md §7.2, dr-scoped-pass.md §3 as amended by D276). No pair
// rule: scoped pass collects no pair claims.
//
// D276: review_confidence says whether the word's data is accurate — its
// pronunciation and its Arabic — not how sure the model is of its level band.
// `level_conf` and `enum_conf` are still recorded in `routing`, but no longer
// score or hold a row. Row status follows the score: only a 3 is `auto`.

import { checkArabicScript } from './validate.mjs';

// Pronunciation fields: the only field confidences that score a row (D276).
const SCORED_FIELDS = ['romanization', 'arabic_vocalised'];

// D274: M/L corrections to the Arabic are not applied, so the source value
// stays unverified; M/L `meaning` fixes apply but still cap (D245's open point,
// settled by D276). H corrections apply cleanly and do not cap. `notes`, `pos`,
// `tag`, `duplicate` and `gap` never cap.
const CORRECTION_TYPES_THAT_CAP_SCORE = new Set(
  ['meaning', 'harakaat', 'romanization', 'variant', 'conjugation', 'root', 'gender']);

function isAuto(conf) {
  return conf === 'H';
}

/** The corrections that hold a row at 2: M or L, to the meaning or the Arabic. */
export function cappingCorrections(corrections) {
  return Array.isArray(corrections)
    ? corrections.filter((c) => c?.conf !== 'H' && CORRECTION_TYPES_THAT_CAP_SCORE.has(c?.type))
    : [];
}

function hasCappingCorrection(corrections) {
  return cappingCorrections(corrections).length > 0;
}

/**
 * Routes one validated model row to a per-field status, an overall row status,
 * and a 1-3 review_confidence score.
 * Assumes `obj` has already passed validate.mjs's validateRow.
 */
export function routeRow(obj) {
  const fieldConf = {
    level: obj.level_conf,
    enum: obj.enum_conf, // covers pos, register, form_origin as one shared confidence
    romanization: obj.romanization.conf,
    arabic_vocalised: obj.arabic_vocalised.conf,
  };

  const routing = {};
  for (const [field, conf] of Object.entries(fieldConf)) {
    routing[field] = isAuto(conf) ? 'auto' : 'held';
  }

  const scoredConfs = SCORED_FIELDS.map((f) => fieldConf[f]);
  let review_confidence;
  // Staged rows predate validate.mjs's script check, and promotion re-derives
  // from them, so a non-Arabic vocalised value scores 1 here as well.
  if (scoredConfs.includes('L') || (typeof obj.arabic_vocalised?.value === 'string' && checkArabicScript(obj.arabic_vocalised.value) !== null)) {
    review_confidence = 1;
  } else if (scoredConfs.includes('M') || obj.native_check === true || hasCappingCorrection(obj.corrections)) {
    review_confidence = 2;
  } else {
    review_confidence = 3;
  }

  const status = review_confidence === 3 ? 'auto' : 'held';
  return { status, routing, review_confidence };
}
