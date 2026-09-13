import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge, parseObjects, readKey, JudgeError, JUDGE_MODEL, ANTHROPIC_URL } from '../judge.mjs';

const MESSAGE = { system: 'sys', user: 'usr' };
const ENV = { DR_ANTHROPIC_KEY: 'k-test' };
const ROWS = [{ id: 284, arabic: 'مبروك' }];

function stubFetch({ status = 200, body }) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, ...init, parsedBody: JSON.parse(init.body) });
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
    };
  };
  return { impl, calls };
}

function reply(text, extra = {}) {
  return { content: [{ type: 'text', text }], usage: { input_tokens: 10, output_tokens: 20 }, stop_reason: 'end_turn', ...extra };
}

test('readKey reads DR_ANTHROPIC_KEY and falls back to nothing', () => {
  assert.equal(readKey(ENV), 'k-test');
  assert.throws(() => readKey({ ANTHROPIC_API_KEY: 'other' }), /DR_ANTHROPIC_KEY is absent/);
});

test('parseObjects handles a bare array, a single object, JSONL and a stray fence', () => {
  assert.equal(parseObjects('[{"id":1},{"id":2}]').length, 2);
  assert.deepEqual(parseObjects('{"id":1}'), [{ id: 1 }]);
  assert.deepEqual(parseObjects('{"id":1}\n{"id":2}').map((o) => o.id), [1, 2]);
  assert.deepEqual(parseObjects('```json\n[{"id":3}]\n```'), [{ id: 3 }]);
});

test('parseObjects keeps braces inside strings out of the object count', () => {
  const objs = parseObjects('{"id":1,"level_reason":"a } brace {"}\n{"id":2,"level_reason":"\\" }"}');
  assert.equal(objs.length, 2);
  assert.equal(objs[0].level_reason, 'a } brace {');
});

test('parseObjects throws rather than returning a patched-up result', () => {
  assert.throws(() => parseObjects('no json at all'), /no JSON object found/);
});

test('the request carries no temperature and steers depth with effort instead (Opus 5 rejects temperature)', async () => {
  const { impl, calls } = stubFetch({ body: reply('[{"id":284}]') });
  await judge(ROWS, { message: MESSAGE, effort: 'low', fetchImpl: impl, env: ENV });
  assert.equal('temperature' in calls[0].parsedBody, false);
  assert.deepEqual(calls[0].parsedBody.output_config, { effort: 'low' });
});

test('judge names the judging model in the API call and sends the built message', async () => {
  const { impl, calls } = stubFetch({ body: reply('[{"id":284}]') });
  const out = await judge(ROWS, { transport: 'anthropic-direct', message: MESSAGE, fetchImpl: impl, env: ENV });
  assert.equal(calls[0].url, ANTHROPIC_URL);
  assert.equal(calls[0].parsedBody.model, JUDGE_MODEL);
  assert.equal(calls[0].parsedBody.system, 'sys');
  assert.equal(calls[0].parsedBody.messages[0].content, 'usr');
  assert.equal(calls[0].headers['x-api-key'], 'k-test');
  assert.deepEqual(out.objects, [{ id: 284 }]);
  assert.deepEqual(out.requestedIds, [284]);
  assert.deepEqual(out.usage, { input_tokens: 10, output_tokens: 20 });
});

test('a non-2xx halts and never leaks the key into the error', async () => {
  const { impl } = stubFetch({ status: 429, body: { error: { type: 'rate_limit_error', message: 'slow down' } } });
  await assert.rejects(
    () => judge(ROWS, { message: MESSAGE, fetchImpl: impl, env: ENV }),
    (err) => err instanceof JudgeError && err.status === 429 &&
      /rate_limit_error/.test(err.message) && !err.message.includes('k-test'),
  );
});

test('a max_tokens stop is a failure, not a short batch', async () => {
  const { impl } = stubFetch({ body: reply('[{"id":284}', { stop_reason: 'max_tokens' }) });
  await assert.rejects(() => judge(ROWS, { message: MESSAGE, fetchImpl: impl, env: ENV }), /truncated at max_tokens/);
});

test('the edge-function transport is a stub that reports why, and unknown transports throw', async () => {
  await assert.rejects(
    () => judge(ROWS, { transport: 'edge-function', message: MESSAGE, env: ENV }),
    /not implemented/,
  );
  await assert.rejects(() => judge(ROWS, { transport: 'carrier-pigeon', message: MESSAGE, env: ENV }), /unknown transport/);
});

test('judge refuses an empty batch or a message it did not get from prompt.mjs', async () => {
  await assert.rejects(() => judge([], { message: MESSAGE, env: ENV }), /non-empty array/);
  await assert.rejects(() => judge(ROWS, { env: ENV }), /cfg\.message/);
});
