# Task 179: Review step: a blank name turns "Create league" off, with the reason

**Status:** Done

## Goal

Show why "Create league" does nothing for a league with no valid name. Today the step tabs reach the Review step past the Details "Next", and a click on "Create league" writes "Enter a league name with at least one letter or number." in the status line at the page bottom. The user did not see it (Task 130 review).

## Acceptance criteria

Proposed on 2026-11-01. Agreed with the user on 2026-11-11.

- [x] On the Review step, a name with no letter or digit turns "Create league" off.
- [x] The name text shows above the button, as the other reasons do: "Enter a league name with at least one letter or number."
- [x] The MVP1 rule changes: the Review step test "does not disable Create league for a blank name" changes with it.
- [x] A name problem comes before the other reasons (team list, bracket, phase problems).
- [x] The user checks the Review step in the real app.

## Notes

- **2026-11-01:** Task created by User. "On the board." The cause came out of the Task 130 review: the user tried to create an unnamed league. About 30 minutes.
- **2026-11-11:** The user agreed choices 1 to 4. (1) A bad name turns "Create league" off, with the reason above it. (2) The name reason comes first. (3) `handleCreate` drops its name check and the status line message. (4) The Review step test "does not disable Create league for a blank name" goes, and the two screen tests check the off button and the reason.

## Report

- **What was built:** `useLeagueSetup` puts `leagueNameProblem` first in `createProblem`, so the Review step turns "Create league" off and shows the reason above it. `handleCreate` no longer checks the name or writes the status line.
- **Test approach:** 2 screen tests changed and 1 new, written first and seen to fail: a symbols-only name through the Details step, a blank name through the Review tab, and the name reason before the team list reason. 1 Review step test removed. Full suite: 2059 tests pass. Lint, format check, and type check pass.
- **Decisions made:** choices 1 to 4, agreed by the user.
- **What is left, what is next:** the user checks the Review step in the real app. Next is Task 180.
