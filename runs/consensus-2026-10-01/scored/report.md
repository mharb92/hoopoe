# Consensus scoring

Scored runs: opus-5.5, gpt-6.1-sol, gemini-3.8-flash. Evidence only: opus-5, opus-4.8, sonnet-5.5, gpt-5.6-sol, gpt-5.6-terra.

## Controls (60 trusted words)

Outcomes: {'A': 35, 'B': 2, 'C': 0, 'D': 7, 'E': 16}. **A or B: 61.7%** (gate 70%). Three runs unanimous on 41; of those, 100.0% match ours (automatic adoption needs 95%).

**Gate failed: 61.7% of controls reach A or B, under 70%.** 
### Why words miss A or B

- Romanization: fewer than 2 of 3 exact: 7; 2 exact, third differs beyond ee/ii-oo/uu: 9
- Vowelled letters not matched by all 3: 3
- Any flag (meaning, dialect, alternative): 7
- Romanization 3/3 and letters 3/3 but blocked by a flag, low confidence or `unsure`: 6

Decision (chat 34, src/scoring.md): the strict rule is kept and the queue is scored unchanged.

## Queue (1289 words)

Outcomes: {'A': 370, 'B': 19, 'C': 109, 'D': 216, 'E': 575}.

- Raised to 3: 389
- Alternatives adopted automatically: 109
- To a person: 798 (`review.csv`), of which levels 1-2: 278; marked possible regional form: 17; trusted controls flagged: 7

### Why words miss A or B

- Romanization: fewer than 2 of 3 exact: 541; 2 exact, third differs beyond ee/ii-oo/uu: 250
- Vowelled letters not matched by all 3: 360
- Any flag (meaning, dialect, alternative): 216
- Romanization 3/3 and letters 3/3 but blocked by a flag, low confidence or `unsure`: 64
