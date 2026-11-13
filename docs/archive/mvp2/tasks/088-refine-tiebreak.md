# Task 088: refine epic 03, Tiebreak Configuration

**Status:** Done (2026-10-27)

## Goal

Turn the three spec stories of epic 03 into refined stories, with acceptance criteria, in `docs/user-stories/mvp2/03-tiebreak-configuration.md`. Find the gaps in the spec and get an answer for each. The build tasks (Task 84) start from these stories.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/03-tiebreak-configuration.md` has stories US-03.1 to US-03.3, one for each spec story, in the README template.
- [x] A new story gets the next free ID, only when a gap needs one.
- [x] Each story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] The stories use the settled decisions: the AET and penalty models with their test bands (Task 80), the neutral venue and the 50/50 coin toss (Task 74), and the fixture ids (Task 77).
- [x] The stories follow the MVP2 handoff where it shows the screen, unless the user overrides it.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees each story, and its status becomes Agreed.

## Notes

- **2026-10-27:** Spec stories of epic 03 (`docs/scorinator-mvp2.md` §2): a "Plays AET?" toggle for each phase, a tiebreak method for each phase (Penalties, or Replay → Coin Toss), and weighted penalties with a 50/50 coin toss. Spec rules: §1 Tiebreak Resolution, with its four-row table. A replay is one match: if it is drawn, the coin toss decides. Settled inputs: AET = 1/3 of full-match expected goals with the same elasticity, kick-by-kick penalties with w = 0.10, home boost in a second-leg AET only (Task 80). Single-match ties, their AET, and replays are neutral (Task 74). A replay has its own fixture id, `.replay` (Task 77).
- **2026-10-27:** The handoff (`Footballer - League Setup Wizard`, phase step) shows "Plays AET" (a toggle) and "Tiebreak method" (Penalties or Replay → Coin toss) on a Bracket phase only. The defaults are AET on and Penalties. The Review step shows "AET on · Penalties". League Detail - Mixed shows "· Pens 5-4" after the aggregate, and an asterisk on a leg score that includes AET.
- **2026-10-27:** Two defaults that Task 80 left for this task: an `Rng` 50/50 picks the team that kicks first, and kicking first gives no edge.
- **2026-10-27:** The user agreed the criteria. Gap answers: (1) the replay plays AET when the phase has AET on, then the coin toss. (2) Away goals apply once, after 180 minutes, never after AET. (3) One "Scorinate" click plays the match and the whole tiebreak the phase needs.
- **2026-10-27:** More gap answers: (4) the tie card follows the handoff (asterisk for AET, "· Pens 5-4"), plus a "Replay" score and a "· Coin toss" tag. No kick-by-kick display. (5) The user confirmed the Task 80 penalty defaults: an `Rng` 50/50 picks the first kicker, with no edge.
- **2026-10-27:** Claude wrote US-03.1 to US-03.3, with the status Refined. US-03.2 row 3 adds the replay AET, which needs a spec edit with the user's OK. The "no away goals after AET" rule also needs a spec line.
- **2026-10-27:** The user agreed all three stories and the three Claude choices. Status: Agreed. With the user's OK, Claude edited `docs/scorinator-mvp2.md` §1 Tiebreak Resolution: table row 3, plus two bullets for the replay AET and for away goals after AET.

## Report

- **What was built:** `docs/user-stories/mvp2/03-tiebreak-configuration.md`, with three Agreed stories, US-03.1 to US-03.3, one for each spec story.
- **Test approach:** none, no code changed. US-03.2 turns the four sequences into test cases. US-03.1 and US-03.3 carry the Task 80 statistical bands.
- **Decisions made:** the gap answers in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Spec edit:** `docs/scorinator-mvp2.md` §1 Tiebreak Resolution, table row 3 and two bullets, with the user's OK.
- **Effect on other tasks:**
  - **Task 89 (Bracket Phase):** the tie card shows the asterisk, "· Pens 5-4", the "Replay" score, and the "· Coin toss" tag. One "Scorinate" click decides a tie. The away-goals rule applies after 180 minutes only.
  - **Engine:** `engine/tiebreak` holds the shootout, the coin toss, and the sequence of US-03.2. AET needs a `scorinateMatch` variant with a time share and a given elasticity (Task 80).
- **What is left, what is next:** nothing. The user accepted the task on 2026-10-27.
