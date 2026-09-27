// Chat 29 calibration: level agreement of dr-calibration-2026-09-27 against dr-essential-2026-09-14.
import { readFileSync } from 'node:fs';
const base = 'https://pniwgnjljpkiimssortp.supabase.co/rest/v1/dictionary_review';
const ids = JSON.parse(readFileSync(new URL('../../../docs/dr/essentials/calibration-ids.json', import.meta.url), 'utf8'));
const src = new Map(JSON.parse(readFileSync(new URL('../../../runs/dr-calibration-2026-09-27/source-rows.json', import.meta.url), 'utf8')).map((r) => [r.id, r]));
const get = async (run) => new Map((await (await fetch(`${base}?select=dictionary_id,payload&run_id=eq.${run}&dictionary_id=in.(${ids.join(',')})`)).json()).map((r) => [r.dictionary_id, r.payload]));
const [o5, o55] = await Promise.all([get('dr-essential-2026-09-14'), get('dr-calibration-2026-09-27')]);
let match = 0, within1 = 0, n = 0, up = 0, down = 0, romSame = 0; const mm = [];
for (const id of ids) {
  const a = o5.get(id), b = o55.get(id); if (!a || !b) { mm.push(`${id}: missing ${!a ? 'o5' : 'o55'}`); continue; }
  n++; const la = a.model.level, lb = b.model.level;
  if (a.model.romanization.value === b.model.romanization.value) romSame++;
  if (la === lb) match++; else { mm.push(`${id} ${src.get(id).arabic} (${src.get(id).english}): O5 ${la}/${a.model.level_conf} → O5.5 ${lb}/${b.model.level_conf} | ${b.model.level_reason}`); lb > la ? up++ : down++; }
  if (Math.abs(la - lb) <= 1) within1++;
}
const dist = (m) => { const d = {}; for (const id of ids) { const l = m.get(id)?.model.level; d[l] = (d[l] ?? 0) + 1; } return d; };
console.log(JSON.stringify({ n, match, within1, up, down, romSame, o5: dist(o5), o55: dist(o55) }));
console.log(mm.join('\n'));
