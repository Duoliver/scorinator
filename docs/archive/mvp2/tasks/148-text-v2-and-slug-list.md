# Task 148: Results text v2 and the slug list writer

**Status:** Done

## Goal

"Export results (.txt)" writes every started phase: the tables of a round robin or each group, the results by matchday, and the ties of a bracket (US-10.6). "Export slug list (.txt)" writes the Instance slugs in the final ranking of Task 147 (US-10.5). Task 150 adds both to the League Detail export menu.

## Acceptance criteria

The user agreed the criteria on 2026-11-04.

- [x] The results file starts with the league name and the format line, for example "Group Stage → Bracket · 16 teams · Home adv. on · 3/1/0 pts" (US-01.2).
- [x] Each started phase has a heading, for example "Phase 1 · Group Stage", and its "Matches played" line.
- [x] A round-robin phase lists its table, then its results by matchday, as the MVP1 file does.
- [x] A Groups phase lists each group as in choice 2.
- [x] A Bracket phase lists each round with each tie, as in choice 3, then the winner line "Winner: <name>" when it is complete (US-04.14).
- [x] The file uses the Instance names, and has no Location (US-10.6).
- [x] The file has no date, so the same league gives the same text (MVP1 rule).
- [x] The slug list file starts with `# <league name> — final ranking, <date>`, then one Instance slug on each line, in the Task 147 order (US-10.5). `parseSlugList` reads it back.
- [x] The slug list includes the slug of a team whose Blueprint was deleted (US-09.4).
- [x] `app/data` has `exportSlugListTxt` with a save dialog, as `exportResultsTxt` has.
- [x] Unit tests for each phase layout and for the slug list. A test that reads the slug list back with `parseSlugList`.

**Out of scope:** the export menu (Task 150). The removal of the old results export from the File screen (Task 149, US-10.6). A styled or PDF report.

## Notes

- **2026-11-04:** Facts from the code.
  - `adapters/txt/resultsTxt.ts` writes one round-robin phase in the MVP1 layout: the title, home advantage, points, "Matches played", a STANDINGS table, then RESULTS by matchday. `app/data/resultsTxt.ts` gives it the current phase only, and skips a bracket.
  - The format line texts (`formatPhasesLabel`, `formatTeamCount`) and the tie footer texts ("Agg", "Pens", "Coin toss", "Away goals") live in `features/`. `adapters/` and `app/data` cannot import `features/` (`module-boundaries.md`). The `PROGRESS.md` open question of MVP1 Task 72 is about the same kind of copy.
  - `adapters/txt/slugList.ts` reads a slug list and skips a line that starts with `#`.
- **2026-11-04:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The shared texts | `adapters/txt` writes its own copy of the format line and the tie texts. Tests pin the same texts as the screens. | ⚠ Two copies of each text. A change on screen needs a change here too. Option B: move the texts to a lower shared module, which changes the module map. |
  | 2 | A Groups phase | One block for each group: "Group A", its table, then its matchdays. | |
  | 3 | A bracket tie line | One line for each tie, top team first: `Salt Marsh United  2-1, 0-1*  Harborview SC  · Agg 2–2 · Pens 4-3`. The scores are from the top team's view, leg by leg, with the replay last. An unplayed tie shows `vs`. A bye shows `Salt Marsh United  · Bye`. A side that waits shows `TBD`. The third-place tie has its own heading "Third-place playoff". | |
  | 4 | The slug list file name | `<league slug>-ranking.txt`, for example `coastal-premier-ranking.txt`. | |
  | 5 | The date of the slug list | The caller gives the date, so the writer has no clock and its tests are fixed. | |
- **2026-11-04:** The user agreed the criteria and the 5 choices.

- **2026-11-04:** Four choices made during the work, for the user to check at review:

  | # | Choice | Made | Flag |
  |---|---|---|---|
  | 6 | The section headings | Upper case, as the MVP1 "STANDINGS" and "RESULTS": "GROUP A", "SEMI-FINALS", "FINAL", "THIRD-PLACE PLAYOFF". | Choice 2 wrote "Group A". |
  | 7 | The "played" line of a bracket | "Ties played: 1 of 4". A bye tie does not count. The phase line says "(phase completed)" in place of the MVP1 "(league completed)". | |
  | 8 | The MVP1 lines "Home advantage: on" and "Points: win 3, draw 1, loss 0" | Removed: the format line holds both. | |
  | 9 | A bracket that waits for its byes | One line: "The bracket waits for its byes." | |

- **2026-11-09 (user review):** The one-line tie has no alignment. The user gave a new layout, which replaces the tie line of choice 3:

  ```
  ROUND OF 16
  Ashfield Rovers  5 - 3  Harbourview United
                  3-1, 2-2
           Team 3  1 - 1  Another Team SC
                  1-0, 0-1
                  Pens 3-5
  ```

  The top names end at one column. The total sits between the names. The leg scores and the decision tag sit on their own lines, centred below the total. The "Agg" tag goes, because the main line holds the total.

- **2026-11-09:** Five choices for cases that the user example does not show, for the user to check at review:

  | # | Choice | Made | Flag |
  |---|---|---|---|
  | 10 | A single match with no extra time | The main line only, with no detail line. | |
  | 11 | A single match with extra time | The main line has no mark. A detail line shows the mark: `2-1*`. | |
  | 12 | A replay | The total does not include it. It comes last on the detail line: `0-0, 2-2`. | |
  | 13 | A bye | `Bye` in the middle column, in place of `· Bye`. | ⚠ Changes choice 3. |
  | 14 | The name column | Each round has its own column width. The third-place tie has its own too. | |

- **2026-11-09:** In the user example, the third tie shows `4 - 6` above the legs `2-0, 4-4*`. These legs give 6-4 from the top team view, as in the other two ties. The writer computes the total from the legs, so it writes `6 - 4`. ⚠ The user checks this at review.

- **2026-11-09 (user review, second pass):** The user saw the layout with many results, and asked for one detail line for each tie. The leg scores and the decision tag share that line, with a centre dot: `1-0, 0-1 · Pens 3-5`. It replaces the separate tag line of the layout above. A tie with only a tag shows the tag alone. A detail line too wide for the space before the total starts at the first column.

- **2026-11-09 (user review, third pass):** The user agreed choices 6 to 14. The user confirmed `6 - 4` for the third tie of the example. The user asked for the third-place tie before the final in the file, the same order as the play order (Task 137 choice 2).

- **2026-11-09 (user review, fourth pass):** The user chose one column set for the full bracket. All rounds and the third-place tie share one name column and one middle column, so `vs` and the scores line up. This replaces choice 14.

## Report

- **Review change (2026-11-09):** the bracket layout above, with one detail line for each tie, one column set for the bracket, and the third-place tie before the final, in `adapters/txt/resultsTxt.ts`. 6 new tests, 3 changed.
- **What was built:**
  - `adapters/txt/resultsTxt.ts`: the v2 writer. The input holds the phase plans and every started phase. A round robin keeps the MVP1 table and matchday layout. A Groups phase has one block for each group. A bracket has one line for each tie, and the winner line. The format line and the tie texts are a copy of the screen texts (choice 1).
  - `adapters/txt/slugList.ts`: `serializeSlugList`.
  - `app/data/resultsTxt.ts`: the input of every started phase, with the team lists, the bracket tree, and the lots. `app/state/phases.ts` exports `phaseTeamLists` for it.
  - `app/data/slugListTxt.ts`: `exportSlugListTxt`, with the save dialog, the Task 147 ranking, and the Instance slugs.
- **Test approach:** 18 unit tests for the results writer (exact text for a round robin, a Groups phase, and a bracket, plus each tag, a bye, TBD, and the guards). 3 for the slug list writer, with a read back by `parseSlugList`. 5 caller tests for the results export, with a Groups → Bracket league that uses random scores (passed six times). 3 caller tests for the slug list export, with a deleted Blueprint. 1791 tests pass.
- **Decisions made:** choices 1 to 5 in the `PROGRESS.md` Decisions log on 2026-11-04. The user agreed choices 6 to 14 on 2026-11-09.
- **What is left, what is next:**
  - The File screen still has the results export with its league selector (MVP1 Task 18, `app/exportActions.ts` `exportResults`). It writes the v2 text now. Task 149 removes it (US-10.6).
  - Task 150 adds both exports to the League Detail menu.
