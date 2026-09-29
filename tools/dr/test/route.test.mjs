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
const corr = (type, conf) => [{ field: 'notes', suggested: 'x', type, reason: 'r', conf }];

test('all-H, no native_check -> status auto, review_confidence 3', () => {
  const { status, routing, review_confidence } = routeRow(goodRow());
  assert.equal(status, 'auto');
  assert.deepEqual(routing, { level: 'auto', enum: 'auto', romanization: 'auto', arabic_vocalised: 'auto' });
  assert.equal(review_confidence, 3);
});

test('D276: level and enum confidence are recorded but neither score nor hold the row', () => {
  for (const conf of ['M', 'L']) {
    const { status, routing, review_confidence } = routeRow(goodRow({ level_conf: conf, enum_conf: conf }));
    assert.equal(routing.level, 'held');
    assert.equal(routing.enum, 'held');
    assert.equal(review_confidence, 3);
    assert.equal(status, 'auto');
  }
});

test('an M on romanization or arabic_vocalised holds the row at 2', () => {
  for (const row of [goodRow({ romanization: { value: 'x', conf: 'M', changed: false } }),
    goodRow({ arabic_vocalised: { value: 'مَبْرُوك', conf: 'M' } })]) {
    const { status, review_confidence } = routeRow(row);
    assert.equal(status, 'held');
    assert.equal(review_confidence, 2);
  }
});

test('an L on a pronunciation field scores 1, regardless of other signals', () => {
  const row = goodRow({ arabic_vocalised: { value: 'مَبْرُوك', conf: 'L' }, native_check: true });
  const { status, review_confidence } = routeRow(row);
  assert.equal(status, 'held');
  assert.equal(review_confidence, 1);
});

test('native_check true holds the row at 2 even with all-H confidences', () => {
  const { status, review_confidence } = routeRow(goodRow({ native_check: true }));
  assert.equal(status, 'held');
  assert.equal(review_confidence, 2);
});

test('D274/D276: an M or L correction to meaning or the Arabic caps at 2 and holds', () => {
  for (const type of ['meaning', 'harakaat', 'romanization', 'variant', 'conjugation', 'root', 'gender']) {
    for (const conf of ['M', 'L']) {
      const { status, review_confidence } = routeRow(goodRow({ corrections: corr(type, conf) }));
      assert.equal(review_confidence, 2, `${type} ${conf}`);
      assert.equal(status, 'held', `${type} ${conf}`);
    }
  }
});

test('D274/D276: an H correction applies cleanly and does not cap', () => {
  for (const type of ['meaning', 'harakaat', 'romanization', 'conjugation']) {
    assert.equal(routeRow(goodRow({ corrections: corr(type, 'H') })).review_confidence, 3, type);
  }
});

test('notes, pos, tag, duplicate and gap never cap, at any confidence', () => {
  for (const type of ['notes', 'pos', 'tag', 'duplicate', 'gap']) {
    assert.equal(routeRow(goodRow({ corrections: corr(type, 'L') })).review_confidence, 3, type);
  }
});

test('a non-Arabic character in arabic_vocalised scores 1 (chat 31: Hebrew niqqud in staged rows)', () => {
  const { status, review_confidence } = routeRow(goodRow({ arabic_vocalised: { value: 'מִשְמִש', conf: 'H' } }));
  assert.equal(review_confidence, 1);
  assert.equal(status, 'held');
  assert.equal(routeRow(goodRow({ arabic_vocalised: { value: 'بِدَّك كَمَان؟', conf: 'H' } })).review_confidence, 3);
});
