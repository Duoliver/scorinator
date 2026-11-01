# Task 177: Phases step counts, best M suggestion, and warnings

**Status:** Not started

## Goal

Show the user what the phase chain gives before "Create league" (US-01.4, US-01.5, US-01.6, US-01.2 note): the qualifier count of each phase, the best M suggestion for a bracket, the fit warnings with their texts, and the reason on a disabled "Create league". Split from Task 129 (choice 1).

## Acceptance criteria

To agree with the user when the task starts. Draft scope from the Task 129 split:

- [ ] The qualifier count line of each phase, for example "4 groups × top 2 = 8 teams go to phase 2", once the team count is known.
- [ ] The best M suggestion when the next phase is a bracket, with one click to apply it (`suggestBestM`).
- [ ] A text for each `checkPhaseChain` and `checkPhaseFit` problem code, on the Phases step and the Review step. The texts update when the team list or a phase changes.
- [ ] "Create league" is disabled for a fit problem, with the reason (US-08.8).
- [ ] The "groups last" warning of US-01.5, on the Phases and Review steps.
- [ ] The home-advantage note of US-01.2 on the Phases step.

## Notes

- **2026-11-01:** Task created by the user's agreement to Task 129 choice 1.

## Report

Write this before the task goes to Review.
