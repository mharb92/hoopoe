// Round-2 essential scope snapshot (D273): essential-ids-final − essential-rejudge-ids, 597 ids. Run from the repo root with node --use-env-proxy.
import { readDictionary } from '../../../tools/dr/db.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const J = (p) => JSON.parse(readFileSync(`${REPO}/${p}`, 'utf8'));
const essential = new Set(J('docs/dr/essentials/essential-ids-final.json'));
const rejudge = new Set(J('docs/dr/essentials/essential-rejudge-ids.json'));
const finalize = new Set(J('runs/dr-finalize-2026-09-27/source-rows.json').map((r) => r.id));
const { rows, total } = await readDictionary();
console.log('dictionary rows', rows.length, 'total header', total);
const sel = rows.filter((r) => essential.has(r.id) && !rejudge.has(r.id));
const text = `${JSON.stringify(sel, null, 1)}\n`;
writeFileSync(`${REPO}/runs/dr-essential-o55-2026-09-27/source-rows.json`, text);
console.log('dr-essential-o55-2026-09-27', sel.length, 'sha256', createHash('sha256').update(text).digest('hex'));
console.log('∩finalize', sel.filter((r) => finalize.has(r.id)).length, 'union', new Set([...finalize, ...sel.map((r) => r.id)]).size);
