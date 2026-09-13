import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  applyRuleFix, buildDuplicateIndex, stripHarakaat, normalizeArabicChars, collapseWhitespace,
} from '../rulefix.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(here, '..', 'fixtures', 'rulefix-rows.json');
const rows = JSON.parse(readFileSync(fixturePath, 'utf8'));
const byId = new Map(rows.map((r) => [r.id, r]));

test('stripHarakaat removes diacritics from a real row (id 9, هَاد -> هاد)', () => {
  assert.equal(stripHarakaat(byId.get(9).arabic), 'هاد');
});

test('tatweel is stripped from a real row (id 29, لَـ -> لَ)', () => {
  assert.equal(normalizeArabicChars(byId.get(29).arabic), 'لَ');
});

test('Persian yeh/keheh are converted to Arabic forms (synthetic id -2, کیف -> كيف)', () => {
  assert.equal(normalizeArabicChars(byId.get(-2).arabic), 'كيف');
});

test('collapseWhitespace trims and collapses internal runs', () => {
  assert.equal(collapseWhitespace('  a   b  '), 'a b');
});

test('track_id is set to palestinian on every row', () => {
  for (const row of rows) {
    const { fixed } = applyRuleFix(row);
    assert.equal(fixed.track_id, 'palestinian');
  }
});

test('dialect_tag D/M/S/D-var convert to register+form_origin per dr-spec.md §4', () => {
  assert.deepEqual(applyRuleFix(byId.get(2)).fixed, {
    track_id: 'palestinian', register: 'neutral', form_origin: 'dialect',
  }); // D
  assert.deepEqual(applyRuleFix(byId.get(34)).fixed, {
    track_id: 'palestinian', register: 'neutral', form_origin: 'msa_shared_dialect_pron',
  }); // M
  assert.deepEqual(applyRuleFix(byId.get(1)).fixed, {
    track_id: 'palestinian', register: 'neutral', form_origin: 'msa_identical',
  }); // S
  assert.deepEqual(applyRuleFix(byId.get(148)).fixed, {
    track_id: 'palestinian', register: 'neutral', form_origin: 'regional_variant',
  }); // D-var
});

test('SL and MSA rows get no register/form_origin from rule-fix (go to the model)', () => {
  const sl = applyRuleFix(byId.get(258));
  const msa = applyRuleFix(byId.get(208));
  assert.equal(sl.fixed.register, undefined);
  assert.equal(sl.fixed.form_origin, undefined);
  assert.equal(msa.fixed.register, undefined);
  assert.equal(msa.fixed.form_origin, undefined);
});

test('flags latin characters in arabic (synthetic id -1)', () => {
  const { flags } = applyRuleFix(byId.get(-1));
  assert.ok(flags.includes('latin_in_arabic'));
});

test('flag-only checks never mutate the arabic/romanization fields', () => {
  const before = byId.get(-1).arabic;
  const { fixed } = applyRuleFix(byId.get(-1));
  // normalization may still run (no Persian/tatweel here), so arabic should be unchanged
  assert.equal(fixed.arabic ?? before, before);
});

test('duplicate detection: exact Arabic match flagged globally, across categories (ids 9 and 2182, هَاد)', () => {
  const dupFlags = buildDuplicateIndex(rows);
  assert.ok(dupFlags.get(9)?.includes('duplicate_exact_arabic'));
  assert.ok(dupFlags.get(2182)?.includes('duplicate_exact_arabic'));
  assert.notEqual(byId.get(9).category, byId.get(2182).category);
});

test('rows with no duplicate get no duplicate flags', () => {
  const dupFlags = buildDuplicateIndex(rows);
  assert.equal(dupFlags.get(34), undefined);
});

test('rank is never written by rule-fix', () => {
  for (const row of rows) {
    const { fixed } = applyRuleFix(row);
    assert.equal('rank' in fixed, false);
  }
});
