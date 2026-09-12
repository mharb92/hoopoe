import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRow, validateBatch } from '../validate.mjs';

function goodRow(id = 284) {
  return {
    id,
    level: 1,
    level_reason: 'obligatory congratulation formula, needed week 1',
    level_conf: 'H',
    pos: 'formula',
    register: 'neutral',
    form_origin: 'msa_identical',
    enum_conf: 'H',
    romanization: { value: 'mabrook', conf: 'H', changed: true },
    arabic_vocalised: { value: 'مَبْرُوك', conf: 'H' },
    native_check: false,
  };
}

test('accepts a well-formed row', () => {
  const { valid, errors } = validateRow(goodRow(), 284);
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test('rejects missing level', () => {
  const row = goodRow();
  delete row.level;
  const { valid, errors } = validateRow(row, 284);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('level:')));
});

test('rejects bad enum values (pos, register, form_origin)', () => {
  const row = { ...goodRow(), pos: 'Phrase', register: 'MSA', form_origin: 'msa' };
  const { valid, errors } = validateRow(row, 284);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.startsWith('pos:')));
  assert.ok(errors.some((e) => e.startsWith('register:')));
  assert.ok(errors.some((e) => e.startsWith('form_origin:')));
});

test('rejects id mismatch', () => {
  const { valid, errors } = validateRow(goodRow(999), 284);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('mismatch')));
});

test('accepts a valid corrections entry, rejects an empty corrections array', () => {
  const withCorrection = {
    ...goodRow(),
    corrections: [{ field: 'notes', current: null, suggested: 'x', type: 'notes', reason: 'usage not recorded', conf: 'M' }],
  };
  assert.equal(validateRow(withCorrection, 284).valid, true);

  const empty = { ...goodRow(), corrections: [] };
  assert.equal(validateRow(empty, 284).valid, false);
});

test('validateBatch: every requested id returned exactly once passes', () => {
  const requested = [1, 2, 3];
  const response = requested.map((id) => goodRow(id));
  const result = validateBatch(requested, response);
  assert.equal(result.valid, true);
  assert.deepEqual(result.missingIds, []);
  assert.deepEqual(result.extraIds, []);
});

test('validateBatch: rejects extra rows not requested', () => {
  const requested = [1, 2];
  const response = [goodRow(1), goodRow(2), goodRow(3)];
  const result = validateBatch(requested, response);
  assert.equal(result.valid, false);
  assert.deepEqual(result.extraIds, [3]);
});

test('validateBatch: reports missing ids', () => {
  const requested = [1, 2, 3];
  const response = [goodRow(1), goodRow(2)];
  const result = validateBatch(requested, response);
  assert.equal(result.valid, false);
  assert.deepEqual(result.missingIds, [3]);
});

test('validateBatch: reports duplicate ids in the response', () => {
  const requested = [1, 2];
  const response = [goodRow(1), goodRow(1), goodRow(2)];
  const result = validateBatch(requested, response);
  assert.equal(result.valid, false);
  assert.deepEqual(result.duplicateIds, [1]);
});
