// Decodes one streamed Anthropic message into the three things the seam needs:
// the text, the usage counts and the stop reason (dr-runner-spec.md §7.9).
// Its own module because decoding a wire format is a different job from being
// the model seam, and inlining it pushed judge.mjs well past the size rule.

export class StreamError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StreamError';
  }
}

// Server-sent events, decoded without a dependency: blocks are separated by a
// blank line and each carries one `data:` JSON payload.
export async function* sseEvents(body) {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    let split;
    while ((split = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);
      const data = block.split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('');
      if (data) yield JSON.parse(data);
    }
  }
}

// Text blocks only: with thinking on, `thinking` blocks stream alongside them and
// are never part of the contract. Usage arrives in two halves — input and cache
// counts on message_start, output and stop_reason on message_delta.
export async function readStream(body) {
  let raw = '';
  let usage = {};
  let stopReason;
  for await (const event of sseEvents(body)) {
    if (event.type === 'error') {
      throw new StreamError(`stream: ${event.error?.type ?? ''} ${event.error?.message ?? ''}`.trim());
    }
    if (event.type === 'message_start') usage = { ...usage, ...event.message?.usage };
    else if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') raw += event.delta.text;
    else if (event.type === 'message_delta') {
      stopReason = event.delta?.stop_reason ?? stopReason;
      usage = { ...usage, ...event.usage };
    }
  }
  return { raw, usage, stopReason };
}
