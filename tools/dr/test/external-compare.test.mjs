import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewQueue, sortRecords, levelBand, dedupeTheirs } from '../external-compare.mjs';

const o = (id, level, confidence, extra = {}) => ({ id, level, confidence, arabic: 'ا', vocalised: 'ا', english: 'e',
  romanization: 'a', pos: 'noun', mvp: 0, held_on: confidence < 3 ? ['romanization M'] : [], ...extra });

test('level bands: 1-2, 3, 4-5', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(levelBand), ['1-2', '1-2', '3', '4-5', '4-5']);
});

test('review queue: below-3 rows plus ours_wrong rows, sorted by level band first', () => {
  const ours = [o(1, 4, 2), o(2, 1, 3), o(3, 3, 1), o(4, 2, 2, { mvp: 1 }), o(5, 2, 2), o(6, 1, 3)];
  const rows = [{ k: 'r1', category: 'harakaat_variant', discrepancy: 'harakaat: x', ours: ours[1],
    theirs: { word: 'و', meaning: 'Yoghurt' } }];
  const q = reviewQueue(rows, ours, { r1: { v: 'ours_wrong', fix: 'وَ', n: 'n' } });
  assert.deepEqual(q.map((x) => x.our_id), [2, 4, 5, 3, 1]); // 6 is a 3 with no external flag
  assert.equal(q[0].confidence, 2); // ours_wrong caps at 2 (D276)
  assert.equal(q[0].external_fix, 'وَ');
  assert.equal(q[0].their_meaning, 'Yogurt');
  assert.match(q[1].reasons, /romanization M/);
});

test('differences sort: level band first, rows with no level of ours last', () => {
  const r = (our_level, category, extra = {}) => ({ our_level, category, mvp: '', our_confidence: 3, verdict: '', our_id: 1, ...extra });
  const s = sortRecords([r('', 'only_theirs'), r(4, 'harakaat_variant'), r(2, 'different_word'), r(1, 'meaning_mismatch')]);
  assert.deepEqual(s.map((x) => x.our_level), [1, 2, 4, '']);
});

test('dedupe on (Word, Meaning), joining topics', () => {
  const row = (Topic, Meaning = 'm') => ({ Topic, Word: 'و', Meaning, Transliteration: '', Category: '', Feminine: '', Plural: '', Superlative: '', OtherVariants: '' });
  const d = dedupeTheirs([row('Food'), row('Home'), row('Food', 'other')]);
  assert.equal(d.length, 2);
  assert.deepEqual(d[0].topics, ['Food', 'Home']);
});
