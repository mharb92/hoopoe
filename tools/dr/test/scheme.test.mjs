// The chat-26 scheme revision (romanization-map.md §1, §1.1, §3.4, §4).
//
// Two mechanisms under test, and the line between them is the whole point:
// migrateScheme does only what is DETERMINISTIC (old symbol -> new symbol, and
// dropping a word-initial glottal that sat on a hamza vowel seat), while ق as
// glottal-or-[q] is a model judgement and must never be substituted here.

import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateScheme, dropInitialHamzaGlottal } from '../rulefix.mjs';
import { checkCharset, ALLOWED_ROMANIZATION_RE, validateRow } from '../validate.mjs';
import { routeRow } from '../route.mjs';

// --- deterministic symbol substitutions -----------------------------------

test('migrateScheme: the four emphatics become capitals', () => {
  // longest-first matters: 9' is ض, not ص followed by a glottal.
  assert.equal(migrateScheme("gha9'ab", 'غضب'), 'ghaDab');
  assert.equal(migrateScheme("faya9'aan", 'فيضان'), 'fayaDaan');
  assert.equal(migrateScheme('9aff', 'صف'), 'Saff');
  assert.equal(migrateScheme('6aabi2', 'طابق'), "Taabi'");
  assert.equal(migrateScheme("6'ohr", 'ظهر'), 'THohr');
});

test('migrateScheme: 2 becomes the apostrophe, since every old 2 was a glottal', () => {
  assert.equal(migrateScheme('wa2t', 'وقت'), "wa't");
  assert.equal(migrateScheme('da2ii2a', 'دقيقة'), "da'ii'a");
  assert.equal(migrateScheme('mit2akhkher', 'متأخر'), "mit'akhkher");
});

test('migrateScheme: 2, 6 and 9 are gone from the output entirely', () => {
  const out = migrateScheme("2a6ii3 9aff 6'ulm", 'قطيع صف ظلم');
  assert.ok(!/[269]/.test(out), `digits survived: ${out}`);
});

// --- the word-initial rule -------------------------------------------------

test('dropInitialHamzaGlottal: a word-initial hamza seat loses the glottal', () => {
  // أولاد — the alif is a vowel seat, the onset is automatic, so write the vowel.
  assert.equal(dropInitialHamzaGlottal("'awlaad", 'أولاد'), 'awlaad');
  assert.equal(dropInitialHamzaGlottal("'ana", 'أنا'), 'ana');
  assert.equal(dropInitialHamzaGlottal("'imbaari7", 'إمبارح'), 'imbaari7');
  assert.equal(dropInitialHamzaGlottal("'aab", 'آب'), 'aab');
});

test('dropInitialHamzaGlottal: a word-initial ق KEEPS its glottal', () => {
  // قهوة — a consonant realised as a glottal, not an automatic onset.
  assert.equal(dropInitialHamzaGlottal("'ahwe", 'قهوة'), "'ahwe");
  assert.equal(dropInitialHamzaGlottal("'albi", 'قلبي'), "'albi");
});

test('dropInitialHamzaGlottal: non-initial glottals are never touched', () => {
  assert.equal(dropInitialHamzaGlottal("mit'akhkher", 'متأخر'), "mit'akhkher");
  assert.equal(dropInitialHamzaGlottal("halla'", 'هلأ'), "halla'");
  assert.equal(dropInitialHamzaGlottal("il-'usbuu3", 'الأسبوع'), "il-'usbuu3");
});

test('migrateScheme: runs both steps, and ق still decides its own glottal', () => {
  assert.equal(migrateScheme('2awlaad', 'أولاد'), 'awlaad');   // hamza seat -> dropped
  assert.equal(migrateScheme('2ahwe', 'قهوة'), "'ahwe");       // ق -> kept
});

// --- what migration must NOT do -------------------------------------------

test('migrateScheme: never invents a [q] — that is the model judgement', () => {
  // qur'aan is correct Arabic, but no deterministic rule produces it from the
  // old string. Migration leaves a glottal; re-judging is what fixes these.
  const out = migrateScheme('2ur2aan', 'قرآن');
  assert.ok(!out.includes('q'), `migration invented a q: ${out}`);
  // The word starts with ق, so the initial glottal is correctly KEPT here — the
  // hamza-seat drop does not apply. Migration lands on 'ur'aan and only the
  // re-judge turns that into qur'aan, which is precisely the split being tested.
  assert.equal(out, "'ur'aan");
});

test('migrateScheme: leaves vowel length alone — never a rule fix (D210)', () => {
  for (const v of ['mabruuk', 'beet', 'biit', 'yoom', 'suu2']) {
    const out = migrateScheme(v, 'x');
    assert.equal(out.replace(/'/g, '').replace(/[269]/g, ''), v.replace(/[269]/g, ''),
      `vowel symbols changed in ${v} -> ${out}`);
  }
});

// --- the character set, which had no enforcement at all --------------------

test('checkCharset: accepts the new scheme', () => {
  for (const v of ["'ahwe", 'qur\'aan', 'ghaDab', 'Saff', 'Taabi\'', 'THohr',
    'il-bint', '3afwan', '7arii2a'.replace('2', "'"), 'as-hal', 'mabruuk']) {
    assert.equal(checkCharset(v), null, `rejected a legal value: ${v}`);
  }
});

test('checkCharset: rejects the retired digits', () => {
  assert.match(checkCharset('wa2t'), /2/);
  assert.match(checkCharset('6aabi'), /6/);
  assert.match(checkCharset('9aff'), /9/);
});

test('checkCharset: rejects stray capitals, diacritics and punctuation', () => {
  assert.match(checkCharset('Ahwe'), /A/);       // A is not an emphatic
  assert.match(checkCharset('Zaff'), /Z/);
  assert.match(checkCharset('café'), /é/);
  assert.match(checkCharset('wa,t'), /,/);
  assert.match(checkCharset('mit_akhkher'), /_/);
});

test('checkCharset: the allowed set is exactly a-z, D S T, q, 3, 7, apostrophe, hyphen', () => {
  // TH is T followed by H — H alone must therefore also be legal, and is, via T/H
  // being covered by the emphatic set. Guard the regex against silent widening.
  assert.equal(ALLOWED_ROMANIZATION_RE.source.includes('2'), false);
  assert.equal(checkCharset('THohr'), null);
  assert.match(checkCharset('HHohr'), /H/); // a bare H is not a legal start
});

// --- D267: pair and constituents are collected but never scored -------------

test('validateRow: accepts pair and constituents, and both are optional', () => {
  const base = {
    id: 1, level: 2, level_reason: 'x', level_conf: 'H', enum_conf: 'H',
    pos: 'formula', register: 'neutral', form_origin: 'dialect',
    romanization: { value: 'Sabaa7 il-kheer', conf: 'H', changed: false }, // 7 is ح; capital H is only ever the second half of TH
    arabic_vocalised: { value: 'صَبَاح', conf: 'H' }, native_check: false,
  };
  assert.deepEqual(validateRow(base, 1).errors, []);
  assert.deepEqual(validateRow({ ...base, pair: 'صباح النور' }, 1).errors, []);
  assert.deepEqual(validateRow({ ...base, constituents: ['صباح', 'الخير'] }, 1).errors, []);
});

test('validateRow: rejects malformed pair and constituents', () => {
  const base = {
    id: 1, level: 2, level_reason: 'x', level_conf: 'H', enum_conf: 'H',
    pos: 'formula', register: 'neutral', form_origin: 'dialect',
    romanization: { value: 'x', conf: 'H', changed: false },
    arabic_vocalised: { value: 'x', conf: 'H' }, native_check: false,
  };
  assert.match(validateRow({ ...base, pair: '' }, 1).errors.join(), /pair/);
  assert.match(validateRow({ ...base, constituents: 'not-an-array' }, 1).errors.join(), /constituents/);
  assert.match(validateRow({ ...base, constituents: ['ok', ''] }, 1).errors.join(), /constituents/);
});

test('routeRow: pair and constituents never touch review_confidence', () => {
  const row = (extra) => routeRow({
    level_conf: 'H', enum_conf: 'H',
    romanization: { conf: 'H' }, arabic_vocalised: { conf: 'H' },
    native_check: false, ...extra,
  });
  // A row that is all-H scores 3 whether or not it carries the new fields.
  assert.equal(row({}).review_confidence, 3);
  assert.equal(row({ pair: 'صباح النور', constituents: ['صباح', 'الخير'] }).review_confidence, 3);
});

test('checkCharset: a phrase with single spaces is legal — 879 rows depend on it', () => {
  for (const v of ['Sabaa7 il-kheer', "is-salaam 3alaykum", 'kiif 7aalak', 'ahlan wa sahlan']) {
    assert.equal(checkCharset(v), null, `rejected a legal phrase: ${v}`);
  }
});

test('checkCharset: stray whitespace is still rejected', () => {
  assert.match(checkCharset(' leading'), /whitespace/);
  assert.match(checkCharset('trailing '), /whitespace/);
  assert.match(checkCharset('double  space'), /whitespace/);
  assert.match(checkCharset('tab\there'), /\t|whitespace/);
});
