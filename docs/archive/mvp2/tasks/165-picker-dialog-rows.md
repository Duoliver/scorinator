# Task 165: restyle the picker dialog rows

**Status:** Done

## Goal

Finish the picker row restyle that the user asked for at the Task 113 review. Task 120 did most of it: the name over the Location, the Tier at the row end, the ✕ at the centre, and half the row padding. The search placeholder is left: it says "Search by name…", but the search also matches the Location (US-08.1).

## Acceptance criteria

- [x] `PickerDialog` takes an optional `searchPlaceholder`. With none, the placeholder is "Search…". The design system stays free of team words (Task 113, choice 3).
- [x] The "Add teams" and "Switch team" dialogs show "Search by name or location…".
- [x] One `PickerDialog` test for the default and the prop. One Teams step test for the team text.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.
- [x] The user checks the two dialogs in the real app.

## Notes

- **2026-11-11:** Facts from the code. `PickerDialog.tsx` line 71 has the fixed text `placeholder="Search by name…"`, from the handoff. `toPickerItem` in `TeamsStep/helpers.tsx` sets `searchText` to the name and the Location. Two callers, both in `TeamsStep.tsx`: "Add teams" (multi) and "Switch team" (single). `ChecklistDialog` has no search.
- **2026-11-11:** The user agreed choices 1 to 4. (1) An optional `searchPlaceholder`, "Search…" by default. (2) The team dialogs say "Search by name or location…", with a lower-case "location". (3) Three new tests. (4) The task changes only the placeholder.

## Report

- **What was built:** `PickerDialog` takes `searchPlaceholder`, with "Search…" as the default. `TEAM_SEARCH_PLACEHOLDER` in `TeamsStep/helpers.tsx` gives "Search by name or location…" to the "Add teams" and "Switch team" dialogs.
- **Test approach:** three new integration tests, written first and seen to fail. Two `PickerDialog` tests: the default, and the caller's text. One Teams step test opens "Add teams", then "Switch team", and checks both placeholders. Full suite: 2056 tests pass. Lint, format check, and type check pass.
- **Decisions made:** choices 1 to 4, agreed by the user.
- **What is left, what is next:** the user checks the two dialogs in the real app. Next is Task 166.
