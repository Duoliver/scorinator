# Task 086: refine epic 01, League Format Configuration

**Status:** Done (2026-10-27)

## Goal

Turn the five spec stories of epic 01 into refined stories, with acceptance criteria, in `docs/user-stories/mvp2/01-league-format.md`. Find the gaps in the spec and get an answer for each. The build tasks (Task 84) start from these stories.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/01-league-format.md` has stories US-01.1 to US-01.5, one for each spec story, in the README template.
- [x] A new story gets the next free ID, only when a gap needs one.
- [x] Each story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] The stories use the settled decisions: fixture ids (Task 77), qualification (Task 78), and the card format text (Task 76).
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees each story, and its status becomes Agreed.

## Notes

- **2026-10-27:** Spec stories of epic 01 (`docs/scorinator-mvp2.md` §2): several phases in one league, a format for each phase, Bracket only as the last phase, advancement requisites for each phase, and a non-blocking warning when Groups is the last phase. Spec rules: §1 League Formats, Phase Chaining. Related epics: 02 Groups (group count and assignment), 03 Tiebreak (AET and tiebreak flags), 04 Bracket (tie settings, byes, the power-of-2 warning), 07 Phase Transition (reset and qualifier view). Today the wizard has three steps: Details, Teams, and Review (`src/features/leagues/LeagueSetupScreen/steps/`).
- **2026-10-27:** The user agreed the criteria. Gap answers: (1) wizard order Details → Phases → Teams → Review. (2) One points system for the league, as in MVP1. (3) Advancement from groups allows top N of each group plus the best M of the next place, for example the 4 best third-placed teams. This uses the Task 78 cross-group order.
- **2026-10-27:** More gap answers: (4) no cap on the phase count, from 1 up. (5) No custom phase names: the format label names a phase. Custom names are parked in `scorinator-future-features.md` §7. (6) The phase step allows add, remove, change format, and move up or down. (7) An advancement count that does not fit shows a warning in setup and blocks Start.
- **2026-10-27:** Claude wrote US-01.1 to US-01.5 from the spec, and US-01.6 for the best M of the next place (gap 3). All six have the status Refined. US-01.6 needs a spec line, with the user's OK.
- **2026-10-27:** The user agreed all six stories, with the five choices Claude made (labels, fit rules, import check, warning text, home-advantage note). Status: Agreed. The user approved a spec line for US-01.6, and asked how the value M is picked.
- **2026-10-27:** The user chose "typed, with a suggestion" for M: the user types M, and when the next phase is a Bracket, the phase step suggests the smallest M that gives a power of 2. US-01.6 has two new criteria for it. Claude added the US-01.6 line to `docs/scorinator-mvp2.md` §1 Phase Chaining, with the user's OK.
- **2026-10-27 (after Done):** The user asked to review the Task 86 stories again after the MVP2 design files arrive (Task 83). The stories stay Agreed until then.
- **2026-10-27 (after Done):** Task 83 reviewed the stories against the MVP2 handoff. US-01.2 changed: full labels in setup, fixed short names on the card and in League Detail, and the handoff progress badge. The other stories did not change. All six stay Agreed.

## Report

- **What was built:** `docs/user-stories/mvp2/01-league-format.md`, with six Agreed stories. US-01.1 to US-01.5 come from the spec. US-01.6 (best M of the next place) is new, from gap 3.
- **Test approach:** none, no code changed. Each criterion is a check that a build task can test.
- **Decisions made:** the seven gap answers and the M rule, in the Notes above and in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Spec edit:** one line in `docs/scorinator-mvp2.md` §1 Phase Chaining, for US-01.6, with the user's OK.
- **Effect on other tasks:**
  - **Task 87 (Groups):** the group sizes decide when "top N" fits (US-01.4). The group count and the minimum group size are for Task 87.
  - **Task 89 (Bracket Phase):** the power-of-2 warning and the M suggestion (US-01.6) work together. The bracket label follows the tie setting.
  - **Task 92 (Phase Transition):** the progress text and the seeding of the best M in the next phase.
  - **Task 93 (Team Selection):** the Teams step now comes after the Phases step. The Start action shows the reason when a count does not fit.
- **What is left, what is next:** nothing. The user accepted the task on 2026-10-27.
