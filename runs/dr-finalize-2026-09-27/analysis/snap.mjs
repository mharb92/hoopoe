// Round-1 scope snapshot (chat 29): writes source-rows.json for the finalize and calibration runs. Run from the repo root with node --use-env-proxy.
import { readDictionary } from '../../../tools/dr/db.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const J = (p) => JSON.parse(readFileSync(`${REPO}/${p}`, 'utf8'));
const essential = new Set(J('docs/dr/essentials/essential-ids-final.json'));
const rejudge = new Set(J('docs/dr/essentials/essential-rejudge-ids.json'));
const calib = new Set(J('docs/dr/essentials/calibration-ids.json'));
const { rows, total } = await readDictionary();
console.log('dictionary rows', rows.length, 'total header', total);
const out = (runId, pick) => {
  const sel = rows.filter(pick);
  mkdirSync(`${REPO}/runs/${runId}`, { recursive: true });
  const text = `${JSON.stringify(sel, null, 1)}\n`;
  writeFileSync(`${REPO}/runs/${runId}/source-rows.json`, text);
  console.log(runId, sel.length, 'sha256', createHash('sha256').update(text).digest('hex'));
};
out('dr-finalize-2026-09-27', (r) => !essential.has(r.id) || rejudge.has(r.id));
out('dr-calibration-2026-09-27', (r) => calib.has(r.id));
console.log('rejudge⊆essential', [...rejudge].every((i) => essential.has(i)), 'calib∩rejudge', [...calib].filter((i) => rejudge.has(i)).length, 'calib⊆essential', [...calib].every((i) => essential.has(i)));
