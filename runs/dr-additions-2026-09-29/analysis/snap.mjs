// Scope for the additions run (chat 31, D278): the 509 rows inserted from the
// external dictionary's `add` verdicts. Run from the repo root with node --use-env-proxy.
import { readDictionary } from '../../../tools/dr/db.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const ids = new Set(JSON.parse(readFileSync(`${REPO}/runs/dr-additions-2026-09-29/inserted-ids.json`, 'utf8')));
const { rows } = await readDictionary();
const sel = rows.filter((r) => ids.has(r.id));
const text = `${JSON.stringify(sel, null, 1)}\n`;
writeFileSync(`${REPO}/runs/dr-additions-2026-09-29/source-rows.json`, text);
console.log('dr-additions-2026-09-29', sel.length, 'of', ids.size, 'sha256', createHash('sha256').update(text).digest('hex'));
