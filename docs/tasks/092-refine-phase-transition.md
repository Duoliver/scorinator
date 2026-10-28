# Task 092: refine epic 07, Phase Transition

**Status:** Done (2026-10-28)

## Goal

Turn the two spec stories of epic 07 into refined stories, with acceptance criteria, in `docs/user-stories/mvp2/07-phase-transition.md`. Find the gaps in the spec and get an answer for each. Settle the open question from Task 78: a re-scorinate in an earlier phase after the next phase starts. The build tasks (Task 84) start from these stories.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/07-phase-transition.md` has US-07.1 and US-07.2, one for each spec story, in the README template.
- [x] A new story gets the next free ID, only when a gap needs one.
- [x] Each story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] The Task 78 open question has a user answer, and leaves the `PROGRESS.md` Open questions list.
- [x] The stories use the settled decisions: the qualification order (Task 78), the progress text (Task 76, US-01.2), the advancement (US-01.4, US-01.6), the later-phase group draw (US-02.1), and the bracket seeds (US-04.2).
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees each story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Spec stories of epic 07 (`docs/scorinator-mvp2.md` §2): the standings reset to zero when a new phase begins, and the user sees which teams qualified into the next phase, and with which seed. Spec rule (§1 Phase Chaining): points and stats reset between phases, and each phase is scored on its own.
- **2026-10-28:** Settled inputs. Qualifiers and seeds follow Task 78: by place, then points, goal difference, goals for, then fixed lots. The best M of place N + 1 come after all teams of place N (US-01.6, US-04.2). A later Groups phase draws its groups when it starts, with Shuffle and moves until its first result (US-02.1, US-02.5). A Bracket phase shows a Seed List (US-04.2). The progress badge shows "MD 7/16", a round name, or "Complete" (US-01.2). A fit problem blocks the league Start (US-01.4), so a later phase always has a valid team count.
- **2026-10-28:** Facts from the code and the review. `calculateStandings` is stateless and recomputes from a roster and a result set (impact review §2.5). So a reset needs no stored zeros: each phase computes its table from its own results.
- **2026-10-28:** Gaps found. Each needs a user answer.
  1. How the next phase starts: at once when the last result of a phase comes in, or with a user click.
  2. The Task 78 open question: can the user re-scorinate a match of a finished phase after the next phase starts?
  3. Where the user sees the qualifiers and their seeds, for each format of the next phase.
- **2026-10-28:** The user agreed the criteria. Gap answers: (1) a user click starts the next phase. (2) A phase locks when the next phase starts. "Allow, with a clear of later phases" is parked in `scorinator-future-features.md` §9. (3) Highlight only. The "Qualifiers" list is parked in §10.
- **2026-10-28:** Claude wrote US-07.1 to US-07.3, with the status Refined. US-07.3 (start the next phase) is new, from gaps 1 and 2. It needs a spec line in §1 Phase Chaining, with the user's OK.

- **2026-10-28:** The user agreed US-07.1 to US-07.3, the six Claude choices, and the spec line. Status: Agreed. Claude added the line to `docs/scorinator-mvp2.md` §1 Phase Chaining, and removed the Task 78 open question from `PROGRESS.md`.

## Report

- **What was built:** `docs/user-stories/mvp2/07-phase-transition.md`, with three Agreed stories. US-07.1 and US-07.2 come from the spec. US-07.3 (start the next phase) is new.
- **Test approach:** none, no code changed. The stories name the tests: the reset to 0 in phase 2 (US-07.1), and the next phase build for each format (US-07.3).
- **Decisions made:** the gap answers and the confirmed Claude choices in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Open question settled:** the Task 78 question on a re-scorinate after the next phase starts. Answer: the earlier phase locks. "Allow, with a clear" is parked.
- **Spec edit:** one line in `docs/scorinator-mvp2.md` §1 Phase Chaining, with the user's OK.
- **Parked:** `docs/scorinator-future-features.md` §9 (re-scorinate a locked phase) and §10 (a Qualifiers list for a round-robin or Groups phase).
- **Effect on other tasks:**
  - **Task 89 (Bracket):** US-04.6 keeps its out-of-scope line. The answer now is the lock of US-07.3.
  - **Task 87 (Groups):** the advancement line of US-02.4 also shows under a round-robin table (US-07.2).
  - **Data model:** each phase stores if it started, and its draw and fixtures. A build task designs the shape.
- **What is left, what is next:** nothing. Next is Task 93, Team Selection in League Setup.
