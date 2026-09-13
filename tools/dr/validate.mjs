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
  }

  const vocalised = obj.arabic_vocalised;
  if (!vocalised || typeof vocalised !== 'object' || !isNonEmptyString(vocalised.value) || !isConf(vocalised.conf)) {
    errors.push('arabic_vocalised: must be {value, conf}');
  }

  if (typeof obj.native_check !== 'boolean') errors.push('native_check: missing or not a boolean');

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
