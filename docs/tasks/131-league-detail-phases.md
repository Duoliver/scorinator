# Task 131: League Detail with phases: tabs, header, badge, group cards, group fixtures, dashboard card text

**Status:** Done

## Goal

Show a league with several phases, or with a Groups phase, in League Detail and on the dashboard (US-01.2, US-02.2, US-02.4). Today League Detail shows the first group table only (Task 128 choice 6), and the card text is always "Round robin (two-way)" (Task 104).

## Acceptance criteria

The user agreed these criteria and choices 1 to 6 on 2026-11-02.

**The texts (US-01.2):**

- [x] The dashboard card text comes from the phases: the full label for one phase ("Round robin (single duels) · 8 teams · Home adv. on"), the short names joined with " → " for several phases ("Group Stage → Bracket · 16 teams · Home adv. on").
- [x] The card keeps the points pill.
- [x] The League Detail header text is the card text plus the points: "Group Stage → Bracket · 16 teams · Home adv. on · 3/1/0 pts".
- [x] `FIXTURE_FORMAT_LABEL` goes. Nothing hardcodes "Round robin (two-way)" any more.

**The progress badge (US-01.2, choices 3 and 4):**

- [x] The card shows a badge from the manifest row: "MD 7/16" during a phase, "Complete" when the league is complete.
- [x] The League Detail header shows the badge with the short name: "Group Stage · MD 6/6", or "Complete".
- [x] Between two phases, the badge stays on the last matchday of the complete phase: "MD 6/6" (Task 128).

**The phase tabs (US-01.2, choices 1 and 2):**

- [x] A league with several phases has one tab for each planned phase: "1 · Group Stage", "2 · Bracket". The current phase is open at the start.
- [x] Each started phase tab has its own Standings and Fixtures tabs.
- [x] A phase tab that has not started shows one line: "Phase 2 starts when phase 1 is complete."
- [x] A one-phase league has no phase tabs. It looks as in MVP1.
- [x] The Fixtures tab of each phase keeps its own matchday across tab switches.

**The group cards (US-02.2, US-02.4, choice 5):**

- [x] The Standings tab of a Groups phase shows one card for each group, in group order, in a row that wraps.
- [x] Each card has its name in a dark band ("Group A"), then the columns #, Team, W, D, L, GD, Pts.
- [x] A tied block shows the MVP1 shared place ("-" after the first row).
- [x] The Standings tab has no horizontal scroll at the 800px window width, at any group count.
- [x] When the phase is not the last, the advancement line shows under the cards: "Top 2 of each group advance to the Bracket." It is the same text as the wizard Teams step (Task 130 choice 5).

**The group fixtures (US-02.2, choice 6):**

- [x] The Fixtures tab of a Groups phase shows one list for each matchday. Each match has its group tag ("A") before the home team, in group order.
- [x] Each group with a bye on that matchday shows one bye line with its group tag.
- [x] A group with no match on that matchday does not show.
- [x] "Scorinate matchday" plays the unplayed matches of every group on that matchday (Task 128 state, now visible).

**Not in this task:** the qualifier highlight, "Start phase N", the confirm, the lock of an earlier phase, and the empty tab design (Task 132). The zone colours (Task 155). The bracket tab, the round name badge, and the bracket progress (Tasks 139, 141). Shuffle and moves of a later phase (Task 132).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | A phase not started yet | Its tab shows and opens. It holds one line: "Phase 2 starts when phase 1 is complete." Task 132 gives it the Start button and the empty tab design. | ⚠ New text. Task 132 can change it. |
| 2 | A one-phase league | No phase tabs, only Standings and Fixtures, as in MVP1 and the one-phase handoff. | |
| 3 | The header badge of a one-phase league | The short name too: "Round robin · MD 7/16". "Complete" at the end, with the accent colour. | ⚠ The one-phase handoff shows "Matchday 7 / 16". US-01.2 gives the short name form. |
| 4 | The card badge | The handoff form: "MD 7/16" with the dark tone, "Complete" with the accent tone. Both are `Badge` tones today. | |
| 5 | The group card | The handoff 280px card width, but narrower when the content area is narrower, so nothing scrolls. The name sits in its own dark band above the column headers. The columns follow US-02.2 (with GD), not the handoff (no GD). | ⚠ The handoff puts the name in the header row, and it scrolls the cards. US-02.4 asks for a wrap. |
| 6 | The group tag and the byes | The handoff tag: the group letter in a warning badge, before each match. A bye line for each group: tag, "Bye", the team name. The matches sort by group. | |

## Notes

- **2026-11-02:** Started. Facts from the code: `useStandings` shows the first table of the current phase only. `useFixtures` reads the current phase and shows one bye. `describeLeague` uses `FIXTURE_FORMAT_LABEL`. The card has no progress badge. `formatPhasesLabel` and `phaseShortName` exist (`leagueSummary.ts`). `phaseStandings` gives one table for each group. The manifest row has `phases` and `progress`. A fixture has no group field: its group comes from the membership in `GroupsPhase.groups`, so the code does not parse the fixture id. The MVP2 handoff ("League Detail - Mixed") shows the phase tabs as a segmented bar, Standings and Fixtures under it, 280px group cards, and a group tag on each match.
- **2026-11-02:** The user agreed the criteria and choices 1 to 6.
- **2026-11-02:** Claude choices found during the build:
  - `Table` gets a `compact` prop (off by default): smaller gaps, padding, and text. With the full-size table, the Team column of a 280px card had no room.
  - `groupsAdvanceText` moves from `LeagueSetupScreen/phaseOneGroups.ts` to `leagueSummary.ts` as `formatGroupsAdvanceText(plans, phaseIndex)`, so the wizard and League Detail share it. League Detail gives the text to `StandingsView` as a prop: a screen folder does not import another screen folder (`FEATURES.md`).
  - The group of a fixture or a bye comes from the draw (`GroupsPhase.groups`), not from the fixture id.
  - The group tag reads "Group A" for a screen reader, with the letter only on view.
  - On the dashboard card, the name and "Unsaved" sit on the left, the badge on the right. On a narrow card, "Unsaved" wraps under the name.
  - `fixtures/helpers.ts` becomes `helpers.tsx`: it holds the `GroupTag` JSX.
- **2026-11-02:** Look check: a temporary demo page in Vite (`demo131.html`, `src/demo131.tsx`, untracked), with five leagues, opened in headless Chromium at 1280px and 800px. No horizontal scroll at either width. The cards wrap, the group tags and byes show, and the phase tabs switch. Found and fixed: the card badge dropped to its own line beside "Unsaved". The demo files are deleted.
- **2026-11-02:** Points for the review, not fixed:
  - Long team names cut hard in a 280px card: about 90px for the name ("Salt Mars…"). One option: equal cards of 280px or more that fill the row (a CSS grid).
  - The Fixtures tab of a complete phase that is not the last shows "League completed". Task 132 (the phase transition) needs a text for it.
  - An earlier phase tab shows enabled Re-scorinate buttons. A click throws a `RangeError`, because the actions play the current phase only. No screen can start phase 2 yet. The lock of Task 132 must turn these buttons off.

## Report

- **Review (2026-11-02):** the user agreed that the task is Done. Before that, the user agreed the three review points. Point 1 changed choice 5: the group cards are a CSS grid of equal cards, 280px or wider, that fill the row. At 1280px, three cards fit in a row, and the demo names show in full. Points 2 and 3 go to Task 132 (Open questions). The user asked for a hint with the full name on a cut team name: new Task 180, a `design-system/` piece first. The user also gave an MVP3 idea, a short team name: logged in Open questions, not built.

- **What was built:**
  - `leagueSummary.ts`: the card text comes from the phases (`FIXTURE_FORMAT_LABEL` is gone). New `formatProgressBadge`, `formatHeaderProgress`, and `formatGroupsAdvanceText`.
  - Dashboard card: the progress badge, dark during a phase, accent when complete.
  - League Detail: the header text with the phases, the progress badge, and one tab for each planned phase. A started phase has its own Standings and Fixtures tabs and its own matchday. A phase not started shows one line.
  - `StandingsView`: one card for each group, in a grid of equal cards of 280px or more that wraps, with the advancement line. It takes a phase index.
  - `FixturesView`: a group tag on each match, the matches in group order, and one bye line for each group. It takes a phase index.
  - `Table`: a `compact` prop. `groupsLeague` test helper in `src/test/databaseRecords.ts`.
- **Test approach:** 30 new tests, all red first (3 more tests moved from `phaseOneGroups.test.ts`). Two tests passed early, because the earlier steps gave the behaviour: the card text (step 1) and "Scorinate matchday" in every group (Task 128 state).
  - `leagueSummary.test.ts` (7 new, 3 moved): the card texts, both badges, and the advance text of any phase.
  - `LeaguesDashboardScreen.test.tsx` (2): the badges, the phase formats.
  - `StandingsView.test.tsx` (6): the cards, the columns, the shared place, the own-group results, the advancement line, a phase index.
  - `FixturesView.test.tsx` (5): the tags in group order, the byes, a group with no match, Scorinate matchday, no tag in a round robin.
  - `LeagueDetailScreen.test.tsx` (9): the meta text, the badges, no phase tabs for one phase, the phase tabs, the cards, the line of a phase not started, two started phases, the matchday of each phase.
  - `Table.test.tsx` (1): the compact look.
  - Not tested by a unit test: no horizontal scroll and the card width. The look check covers them.
- **Decisions made:** choices 1 to 6, in the Decisions log (2026-11-02). The Claude choices are in the Notes.
- **What is left, what is next:** review points 2 and 3 go to Task 132. Task 180 adds the full-name hint. Task 132 adds "Start phase N", the lock, the empty tab, and the qualifier highlight.
