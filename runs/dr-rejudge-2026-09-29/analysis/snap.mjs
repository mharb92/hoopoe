// Re-judge scope (chat 31): every row of dr-finalize-2026-09-27's batches 8, 24 and 27,
// the three batches whose arabic_vocalised drifted into Hebrew letters and niqqud (91 rows).
// The whole batch is re-judged: every field a degenerated batch produced is suspect.
// Run from the repo root with node --use-env-proxy.
import { readDictionary } from '../../../tools/dr/db.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const ids = new Set(JSON.parse(readFileSync(`${REPO}/runs/dr-rejudge-2026-09-29/rejudge-ids.json`, 'utf8')));
const { rows } = await readDictionary();
const sel = rows.filter((r) => ids.has(r.id));
const text = `${JSON.stringify(sel, null, 1)}\n`;
writeFileSync(`${REPO}/runs/dr-rejudge-2026-09-29/source-rows.json`, text);
console.log('dr-rejudge-2026-09-29', sel.length, 'of', ids.size, 'sha256', createHash('sha256').update(text).digest('hex'));
