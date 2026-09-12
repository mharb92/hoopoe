// Run configuration for the DR batch runner (dr-runner-spec.md §2, §4-§5).
// Offline: builds and validates the shape, does not read env or network itself.

import { randomUUID } from 'node:crypto';

export const TOTAL_ROWS = 2728;
export const DEFAULT_BATCH_SIZE = 60; // dr-scoped-pass.md §6: scoped default, not the frozen 120.
export const TRANSPORTS = ['anthropic-direct', 'edge-function'];

// Deterministic 32-bit seed from a string, so a run id maps to one plan (mulberry32-compatible).
export function seedFromString(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0) || 1; // never 0
}

// spendCapUsd has no default: the dollar figure is Marwan's call (dr-build-brief.md B4),
// not something this runner may invent. Callers must pass it explicitly.
export function buildConfig(overrides = {}) {
  const runId = overrides.runId ?? `dr-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  const seed = overrides.seed ?? seedFromString(runId);
  const batchSize = overrides.batchSize ?? DEFAULT_BATCH_SIZE;
  const transport = overrides.transport ?? 'anthropic-direct';
  const spendCapUsd = overrides.spendCapUsd; // required by callers that spend money (B3), not validated here.

  if (!Number.isInteger(seed) || seed <= 0) {
    throw new Error(`config: seed must be a positive integer, got ${seed}`);
  }
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error(`config: batchSize must be a positive integer, got ${batchSize}`);
  }
  if (!TRANSPORTS.includes(transport)) {
    throw new Error(`config: transport must be one of ${TRANSPORTS.join(', ')}, got ${transport}`);
  }

  return Object.freeze({ runId, seed, batchSize, transport, spendCapUsd, totalRows: TOTAL_ROWS });
}
