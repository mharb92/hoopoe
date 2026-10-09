# Consensus scoring

Scored runs: opus-5.5, gpt-6.1-sol, gemini-3.8-flash. Evidence only: opus-5, opus-4.8, sonnet-5.5, gpt-5.6-sol, gpt-5.6-terra.

## Controls (60 trusted words)

Outcomes: {'A': 35, 'B': 2, 'C': 0, 'D': 7, 'E': 16}. **A or B: 61.7%** (gate 70%). Three runs unanimous on 41; of those, 100.0% match ours (automatic adoption needs 95%).

**Gate failed: 61.7% of controls reach A or B, under 70%. The queue is not scored until the thresholds are revisited (src/scoring.md).**

### Why words miss A or B

- Romanization: fewer than 2 of 3 exact: 7; 2 exact, third differs beyond ee/ii-oo/uu: 9
- Vowelled letters not matched by all 3: 3
- Any flag (meaning, dialect, alternative): 7
- Romanization 3/3 and letters 3/3 but blocked by a flag, low confidence or `unsure`: 6
