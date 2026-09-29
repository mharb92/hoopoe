// Level re-check for verbs judged at level 3 (chat 31, D279). A focused second
// look under the same frozen rubric the DR pass used: verbs only, one question
// (2 or 3?), so everyday verbs the mixed-row batches placed at 3 can surface.
// A move applies only on an H answer of 2. Writes recheck.json; changes nothing
// in the database. Run from the repo root:
//   env -u DR_ANTHROPIC_KEY node runs/dr-level-recheck-2026-09-29/recheck.mjs
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { callClaudeCli } from '../../tools/dr/judge-cli.mjs';
import { parseObjects } from '../../tools/dr/judge.mjs';
import { LEVEL_RUBRIC_TEXT } from '../../tools/dr/prompt-content.mjs';

const DIR = 'runs/dr-level-recheck-2026-09-29';
const MODEL = 'claude-opus-5-5';
const SPEND_CAP = 3;
if (process.env.DR_ANTHROPIC_KEY) throw new Error('DR_ANTHROPIC_KEY is set: run with env -u DR_ANTHROPIC_KEY (D260)');

const ours = JSON.parse(readFileSync('runs/ext-compare-2026-09-29/ours.json', 'utf8'));
const rows = ours.filter((o) => o.pos === 'verb' && o.level === 3);
writeFileSync(`${DIR}/scope.json`, JSON.stringify(rows.map((o) => o.id)) + '\n');

const SYSTEM = `You re-check the level of Palestinian Arabic verbs against this rubric.

${LEVEL_RUBRIC_TEXT}

Every verb below is currently at level 3. For each, decide by the rubric whether it belongs at level 2 (needed to hold an ordinary daily conversation beyond survival) or stays at level 3 (needed to talk about a topic rather than a situation). Judge encounter likelihood for a learner living in Palestine. Do not move a verb to 2 because it is short or common in English; move it only if Palestinians use it in everyday conversation.

Reply with one JSON object per line, in input order, and nothing else:
{"id":<id>,"level":2|3,"c":"H|M|L","r":"<reason, max 12 words>"}`;

const out = existsSync(`${DIR}/recheck.json`) ? JSON.parse(readFileSync(`${DIR}/recheck.json`, 'utf8')) : { usd: 0, results: {} };
const log = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); appendFileSync(`${DIR}/recheck.log`, l + '\n'); };
const todo = rows.filter((o) => !out.results[o.id]);
log(`start: ${rows.length} level-3 verbs, ${todo.length} to check, $${out.usd.toFixed(4)} spent`);
for (let i = 0; i < todo.length; i += 60) {
  if (out.usd >= SPEND_CAP) { log('stop: spend cap'); break; }
  let batch = todo.slice(i, i + 60);
  for (let attempt = 0; attempt < 2 && batch.length; attempt++) {
    const user = batch.map((o) => JSON.stringify({ id: o.id, ar: o.vocalised || o.arabic, en: o.english })).join('\n');
    const res = await callClaudeCli({ message: { system: SYSTEM, user }, model: MODEL, effort: 'medium' });
    out.usd += res.usd ?? 0;
    for (const x of parseObjects(res.raw)) {
      if (batch.some((o) => o.id === x.id) && [2, 3].includes(x.level) && ['H', 'M', 'L'].includes(x.c)) {
        out.results[x.id] = { level: x.level, c: x.c, r: String(x.r ?? '') };
      }
    }
    batch = batch.filter((o) => !out.results[o.id]);
    log(`batch ${i / 60 + 1} attempt ${attempt + 1}: ${batch.length} unresolved, total $${out.usd.toFixed(4)}`);
  }
  writeFileSync(`${DIR}/recheck.json`, JSON.stringify(out, null, 1) + '\n');
  if (batch.length) throw new Error(`${batch.length} rows unresolved after one repair: ${batch.map((o) => o.id)}`);
}
const moves = rows.filter((o) => out.results[o.id]?.level === 2 && out.results[o.id].c === 'H');
log(`done: ${Object.keys(out.results).length} checked, ${moves.length} move to level 2 (H), $${out.usd.toFixed(4)}`);
