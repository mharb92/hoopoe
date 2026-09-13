// D246 in-run P6 checkpoint. Operator script for the full loop, not a runner
// module: `dr-runner-spec.md` §3 fixes the module map at eleven and D244 records
// why that map is not grown casually. Nothing here is imported by `run.mjs`.
//
// P6 is uninformative at the pilot's 10 low-band rows (interval ~0.003-0.445,
// which contains both the observed 0.10 and the 0.30 floor). It becomes readable
// once the low band reaches n≈50, around 300 rows, and that point is the last one
// at which a FAIL is still actionable: ~$3.25 spent leaves ~$36.75, still above
// the $29.46 a re-prompted second run would cost.
//
// Reads staged rows for a run and re-computes P6 with report.mjs's own definition
// (report.mjs:131-132: level 1-2 rows, `pos === 'verb'`, floor P6_VERB_FLOOR).
//
// Exit codes: 0 clear (pass, or denominator still too small), 1 read error,
// 3 FAIL at a readable denominator — the halt D246 specifies.

import { BASE_URL, WRITE_TABLE, authHeaders, PAGE_SIZE } from './db.mjs';
import { P6_VERB_FLOOR, P6_EXTERNAL_SIGNAL } from './report.mjs';

// Below this the check is not read at all: that is the pilot's failure mode, and
// re-running it at n=10 would reproduce it rather than resolve it.
export const MIN_LOW_BAND = 50;

async function readStaged(runId) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const url = `${BASE_URL}/${WRITE_TABLE}?select=dictionary_id,payload&run_id=eq.${encodeURIComponent(runId)}` +
      '&order=dictionary_id.asc';
    const res = await fetch(url, {
      headers: { ...authHeaders(), Range: `${offset}-${offset + PAGE_SIZE - 1}` },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`p6: read failed ${res.status}: ${text.slice(0, 300)}`);
    const page = JSON.parse(text);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

export function p6From(stagedRows) {
  const objects = stagedRows.map((r) => r?.payload?.model).filter(Boolean);
  const lowBand = objects.filter((o) => o.level === 1 || o.level === 2);
  const verbs = lowBand.filter((o) => o.pos === 'verb').length;
  const verbShare = lowBand.length ? verbs / lowBand.length : null;
  const readable = lowBand.length >= MIN_LOW_BAND;
  return {
    rows: objects.length,
    lowBandRows: lowBand.length,
    verbs,
    verbShare,
    floor: P6_VERB_FLOOR,
    externalSignal: P6_EXTERNAL_SIGNAL,
    readable,
    // Not readable is not a pass: it is "ask again next chunk" (see the caller).
    verdict: !readable ? 'not-yet-readable' : verbShare >= P6_VERB_FLOOR ? 'pass' : 'fail',
  };
}

const runId = process.argv[2];
if (!runId) {
  console.error('usage: NODE_USE_ENV_PROXY=1 node tools/dr/full-loop-p6.mjs <run-id>');
  process.exit(1);
}

try {
  const result = p6From(await readStaged(runId));
  console.log(JSON.stringify(result));
  process.exit(result.verdict === 'fail' ? 3 : 0);
} catch (err) {
  console.error(err.stack ?? err.message);
  process.exit(1);
}
