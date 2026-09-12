// Builds the batch message from dr-prompt-scoped.md (dr-build-brief.md B1).
// Pure templating: takes the doc's raw text plus content strings, no network,
// no file I/O of its own (loadPromptDoc is the one exception, used by callers).

import { readFile } from 'node:fs/promises';

const TSV_HEADER = [
  'id', 'arabic', 'romanization', 'english', 'pos', 'category', 'root',
  'conjugation', 'gender', 'dialect_tag', 'notes', 'confidence',
];

export async function loadPromptDoc(path) {
  return readFile(path, 'utf8');
}

// Extracts the first ``` fenced block that follows a heading line matching `headingRe`.
export function extractFencedBlock(docText, headingRe) {
  const headingMatch = headingRe.exec(docText);
  if (!headingMatch) throw new Error(`prompt: heading not found: ${headingRe}`);
  const rest = docText.slice(headingMatch.index + headingMatch[0].length);
  const fenceMatch = /```[^\n]*\n([\s\S]*?)```/.exec(rest);
  if (!fenceMatch) throw new Error(`prompt: no fenced block after heading: ${headingRe}`);
  return fenceMatch[1].replace(/\n$/, '');
}

function fillPlaceholders(template, replacements) {
  let out = template;
  for (const [key, value] of Object.entries(replacements)) {
    const token = `<<${key}>>`;
    if (!out.includes(token)) continue;
    if (value === undefined || value === null) {
      throw new Error(`prompt: missing required content for placeholder ${token}`);
    }
    out = out.split(token).join(value);
  }
  return out;
}

export function buildSystemPrompt(docText, { enums, levelRubric, romanization }) {
  const template = extractFencedBlock(docText, /##\s*System\s*\n/);
  return fillPlaceholders(template, {
    ENUMS: enums,
    LEVEL_RUBRIC: levelRubric,
    ROMANIZATION: romanization,
  });
}

function rowToTsvLine(row) {
  return TSV_HEADER.map((col) => {
    const v = row[col];
    return v === null || v === undefined ? '' : String(v).replace(/\t|\n/g, ' ');
  }).join('\t');
}

// The template text itself reads "Rows <<N>> of 2,728. Batch <<B>>." — N is
// this batch's row count, B is "index/total", so the placeholders only need
// to carry the numbers the surrounding literal text does not already say.
export function buildUserPrompt(docText, { rowCount, batchLabel, rows }) {
  const template = extractFencedBlock(docText, /##\s*User \(per batch\)\s*\n/);
  const tsv = [TSV_HEADER.join(', '), ...rows.map(rowToTsvLine)].join('\n');
  return fillPlaceholders(template, { N: rowCount, B: batchLabel, TSV: tsv });
}

/**
 * Assembles the full system+user message for one batch.
 * rows: array of row objects with rulefix already applied (dr-runner-spec.md §6).
 * batchIndex/totalBatches: 1-based.
 */
export function buildBatchMessage(docText, rows, { batchIndex, totalBatches, enums, levelRubric, romanization }) {
  const system = buildSystemPrompt(docText, { enums, levelRubric, romanization });
  const batchLabel = `${batchIndex}/${totalBatches}`;
  const user = buildUserPrompt(docText, { rowCount: rows.length, batchLabel, rows });
  return { system, user };
}
