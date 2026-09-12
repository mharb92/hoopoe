// Confidence -> status routing and review_confidence derivation
// (dr-runner-spec.md §7.2, dr-scoped-pass.md §3). No pair rule: scoped pass
// collects no pair claims.

const CORRECTION_TYPES_THAT_CAP_SCORE = new Set(['meaning', 'harakaat', 'romanization']);

function isAuto(conf) {
  return conf === 'H';
}

function hasCappingCorrection(corrections) {
  return Array.isArray(corrections) && corrections.some((c) => CORRECTION_TYPES_THAT_CAP_SCORE.has(c?.type));
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

  const allFieldsAuto = Object.values(routing).every((s) => s === 'auto');
  const status = allFieldsAuto && obj.native_check === false ? 'auto' : 'held';

  const criticalConfs = Object.values(fieldConf);
  const anyL = criticalConfs.includes('L');
  const anyM = criticalConfs.includes('M');
  const cappingCorrection = hasCappingCorrection(obj.corrections);

  let review_confidence;
  if (anyL) {
    review_confidence = 1;
  } else if (anyM || obj.native_check === true || cappingCorrection) {
    review_confidence = 2;
  } else {
    review_confidence = 3;
  }

  return { status, routing, review_confidence };
}
