# Task 254: bold team names in the Teams list and the Season Teams tab

**Status:** Refactor

## Goal

The standings show each team name in bold: `font-weight: 600` on the team cell (`StandingsView.module.css`). Give the same bold to the team names in two more places: the table of the Teams screen, and the roster of the Season Teams tab. Layout tweak, before M3 starts.

## Acceptance criteria

The user agreed the criteria on 2026-11-15.

- [x] The Teams screen: the text of the Name column has `font-weight: 600`, as the standings do.
- [x] The Season Teams tab: the team name has `font-weight: 600`. The Location beside it stays normal weight, small, and muted.
- [x] `TeamLabel` gives its name span `data-part="name"`, as `TeamName` does, so a screen CSS can bold the name alone. The other `TeamLabel` places (the wizard Teams step, the add dialog, the Review step, the group cards) do not change.
- [x] CSS only, apart from the `data-part` mark: the user checks the look in the real app. The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-15:** Task created by the user. The first of some layout tweaks before M3. Draft criteria wait for the user.
- **2026-11-15:** The user agreed the criteria. Started.
- **2026-11-15:** Test first: the `data-part="name"` mark of `TeamLabel` failed, then passed. A search found six screen CSS rules on `[data-part='name']`. None of their containers holds a `TeamLabel`, so no other place changes.
- **2026-11-15:** Claude choice in the code, for the review: (a) the Teams screen Name column gets a `render` with a `.name` class, because the default render of `Table` gives plain text.
- **2026-11-15:** The user agreed the review, with the Claude choice (a). Commit 1. The refactor pass is next.

## Report

- **What was built:** the team names in the Teams screen table and in the Season Teams tab roster show at `font-weight: 600`, as in the standings. `TeamLabel` marks its name `data-part="name"`. The Location keeps its look.
- **Test approach:** one unit test for the `TeamLabel` mark. The bold is CSS only, so the user checks it in the real app. The full suite passes: 2334 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the Claude choice (a) is in the notes.
- **What is left, what is next:** a live check of the two places. Then the next layout tweak of the user.
- **Refactor:** waits for the review.
