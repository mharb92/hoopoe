// The model seam (dr-runner-spec.md §4, dr-build-brief.md B2).
//
// One shape: judge(rows, cfg). Transport is config — `anthropic-direct` for the
// pilot, `judge-cli` for the full loop (D260, and see judge-cli.mjs), and
// `edge-function` once the `claude` function is deployed (open §J item).
// Nothing above the seam knows which is in use.
//
// The judging model is named here, independent of whichever model orchestrates
// the session. The key is read from DR_ANTHROPIC_KEY only: no fallback
// variable, never logged, never written to a config file or a run artefact.

import { readStream, StreamError } from './stream.mjs';

export const JUDGE_MODEL = 'claude-opus-5'; // dr-prompt-scoped.md: "Model: Opus"
export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';
// Streamed, so a large ceiling costs nothing until it is used. A 60-row batch
// runs 150-250 content tokens per row plus a thinking budget that varies several
// -fold by row, and a batch that hits the ceiling fails outright rather than
// degrading, so the ceiling is set well clear of the worst case P8 might find.
export const DEFAULT_MAX_TOKENS = 64000;
// Opus 5 removed `temperature` (400 `temperature is deprecated for this model`)
// and runs adaptive thinking by default, so determinism is no longer a sampling
// setting. Depth is steered by effort instead, and thinking tokens are billed as
// output, so P8 measures a number the frozen estimate predates.
// `high` because this pass is judged on correctness, not cost: an error here
// reaches every lesson built on the row. `max` is the level above; the pilot
// prices `high` first so that choice is made with a number in front of it.
export const DEFAULT_EFFORT = 'high';
// The system prompt — calibration warning, enums, level rubric, romanization map
// — is byte-identical across every batch of a run and is the only part worth a
// cache breakpoint. The per-batch rows sit after it in render order, so nothing
// volatile precedes the breakpoint. Quality-neutral: it changes what is billed,
// never what is sent. Verify with usage.cache_read_input_tokens, not by assuming.

export class JudgeError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'JudgeError';
    this.status = status;
    this.body = body;
  }
}

export function readKey(env = process.env) {
  const key = env.DR_ANTHROPIC_KEY;
  if (!key) {
    throw new JudgeError('judge: DR_ANTHROPIC_KEY is absent. The hoopoe-dr environment is not ' +
      'configured for the live call. Stop and report — there is no fallback variable.');
  }
  return key;
}

/**
 * Pulls the JSON objects out of a model response without altering their content.
 * The contract says one object per row, no prose and no fences, but a stray
 * fence or a wrapping array must not cost a batch. Extraction only: nothing
 * here edits a value to make the schema pass (dr-runner-spec.md §7.5).
 */
export function parseObjects(text) {
  const stripped = text.trim().replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '').trim();
  try {
    const whole = JSON.parse(stripped);
    if (Array.isArray(whole)) return whole;
    if (whole && typeof whole === 'object') return [whole];
  } catch { /* fall through to the scanner */ }

  const objects = [];
  let depth = 0, start = -1, inString = false, escaped = false;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') { if (depth === 0) start = i; depth++; }
    else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        objects.push(JSON.parse(stripped.slice(start, i + 1)));
        start = -1;
      }
    }
  }
  if (objects.length === 0) throw new JudgeError('judge: no JSON object found in the response');
  return objects;
}

async function callAnthropic(cfg) {
  const {
    message, model = JUDGE_MODEL, maxTokens = DEFAULT_MAX_TOKENS,
    effort = DEFAULT_EFFORT, cache = true, fetchImpl = fetch, env = process.env,
  } = cfg;
  const res = await fetchImpl(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': readKey(env),
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      output_config: { effort },
      system: cache
        ? [{ type: 'text', text: message.system, cache_control: { type: 'ephemeral' } }]
        : message.system,
      messages: [{ role: 'user', content: message.user }],
      // Always streamed: a batch's output runs to tens of thousands of tokens and
      // a non-streamed request that large hits the HTTP timeout before the model
      // is done. Transport only — it changes nothing about what is sent or cached.
      stream: true,
    }),
  });

  // Halts on any non-2xx (§7.6). An error response is plain JSON, not a stream.
  // The key never appears in the thrown detail.
  if (!res.ok) {
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch { /* keep raw text */ }
    throw new JudgeError(`judge: anthropic ${res.status} ${body?.error?.type ?? ''} ${body?.error?.message ?? ''}`.trim(),
      { status: res.status, body });
  }

  // The seam presents one error type upward, whatever layer failed.
  let decoded;
  try {
    decoded = await readStream(res.body);
  } catch (err) {
    if (err instanceof StreamError) throw new JudgeError(`judge: ${err.message}`);
    throw err;
  }
  return { model, effort, ...decoded };
}

function callEdgeFunction() {
  // Stub until the `claude` edge function is deployed (dr-runner-spec.md §11).
  // It is the required route for the full 2,728-row loop; the pilot runs direct.
  throw new JudgeError('judge: transport "edge-function" is not implemented — the `claude` ' +
    'edge function is not deployed yet (open §J item). Use "anthropic-direct" for the pilot.');
}

/**
 * rows: the batch's rule-fixed source rows. Used for the requested-id list the
 *   caller checks the response against; the prompt text itself is built above
 *   the seam (§6 steps 3 then 4) and passed in as cfg.message {system, user}.
 * cfg: { transport, message, model?, maxTokens?, effort?, cache?, fetchImpl?, env? }
 *
 * Returns { objects, requestedIds, usage, model, stopReason, raw }. §4 names the
 * return "array of row objects"; the token counts §6.8 requires have to travel
 * with it, so the array is a field rather than the whole return.
 */
export async function judge(rows, cfg = {}) {
  if (!Array.isArray(rows) || rows.length === 0) throw new JudgeError('judge: rows must be a non-empty array');
  if (!cfg.message?.system || !cfg.message?.user) {
    throw new JudgeError('judge: cfg.message must carry {system, user} built by prompt.mjs');
  }

  const transport = cfg.transport ?? 'anthropic-direct';
  let result;
  if (transport === 'anthropic-direct') result = await callAnthropic(cfg);
  else if (transport === 'edge-function') result = callEdgeFunction(cfg);
  else if (transport === 'judge-cli') {
    // Imported lazily so the CLI module's node:child_process dependency stays out
    // of the offline suites that only exercise the direct path.
    const { callClaudeCli } = await import('./judge-cli.mjs');
    result = await callClaudeCli(cfg);
  } else throw new JudgeError(`judge: unknown transport ${transport}`);

  if (result.stopReason === 'max_tokens') {
    throw new JudgeError(`judge: response truncated at max_tokens (${cfg.maxTokens ?? DEFAULT_MAX_TOKENS}) — ` +
      'batch output does not fit. Lower batchSize (dr-runner-spec.md §7.4) rather than trimming the output.');
  }

  return {
    objects: parseObjects(result.raw),
    requestedIds: rows.map((r) => r.id),
    usage: result.usage,
    model: result.model,
    effort: result.effort,
    stopReason: result.stopReason,
    raw: result.raw,
    // Present only when the transport meters itself (judge-cli). run.mjs prefers
    // it over D243's price table; absent, nothing changes for the direct path.
    usd: result.usd,
    sessionId: result.sessionId,
  };
}
