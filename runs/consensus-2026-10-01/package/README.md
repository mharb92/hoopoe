# Hoopoe dictionary check: three-model run

Hoopoe is a Palestinian Arabic learning app. Its dictionary has **1,349 words to check** (1,289 uncertain words plus 60 trusted ones mixed in as a control). The same prompt is run on **Claude, Gemini and ChatGPT separately**. Each model writes its own romanization, vowelled Arabic, meaning check and dialect verdict for every word, with its reasoning. The three sets of answers are then compared to decide which words can be trusted and which need a human. `scoring.md` explains how.

## What's in this folder
| File | What it is |
|---|---|
| `system-prompt.txt` | The instructions every model gets, unchanged, on every request |
| `user-message-template.txt` | The message for one batch: replace `{{N}}` and `{{BATCH_JSON}}` |
| `prompt.md` | Both of the above in one readable file |
| `batches/batch-001.json` … `batch-054.json` | The words, 25 per batch (the last one has 24) |
| `input.csv` | The same 1,349 words in one sheet, if your tool works on a whole CSV |
| `check_output.py` | Checks one model's results before you send them (Python 3, nothing to install) |
| `romanization-rules.md` | The full romanization scheme (the prompt already contains the parts the models need) |
| `dialect-rules.md` | The dialect rules (also already in the prompt) |
| `examples.csv` | The worked examples from the prompt, in a sheet |
| `scoring.md` | How the answers will be scored afterwards. The models never see it |

## Steps
1. **Set up each model.** Use the strongest version available to you. Turn web search and tools off, so each model answers from its own knowledge. Thinking or reasoning modes are fine. If temperature is adjustable, set it to 0 or the lowest value.
2. **Run every batch on every model.** Start a fresh conversation or request for each batch, with `system-prompt.txt` as the system prompt and the user message built from one batch file. Save each reply as-is, for example `results-claude/batch-001.json`. Do 3 × 54 = 162 requests in total.
3. **Keep the models independent.** Never show one model another's answers. Don't use a debate, voting or "consensus" feature, and don't edit answers by hand. If a reply is broken, re-run that batch unchanged.
4. **Check each model's results:** `python3 check_output.py results-claude/`. It lists every problem (a missing word, characters outside the romanization scheme, Hebrew letters in the Arabic, and so on) and ends with `OK` or `FAILED`. Re-run the batches it names until it says `OK`. The models have drifted into Hebrew letters before, so this check matters.
5. **Send back:**
    - the three results folders (or three CSVs), zipped;
    - `run-notes.txt`: for each model, its exact name and version, the date, the settings used, which batches were re-run, and anything odd.

**If your tool fills a whole CSV instead:** give it `input.csv` and have it add these columns, one output file per model (`results-claude.csv`, `results-gemini.csv`, `results-gpt.csv`): `romanization`, `vowelled_arabic`, `pronunciation_confidence`, `meaning_ok`, `meaning_fix`, `dialect`, `palestinian_alternative`, `reasoning`. Still send it at most 25 words per request: quality drops on long requests. Check each file the same way: `python3 check_output.py results-claude.csv`.

## After you send it back
The three result sets are merged into one sheet, with each model's answers in its own columns, and compared with our current values using the rules in `scoring.md`. The output is the list of words raised to high confidence, plus a short spreadsheet of the words that need a person to decide.
