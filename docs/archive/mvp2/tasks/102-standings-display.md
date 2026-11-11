# Task 102: refine epic 12, Standings display

**Status:** Done (2026-10-28)

## Goal

Write a new epic, 12, "Standings display", in `docs/user-stories/mvp2/12-standings-display.md`, with one refined story for each of these features from `docs/unplanned-features-draft.md`: the last 5 matches with a hover card (#2), GF and GA on hover over GD (#3), hints on abbreviated headers (#4), the standings chart (#5), and position zones (#7).

## Acceptance criteria

- [x] `docs/user-stories/mvp2/12-standings-display.md` has one story for each of the five features, in the README template.
- [x] The position zones agree with the qualifier highlight of US-02.2 and US-07.2.
- [x] The chart story says which mode comes first, and parks the other mode if the user chooses so.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees each story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Task created by the user. The last-5 card shows trigrams, so it depends on Task 100. Features #2, #3, and #4 need the Tooltip component (also needed by US-09.3).
- **2026-10-28:** Facts from the code. The MVP1 standings table (`src/features/standings/helpers.tsx`) has the columns #, Team, P, W, D, L, GF, GA, GD, Pts. Group cards show W, D, L, GD, Pts (US-02.2). A qualifier highlight and a lighter best-M highlight exist in US-02.2 and US-07.2. The project has no chart library. Team colours include White and Sand, which are close to the page background. The design system needs AAA contrast for text (`docs/design-reference/README.md`).
- **2026-10-28:** Gaps found. Each needs a user answer.
  1. Last 5: the order of the matches, and what the hover card shows.
  2. Last 5: which tables show it.
  3. Chart: which mode comes first, positions or points.
  4. Zones: how they relate to the qualifier highlight of US-02.2 and US-07.2.
  5. Zones: where and when the user sets them.
- **2026-10-28:** The user agreed the criteria. Gap answers: (1) one hint for each dot of the last 5. (2) The round-robin table only. The form in group cards, maybe with a full table for each group, is parked in `scorinator-future-features.md` §14. (3) The positions chart first. The points mode is parked in §15. (4) Zones and the qualifier highlight are one system. (5) Zones are set in the wizard and in League Detail, at any time. (6) An optional label, a legend, and a left stripe.
- **2026-10-28:** Claude wrote US-12.1 to US-12.5, with the status Refined.

- **2026-10-28:** The user asked if "Form" is the usual name. Claude answered yes (Premier League, BBC Sport), with "Last 5" as the other choice. The user kept "Form". The user asked where the chart lives: a "Chart" sub-tab in League Detail.
- **2026-10-28:** The user agreed US-12.1 to US-12.5, the Claude choices, and three edits. Status: Agreed. Claude added a §1 "Standings display" section and a §2 epic to `docs/scorinator-mvp2.md`, and pointed the highlight criteria of US-02.2 and US-07.2 to the zones of US-12.5.

## Report

- **What was built:** `docs/user-stories/mvp2/12-standings-display.md`, a new epic with five Agreed stories: Form (US-12.1), GF and GA in the GD hint (US-12.2), header hints (US-12.3), the position chart (US-12.4), and zones (US-12.5).
- **Test approach:** none, no code changed. The stories name the tests: the last-N function, the places-by-matchday function, and a contrast test for the zone tokens.
- **Decisions made:** the gap answers and the confirmed Claude choices in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edits:** a §1 section and a §2 epic in `docs/scorinator-mvp2.md`, with the user's OK. US-02.2 and US-07.2 stay Agreed, with a dated pointer to US-12.5.
- **Parked:** `docs/scorinator-future-features.md` §14 (Form in group cards) and §15 (points mode of the chart).
- **Effect on other tasks:**
  - **Task 84 (build tasks):** the Tooltip component comes early: US-09.3, US-09.5, US-12.1, US-12.2, and US-12.3 need it. The zone colours need design tokens.
  - **US-01.1 (wizard phase step):** gets a "Zones" section for round-robin and Groups phases.
- **What is left, what is next:** nothing. Next is Task 84: split the epics into build tasks.
