# Consensus scoring

Scored runs: opus-5.5, gpt-6.1-sol, gemini-3.8-flash. Evidence only: opus-5, opus-4.8, sonnet-5.5, gpt-5.6-sol, gpt-5.6-terra. Romanization matched by sound (src/scoring.md, chat 34 second section).

## Controls (60 trusted words)

Outcomes: {'A': 40, 'E': 7, 'D2': 4, 'A2': 3, 'D': 3, 'B': 2, 'C': 1}. **Raised (A, A2, B): 75.0%** (gate 70%). Three runs unanimous on 47; of those, 97.9% match ours (automatic adoption needs 95%).

Controls the three runs unanimously disagree with (each needs a look):

- 251 وْإِنْتَ مِن أَهْلُو "and you too (good night reply, to m.)": ours `w inte min ahlu` وْإِنْتَ مِن أَهْلُو, runs `w-inta min ahlu` وْإِنْتَ مِنْ أَهْلُو

## Queue (1289 words)

Outcomes: {'A': 454, 'E': 436, 'D': 174, 'C': 115, 'A2': 49, 'D2': 42, 'B': 19}.

- Raised to 3: 522 (A and B: all three agree with ours; A2: GPT and Gemini both match ours exactly)
- Alternatives adopted automatically: 115
- Review, 659 rows in `review.xlsx`, trusted controls included: Arabic 544, English meaning 69, not taught by rule 46 (2-3 models say not Palestinian)

### Why words are not raised

- Romanization: fewer than 2 of 3 match by sound: 402; 2 match, third differs beyond ee/ii-oo/uu: 214
- Vowelled letters not matched by all 3: 337
- Any flag (meaning, dialect, alternative): 216
- Romanization 3/3 and letters 3/3 but blocked by a flag, low confidence or `unsure`: 75
