// Chat 29 run comparison. Run from the repo root: node --use-env-proxy runs/dr-finalize-2026-09-27/analysis/analyse.mjs <run_id> <source-rows.json | live>
// usage: node analyse.mjs <run_id> <source-rows.json | live> [ids-filter.json]
import { readFileSync } from 'node:fs';
import { readDictionary } from '../../../tools/dr/db.mjs';
import { isVowelLengthFlip, distribution } from '../../../tools/dr/report.mjs';
const [runId, src] = process.argv.slice(2);
const base = 'https://pniwgnjljpkiimssortp.supabase.co/rest/v1/dictionary_review';
const staged = [];
for (let off = 0; ; off += 1000) {
  const r = await fetch(`${base}?select=dictionary_id,batch_no,status,payload&run_id=eq.${runId}&order=dictionary_id.asc`, { headers: { Range: `${off}-${off + 999}` } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const page = await r.json(); staged.push(...page); if (page.length < 1000) break;
}
let source;
if (src === 'live') {
  const { rows } = await readDictionary();
  const before = JSON.parse(readFileSync(new URL('../../../docs/dr/essentials/q25-before.json', import.meta.url), 'utf8'));
  source = new Map(rows.map((r) => [r.id, before[r.id] ?? r]));
} else source = new Map(JSON.parse(readFileSync(src, 'utf8')).map((r) => [r.id, r]));
const n = staged.length;
const lv = distribution(staged.map((s) => s.payload.model.level));
const rc = distribution(staged.map((s) => s.payload.review_confidence));
const rom = (s) => s.payload.model.romanization?.value ?? '';
const retired = staged.filter((s) => /[269]/.test(rom(s)));
const qaf = staged.filter((s) => (source.get(s.dictionary_id)?.arabic ?? '').includes('ق'));
const qCount = qaf.filter((s) => /q/.test(rom(s))).length;
const glot = qaf.filter((s) => !/q/.test(rom(s)) && /'/.test(rom(s))).length;
const neither = qaf.filter((s) => !/[q']/.test(rom(s))).map((s) => `${s.dictionary_id}:${source.get(s.dictionary_id).arabic}=${rom(s)}`);
const flips = staged.filter((s) => isVowelLengthFlip(source.get(s.dictionary_id)?.romanization, rom(s)));
const held = staged.filter((s) => s.status !== 'auto');
const heldBy = distribution(held.flatMap((s) => Object.entries(s.payload.routing).filter(([, v]) => v !== 'auto').map(([k]) => k)));
const badChars = staged.filter((s) => !/^(?:[a-z37'\-]|TH|[DST])+(?: (?:[a-z37'\-]|TH|[DST])+)*$/.test(rom(s))).map((s) => `${s.dictionary_id}=${rom(s)}`);
const verbs = staged.filter((s) => s.payload.model.pos === 'verb');
const low = staged.filter((s) => s.payload.model.level <= 2);
console.log(JSON.stringify({ runId, staged: n, batches: distribution(staged.map((s) => s.batch_no)),
  level: lv, review_confidence: rc, rc3_share: +((rc[3] ?? 0) / n).toFixed(3),
  level_conf: distribution(staged.map((s) => s.payload.model.level_conf)),
  retired_digit_rows: retired.map((s) => `${s.dictionary_id}=${rom(s)}`),
  qaf_rows: qaf.length, qaf_q: qCount, qaf_glottal: glot, qaf_neither: neither,
  p10_flips: flips.length, p10_rate: +(flips.length / n).toFixed(4),
  held: held.length, held_share: +(held.length / n).toFixed(3), held_fields: heldBy,
  native_check: staged.filter((s) => s.payload.model.native_check).length,
  corrections_rows: staged.filter((s) => (s.payload.model.corrections ?? []).length).length,
  charset_violations: badChars,
  p6: { low: low.length, verbs_in_low: low.filter((s) => s.payload.model.pos === 'verb').length, verbs: verbs.length } }, null, 1));
