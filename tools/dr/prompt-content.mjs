// Transcribed spec content injected into the frozen/scoped prompt's placeholders
// (dr-prompt-scoped.md: <<ENUMS>>, <<LEVEL_RUBRIC>>, <<ROMANIZATION>>).
// Source: dr-spec.md §2-§4. Transcribed, not paraphrased or re-derived.

export const ENUMS_TEXT = `
ENUMS

pos (dr-spec.md §3):
  noun, verb, adjective, adverb, pronoun, preposition, conjunction, particle,
  interjection — single lexemes, as now.
  formula — a fixed multi- or single-token utterance functioning as a whole
    conversational turn (e.g. مبروك، شكرا، إن شاء الله، وعليكم السلام).
  frame — a productive pattern with a variable slot (e.g. بدي أروح، شو بدك؟).

register (dr-spec.md §4): neutral | slang | formal

form_origin (dr-spec.md §4):
  dialect | msa_shared_dialect_pron | msa_identical | regional_variant

level (dr-spec.md §2): integer 1-5. See LEVEL_RUBRIC below.
`.trim();

export const LEVEL_RUBRIC_TEXT = `
LEVEL RUBRIC (dr-spec.md §2)

Level N = a learner who has cleared band N can be assumed to handle
essentially everything at levels 1 to N. Global across the whole dictionary,
not within category or pos.

Level 1 requires all three strands (§2.1):
  A. Sentence machinery — pronouns, the core verb spine in dialect form,
     negation (مش، ما), بدي, question words, prepositions, quantifiers,
     core connectors.
  B. Core concrete lexis — nouns and adjectives you cannot describe a day
     without.
  C. Obligatory formulas — greetings, farewells, politeness, core blessings,
     including both halves of every call-and-response pair.

Worked anchors (§2.3), test = how early a learner needs this to form and
survive Palestinian sentences, not frequency or difficulty:
  1 — needed in week 1 to say anything at all, or an obligatory social move.
  2 — needed to hold an ordinary daily conversation beyond survival.
  3 — needed to talk about a topic rather than a situation; the working middle.
  4 — lower-frequency, more specific, or register-marked.
  5 — rare, literary, formal, or highly regional.

Hard rules (§2.4):
  1. Pairs share a level. Both halves of a formula_pair get the same level.
  2. Regional variants sit at least one level above their base form.
  3. form_origin = msa_identical is not evidence of low level.
  4. register = formal caps at level 4.
  5. register = slang caps at level 3.
  6. Frames and formulas are levelled by need, not by length.
`.trim();

// The D47 Arabizi romanization standard (character map) is referenced by
// dr-prompt.md and dr-prompt-scoped.md but is not defined anywhere in this
// repo — only in PROJECT_SPEC.md in the claude.ai project (CLAUDE.md:
// "Sources of truth ... not in this repo"). Left unset deliberately: this
// module must never fabricate a romanization standard. buildSystemPrompt()
// throws if this is not supplied by the caller.
export const ROMANIZATION_TEXT = undefined;
