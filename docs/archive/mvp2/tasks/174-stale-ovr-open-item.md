# Task 174: the stale OVR weighting item in `CLAUDE.md`

**Status:** Done

## Goal

`CLAUDE.md` still lists "OVR-difference vs. absolute-OVR weighting" as an open item. The user settled the weight in MVP1 Task 5 (2026-09-07). A session that reads the list can stop and ask about a settled decision. Make the list show the true state.

## Acceptance criteria

Proposed on 2026-11-01. The user asked for the task at the end of the 2026-11-01 session, with these criteria.

- [x] The `CLAUDE.md` open items list no longer shows the weight as open.
- [x] The text names MVP1 Task 5 as the place of the decision.
- [x] A change to the weight still needs a proposal and a user decision. `scorinator-future-features.md` §"Constraints" says this, and the text keeps that rule true.
- [x] `docs/scorinator-future-features.md` no longer calls the weight "a `CLAUDE.md` open item".
- [x] `docs/tdd.md` keeps the weight as an example, with "settled in MVP1 Task 5" added.
- [x] No code changes.

## Notes

- **2026-11-01:** Task created by the user. Three files name the item: `CLAUDE.md` line 90, `docs/tdd.md` line 16, and `docs/scorinator-future-features.md` line 42. The MVP1 decision is in `docs/archive/mvp1/PROGRESS.md` (Task 5) and `docs/archive/mvp1/progress-reports/005-scorination.md`.
- **2026-11-01:** The user asked for the task at the end of the session. Built with the proposed criteria.
- **2026-11-01:** The user agreed that the task is Done.

## Report

- **What was built:** three doc edits, no code.
  - `CLAUDE.md`: the weight is out of the open items list. A "Settled, not open" line under the list names MVP1 Task 5 and keeps the rule that a change needs a proposal and a user decision.
  - `docs/scorinator-future-features.md`: the constraint says the weight was settled in MVP1 Task 5, and a change needs a decision first.
  - `docs/tdd.md`: the example adds "settled in MVP1 Task 5".
- **Test approach:** none, no code changed. `grep` finds no other text that calls the weight open.
- **Decisions made:** none new. MVP1 Task 5 holds the decision.
- **What is left, what is next:** nothing.
