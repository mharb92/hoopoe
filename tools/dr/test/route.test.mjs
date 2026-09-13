import { test } from 'node:test';
import assert from 'node:assert/strict';
import { routeRow } from '../route.mjs';

function goodRow(overrides = {}) {
  return {
    level_conf: 'H',
    enum_conf: 'H',
    romanization: { value: 'mabrook', conf: 'H', changed: true },
    arabic_vocalised: { value: 'مَبْرُوك', conf: 'H' },
    native_check: false,
    corrections: undefined,
    ...overrides,
  };
}

test('all-H, no native_check -> status auto, review_confidence 3', () => {
  const { status, routing, review_confidence } = routeRow(goodRow());
  assert.equal(status, 'auto');
  assert.deepEqual(routing, { level: 'auto', enum: 'auto', romanization: 'auto', arabic_vocalised: 'auto' });
  assert.equal(review_confidence, 3);
});

test('any M holds the row and caps review_confidence at 2', () => {
  const row = goodRow({ level_conf: 'M' });
  const { status, routing, review_confidence } = routeRow(row);
  assert.equal(status, 'held');
  assert.equal(routing.level, 'held');
  assert.equal(review_confidence, 2);
});

test('any L holds the row and caps review_confidence at 1, regardless of other fields', () => {
  const row = goodRow({ level_conf: 'L', enum_conf: 'H' });
  const { status, review_confidence } = routeRow(row);
  assert.equal(status, 'held');
  assert.equal(review_confidence, 1);
});

test('native_check true holds the row even with all-H confidences', () => {
  const row = goodRow({ native_check: true });
  const { status, review_confidence } = routeRow(row);
  assert.equal(status, 'held');
  assert.equal(review_confidence, 2);
});

test('a flagged correction of type meaning/harakaat/romanization caps review_confidence at 2 even with all-H', () => {
  const row = goodRow({
    corrections: [{ field: 'notes', suggested: 'x', type: 'meaning', reason: 'wrong gloss', conf: 'H' }],
  });
  const { status, review_confidence } = routeRow(row);
  // status still reflects field confidences (all H, native_check false) -> auto per §7.2,
  // but review_confidence is capped at 2 per dr-scoped-pass.md §3.
  assert.equal(status, 'auto');
  assert.equal(review_confidence, 2);
});

test('a non-capping correction type (e.g. notes) does not cap review_confidence', () => {
  const row = goodRow({
    corrections: [{ field: 'notes', suggested: 'x', type: 'notes', reason: 'usage not recorded', conf: 'M' }],
  });
  const { review_confidence } = routeRow(row);
  assert.equal(review_confidence, 3);
});

test('L always wins over M and native_check for review_confidence (minimum across critical fields)', () => {
  const row = goodRow({ level_conf: 'L', enum_conf: 'M', native_check: true });
  const { review_confidence } = routeRow(row);
  assert.equal(review_confidence, 1);
});
