// Builds the batch message from dr-prompt-scoped.md (dr-build-brief.md B1).
// Pure templating: takes the doc's raw text plus content strings, no network.
// loadPromptDoc and loadRomanizationMap are the file-reading exceptions, and
// take a path rather than naming one — callers get the real paths from
// config.mjs (PROMPT_DOC_PATH, ROMANIZATION_MAP_PATH).

import { readFile } from 'node:fs/promises';

const TSV_HEADER = [
  'id', 'arabic', 'romanization', 'english', 'pos', 'category', 'root',
  'conjugation', 'gender', 'dialect_tag', 'notes', 'confidence',
];

export async function loadPromptDoc(path) {
  return readFile(path, 'utf8');
}

// Loads the D47 romanization map (docs/dr/romanization-map.md — path from
// config.mjs's ROMANIZATION_MAP_PATH). Throws on a missing or empty file
// rather than letting buildSystemPrompt silently inject nothing.
export async function loadRomanizationMap(mapPath) {
  let content;
  try {
    content = await readFile(mapPath, 'utf8');
  } catch (err) {
    throw new Error(`prompt: romanization map not found at ${mapPath} (${err.code ?? err.message})`);
  }
  if (content.trim().length === 0) {
    throw new Error(`prompt: romanization map at ${mapPath} is empty`);
  }
  return content;
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

// Pulls a whole `## Heading` section, fence and prose together, up to the next
// `## ` heading or the end of the doc.
export function extractSection(docText, headingRe) {
  const headingMatch = headingRe.exec(docText);
  if (!headingMatch) throw new Error(`prompt: section not found: ${headingRe}`);
  const start = headingMatch.index;
  const rest = docText.slice(start + headingMatch[0].length);
  const nextHeading = /\n##\s/.exec(rest);
  const end = nextHeading ? start + headingMatch[0].length + nextHeading.index : docText.length;
  return docText.slice(start, end).trim();
}

// The output contract — the JSON example, the field rules, the D210 vowel-length
// rule — sits outside both fenced blocks in dr-prompt-scoped.md (and in frozen
// dr-prompt.md), so injecting only those fences leaves the model with no
// statement of the shape to return. It then answers in a shape of its own
// invention and validate.mjs rejects every row. Injected verbatim, never
// paraphrased; absence is a hard error, not a silently contract-free prompt.
export function extractOutputContract(docText) {
  return extractSection(docText, /##\s*Output contract\s*\n/);
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
  return { system, user: `${user}\n\n${extractOutputContract(docText)}` };
}
