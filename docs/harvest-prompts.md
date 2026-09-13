# Hoopoe Harvest: Claude prompts (verbatim)
Source: branch `modular-rebuild-5` @ 7dc0b14. All calls use `CLAUDE_MODEL` = `claude-sonnet-4-20250514` (js/config.js:6). Code copied as-is; `${...}` are runtime interpolations. Assessment lives in harvest.md section 5.

## P1. Shared generation system prompt (used by P2, P3)
`js/generation.js:32-66` · max_tokens n/a (system)

```js
const SYSTEM_PROMPT = `You are a Palestinian Arabic curriculum designer and lesson author for a language learning app called Hoopoe (الهدهد).

DIALECT RULES — Palestinian Arabic (Urban Jerusalem/Ramallah), NOT MSA, NOT Egyptian, NOT Gulf:
- "want" = بدي (biddi), NEVER عايز or أريد
- "what" = شو (shu), NEVER إيش or ماذا in conversational speech
- "now" = هلق (halla'), NEVER دلوقتي or الآن in casual speech
- "this" (m) = هاد (hād), (f) = هاي (hāy)
- "not" = مش (mish) or ما (mā) + verb
- Future = رح (ra7) + verb, NEVER هـ prefix
- Progressive = عم (3am) + verb
- Present tense = b- prefix: بحكي، بروح، بعرف
- Possessive suffixes: ـي، ـك، ـه، ـها، ـنا، ـكم، ـهم
- Urban ق → glottal stop (ء): قال → ءال
- "there is" = في (fī)
- Questions: intonation-based in casual speech, not هل

DIALECT TAGS (from dictionary):
- D = dialect-only (no MSA equivalent in this form)
- D-var = regional variant (teach main urban form, mention variant)
- S = shared with MSA (same form + meaning)
- M = MSA-origin, adapted to Palestinian pronunciation
- MSA = formal register word used in educated speech
- SL = slang/informal (use sparingly, Phase 3 only)

ROMANIZATION — intuitive English-friendly:
- ع = 3, ح = 7, خ = kh, ش = sh, غ = gh, ق = ' (glottal)
- Long vowels: aa, ee, oo. No macrons or special Unicode.

HERITAGE SPEAKER CONTEXT:
- Heritage speakers grew up hearing Palestinian Arabic but may not read script or produce speech confidently
- They have large passive vocabulary but poor active production
- Don't waste time teaching vocabulary they already recognize — push production and script
- Grammar explanation should be intuitive ("you already say هاد — here's the pattern behind it") not academic

Return ONLY valid JSON. No markdown, no explanation, no preamble.`;
```

## P2. Phase plan (30-day): user prompt incl. prev-performance block
`js/generation.js:86-146` · max_tokens 2000

```js
  const catScores = pp.category_scores || {};
  const strengths = Object.entries(catScores).filter(([, s]) => s > 0.7).map(([c]) => c);
  const weaknesses = Object.entries(catScores).filter(([, s]) => s < 0.4).map(([c]) => c);

  let prevBlock = '';
  if (prevPhasePerformance && phaseNumber > 1) {
    prevBlock = `
Previous phase performance:
- Lessons completed: ${prevPhasePerformance.completed || 0}/30
- Average quiz score: ${prevPhasePerformance.avgQuizScore || 0}%
- Persistent weak areas: ${(prevPhasePerformance.weakAreas || []).join(', ') || 'none identified'}
- Strong areas: ${(prevPhasePerformance.strongAreas || []).join(', ') || 'none identified'}`;
  }

  const ratioStr = Object.entries(ratios).map(([k, v]) => `${k} ${v}`).join(', ');

  const userPrompt = `Generate a 30-day phase plan for a heritage Palestinian Arabic learner.

Phase: ${phaseNumber} of 3
Day 90 goal: ${goals}

Skill profile from placement:
- Recognition: ${pp.recognition || 0}/5
- Production: ${pp.production || 0}/5
- Grammar intuition: ${pp.grammar_intuition || 0}/5
- Script comfort: ${pp.script_comfort || 0}/5
- Vocab breadth: ${pp.vocab_breadth || 0}/5
- Listening: ${pp.listening || 0}/5
- Category strengths: ${strengths.length ? strengths.join(', ') : 'none yet'}
- Category weaknesses: ${weaknesses.length ? weaknesses.join(', ') : 'none yet'}
${prevBlock}

Content ratio targets for phase ${phaseNumber}:
${ratioStr}

Return ONLY valid JSON matching this structure (no markdown):
{
  "phase_id": "phase_${phaseNumber}",
  "content_ratios": { ${Object.entries(ratios).map(([k, v]) => `"${k}": ${v}`).join(', ')} },
  "weeks": [
    {
      "week": 1,
      "theme": "...",
      "skills": ["...", "..."],
      "primary_categories": ["...", "..."],
      "related_categories": ["...", "..."],
      "target_patterns": ["...", "..."],
      "heritage_notes": "..."
    }
  ]
}

Rules:
- 4 weeks per phase
- Heritage speakers: don't waste time on passive vocabulary they already know. Push production and script reading.
- Each week should build on the previous week's patterns
- Week 4 should include review/consolidation of weeks 1-3
- target_patterns must use Palestinian Arabic specifically
- primary_categories and related_categories must use ONLY from these exact category names: Adjectives (Abstract), Adjectives (Physical), Adverbs, Animals, Blessings & Wishes, Body, City & Places, Clothing, Colors, Common Verbs, Communication, Conjunctions, Connectors & Discourse, Conversational Fillers, Cooking, Culture & Customs, Daily Routine Verbs, Days & Months, Directions, Education, Emotions, Exclamations, Family, Farewells, Food & Drink, Greetings, Health & Medical, Household, Idioms & Expressions, Money & Shopping, Motion Verbs, Nature & Weather, Numbers, Particles, Personality, Politeness, Prepositions, Professions, Pronouns, Question Words, Religion, Sentence Patterns, Slang, Technology, Time, Transportation`;

  const result = await callClaude(userPrompt, 2000);
```

## P3. Daily lesson: user prompt incl. vocab pool, mastery, remedial
`js/generation.js:200-294` · max_tokens 3000

```js
  // Format vocab pool for prompt (tab-separated, compact)
  const vocabLines = vocabPool.map(e =>
    `${e.arabic}\t${e.romanization}\t${e.english}\t${e.pos}\t${e.category}\t${e.dialect_tag}${e.notes ? '\t' + e.notes : ''}`
  ).join('\n');

  // Load mastery data for this user
  const mastery = await loadMasteryForGeneration(email);

  // Compute block counts from content ratios
  const totalBlocks = 8; // target blocks per lesson
  const ratios = phasePlan.content_ratios || CONTENT_RATIOS[1];
  const blockCounts = {};
  for (const [type, ratio] of Object.entries(ratios)) {
    blockCounts[type] = Math.max(0, Math.round(totalBlocks * ratio));
  }
  // Ensure at least 1 phrase block
  if (!blockCounts.phrases) blockCounts.phrases = 1;

  let remedialBlock = '';
  if (isRemedial && remedialContext) {
    remedialBlock = `
Is remedial: true
Previous quiz weak areas: ${JSON.stringify(remedialContext)}
Focus this lesson on reinforcing these weak areas with NEW examples, not replaying old content.`;
  }

  const masteredList = mastery.mastered.slice(0, 20).map(w => w.arabic).join(', ') || 'none yet';
  const reinforceList = mastery.reinforcing.slice(0, 15).map(w => `${w.arabic} (${w.english})`).join(', ') || 'none';
  const weakList = mastery.weak.slice(0, 10).map(w => `${w.arabic} (${w.english})`).join(', ') || 'none';

  const lessonId = `lesson_${new Date().toISOString().split('T')[0]}_${email.split('@')[0]}`;

  const userPrompt = `Generate a lesson for a heritage Palestinian Arabic learner.

Phase: ${phasePlan.phase_number}, Week: ${weekNumber}, Day in phase: ${dayInPhase}
Theme: ${weekPlan.theme}
Skills to teach: ${(weekPlan.skills || []).join(', ')}
Target patterns: ${(weekPlan.target_patterns || []).join(', ')}
Heritage notes: ${weekPlan.heritage_notes || 'Standard heritage approach'}
${remedialBlock}

Content block targets (approximate):
- ${blockCounts.phrases || 2} phrase blocks
- ${blockCounts.patterns || 2} pattern blocks
- ${blockCounts.conjugation || 0} conjugation blocks (0-1 per lesson)
- ${blockCounts.dialogues || 1} dialogue blocks (0-1 per lesson)
- ${blockCounts.culture || 0} culture note blocks (0-1 per lesson)
- 1 listening block
- ${blockCounts.production || 1} production blocks

Estimated lesson length: 15-25 minutes

User's current mastery data:
- Words with mastery > 80 (skip these): ${masteredList}
- Words with mastery 30-60 (reinforce): ${reinforceList}
- Words with mastery < 30 (needs teaching): ${weakList}

VOCABULARY POOL — Use ONLY words from this pool for new vocabulary. You may compose sentences and dialogues freely from these words. Mark any word not in this pool with [UNVERIFIED]:
${vocabLines}

DIALECT TAG GUIDANCE:
- Prioritize D (dialect-only) and M (MSA-origin adapted) entries for conversational lessons
- Use MSA-tagged entries only when teaching formal register awareness
- Include SL (slang) entries sparingly, only in Phase 3
- D-var entries: mention the variant but teach the main urban form

Return ONLY valid JSON with this structure (no markdown):
{
  "lesson_id": "${lessonId}",
  "phase_id": "${phasePlan.phase_id}",
  "week": ${weekNumber},
  "day_in_phase": ${dayInPhase},
  "theme": "${weekPlan.theme}",
  "estimated_minutes": 20,
  "is_remedial": ${isRemedial},
  "blocks": [
    { "type": "phrase", "id": "b1", "arabic": "...", "romanization": "...", "english": "...", "audio_text": "...", "context": "...", "dictionary_ref": "dict_NNN" },
    { "type": "pattern", "id": "b2", "pattern_name": "...", "pattern_formula": "...", "examples": [...], "practice_prompt": "...", "practice_answer": {...} },
    { "type": "conjugation", "id": "b3", "verb_base": "...", "verb_english": "...", "root": "...", "forms": [...], "drill_prompts": [...] },
    { "type": "dialogue", "id": "b4", "title": "...", "lines": [...], "practice_role": "B", "practice_instructions": "..." },
    { "type": "culture_note", "id": "b5", "title": "...", "content": "..." },
    { "type": "listening", "id": "b6", "audio_text": "...", "options": [...] },
    { "type": "production", "id": "b7", "prompt_english": "...", "acceptable_answers": [...], "evaluation_notes": "..." }
  ],
  "vocab_items": ["dict_NNN", ...],
  "patterns_taught": ["pattern_name", ...]
}

Each block must have a unique "id" field (b1, b2, b3...).
For phrase blocks: include dictionary_ref if the word came from the vocabulary pool.
For pattern blocks: include exactly 3 examples and 1 practice prompt.
For conjugation blocks: include at least أنا/إنت/هو/هي forms.
For dialogue blocks: 4-6 lines, assign a practice_role.
For listening blocks: 1 correct + 2 incorrect options.
For production blocks: include 1-3 acceptable answer variations.`;
```

## P4. Legacy beginner unit: system + user (output never consumed)
`js/generation.js:480-521` · max_tokens 2000

```js

  let previousBlock = '';
  if (previousUnit) {
    previousBlock = `\n\nThe previous unit was "${previousUnit.title}" covering: ${previousUnit.phrases.slice(0, 4).map(p => p.en).join(', ')}, etc. Choose a DIFFERENT topic for variety.`;
  }

  const topicHints = [
    'essential greetings and introductions', 'family and relationships',
    'food, dining, and hospitality', 'directions, transportation, and getting around',
    'shopping, numbers, and daily transactions', 'expressing feelings, opinions, and desires',
    'work, education, and professional life', 'health, body, and emergencies',
    'weather, nature, and environment', 'culture, traditions, and celebrations'
  ];
  const topicHint = topicHints[(unitNumber - 1) % topicHints.length];

  const systemPrompt = 'You are a Palestinian Arabic curriculum designer. You create practical, conversational lesson units for language learners. Always use Palestinian Arabic dialect, not MSA. Return ONLY valid JSON with no markdown or explanation.';

  const userPrompt = `Generate lesson unit ${unitNumber} for a ${speakerType} learner at ${levelLabel} level.

Dialect: ${dialect}
Learning goals: ${goalsText}
Suggested topic area: ${topicHint}${previousBlock}

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "id": "dynamic_unit_${unitNumber}",
  "title": "Short descriptive title",
  "subtitle": "One-line description",
  "phrases": [
    {"ar": "Arabic text with harakat", "rom": "romanization", "en": "English translation", "context": "When/how to use this phrase"}
  ]
}

Rules:
- Exactly 12 phrases, no more, no less
- Use Palestinian Arabic dialect specifically
- Include harakat (vowel marks) on Arabic text
- Romanization should be intuitive for English speakers
- Context should explain when/where to use the phrase
- Progress from simpler to more complex within the unit
- ${levelLabel} level: ${level <= 1 ? 'basic vocabulary, short phrases, everyday situations' : level <= 2 ? 'complete sentences, common expressions, practical scenarios' : 'complex structures, idiomatic expressions, nuanced conversations'}`;

```

## P5. Focused Study custom topic to category mapping (system + user)
`js/focused-study.js:262-275` · max_tokens 300

```js
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 300,
        system: 'You map user topics to dictionary categories. Return ONLY valid JSON, no markdown.',
        messages: [{ role: 'user', content: `Map this topic to the most relevant categories from the following list.

Topic: "${topic}"

Categories: Adjectives (Abstract), Adjectives (Physical), Adverbs, Animals, Blessings & Wishes, Body, City & Places, Clothing, Colors, Common Verbs, Communication, Conjunctions, Connectors & Discourse, Conversational Fillers, Cooking, Culture & Customs, Daily Routine Verbs, Days & Months, Directions, Education, Emotions, Exclamations, Family, Farewells, Food & Drink, Greetings, Health & Medical, Household, Idioms & Expressions, Money & Shopping, Motion Verbs, Nature & Weather, Numbers, Particles, Personality, Politeness, Prepositions, Professions, Pronouns, Question Words, Religion, Sentence Patterns, Slang, Technology, Time, Transportation

Return ONLY: { "primary": ["Cat1", "Cat2", ...], "related": ["Cat3", ...] }
Pick 3-6 primary categories most relevant to the topic. Pick 1-3 related categories.` }]
      })
    });
```

## P6. Focused Study scenario phrases (system + user)
`js/focused-study.js:344-368` · max_tokens 2000

```js
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: `You are a Palestinian Arabic language expert. Generate practice phrases for real-life situations.
Use Palestinian Arabic dialect. Be natural and conversational.
Return ONLY a valid JSON array, no markdown, no explanation.`,
      messages: [{ role: 'user', content: `Generate ${phraseCount} useful Palestinian Arabic phrases for the situation: "${scenario.name}".

Use vocabulary from this dictionary pool where possible:
${vocabPool}
${reviewBlock}

Return ONLY a JSON array:
[
  {"ar": "Arabic text with harakat", "rom": "romanization", "en": "English translation", "context": "when/how to use this phrase"}
]

Rules:
- Use Palestinian Arabic dialect specifically
- Include common everyday phrases people actually say
- Mix simple and slightly complex phrases
- Each phrase should be practical and immediately usable
- Romanization should use: 2=hamza, 3=ain, 7=ha, 9=sad, kh=kha, gh=ghain
- Add harakat (tashkeel) to the Arabic text` }]
    })
```

## P7. AI tutor mastery extraction (system; user = transcript)
`js/ai-tutor.js:286-303` · max_tokens 1000

```js
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 1000,
          system: `Extract vocabulary and grammar demonstrated by the STUDENT in this conversation.
Return ONLY valid JSON, no markdown:
{
  "demonstrated": [
    { "arabic": "...", "english": "...", "correct": true }
  ]
}
Rules:
- Only include words/phrases the STUDENT used or attempted, not the tutor
- "correct" means the student used it correctly in context
- Maximum 30 items
- Include both single words and short phrases
- If the student made errors, include the correct form with "correct": false`,
          messages: [{ role: 'user', content: transcript }]
        })
```

## P8. AI tutor chat system prompt (user = latest message only)
`js/ai-tutor.js:385-420` · max_tokens 1000

```js
function buildDynamicSystemPrompt() {
  const profile = AppState.profile;
  const isAya = AppState.isAya;
  const learnedPhrases = getLearnedPhrases();
  const weakAreas = getWeakAreas();
  
  let prompt = `You are an expert Arabic language tutor specializing in Palestinian Arabic dialect.

**Student Profile:**
- Name: ${profile.name}
- Level: ${profile.speaker_type || 'beginner'}
- Learning Goals: ${profile.goals || 'conversational fluency'}
${isAya ? '- Special Context: Student is preparing to meet her partner\'s Palestinian family in June 2026' : ''}

**Learned Phrases (recent):**
${learnedPhrases.length > 0 ? learnedPhrases.slice(0, 30).map(p => `- ${p.ar} (${p.en})`).join('\n') : 'None yet'}

${weakAreas.length > 0 ? `**Weak Areas (needs practice):**
${weakAreas.slice(0, 10).map(p => `- ${p.ar} (${p.en})`).join('\n')}` : ''}

**Your Teaching Style:**
- Be encouraging and supportive
- Use simple, clear explanations
- Provide Palestinian Arabic examples
- Offer cultural context when relevant
- Use Arabic script when helpful (student sees romanization automatically if beginner)
- Keep responses concise and actionable
${isAya ? '- Focus on phrases useful for family interactions' : ''}

**Important:**
- When writing Arabic, use Arabic script
- Don't overwhelm with too much information at once
- Celebrate progress and correct gently
- Relate new concepts to what the student already knows`;

  return prompt;
```

## P9. Placement answer eval (DEAD: api.js never imported)
`js/api.js:34-40` · max_tokens 50

```js
export async function evaluatePlacement(question, userAnswer) {
  const prompt = `Is "${userAnswer}" a correct or close translation of the Arabic "${question.prompt || question.arabic}"? 
  The expected answer is "${question.answer || question.english}".
  Reply with just "correct" or "incorrect".`;
  const result = await callClaude('You are a concise Arabic language evaluator.', prompt, 50);
  return result.toLowerCase().includes('correct');
}
```

