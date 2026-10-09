# Consensus run results (raw, unscored)

Eight blind runs of the package, 1,349 entries each, raw model output, never hand-edited. Received chat 34.

| folder | run by | model as named by the runner | validator |
|---|---|---|---|
| `omar/gemini-3.8-flash` | Omar | Gemini 3.8 Flash | OK |
| `omar/gpt-5.6-sol` | Omar | GPT 5.6 Sol | OK |
| `omar/gpt-5.6-terra` | Omar | GPT 5.6 Terra | OK |
| `omar/opus-4.8` | Omar | Claude Opus 4.8 | OK |
| `omar/opus-5` | Omar | Claude Opus 5 | OK |
| `omar/opus-5.5` | Omar | Claude Opus 5.5 | OK |
| `marwan/gpt-6.1-sol` | Marwan's agent | `gpt-6.1-sol[1m]` | OK |
| `marwan/sonnet-5.5` | Marwan's agent | `claude-sonnet-5-5[1m]` | 1 problem: id 385 `آخ`, a validator false positive (madda carries the vowel) |

**Prompt version.** Marwan's run used the package's first version (system prompt sha256 `f9b6d3e7…`, commit `f27ce8e`): urban Ramallah speech only, other Palestinian variants out. The repo's `package/` is the later version (Ramallah as priority, other Palestinian forms accepted). Marwan states Omar ran the same copy he did; Omar's notes are not in hand, so that is unverified.

**Omar's run notes** (settings, dates, re-runs, web search off) were not supplied. `omar/own-comparison/` is Omar's own model-vs-model majority vote. It does not compare against our values and is not the scoring in `src/scoring.md`; reference only.

**Marwan's run** notes, manifest and runner are in `marwan/`. Raw CLI event logs (16 MB) were left out.

The run was independent: no run saw another's answers, and runs saw only the package folder, never `answer-key.json` (Marwan, chat 34).
