// JSON contract check for the scoped output (dr-prompt-scoped.md "Output contract").
// One row at a time, plus a batch-level check for id coverage.

export const CONF_VALUES = ['H', 'M', 'L'];
export const POS_VALUES = [
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition',
  'conjunction', 'particle', 'interjection', 'formula', 'frame',
];
export const REGISTER_VALUES = ['neutral', 'slang', 'formal'];
export const FORM_ORIGIN_VALUES = [
  'dialect', 'msa_shared_dialect_pron', 'msa_identical', 'regional_variant',
];
export const CORRECTION_TYPES = [
  'meaning', 'harakaat', 'romanization', 'gender', 'pos', 'root',
  'conjugation', 'tag', 'notes', 'duplicate', 'gap', 'variant',
];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.length > 0;
}

function isConf(v) {
  return CONF_VALUES.includes(v);
}

/**
 * Validates one model-returned row object against the scoped contract.
 * expectedId: the id this object was requested for.
 * Returns { valid: boolean, errors: string[] }.
 */
// Allowed romanization characters (romanization-map.md §3.4, chat-26 scheme).
// `TH` is one grapheme, so a capital H is legal only as its second half; every
// other capital, every digit but 3 and 7, and all other punctuation are rejected.
// The map has claimed "the validator rejects anything else" since D47; until now
// nothing enforced it and capitals, diacritics and stray punctuation all passed.
export const ALLOWED_ROMANIZATION_RE = /^(?:TH|[SDT]|[a-z37'-])+(?: (?:TH|[SDT]|[a-z37'-])+)*$/;

/** Returns null when clean, else the first offending character. */
export function checkCharset(value) {
  if (typeof value !== 'string' || value.length === 0) return '(empty)';
  // 879 dictionary rows are phrases, so a single interior space is legal. The map
  // omitted whitespace from §3.4 because it was written describing single words;
  // enforcing it literally rejected every phrase. Leading, trailing and doubled
  // spaces stay illegal — rulefix collapses those before the model ever sees them.
  if (value !== value.trim() || value.includes('  ')) return '(stray whitespace)';
  for (let i = 0; i < value.length; i++) {
    if (value.startsWith('TH', i)) { i += 1; continue; }   // one grapheme
    const ch = value[i];
    if (ch === 'S' || ch === 'D' || ch === 'T') continue;  // the emphatics
    if (ch === ' ') continue;                              // single interior space
    if (/[a-z37'-]/.test(ch)) continue;
    return ch;
  }
  return null;
}

export function validateRow(obj, expectedId) {
  const errors = [];

  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return { valid: false, errors: ['row is not an object'] };
  }

  if (!Number.isInteger(obj.id)) {
    errors.push('id: missing or not an integer');
  } else if (obj.id !== expectedId) {
    errors.push(`id: mismatch — expected ${expectedId}, got ${obj.id}`);
  }

  if (!Number.isInteger(obj.level) || obj.level < 1 || obj.level > 5) {
    errors.push('level: missing or not an integer 1-5');
  }
  if (!isNonEmptyString(obj.level_reason)) errors.push('level_reason: missing or empty');
  if (!isConf(obj.level_conf)) errors.push('level_conf: missing or not H/M/L');

  if (!POS_VALUES.includes(obj.pos)) errors.push(`pos: not one of ${POS_VALUES.join(', ')}`);
  if (!REGISTER_VALUES.includes(obj.register)) errors.push(`register: not one of ${REGISTER_VALUES.join(', ')}`);
  if (!FORM_ORIGIN_VALUES.includes(obj.form_origin)) {
    errors.push(`form_origin: not one of ${FORM_ORIGIN_VALUES.join(', ')}`);
  }
  if (!isConf(obj.enum_conf)) errors.push('enum_conf: missing or not H/M/L');

  const rom = obj.romanization;
  if (!rom || typeof rom !== 'object' || !isNonEmptyString(rom.value) || !isConf(rom.conf) ||
      typeof rom.changed !== 'boolean') {
    errors.push('romanization: must be {value, conf, changed}');
  } else {
    const bad = checkCharset(rom.value);
    if (bad) errors.push(`romanization.value: illegal character ${JSON.stringify(bad)} in "${rom.value}"`);
  }

  const vocalised = obj.arabic_vocalised;
  if (!vocalised || typeof vocalised !== 'object' || !isNonEmptyString(vocalised.value) || !isConf(vocalised.conf)) {
    errors.push('arabic_vocalised: must be {value, conf}');
  }

  if (typeof obj.native_check !== 'boolean') errors.push('native_check: missing or not a boolean');

  // D267: collected, never scored. `pair` and `constituents` are evidence for the
  // formula_pair table and the C5.5 pool check; they carry no confidence and are
  // deliberately absent from route.mjs's critical set, because the minimum rule
  // means any new scored field drags review_confidence down for the whole row.
  if (obj.pair !== undefined && !isNonEmptyString(obj.pair)) {
    errors.push('pair: must be the other half as a non-empty Arabic string, or absent');
  }
  if (obj.constituents !== undefined) {
    if (!Array.isArray(obj.constituents) || obj.constituents.some((c) => !isNonEmptyString(c))) {
      errors.push('constituents: must be an array of non-empty strings, or absent');
    }
  }

  if (obj.corrections !== undefined) {
    if (!Array.isArray(obj.corrections) || obj.corrections.length === 0) {
      errors.push('corrections: if present must be a non-empty array');
    } else {
      obj.corrections.forEach((c, i) => {
        if (!c || typeof c !== 'object') {
          errors.push(`corrections[${i}]: not an object`);
          return;
        }
        if (!isNonEmptyString(c.field)) errors.push(`corrections[${i}].field: missing`);
        if (!CORRECTION_TYPES.includes(c.type)) errors.push(`corrections[${i}].type: not a known type`);
        if (!isNonEmptyString(c.reason)) errors.push(`corrections[${i}].reason: missing`);
        if (!isConf(c.conf)) errors.push(`corrections[${i}].conf: not H/M/L`);
        if (!('suggested' in c)) errors.push(`corrections[${i}].suggested: missing`);
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a batch response against the ids that were requested.
 * Returns { valid, missingIds, extraIds, duplicateIds, rowResults }
 * where rowResults maps id -> validateRow() result for every id seen.
 */
export function validateBatch(requestedIds, responseArray) {
  const requested = new Set(requestedIds);
  const seen = new Map(); // id -> count
  const rowResults = new Map();
  const extraIds = [];

  const items = Array.isArray(responseArray) ? responseArray : [];
  for (const obj of items) {
    const id = Number.isInteger(obj?.id) ? obj.id : undefined;
    if (id === undefined) continue; // caught per-row by validateRow when matched below
    seen.set(id, (seen.get(id) ?? 0) + 1);
    if (!requested.has(id)) extraIds.push(id);
    rowResults.set(id, validateRow(obj, id));
  }

  const missingIds = requestedIds.filter((id) => !seen.has(id));
  const duplicateIds = [...seen.entries()].filter(([, count]) => count > 1).map(([id]) => id);

  const allRowsValid = [...rowResults.values()].every((r) => r.valid);
  const valid = missingIds.length === 0 && extraIds.length === 0 && duplicateIds.length === 0 && allRowsValid;

  return { valid, missingIds, extraIds, duplicateIds, rowResults };
}
