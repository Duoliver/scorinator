# Task 132: Phase transition: "Start phase N", the confirm, the lock, the empty tab, the qualifier highlight

**Status:** Done

## Goal

Let the user start the next phase of a league from League Detail, and show who qualifies (US-07.1 to US-07.3, the highlights of US-02.2). Task 128 gave the state (`startNextPhase`, `canStartNextPhase`). Task 131 gave the phase tabs. No screen can start a phase today.

## Acceptance criteria

The user agreed these criteria and choices 1 to 9 on 2026-11-02.

**The start (US-07.3, choices 2 to 4):**

- [x] When the current phase is complete and a next phase is planned, the tab of the current phase shows a button: "Start phase 2 · Round robin".
- [x] Until the click, every match of the complete phase can be re-scorinated. The highlight follows the new results.
- [x] The click opens a confirm: title "Start phase 2?", text "Phase 1 locks, and its results can no longer change.", buttons "Cancel" and "Start phase 2". "Cancel" changes nothing.
- [x] "Start phase 2" builds the next phase with `startNextPhase`, and opens its tab.
- [x] A Bracket next phase: the button shows, but it is off, with a reason (choice 4).
- [x] The badge and the header between two phases show the last progress of the complete phase (Task 128, already true).

**The lock (US-07.3, choice 5):**

- [x] In a locked phase, every Scorinate and Re-scorinate button is off, and "Scorinate matchday" too.
- [x] The Fixtures tab of a locked phase shows: "Phase 2 started. This phase is locked."
- [x] A locked phase keeps its final table and its highlight (US-07.1, US-07.2).

**The texts of a phase (choices 6 and 7):**

- [x] A phase tab before its start shows the story text: "This phase starts when phase 1 is complete." (choice 6).
- [x] The Fixtures tab of a complete phase that is not the last shows a "Phase complete" badge in place of "League completed". The last phase keeps "League completed" (choice 7).
- [x] A round-robin table of a phase that is not the last shows its advancement line: "Top 4 advance to the Bracket." (US-07.2).

**The qualifier highlight (US-02.2, US-07.2, choices 8 and 9):**

- [x] A round-robin table of a phase that is not the last: the top N rows have the qualifier tint.
- [x] A group card: the top N rows have the qualifier tint.
- [x] With a best M of place N + 1: during the phase, each place N + 1 row has a lighter second tint. When the phase is complete, the best M rows get the qualifier tint, and the other place N + 1 rows lose the second tint.
- [x] A complete phase marks the same teams that `startNextPhase` sends on (`pickQualifiers`).
- [x] The last phase has no tint.
- [x] Two new colour tokens in `design-system/`, with the AAA contrast test for the text on them (choice 8).

**Not in this task:** Shuffle and moves for a later Groups phase (choice 1, new Task 181). The Bracket start (Task 139). The zones of US-12.5 (Tasks 152, 155). An undo of a phase start (parked).

## Choices for the user

| # | Choice | Proposal | Flag |
|---|---|---|---|
| 1 | Shuffle and moves for a later Groups phase (US-02.1, US-02.5) | A new Task 181. It needs the wizard group cards moved to a shared place, a move rule for a started phase, and its own tests. A later Groups phase is rare: Groups → Bracket is the common chain, and it waits for M4. | ⚠ Task 130 said Task 132 adds them. Recommended split. |
| 2 | Where the Start button goes | In the tab of the current phase, at the right end of the Standings and Fixtures row. A primary button. | |
| 3 | After the start | The new phase tab opens. | |
| 4 | A Bracket next phase | The button shows, off, with a hint: "A Bracket phase cannot start yet. It comes with the bracket screens." A Groups → Bracket league stops at the end of phase 1 until Task 139. | ⚠ New text. |
| 5 | The lock hint | Above the match list of the Fixtures tab, with the muted text style. The buttons stay, off. | |
| 6 | The empty tab text | The US-07.3 text: "This phase starts when phase 1 is complete." | ⚠ Task 131 choice 1 used "Phase 2 starts when phase 1 is complete." I missed the story text then. This fixes it. |
| 7 | A complete phase that is not the last | Badge "Phase complete" (short form "Complete"), in place of "League completed". | ⚠ New text. From the Task 131 review. |
| 8 | The tints | Two tokens: the qualifier tint `#EAF3EA` (the handoff value) and a lighter yellow for the place N + 1 rows. Task 152 later adds the other zone tokens next to them. | ⚠ Takes a part of Task 152 earlier. |
| 9 | How a row gets its tint | A `Table` prop that gives each row a tone, from a function. `Table` stays free of football terms: the tones are "positive" and "caution". | |

## Notes

- **2026-11-02:** Started. Facts from the code: `startNextPhase` builds a round robin or a Groups phase, and throws for a Bracket (Task 139). `canStartNextPhase` exists. The scorinate actions play the current phase only, so a click in an earlier phase throws or plays the wrong phase (Task 131 review point 3). `pickQualifiers` gives the qualifiers in seed order. `ConfirmDialog` exists. The handoff has no Start button and no lock hint: the texts come from US-07.3. The design tokens have no tint for a row.
- **2026-11-02:** The user agreed the criteria and choices 1 to 9. Shuffle and moves for a later Groups phase go to the new Task 181.
- **2026-11-02:** Claude choices found during the build:
  - `phaseQualifierMarks` in `app/state/phases.ts`, next to `phaseStandings`: "qualifier" or "best-of-next" for each team. The standings view turns them into the `Table` tones.
  - `Tabs` gets an `actions` slot: content at the end of the tab row, outside the tab list. The Start button uses it (choice 2).
  - `formatGroupsAdvanceText` becomes `formatAdvanceText`: it also gives the round-robin line. The wizard shows the line under the group cards only, so the wizard does not change.
  - The `MatchdayNav` flag `leagueCompleted` becomes `phaseComplete`.
  - The token names are `--color-row-positive` (`#EAF3EA`) and `--color-row-caution` (`#FBF3D6`). Both pass the AAA test with the normal text colour.
  - A failed start writes its message to the status line, as other actions do.
- **2026-11-02:** Look check: a temporary demo page in Vite (`demo132.html`, `src/demo132.tsx`, untracked), opened in headless Chromium at 1280px. The off Bracket button shows its hint on hover. The confirm, the new phase tab, the lock hint, the "Phase complete" badge, and both tints show as planned. The demo files are deleted.

## Report

- **Review (2026-11-02):** the user tested in the real app and agreed that the task is Done. The published demo port gave "connection reset" in the user's browser. The user asked for a dashboard card change: new Task 182.

- **What was built:**
  - League Detail: "Start phase 2 · Round robin" at the end of the Standings and Fixtures row of a complete current phase, a confirm, then the new phase tab opens. A Bracket next phase has the button off, with its reason. The empty tab uses the US-07.3 text.
  - `FixturesView`: a locked phase has every Scorinate button off and the hint "Phase 2 started. This phase is locked." A complete phase that is not the last shows "Phase complete".
  - `StandingsView`: the qualifier tint and the lighter place N + 1 tint, from `phaseQualifierMarks`. The round-robin advancement line.
  - `design-system/`: two row tint tokens, the `Table` `rowTone` prop, and the `Tabs` `actions` slot.
- **Test approach:** 22 new tests, all red first.
  - `phases.test.ts` (4): the marks of the last phase, a round robin, a Groups phase during play, and a complete phase against `pickQualifiers`.
  - `StandingsView.test.tsx` (3): the group tints, the round-robin tints with the line, no tint in the last phase.
  - `FixturesView.test.tsx` (4): "Phase complete", Re-scorinate on before the start, the lock, the open new phase.
  - `LeagueDetailScreen.test.tsx` (4 new, 1 changed): no button before the end, Cancel, the start with the new tab and the lock, the off Bracket button with its reason. The empty tab test has the US-07.3 text.
  - `leagueSummary.test.ts` (1 new, 1 changed): the round-robin line.
  - Design system (6): the two tokens in sync, their AAA contrast, `rowTone`, and `actions`.
  - US-07.1 (each phase starts from zero) has its test from Task 128 (`phaseStandings` "starts each phase from zero").
- **Decisions made:** choices 1 to 9, in the Decisions log (2026-11-02). The Claude choices are in the Notes. The Task 131 open question on the "League completed" text and the earlier-phase buttons is resolved here (choices 5 and 7).
- **What is left, what is next:** Task 181 (Shuffle and moves for a later Groups phase), then Task 133 (the M3 smoke check). A Groups → Bracket league stops after phase 1 until Task 139.
