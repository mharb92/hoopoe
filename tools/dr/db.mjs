// PostgREST edge: reads `dictionary`, upserts `dictionary_review`
// (dr-runner-spec.md §3, §5, dr-build-brief.md B2).
//
// There is no code path here that writes `dictionary`. WRITE_TABLE is the only
// table any write function names, and it is `dictionary_review`. Promotion
// stays a hand-run SQL step behind G1-G8.
//
// Credential: the hoopoe-dr environment injects the service_role key into every
// call to this host as `Authorization: Bearer <key>` plus `apikey: <key>`, so
// the session never sees it. If a key is present in the environment anyway,
// both headers are set here with the same value — the shape is identical.

export const PROJECT_REF = 'pniwgnjljpkiimssortp'; // new project (CLAUDE.md, D137)
export const BASE_URL = `https://${PROJECT_REF}.supabase.co/rest/v1`;
export const READ_TABLE = 'dictionary';
export const WRITE_TABLE = 'dictionary_review';
export const PAGE_SIZE = 1000;

// The 12 source columns the prompt's TSV carries, plus nothing else.
export const DICTIONARY_COLUMNS = [
  'id', 'arabic', 'romanization', 'english', 'pos', 'category', 'root',
  'conjugation', 'gender', 'dialect_tag', 'notes', 'confidence',
];

export class SupabaseError extends Error {
  constructor(message, { status, body, headers }) {
    super(message);
    this.name = 'SupabaseError';
    this.status = status;
    this.body = body;
    this.headers = headers;
  }
}

// Node's built-in fetch ignores HTTPS_PROXY unless the process was started with
// NODE_USE_ENV_PROXY=1 (or --use-env-proxy). Without it the call leaves the
// sandbox uncredentialed and Supabase answers 401 UNAUTHORIZED_MISSING_API_KEY,
// which reads as a credential fault but is not one. Checked before the request
// so the real cause is named.
export function proxyReadiness(env = process.env, execArgv = process.execArgv) {
  const proxy = env.HTTPS_PROXY ?? env.https_proxy;
  if (!proxy) return { ok: true, reason: 'no proxy configured' };
  const enabled = env.NODE_USE_ENV_PROXY === '1' || execArgv.includes('--use-env-proxy');
  if (enabled) return { ok: true, reason: 'env proxy enabled' };
  return {
    ok: false,
    reason: `HTTPS_PROXY is set (${proxy}) but this process ignores it. ` +
      'Start the runner as `NODE_USE_ENV_PROXY=1 node ...`, otherwise the ' +
      'environment credential never reaches Supabase.',
  };
}

// Both headers carry the same value; apikey has no prefix (CLAUDE.md).
// Absent key = the environment injects it on the wire.
export function authHeaders(env = process.env) {
  const key = env.DR_SUPABASE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  return key ? { Authorization: `Bearer ${key}`, apikey: key } : {};
}

function describeFailure(status, body, headers) {
  const code = headers?.get?.('sb-error-code') ?? body?.code;
  if (status === 401) {
    return `401 ${code ?? ''}: the apikey header did not reach Supabase. ` +
      'Credential problem, not a Supabase setting (CLAUDE.md).';
  }
  if (status === 403 && (body?.code === '42501' || /permission denied/i.test(body?.message ?? ''))) {
    return '403 42501 permission denied: service_role grants are missing on this table. ' +
      'Fix in the SQL Editor with `grant all on table ... to service_role;` — do not work around it.';
  }
  return `${status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`;
}

async function request(path, { method = 'GET', headers = {}, body, fetchImpl = fetch, env = process.env } = {}) {
  const ready = proxyReadiness(env);
  if (!ready.ok) throw new SupabaseError(`db: ${ready.reason}`, { status: 0, body: null });

  const res = await fetchImpl(`${BASE_URL}${path}`, {
    method,
    headers: { ...authHeaders(env), 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let parsed = text;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* keep raw text */ }

  // Any non-2xx halts (dr-runner-spec.md §7.6). Nothing here retries or patches.
  if (!res.ok) {
    throw new SupabaseError(`db: ${method} ${path} failed — ${describeFailure(res.status, parsed, res.headers)}`,
      { status: res.status, body: parsed, headers: res.headers });
  }
  return { body: parsed, headers: res.headers };
}

// content-range comes back as "0-999/2728" (or "*/2728" on an empty page).
function totalFromContentRange(headers) {
  const total = (headers.get('content-range') ?? '').split('/')[1];
  return total && total !== '*' ? Number(total) : undefined;
}

/** Reads every `dictionary` row, id-ordered, paged. Returns { rows, total }. */
export async function readDictionary(opts = {}) {
  const { columns = DICTIONARY_COLUMNS, pageSize = PAGE_SIZE, onPage, ...rest } = opts;
  const select = columns.join(',');
  const rows = [];
  let total;

  for (let offset = 0; ; offset += pageSize) {
    const { body, headers } = await request(
      `/${READ_TABLE}?select=${select}&order=id.asc`,
      { headers: { Prefer: 'count=exact', Range: `${offset}-${offset + pageSize - 1}` }, ...rest },
    );
    total ??= totalFromContentRange(headers);
    rows.push(...body);
    if (onPage) onPage({ received: body.length, soFar: rows.length, total });
    if (body.length < pageSize) break;
    if (total !== undefined && rows.length >= total) break;
  }
  return { rows, total: total ?? rows.length };
}

/** dictionary_ids already staged for this run — the resume key (§5). */
export async function stagedIds(runId, opts = {}) {
  const { body } = await request(
    `/${WRITE_TABLE}?select=dictionary_id&run_id=eq.${encodeURIComponent(runId)}`,
    opts,
  );
  return body.map((r) => r.dictionary_id);
}

/**
 * Stages one row per dictionary row, keyed (run_id, dictionary_id).
 * Default conflict behaviour is do-nothing, per §5: a retry after a partial
 * write must not overwrite what is already staged. `merge: true` switches to
 * merge-duplicates for a deliberate re-stage.
 */
export async function upsertReview(rows, opts = {}) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('db: upsertReview needs a non-empty array');
  for (const r of rows) {
    if (!r?.run_id || !Number.isInteger(r?.dictionary_id)) {
      throw new Error('db: every staging row needs run_id and an integer dictionary_id');
    }
  }
  const { merge = false, ...rest } = opts;
  const resolution = merge ? 'merge-duplicates' : 'ignore-duplicates';
  await request(`/${WRITE_TABLE}?on_conflict=run_id,dictionary_id`, {
    method: 'POST',
    headers: { Prefer: `resolution=${resolution},return=minimal` },
    body: rows,
    ...rest,
  });
  return { staged: rows.length, resolution };
}
