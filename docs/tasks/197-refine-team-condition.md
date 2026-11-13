# Task 197: refine epic 14, Team condition

**Status:** Done

## Goal

Turn the Team condition item of the MVP3 spec into refined stories in `docs/user-stories/mvp3/14-team-condition.md`. The stories cover C10 (Must). Claude asks the user questions, and writes the stories from the answers. Claude does not propose how a feature works (Task 195).

## Acceptance criteria

- [x] C10 has one or more stories, with acceptance criteria, in the story template of `docs/user-stories/README.md`.
- [x] Each story comes from the user's answers. A gap that the user leaves open goes to the open questions of `PROGRESS.md`.
- [x] The user agrees each story (status Agreed).
- [x] A spec line changes only with the user's approval.

## Notes

- **2026-11-12:** Inputs. `docs/scorinator-mvp3.md` §1 Team condition: a buff or a nerf for the Season, with no direct change to the Tier. The ranked slug list export (US-10.5) carries it. Task 195, C10. The open question of 2026-10-29 in `PROGRESS.md`, item (1): a form for each team in a league, a peak or a crisis. Task 196, round 1: the condition changes the base OVR into the real OVR, for each team in each league. US-13.4: a Season team has one base OVR for every league. The Tier ranges do not overlap: S is 90 to 99, F is 30 to 39 (`engine/tier-ovr`).
- **2026-11-12:** A difference in the inputs. The spec says "for the Season". Task 196 round 1 and the open question of 2026-10-29 say "for each team in each league". Asked in round 1.
- **2026-11-12:** The user's answers, round 1.
  - (1) The condition is for one team in one league. A default condition for the Season can come another day: parked as future features §33.
  - (2) A standalone league also has the condition.
  - (3) Five named levels: -2, -1, 0, +1, +2. The default is 0. +1 adds a random 1 to 5 points, +2 adds 5 to 10. -1 takes away 1 to 5, -2 takes away 5 to 10. The user has an idea for an icon for each level. The names can be "-2" to "2", not "1" to "5".
  - (4) The real OVR can go out of the Tier range.
  - (5) The condition stays until the user changes it.
  - (6) The user can change it at any time.
  - (7) The display is open. The wizard of a Season league sets it. Ideas: an icon next to the team name in the standings, a menu in League Detail, or a click on a team name in the standings and the brackets that opens a modal or a dropdown. The user wants to sketch it.
  - (8) A Season playoff team has a condition too. The playoff wizard sets it. This changes US-13.7 ("the Season base OVR and Tier").
  - (9) The slug list can become a CSV, unless a space between the two values in the `.txt` is a common pattern.
- **2026-11-12:** Claude checked round 1. The engine already takes an OVR above 99: the home advantage boost does it for one match (`applyHomeAdvantage`), and the expected-goals factors have a floor and a ceiling. So answer 4 needs no engine change. Answers 1 and 2 change the spec line "for the Season" (§1 Team condition): asked for approval. Gaps sent as round 2: the time of the roll, the value 5 in two ranges, a base OVR change under a condition, and what the slug list carries.
- **2026-11-12:** The user's answers, round 2.
  - (1) The user approved the spec line: the condition is for one team in one league, in a Season or standalone, and for a playoff team. Applied to `scorinator-mvp3.md` §1.
  - (2) The amount rolls once, when the user sets the level. The picker is a segmented control. The user does not like a user who picks the same level again and again, to roll again.
  - (3) The value 5 in two ranges is what the user wants.
  - (4) A base OVR change keeps the amount.
  - (5) The slug list carries the level, in the `.txt` format.
- **2026-11-12:** Claude checked round 2. `SegmentedControl` exists, and a click on the selected option does nothing, so the same level cannot roll again. A switch to another level and back still rolls again. The Edit drawer already lets the user type any OVR in the Tier range (US-08.4). Stories written: US-14.1 to US-14.4, status Refined.

- **2026-11-12:** The user's answers, round 3. The user agreed US-14.1 to US-14.4, with the Claude choices. A switch away and back that rolls again is OK. The standings and the bracket do not show the condition directly. League Detail shows it in a "Teams" tab, or in a modal from a click on a team name in the standings, the fixtures, or a tie card. US-13.7 edited for the playoff condition.

- **2026-11-12:** The user gave the level icons: arrows at 90° and 45°, up for a buff and down for a nerf, and a dash for 0. Added to US-14.1. On the place: it depends on how useful a new "Teams" tab is for MVP3. Claude listed the MVP3 items that a "Teams" tab can hold.

- **2026-11-12:** The user left the place open for the build task of US-14.2, and chose the Unicode characters as the icons. The user agreed the review: Done.

## Report

**Delivered:** 4 Agreed stories in `docs/user-stories/mvp3/14-team-condition.md`, US-14.1 to US-14.4. They cover C10 (Must), from three rounds of answers.

**Spec change, with the user's approval:** `scorinator-mvp3.md` §1 Team condition. The condition is for one team in one league, in a Season or standalone, and for a playoff team. It said "for the Season".

**Other story changed:** US-13.7. A playoff team plays with its condition (US-14.3).

**Parked:** `scorinator-future-features.md` §33, a default condition for a Season.

**Changes to MVP2 rules:**

- A standalone league gets the condition, and a real OVR next to the base OVR (US-08.4, US-09.2).
- The slug list `.txt` gets a level on each line (US-10.5, US-08.7). Old files stay valid.

**Open question:** the place in League Detail, a "Teams" tab or a modal. It depends on how useful a "Teams" tab is for MVP3. It can wait for the build task of US-14.2.

**For the build tasks:**

- `SegmentedControl` exists. It shows text labels only. The level icons are Unicode characters (US-14.1). Check that the app fonts have them.
- The engine takes an OVR above 99 already (`applyHomeAdvantage`). The condition needs no change to the OVR weights (Task 5, settled).
- League Detail has no "Teams" tab today.
