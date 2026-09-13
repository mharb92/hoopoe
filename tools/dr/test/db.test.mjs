import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  authHeaders, proxyReadiness, readDictionary, stagedIds, upsertReview,
  SupabaseError, BASE_URL, WRITE_TABLE,
} from '../db.mjs';

const ENV = { NODE_USE_ENV_PROXY: '1', DR_SUPABASE_KEY: 'test-key' };

// Records every call and replies from a queue of { status, body, headers }.
function stubFetch(replies) {
  const calls = [];
  const queue = [...replies];
  const impl = async (url, init = {}) => {
    calls.push({ url, ...init });
    const { status = 200, body = [], headers = {} } = queue.shift() ?? {};
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers(headers),
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    };
  };
  return { impl, calls };
}

test('authHeaders sets Authorization and apikey to the same value, apikey unprefixed', () => {
  const h = authHeaders({ DR_SUPABASE_KEY: 'abc' });
  assert.equal(h.Authorization, 'Bearer abc');
  assert.equal(h.apikey, 'abc');
});

test('authHeaders is empty when no key is in the environment (the proxy injects it)', () => {
  assert.deepEqual(authHeaders({}), {});
});

test('proxyReadiness fails when HTTPS_PROXY is set but the process ignores it', () => {
  const r = proxyReadiness({ HTTPS_PROXY: 'http://127.0.0.1:42511' }, []);
  assert.equal(r.ok, false);
  assert.match(r.reason, /NODE_USE_ENV_PROXY/);
});

test('proxyReadiness passes with the env flag, the CLI flag, or no proxy at all', () => {
  assert.ok(proxyReadiness({ HTTPS_PROXY: 'p', NODE_USE_ENV_PROXY: '1' }, []).ok);
  assert.ok(proxyReadiness({ HTTPS_PROXY: 'p' }, ['--use-env-proxy']).ok);
  assert.ok(proxyReadiness({}, []).ok);
});

test('readDictionary pages until the count is reached and sends both auth headers', async () => {
  const page = (n, from) => Array.from({ length: n }, (_, i) => ({ id: from + i }));
  const { impl, calls } = stubFetch([
    { body: page(2, 1), headers: { 'content-range': '0-1/3' } },
    { body: page(1, 3), headers: { 'content-range': '2-2/3' } },
  ]);
  const { rows, total } = await readDictionary({ pageSize: 2, fetchImpl: impl, env: ENV });
  assert.equal(total, 3);
  assert.deepEqual(rows.map((r) => r.id), [1, 2, 3]);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].headers.apikey, 'test-key');
  assert.equal(calls[0].headers.Authorization, 'Bearer test-key');
  assert.equal(calls[0].headers.Range, '0-1');
  assert.equal(calls[1].headers.Range, '2-3');
  assert.match(calls[0].url, /order=id\.asc/);
});

test('a 401 is reported as a missing apikey header, not a Supabase setting', async () => {
  const { impl } = stubFetch([{
    status: 401,
    body: { message: 'No API key found in request' },
    headers: { 'sb-error-code': 'UNAUTHORIZED_MISSING_API_KEY' },
  }]);
  await assert.rejects(
    () => readDictionary({ fetchImpl: impl, env: ENV }),
    (err) => err instanceof SupabaseError && err.status === 401 && /apikey header/.test(err.message),
  );
});

test('a 403 42501 is reported as missing grants, and nothing works around it', async () => {
  const { impl } = stubFetch([{ status: 403, body: { code: '42501', message: 'permission denied for table' } }]);
  await assert.rejects(
    () => upsertReview([{ run_id: 'r', dictionary_id: 1, batch_no: 1, payload: {} }], { fetchImpl: impl, env: ENV }),
    (err) => err.status === 403 && /grant all on table/.test(err.message),
  );
});

test('upsertReview posts to dictionary_review on (run_id, dictionary_id), do-nothing by default', async () => {
  const { impl, calls } = stubFetch([{ status: 201, body: '' }]);
  const rows = [{ run_id: 'r1', dictionary_id: 7, batch_no: 1, payload: { id: 7 }, status: 'auto' }];
  const out = await upsertReview(rows, { fetchImpl: impl, env: ENV });
  assert.equal(out.staged, 1);
  assert.equal(out.resolution, 'ignore-duplicates');
  assert.equal(calls[0].url, `${BASE_URL}/${WRITE_TABLE}?on_conflict=run_id,dictionary_id`);
  assert.equal(calls[0].method, 'POST');
  assert.match(calls[0].headers.Prefer, /resolution=ignore-duplicates/);
});

test('upsertReview rejects rows without the resume key rather than staging them', async () => {
  const { impl, calls } = stubFetch([{ status: 201, body: '' }]);
  await assert.rejects(() => upsertReview([{ dictionary_id: 7 }], { fetchImpl: impl, env: ENV }), /run_id/);
  assert.equal(calls.length, 0);
});

test('no write function names the dictionary table', async () => {
  const { impl, calls } = stubFetch([{ status: 201, body: '' }, { body: [] }]);
  await upsertReview([{ run_id: 'r', dictionary_id: 1, batch_no: 1, payload: {} }], { fetchImpl: impl, env: ENV });
  await stagedIds('r', { fetchImpl: impl, env: ENV });
  for (const call of calls) {
    if ((call.method ?? 'GET') !== 'GET') assert.match(call.url, /\/dictionary_review\?/);
  }
});
