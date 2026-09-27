// Round-2 MVP comparison (D273): the 619 essential ids on Opus 5.5 (dr-essential-o55-2026-09-27's 597 + dr-finalize-2026-09-27's 22 rejudge ids)
// against dr-essential-2026-09-14 (O5), plus `pair` on dr-formula-2026-09-14b's 32 rows. Metric definitions match ../../dr-finalize-2026-09-27/analysis/analyse.mjs.
// Run from the repo root: node --use-env-proxy runs/dr-essential-o55-2026-09-27/analysis/mvp.mjs
import { readFileSync } from 'node:fs';
import { distribution } from '../../../tools/dr/report.mjs';
const base = 'https://pniwgnjljpkiimssortp.supabase.co/rest/v1/dictionary_review';
const J = (p) => JSON.parse(readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf8'));
const pull = async (runId) => {
  const out = [];
  for (let off = 0; ; off += 1000) {
    const r = await fetch(`${base}?select=dictionary_id,status,payload&run_id=eq.${runId}&order=dictionary_id.asc`, { headers: { Range: `${off}-${off + 999}` } });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    const page = await r.json(); out.push(...page); if (page.length < 1000) break;
  }
  return out;
};
const essential = J('docs/dr/essentials/essential-ids-final.json');
const rejudge = new Set(J('docs/dr/essentials/essential-rejudge-ids.json'));
const [ess, fin, o5, formula] = await Promise.all(['dr-essential-o55-2026-09-27', 'dr-finalize-2026-09-27', 'dr-essential-2026-09-14', 'dr-formula-2026-09-14b'].map(pull));
const mvp = [...ess, ...fin.filter((s) => rejudge.has(s.dictionary_id))];
const rom = (s) => s.payload.model.romanization?.value ?? '';
const stats = (rows) => {
  const n = rows.length, rc = distribution(rows.map((s) => s.payload.review_confidence));
  const low = rows.filter((s) => s.payload.model.level <= 2), lowVerbs = low.filter((s) => s.payload.model.pos === 'verb').length;
  const held = rows.filter((s) => s.status !== 'auto').length;
  return { n, level: distribution(rows.map((s) => s.payload.model.level)), rc3: rc[3] ?? 0, rc3_share: +((rc[3] ?? 0) / n).toFixed(3),
    review_confidence: rc, level_conf: distribution(rows.map((s) => s.payload.model.level_conf)),
    p6: { low: low.length, verbs_in_low: lowVerbs, share: +(lowVerbs / low.length).toFixed(3) },
    held, held_share: +(held / n).toFixed(3), retired_digit_rows: rows.filter((s) => /[269]/.test(rom(s))).map((s) => `${s.dictionary_id}=${rom(s)}`) };
};
const ids = new Set(mvp.map((s) => s.dictionary_id));
const missing = essential.filter((i) => !ids.has(i));
const o5By = new Map(o5.map((s) => [s.dictionary_id, s.payload.model]));
let match = 0, within1 = 0, up = 0, down = 0, n = 0; const moves = {};
for (const s of ess) {
  const a = o5By.get(s.dictionary_id); if (!a) continue; n++;
  const la = a.level, lb = s.payload.model.level;
  if (la === lb) match++; else { lb > la ? up++ : down++; moves[`${la}→${lb}`] = (moves[`${la}→${lb}`] ?? 0) + 1; }
  if (Math.abs(la - lb) <= 1) within1++;
}
const mvpBy = new Map(mvp.map((s) => [s.dictionary_id, s.payload.model]));
const pairRows = formula.map((f) => {
  const a = f.payload.model, b = mvpBy.get(f.dictionary_id);
  return { id: f.dictionary_id, o5: a.pair ?? null, o55: b ? (b.pair ?? null) : 'MISSING', same: b && (a.pair ?? null) === (b.pair ?? null),
    constituents_same: b && JSON.stringify(a.constituents ?? null) === JSON.stringify(b.constituents ?? null) };
});
console.log(JSON.stringify({ mvp_ids: mvp.length, essential_ids: essential.length, missing,
  o55: stats(mvp), o5: stats(o5),
  level_agreement_597: { n, match, share: +(match / n).toFixed(3), within1, up, down, moves },
  pair: { n: pairRows.length, same: pairRows.filter((r) => r.same).length, o5_with_pair: pairRows.filter((r) => r.o5).length,
    o55_with_pair: pairRows.filter((r) => r.o55 && r.o55 !== 'MISSING').length, constituents_same: pairRows.filter((r) => r.constituents_same).length,
    diffs: pairRows.filter((r) => !r.same).map((r) => `${r.id}: ${r.o5} → ${r.o55}`) } }, null, 1));
