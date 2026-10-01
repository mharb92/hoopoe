# How confidence is scored

Every dictionary word has a **confidence score from 1 to 3**. It measures whether the word's data is accurate (the Arabic, how it is said, and what it means), not how hard the word is. **Only words at 3 are taught.**

## The rule today
| Score | When |
|---|---|
| 3 | The romanization and the vowelled Arabic were both judged with high confidence, nothing flagged the word for a native speaker, and no uncertain fix to its meaning or its Arabic is pending |
| 2 | Either was judged with medium confidence, **or** the word was flagged "needs a native speaker", **or** an uncertain fix to its meaning or its Arabic is pending |
| 1 | Either was judged with low confidence, or the vowelled Arabic contains non-Arabic letters |

Today 1,950 words score 3. The 1,291 below 3 are the review queue. This run covers 1,289 of them, because two known errors (rows 2127 and 2175) are fixed separately.

## What this run is for
To raise queue words to 3 where three independent models agree with what we have, and to send the rest to a human with the evidence laid out.

- The models see only the Arabic **without vowel marks**, the English meaning and the part of speech. They never see our romanization or our vowelled Arabic. Agreement only counts as evidence if it is independent.
- **60 words we already trust are mixed in, unlabelled, as a control group.** They measure how often three blind models reproduce a value we know is right.
- Each model answers on its own. No model sees another's answers.

## How the answers will be compared
These rules are fixed before any results arrive. A change after results arrive must be written down with its reason.

**Matching**
- Romanization: exact string match. Capitals count, since they mark emphatic letters. A difference only in long-vowel quality (`ee`/`ii`, `oo`/`uu`) is counted separately, because the source data is known to be weakest there.
- Vowelled Arabic: matched on its letters and shadda, after removing sukun, tatweel and punctuation and treating the two ways of writing a long vowel as equal (ـَيْ and ـِي for `ee`, ـَوْ and ـُو for `oo`). A respelling counts as a difference (for example ثالث against تالت). Short-vowel marks are compared too and every difference is reported, but one does not block a raise when the romanizations match: the romanization is the record of how the word is said. A test run showed why: عَلَيْكُم and عَلِيكُم are both `3aleekum`.

**Outcomes for each queue word**
| Outcome | Condition | Result |
|---|---|---|
| A. Confirmed | All three models match our romanization and our vowelled Arabic (as defined above). All three say the meaning is right, and all call it Palestinian or pan-Levantine (or MSA, for a row whose English already labels it MSA or formal). None offers a Palestinian alternative, and none rates itself low | **Raised to 3** |
| B. Majority | Two models match ours exactly, the third differs only in long-vowel quality, and every meaning and dialect condition of A holds | **Raised to 3** |
| C. Unanimous alternative | All three agree with each other but not with us | A correction candidate. Adopted automatically only if the controls show blind unanimous answers matching our trusted values at least 95% of the time; otherwise it goes to a human |
| D. Meaning or dialect flag | Any model says the meaning is wrong or partly wrong, calls the word Lebanese/Syrian or MSA (outside rows already labelled MSA), or offers a Palestinian alternative | Goes to a human, with the models' fixes shown |
| E. Everything else | Split answers, or any model rating itself low | Stays at 2 and goes to a human |

**Controls.** For the 60 trusted words, the report shows how many land in A, B or C. Every control the models unanimously disagree with is looked at individually: either our trusted value is wrong, or the models share a mistake. If fewer than 70% of controls reach A or B, exact matching is too strict for blind answers. The thresholds are then revisited before the queue is scored, and the change is recorded.

## Human review
The words that need a person go into a spreadsheet with a notes column, never the database. Each row shows the Arabic, our values and the three models' values with their reasoning side by side, ordered with the commonest words (levels 1-2) first and the most-disputed first within a level. The reviewer marks the right option or writes the correct one in the notes.
