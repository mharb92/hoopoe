// Seeded stratified batch plan over all dictionary ids (dr-runner-spec.md §5,
// dr-scoped-pass.md §6: single sampled shuffle, no grouped-batch path).

// mulberry32: small, deterministic, dependency-free PRNG.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(array, rng) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * rows: array of { id, category }.
 * Returns { seed, batches: [[id, ...], ...] } — a stratified random sample plan,
 * every id appearing exactly once, batches sized to cfg.batchSize (last batch
 * may be smaller).
 *
 * Stratification method: each category's shuffled ids are placed at evenly
 * spaced fractional positions in [0, 1) — id at index i of n gets key
 * (i + 0.5) / n. Merging all categories by sorting on this key produces one
 * sequence where every category's ids are spread uniformly across the whole
 * run, so any contiguous batchSize-sized slice reflects the overall category
 * proportions. Slicing then gives exact, evenly sized batches, unlike
 * per-category-per-batch remainder splitting (which front-loads remainders
 * onto the same batches for every category).
 */
export function buildPlan(rows, cfg) {
  const { seed, batchSize } = cfg;
  if (rows.length === 0) throw new Error('sample: rows must be non-empty');

  const byCategory = new Map();
  for (const r of rows) {
    if (!byCategory.has(r.category)) byCategory.set(r.category, []);
    byCategory.get(r.category).push(r.id);
  }

  const categories = [...byCategory.keys()].sort(); // stable order regardless of input order
  const rng = mulberry32(seed);

  const keyed = [];
  for (const category of categories) {
    const ids = byCategory.get(category).slice().sort((a, b) => a - b);
    const shuffled = seededShuffle(ids, rng);
    const n = shuffled.length;
    shuffled.forEach((id, i) => {
      keyed.push({ id, key: (i + 0.5) / n, tiebreak: rng() });
    });
  }
  keyed.sort((a, b) => a.key - b.key || a.tiebreak - b.tiebreak);
  const orderedIds = keyed.map((k) => k.id);

  const numBatches = Math.ceil(orderedIds.length / batchSize);
  const batches = [];
  for (let i = 0; i < numBatches; i++) {
    batches.push(orderedIds.slice(i * batchSize, (i + 1) * batchSize));
  }

  // Shuffle order within each batch so it isn't ordered by category/key.
  const finalBatches = batches.map((batch) => seededShuffle(batch, rng));

  return { seed, batches: finalBatches };
}
