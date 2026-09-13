import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readStream, sseEvents, StreamError } from '../stream.mjs';

const enc = (s) => new TextEncoder().encode(s);
const frame = (type, obj) => `event: ${type}\ndata: ${JSON.stringify({ type, ...obj })}\n\n`;

// Yields the wire bytes in fixed-size chunks that do not align with frame edges.
function chunked(wire, size) {
  const bytes = enc(wire);
  return (async function* () {
    for (let i = 0; i < bytes.length; i += size) yield bytes.slice(i, i + size);
  })();
}

const wire = [
  frame('message_start', { message: { usage: { input_tokens: 4228, cache_read_input_tokens: 2676 } } }),
  frame('content_block_start', { index: 0 }),
  frame('content_block_delta', { index: 0, delta: { type: 'text_delta', text: '{"id":284,' } }),
  frame('content_block_delta', { index: 0, delta: { type: 'text_delta', text: '"level":1}' } }),
  frame('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 1194 } }),
  frame('message_stop', {}),
].join('');

test('readStream reassembles text, merges both halves of usage, and reports the stop reason', async () => {
  const out = await readStream(chunked(wire, 7));
  assert.equal(out.raw, '{"id":284,"level":1}');
  assert.equal(out.stopReason, 'end_turn');
  assert.deepEqual(out.usage, { input_tokens: 4228, cache_read_input_tokens: 2676, output_tokens: 1194 });
});

test('the result is identical however the bytes are chunked', async () => {
  const results = [];
  for (const size of [1, 3, 64, 100000]) results.push(await readStream(chunked(wire, size)));
  for (const r of results) assert.deepEqual(r, results[0]);
});

test('thinking deltas never reach the text, so the contract sees only the JSON', async () => {
  const withThinking = [
    frame('message_start', { message: { usage: {} } }),
    frame('content_block_delta', { index: 0, delta: { type: 'thinking_delta', thinking: 'weighing level 1 vs 2' } }),
    frame('content_block_delta', { index: 1, delta: { type: 'text_delta', text: '{"id":1}' } }),
    frame('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 5 } }),
  ].join('');
  const out = await readStream(chunked(withThinking, 11));
  assert.equal(out.raw, '{"id":1}');
});

test('an error event halts rather than returning a truncated batch', async () => {
  const err = frame('error', { error: { type: 'overloaded_error', message: 'overloaded' } });
  await assert.rejects(() => readStream(chunked(err, 9)),
    (e) => e instanceof StreamError && /overloaded_error/.test(e.message));
});

test('sseEvents ignores keep-alive lines and comments between frames', async () => {
  const noisy = `: ping\n\n${frame('message_stop', {})}`;
  const seen = [];
  for await (const ev of sseEvents(chunked(noisy, 5))) seen.push(ev.type);
  assert.deepEqual(seen, ['message_stop']);
});
