// Builds the insert file for the external dictionary's `add` rows (chat 31, D278):
// ext-compare-2026-09-29 verdict `add`, deduped, glosses in American spelling and,
// for verbs, in the past tense like every other verb gloss in `dictionary`.
// Run from the repo root: node runs/dr-additions-2026-09-29/build-insert.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseCsv } from '../../tools/dr/essentials.mjs';

const PAST = {
  'اسْتَوى': 'ripened / cooked through', 'شَمّ': 'smelled', 'جَلى': 'washed (dishes)', 'كَبّ': 'threw away / spilled',
  'انْقَلى': 'was fried', 'انْشَوى': 'was grilled', 'حَرَق': 'burned', 'غَلى': 'boiled', 'عَضّ': 'bit',
  'طَعْمَى': 'fed', 'ذاب': 'melted / dissolved', 'حَكَم': 'governed / ruled over', 'ثار': 'rebelled against',
  'قَسَم': 'divided', 'هَزَم': 'defeated', 'أَعْلَن': 'announced / declared / proclaimed', 'أَضْرَب': 'went on strike',
  'احْتَلّ': 'occupied', 'اجْتاح': 'invaded', 'انْدَفَع': 'was paid', 'دَعَم': 'supported / invested in',
  'صَنَع': 'made / manufactured', 'تَطَوَّع': 'volunteered', 'داوَم': 'was on duty / at work', 'رَحَل': 'moved (house)',
  'عَرْبَن': 'put down a deposit', 'تَضايَق': 'was annoyed', 'عَصَّب': 'got angry', 'رَضِي': 'was pleased / satisfied',
  'انْزَعَج': 'was annoyed', 'حَنّ': 'longed for', 'اشْتَهى': 'craved / desired', 'تَعَوَّد': 'got used to',
  'عانَى': 'suffered', 'احْتار': 'was confused / at a loss', 'احْتاط': 'was cautious / took precautions',
  'نافَس': 'competed against', 'كَلَّف': 'cost (an amount)', 'غَلَّى': 'raised the price', 'فاق': 'woke up',
  'غَفِي': 'dozed off / took a nap', 'فَرْشَى': 'brushed', 'سَلَّم': 'greeted', 'باس': 'kissed', 'تَزَوَّج': 'married',
  'تَصالَح': 'made up with', 'عاش': 'lived', 'مات': 'died', 'انْوَلَد': 'was born',
};
// Keys compared in NFC: shadda and a vowel can be stored in either order.
const PAST_N = new Map(Object.entries(PAST).map(([k, v]) => [k.normalize('NFC'), v]));
const POS = { noun: 'Noun', adjective: 'Adjective', verb: 'Verb' };

const src = parseCsv(readFileSync('runs/ext-compare-2026-09-29/differences.csv', 'utf8')).filter((r) => r.verdict === 'add');
const byWord = new Map();
for (const r of src) {
  const arabic = r.their_word.split(' / ')[0].trim(); // عَشَان / عَلَى شَان: first form; the variant goes to notes
  const english = (PAST_N.get(arabic.normalize('NFC')) ?? r.their_meaning.replace(/\s*\(?e\.t\.c\.\)?/g, '').replace('disolve', 'dissolve'))
    .replace(/^To /, 'to ').replace(/^([A-Z])(?=[a-z])/, (c) => c.toLowerCase());
  const seen = byWord.get(arabic);
  if (seen) { if (!seen.english.split(' / ').includes(english)) seen.english += ` / ${english}`; continue; }
  if (r.their_category === 'verb' && !PAST_N.has(arabic.normalize('NFC'))) throw new Error(`no past-tense gloss for verb ${arabic}`);
  const variant = r.their_word.includes(' / ') ? `; variant: ${r.their_word.split(' / ').slice(1).join(' / ')}` : '';
  byWord.set(arabic, {
    arabic, english, romanization: r.their_transliteration, pos: POS[r.their_category] ?? null,
    category: null, dialect_tag: null, confidence: null,
    notes: `source: Levantine dictionary (D278), topics: ${r.their_topics}${variant}`,
  });
}
const rows = [...byWord.values()];
const text = JSON.stringify(rows, null, 1) + '\n';
writeFileSync('runs/dr-additions-2026-09-29/insert-rows.json', text);
console.log(rows.length, 'rows', 'sha256', createHash('sha256').update(text).digest('hex'));
