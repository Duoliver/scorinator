# Task 089: refine epic 04, Bracket Phase

**Status:** Done (2026-10-28)

## Goal

Turn the eleven spec stories of epic 04 into refined stories, with acceptance criteria, in `docs/user-stories/mvp2/04-bracket-phase.md`. Find the gaps in the spec and get an answer for each. The build tasks (Task 84) start from these stories.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/04-bracket-phase.md` has stories US-04.1 to US-04.11, one for each spec story, in the README template.
- [x] A new story gets the next free ID, only when a gap needs one. Candidates: the third-place toggle (Task 77), the single-match final toggle (Task 79), and the round names (Task 76).
- [x] Each story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] The stories use the settled decisions: the fixture ids (Task 77), the seeding and the fixed lots (Task 78), the second-leg host and the single-match final (Task 79), the neutral venue (Task 74), and the epic 03 tiebreak stories (Task 88).
- [x] The stories follow the MVP2 handoff where it shows the screen, unless the user overrides it.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees each story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Spec stories of epic 04 (`docs/scorinator-mvp2.md` §2): tie format, auto-seed, away-goals toggle, aggregate and tiebreak order, Scorinate one tie or the bracket, the re-scorinate warning, cleared ties with "TBD", the tie card footer, the power-of-2 warning, byes with a manual reassign, and the bye UI. Spec rules: §1 Bracket Specifics, Bracket Sizing & Byes, Bracket Scorination Workflow.
- **2026-10-28:** Settled inputs. Fixture ids `p3.r2.t1`, `.leg1`, `.leg2`, `.replay`, `p3.r3.final`, `p3.r3.third`, and the third-place toggle, off by default (Task 77). Seeds by place, then points, goal difference, goals for, then fixed lots (Task 78). The higher seed hosts the second leg, and a tie winner keeps its seed. A single-match final toggle for a two-legged phase (Task 79). Single-match ties and replays at a neutral venue (Task 74). One "Scorinate" click plays the whole tiebreak. The tie card marks AET with an asterisk and shows "· Pens 5-4", "Replay", and "· Coin toss" (Task 88). The progress badge shows the round name (US-01.2, Task 76).
- **2026-10-28:** Proposals left open by earlier tasks, for the user to confirm here: a single-match tie has one match, `.leg1` (Task 77). The single-match final toggle is off by default (Task 79).
- **2026-10-28:** The handoff (`League Setup Wizard`, phase step) shows "Tie format" (Single match or Two-legged) and an "Away goals rule" toggle on a Bracket phase. The toggle shows for Two-legged only. A new phase defaults to Single match, away goals off. `League Detail - Mixed` shows a "Seed List" sub-tab beside "Bracket". The seed list tags each qualifier by group place (A1, B1, ...). Byes: "Top seeds get a bye by default. Star any seed to grant it a bye instead — first-round only." and "x / y byes assigned". With no byes: "8 qualifiers fill the bracket exactly — no byes needed." The bracket header: "Seeded by Group Stage final standing · All ties two-legged (aggregate, home & away), away goals off · AET → Penalties · * leg score includes AET". The rounds are "Quarterfinals", "Semifinals", "Final", and "Third-place playoff". A bye tie shows "BYE — advances automatically". The confirm modal: "Clear later rounds?", "This will clear results for later rounds. Continue?", "Cancel", "Clear & scorinate".
- **2026-10-28:** Differences between the handoff and the spec or decisions, found in Task 83 and in this task:
  - The handoff seeds group winners in group order (A1, B1, C1, D1). Task 78 seeds them by stats.
  - The handoff pairs the first round A1 v D2, C1 v B2, B1 v C2, D1 v A2. The spec says simple seed order.
  - The handoff always shows the third-place playoff. Task 77 makes it a toggle.
  - The handoff "Scorinate bracket" plays every tie again, with the confirm when any result exists. MVP1 "Scorinate matchday" plays only the matches with no result.
  - The handoff clears every tie of the later rounds on a re-scorinate. The spec clears only the ties that depend on the re-scorinated tie.
  - The handoff allows a bye change after results, with the confirm. The spec does not say when a bye change is allowed.
- **2026-10-28:** Gaps found. Each needs a user answer.
  1. How a bracket seeds its teams when it is the first phase, for example a pure cup. The spec seeds from the previous phase only.
  2. Where each tie sits in the tree, so who meets whom in later rounds. "Simple seed order" says 1 v 8, 2 v 7, and so on, but not which ties meet next.
  3. What "Scorinate bracket" plays: the current round, every tie to the final, or every tie again.
  4. Until when the user can change the byes.
  5. Which ties a re-scorinate clears: the dependent ties only, or every tie of the later rounds.
  6. The round names, and how many teams make a "Round of N".
  7. How the screen shows the bracket winner when the final ends.
  8. Smaller defaults: tie format, the away-goals default, the confirm text, the Seed List sub-tab, and the power-of-2 warning text.
- **2026-10-28:** The user agreed the criteria. Gap answers: (1) a first-phase bracket seeds by a random draw with an injected `Rng`, stored, at league start. (2) The tree uses the standard bracket placement: seeds 1 and 2 meet only in the final. This needs a spec edit. (3) "Scorinate bracket" plays only the playable ties with no result, like "Scorinate matchday". Its spec confirm line goes, with a spec edit. (4) The user can change the byes at any time. After the first result, the confirm modal shows, and a confirm clears every bracket result. (5) A re-scorinate clears the dependent ties only, as the spec says. (6) Round names with a hyphen: "Quarter-finals", "Semi-finals". (7) A "Winner: <team>" line on the Bracket tab.
- **2026-10-28:** Claude wrote US-04.1 to US-04.14, with the status Refined. US-04.12 (third place), US-04.13 (single-match final), and US-04.14 (round names and the winner) are new stories. Gap 8 defaults, as Claude choices for the user to confirm: Single match by default, away goals off and shown for Two-legged only, the Seed List sub-tab with place tags, the warning text, the "· Away goals" tag, the bold winner row, the bye slot rule after a star change, "Clear & change byes", and the block when byes are missing.

- **2026-10-28:** The user agreed all 14 stories, the Claude choices, and the four spec edits. Status: Agreed. With the user's OK, Claude edited `docs/scorinator-mvp2.md` §1: the first-phase random draw (Bracket Specifics), the standard bracket placement and the bye change (Bracket Sizing & Byes), and "Scorinate bracket" with its confirm line removed (Bracket Scorination Workflow).

## Report

- **What was built:** `docs/user-stories/mvp2/04-bracket-phase.md`, with 14 Agreed stories. US-04.1 to US-04.11 come from the spec stories. US-04.12 (third place), US-04.13 (single-match final), and US-04.14 (round names and the winner) are new.
- **Test approach:** none, no code changed. The stories name the engine tests: the placement table for 2 to 32 slots (US-04.2), each resolve path (US-04.4), the clear cases (US-04.7), and the round names for 2 to 64 slots (US-04.14).
- **Decisions made:** the gap answers and the confirmed Claude choices in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edits:** `docs/scorinator-mvp2.md` §1, four edits, with the user's OK. Each one is marked with its date and Task 89.
- **Effect on other tasks:**
  - **Task 92 (Phase Transition):** the Seed List (US-04.2) already shows the seed and the place tag of each qualifier. Epic 07 can link to it for "see which teams qualified, and by what seed". The open question on a re-scorinate of an earlier phase stays with Task 92.
  - **Task 93 (Team Selection):** the power-of-2 warning shows in the Teams step for a one-bracket league (US-04.9).
  - **Engine:** a new `engine/bracket` module: seeds, the standard placement, byes, tie resolve, the clear of dependent ties, and the round names. All pure, with an injected `Rng` for the first-phase draw.
  - **Design system:** the tree needs a tie card and a star toggle. Check the primitives before the build task.
- **What is left, what is next:** nothing for this task. Next is Task 90, Region Adjacency.
