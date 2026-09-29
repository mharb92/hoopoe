import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  skeleton, fold, stripArticle, compareHarakaat, senses, glossCheck, posGap, categorise, isExported, isBoundMorpheme,
} from '../external-match.mjs';

test('T1 skeleton strips harakaat and tatweel only', () => {
  assert.equal(skeleton('كِتِب'), 'كتب');
  assert.equal(skeleton('كَـتَب'), 'كتب');
  assert.equal(skeleton('إِجَا'), 'إجا');
});

test('T2 fold: alif seats, taa marbuta, and word-final ى/ا/ي as one class', () => {
  assert.equal(fold('إِجى'), fold('إِجَا')); // the D265 matcher missed 530 on this
  assert.equal(fold('اسْتَنّا'), fold('اسْتَنَّى'));
  assert.equal(fold('مَشى'), fold('مِشِي'));
  assert.equal(fold('جِبنة'), fold('جبنه'));
  assert.equal(fold('أكل'), fold('اكل'));
  assert.notEqual(fold('بيت'), fold('بات')); // only word-final ى/ا/ي fold
});

test('T3 strips a leading article, never a short word', () => {
  assert.equal(stripArticle('الجُمعة'), fold('جمعة'));
  assert.equal(stripArticle('الي'), fold('الي'));
});

test('harakaat: only letters marked on both sides are compared', () => {
  const r = compareHarakaat('شُورْبَة', 'شوربة');
  assert.deepEqual(r, { compared: 0, diffs: [] });
});

test('harakaat: a vowel difference is reported with its letter position', () => {
  const r = compareHarakaat('كِتِب', 'كَتَب');
  assert.equal(r.compared, 2);
  assert.deepEqual(r.diffs.map((d) => [d.pos, d.ours, d.theirs]), [[1, 'i', 'a'], [2, 'i', 'a']]);
});

test('harakaat: shadda against a vowel without it is a difference; sukun against nothing is not', () => {
  assert.equal(compareHarakaat('حَبّ', 'حَبَ').diffs.length, 1);
  assert.equal(compareHarakaat('خُبْز', 'خُبز').diffs.length, 0);
});

test('harakaat: unalignable words return null, and T3 aligns after the article', () => {
  assert.equal(compareHarakaat('كتب', 'كتاب'), null);
  const r = compareHarakaat('جُمْعَة', 'الجُمعة', { article: true });
  assert.equal(r.diffs.length, 0);
  assert.equal(r.compared, 1);
});

test('senses: lowercase, parentheticals, e.t.c., leading to, split on / , or', () => {
  assert.deepEqual(senses('To wash (dishes e.t.c.)'), ['wash']);
  assert.deepEqual(senses('got bored / fed up'), ['got bored', 'fed up']);
  assert.deepEqual(senses('Complete/Perfect'), ['complete', 'perfect']);
});

test('gloss check: equal senses or whole-word containment agree; tense differences do not', () => {
  assert.equal(glossCheck('cheese', 'Cheese'), 'agree');
  assert.equal(glossCheck('did / made', 'To make a mistake'), 'disagree');
  assert.equal(glossCheck('last month', 'Last month'), 'agree');
  assert.equal(glossCheck('rain / winter rain', 'rain'), 'agree');
  assert.equal(glossCheck('came', 'To come'), 'disagree'); // goes to the model as same_sense
});

test('pos gap: verb against non-verb only, blank never flags', () => {
  assert.equal(posGap('verb', 'noun'), true);
  assert.equal(posGap('noun', 'verb'), true);
  assert.equal(posGap('noun', 'adjective'), false);
  assert.equal(posGap('verb', ''), false);
});

const o = (id, arabic, english, extra = {}) => ({ id, arabic, vocalised: arabic, english, pos: 'noun', level: 2,
  romanization: 'x', confidence: 3, mvp: 0, ...extra });
const t = (word, meaning, extra = {}) => ({ word, meaning, transliteration: '', category: 'noun', ...extra });

test('categorise: each category from its rule, and only-ours from what nothing reached', () => {
  const ours = [
    o(1, 'جِبْنِه', 'cheese'),
    o(2, 'إِجَا', 'came', { pos: 'verb' }),
    o(3, 'كِتِب', 'wrote', { pos: 'verb' }),
    o(4, 'أَنْف', 'nose'),
    o(5, 'بَيْت', 'house'),
    o(6, 'سَمَك', 'fish'),
  ];
  const theirs = [
    t('جبنة', 'Cheese'), // T2 (ة), no compared diffs, gloss agrees
    t('إِجى', 'To come', { category: 'verb' }), // T2, gloss tense differs
    t('كَتَب', 'To write', { category: 'verb' }), // T1, gloss differs -> meaning_mismatch
    t('مَنخار', 'Nose'), // gloss match, different word
    t('قَمَر', 'Moon'), // nothing
    t('سَمَك', 'Fish'), // T0 same
  ];
  const { rows, onlyOurs } = categorise(theirs, ours);
  const cat = Object.fromEntries(rows.map((r) => [r.theirs.word, r.category]));
  assert.equal(cat['جبنة'], 'spelling_variant');
  assert.equal(cat['إِجى'], 'meaning_mismatch');
  assert.equal(cat['كَتَب'], 'meaning_mismatch');
  assert.equal(cat['مَنخار'], 'different_word');
  assert.equal(cat['قَمَر'], 'only_theirs');
  assert.equal(cat['سَمَك'], 'same');
  assert.deepEqual(onlyOurs.map((x) => x.id), [5]);
  assert.equal(rows.filter(isExported).length, 5);
});

test('categorise: harakaat_variant when letters and gloss match but marks differ', () => {
  const { rows } = categorise([t('كَتَب', 'wrote', { category: 'verb' })], [o(3, 'كِتِب', 'wrote', { pos: 'verb' })]);
  assert.equal(rows[0].category, 'harakaat_variant');
  assert.match(rows[0].discrepancy, /letter 1 \(ك\): ours i, theirs a/);
});

test('categorise: homographs keep the gloss-agreeing candidate only', () => {
  const ours = [o(10, 'عَيْن', 'eye'), o(11, 'عَيْن', 'spring (water)')];
  const { rows } = categorise([t('عين', 'Eye')], ours);
  assert.deepEqual(rows.map((r) => r.ours.id), [10]);
});

test('harakaat: the sun-letter shadda after a dropped article is not a difference', () => {
  assert.deepEqual(compareHarakaat('ثَامِن', 'الثّامِن', { article: true }).diffs, []);
  assert.equal(compareHarakaat('ثَامِن', 'الثّامُن', { article: true }).diffs.length, 1);
});

test('bound morphemes are skipped, not compared', () => {
  assert.equal(isBoundMorpheme('... ـــكُم'), true);
  assert.equal(isBoundMorpheme('كُم'), false);
  const { rows, skipped } = categorise([t('... ـــكُم', 'You (pl.)')], [o(7, 'إِنْتُو', 'you (pl.)')]);
  assert.equal(rows.length, 0);
  assert.equal(skipped.length, 1);
});

test('American spelling: British glosses are normalised, ordinary words untouched', async () => {
  const { americanise } = await import('../external-match.mjs');
  assert.equal(americanise('Yoghurt'), 'Yogurt');
  assert.equal(americanise('neighbourhood / flavour'), 'neighborhood / flavor');
  assert.equal(americanise('to organise'), 'to organize');
  assert.equal(americanise('exercise, promise, otherwise'), 'exercise, promise, otherwise');
  assert.equal(glossCheck('yogurt', 'Yoghurt'), 'agree');
});
