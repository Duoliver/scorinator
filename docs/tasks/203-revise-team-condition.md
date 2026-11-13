# Task 203: revise epic 14, Team condition, with the notes of the user

**Status:** Done

## Goal

Revise the Agreed stories in `docs/user-stories/mvp3/14-team-condition.md` with the notes of the user of 2026-11-13. The notes give the condition as a fixed percentage of the OVR, not a random amount. They also give a sketch of the team modal and an idea for a "Teams" tab in League Detail. Claude asks the user questions, and writes the stories from the answers. Claude does not propose how a feature works (Task 195).

## Acceptance criteria

- [x] Claude reads the notes and the two sketches in `docs/14-condition-sketches-and-drafts/`, and asks the user questions about each gap.
- [x] US-14.1 shows the answers of the user on the condition amount: the percentage, the rounding, and the roll.
- [x] Claude checks each story that uses the amount or the roll, and updates it from the answers: US-14.2, US-14.3, US-14.4, and US-13.7.
- [x] The place in League Detail (US-14.2) gets an answer from the user, or stays open. When the user answers it, Claude removes the open question of 2026-11-12 from `PROGRESS.md`, and writes the answer in this report.
- [x] Each changed story goes back to Refined. It goes to Agreed when the user agrees it.
- [x] A spec line changes only when the user approves it.
- [x] Each decision goes in the `PROGRESS.md` Decisions log.
- [x] The commit of this task holds `docs/14-condition-sketches-and-drafts/`.

## Notes

- **2026-11-13:** Task created by User. Inputs:
  - `docs/14-condition-sketches-and-drafts/ideas-and-teams-tab.md`. The condition is a fixed percentage: +2 is +20% OVR, +1 is +10%, both with ceiling. -1 is -10%, -2 is -20%, both with floor. Stronger teams get lower lows and higher highs, and the user accepts that. The note also says that a fixed value stops a user who switches levels again and again for a new roll. The "Teams" tab lists the league teams, with the condition segmented control in each row, and the change saves automatically.
  - `during-league-team-modal.png`: a modal for one team during a league. It shows the colour, the name, the trigram, and the base Tier and OVR. It shows the condition from "Crisis" -2 to "Peak" +2, with "Cancel" and "Save". It also shows "There are unsaved changes".
  - `league-setup-condition-setter.png`: the Teams step of the wizard. One row has the team, the Location, the trigram, the Tier, and the condition icon. A click on the icon opens an overlay with the five level icons, from "Crisis" to "Peak". The note under it asks where the overlay shows. It can show above or below the current condition. Its position can follow the row or the condition.
  - Conflict: US-14.1 (Agreed) gives each level a random range, rolled once. For example, +1 rolls +1 to +5.
- **2026-11-13:** The user agreed the criteria. The commit holds the sketches folder. Round 1 of questions sent.
- **2026-11-13:** The answers of the user, round 1.
  - (1) The base OVR is the base of the percentage. The user asked if the Instance and the Season team are the same. Yes: a Season team is the one Instance of a Blueprint in a Season wrapper (US-13.4, `PERSISTENCE.md` §2a). The term "base OVR" covers both.
  - (2) A base OVR change also changes the amount.
  - (3) The slug list import sets the level only.
  - (4) A playoff team uses the same percentages.
  - (5) The control shows the arrows. The modal sketch is a rough idea only.
  - (6) "Crisis" and "Peak" are part of the control.
  - (7) The place of the wizard overlay waits for the build task. Two alternatives stay open until then.
  - (8) The three boxes are the edit, switch, and delete buttons of the wizard team list. Nothing new.
  - (9) League Detail gets both: a "Teams" tab and a modal.
  - (10) The modal shows the base Tier and OVR, read only. The "Teams" tab can show them too. The modal and the tab do not show the real OVR.
- **2026-11-13:** Claude checked round 1. US-14.1 rewritten: fixed percentages, the rounding, no RNG, the labels, the icons only. US-14.3 and US-14.4 updated. US-14.1, US-14.3, and US-14.4 are Refined. US-13.7 says "plus its condition for that playoff (US-14.3)", with no roll: no change. The spec §1 Team condition gives no amounts: no change. The open question of 2026-11-12 is answered (both places), and removed from `PROGRESS.md`. A build note in US-14.1: in floating point, `Math.ceil(50 * 1.1)` gives 56, so the function needs integer arithmetic. Round 2 sent, on the details of US-14.2.
- **2026-11-13:** The answers of the user, round 2.
  - (1) No screen shows the real OVR, for now. Epic 18, Debug mode (Task 201), is not refined yet.
  - (2) A "Teams" tab row also shows the trigram and the Location.
  - (3) The modal does not save at once. It uses "Cancel" and "Save".
  - (4) The list is correct. The user asked if Claude sees other places, and named the Season "Resume" tab (US-13.8) as one.
  - (5) The League Detail tab is "Teams" too.
- **2026-11-13:** Claude checked round 2. League Detail shows team names in three more places: the Seed List tab, the legend of the Chart tab, and the group cards of a Groups phase in the Standings tab. Each name in the Season "Resume" tab belongs to one league. The Season "Teams" tab lists the roster, and a roster team can be in more than one league. Round 3 sent: these places, the modal content, and a close with a change that is not saved.
- **2026-11-13:** The answers of the user, round 3.
  - (1) A click on a team name in the Seed List, the Chart legend, and the group cards also opens the modal.
  - (2) The modal from the Season "Resume" tab is a "could". The user asked if the "Resume" tab shows while the leagues run.
  - (3) If the Season "Teams" tab opens the modal, the modal has no condition control there.
  - (4) The modal shows the same items as a "Teams" tab row.
  - (5) A close with the X or Escape drops the change. The status line shows "Operation cancelled", only when the level changed and the user did not save it.
- **2026-11-13:** Claude checked round 3. The app has a `StatusLine` (`features/components/`) at the bottom of the sidebar. It clears after 4 seconds (`STATUS_VISIBLE_MS`, `app/useStatusAutoClear.ts`). US-13.3 and US-13.8 do not limit when the "Resume" tab shows. A running league has no winner yet, and US-13.8 does not say what the tab shows for it. US-14.2 says the user changes the condition while the league runs. It does not say what happens after the league ends. Round 4 sent.
- **2026-11-13:** The answers of the user, round 4.
  - (1) For a running league, the "Resume" tab shows the same content: the winner and the teams in the zones. Changed in this task.
  - (2) The modal from the "Resume" tab is a Could.
  - (3) The Season "Teams" tab opens the modal, with no condition control.
  - (4) After a league ends, the user cannot change the condition.
- **2026-11-13:** Claude wrote US-14.2, and added a criterion to US-13.8. Both are Refined. Claude choices, sent to the user with the stories: a level change in the "Teams" tab applies at once, and is an unsaved change of the database (the app saves the database by hand, `app/saveActions.ts`). The "Save" of the modal applies the level, and does not write the database. For a running league, the "Resume" tab uses the team in first place as the winner.
- **2026-11-13:** The user agreed the five stories and the three Claude choices. US-14.1 to US-14.4 and US-13.8 are Agreed.
- **2026-11-13:** The user agreed the review: Done.

## Report

**Delivered:** five Agreed stories, from four rounds of answers. US-14.1 to US-14.4 in `docs/user-stories/mvp3/14-team-condition.md`, and US-13.8 in `13-season.md`.

**What changed:**

- US-14.1: each level is a fixed percentage of the base OVR, not a random range. +1 and +2 are +10% and +20%, rounded up. -1 and -2 are -10% and -20%, rounded down. No RNG. A base OVR change changes the amount. The control shows the arrows, with "Crisis" and "Peak" at the two ends.
- US-14.2: League Detail gets a "Teams" tab and a team modal. The tab applies a change at once. The modal has "Cancel" and "Save", and a dropped change shows "Operation cancelled" in the status line. The modal opens from a team name in six places of League Detail, and from the Season "Teams" tab with no control. The "Resume" tab can open it (Could). After a league ends, the condition is fixed. No screen shows the real OVR.
- US-14.3: a playoff team uses the same percentages.
- US-14.4: the slug list import sets the level only.
- US-13.8: for a running league, the "Resume" tab shows the team in first place and the teams in the zones.

**Open question closed:** the place of the condition in League Detail (Task 197). Answer: both, a "Teams" tab and a modal. Removed from `PROGRESS.md`.

**No spec change.** `scorinator-mvp3.md` §1 Team condition gives no amounts. US-13.7 needs no change.

**For the build tasks:**

- The real OVR needs integer arithmetic. In floating point, `Math.ceil(50 * 1.1)` gives 56, not 55.
- `SegmentedControl` shows text labels only. The "Crisis" and "Peak" labels at the two ends are new.
- The place of the wizard overlay is open: above or below the current condition.
- A "Teams" tab change and the modal "Save" do not write the database file. The user saves the database by hand, as in MVP2.

**Refactor:** No code, no refactor step.
