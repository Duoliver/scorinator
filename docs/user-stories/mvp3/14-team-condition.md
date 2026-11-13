# Epic 14: Team condition

Source: [`docs/scorinator-mvp3.md`](/docs/scorinator-mvp3.md) §0 Scope, §1 Team condition. Refined in [Task 197](/docs/tasks/197-refine-team-condition.md), from the user's answers in three rounds (2026-11-12). The user agreed all stories on 2026-11-12. Revised in [Task 203](/docs/tasks/203-revise-team-condition.md) (2026-11-13): the amount is a fixed percentage, and League Detail has both places for the condition. The user agreed the revised stories on 2026-11-13.

Items: C10 (Must), from [Task 195](/docs/tasks/195-mvp3-scope.md).

**Terms used in this file:**

- **Base OVR:** the OVR of a team in a league: the OVR of the Instance, or of the Season team (US-13.4).
- **Level:** one of five condition levels: -2, -1, 0, +1, +2.
- **Amount:** the number of OVR points that a level adds or takes away: a fixed percentage of the base OVR (US-14.1).
- **Real OVR:** the base OVR plus the amount. A match uses the real OVR.

A default condition for a Season is parked (`scorinator-future-features.md` §33).

---

### US-14.1: the condition levels

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Team condition

As a user, I want to give a team a condition level, so that a team in good form plays above its OVR, and a team in a crisis plays below it.

**Acceptance criteria:**

- [ ] A condition has five levels: -2, -1, 0, +1, +2. The default is 0.
- [ ] Each level has a fixed percentage of the base OVR, and a rounding:

  | Level | Amount | Rounding |
  |---|---|---|
  | +2 | +20% of the base OVR | Up |
  | +1 | +10% of the base OVR | Up |
  | 0 | 0 | None |
  | -1 | -10% of the base OVR | Down |
  | -2 | -20% of the base OVR | Down |

- [ ] The real OVR is the base OVR plus the amount, with the rounding of the level. For example, a base OVR of 35 at +1 gives 38.5, so the real OVR is 39. At -1 it gives 31.5, so the real OVR is 31.
- [ ] The amount has no random part. The same level and the same base OVR always give the same real OVR.
- [ ] The level stays until the user changes it. A condition does not end by itself.
- [ ] A match uses the real OVR. The home advantage applies to the real OVR (MVP1 spec §1).
- [ ] The real OVR can go out of the Tier range, also above 99 or below 30. The Tier does not change.
- [ ] A base OVR change also changes the amount. The app calculates the real OVR again from the new base OVR (US-13.4).
- [ ] The user picks the level with a segmented control (`design-system/`, `SegmentedControl`).
- [ ] The control shows the label "Crisis" at the -2 end, and the label "Peak" at the +2 end.
- [ ] Each level has an icon:

  | Level | Icon | Character |
  |---|---|---|
  | +2 | an arrow up, at 90° | `↑` U+2191 |
  | +1 | an arrow up, at 45°, to the top right | `↗` U+2197 |
  | 0 | a dash | `–` U+2013 |
  | -1 | an arrow down, at 45°, to the bottom right | `↘` U+2198 |
  | -2 | an arrow down, at 90° | `↓` U+2193 |

- [ ] The control shows the icons, not the numbers.
- [ ] The icons are these Unicode characters, not an icon library.
- [ ] The real OVR is one pure function in `engine/`, with tests: each level, the rounding of each level, and a base OVR at each end of each Tier range. The function takes no RNG.

**Out of scope:** a default condition for a Season (§33).

**Notes:** Task 197 gave each level a random range, rolled once. Task 203 changed it to a fixed percentage, from the notes of the user of 2026-11-13. A stronger team gets a larger amount, and the user accepts that. With no roll, a switch to another level and back gives the same real OVR. The "Crisis" and "Peak" labels come from the two sketches in `docs/14-condition-sketches-and-drafts/`. For the build task: use integer arithmetic. In floating point, 50 × 1.1 gives 55.00000000000001, and a round up gives 56, not 55.

---

### US-14.2: set the condition of a league team

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Team condition

As a user, I want to set the condition of a team in one league, so that its form in that league changes, and its other leagues do not.

**Acceptance criteria:**

- [ ] Each team in a league has its own condition. In a Season, one Season team can have a different condition in each league.
- [ ] A standalone league and a Season league both have the condition.
- [ ] The Teams step of the wizard sets the condition of each team. Each team row shows the icon of its level. A click on the icon opens an overlay with the control (US-14.1).
- [ ] The user can change the condition at any time while the league runs. After the league ends, the user cannot change it.
- [ ] The standings, the fixtures, and the bracket do not show the condition directly.
- [ ] No screen shows the real OVR.
- [ ] League Detail has a new "Teams" tab. It lists the teams of the league, in a standalone league and in a Season league.
- [ ] Each row of the "Teams" tab shows the team, the trigram, the Location, the base Tier and OVR, and the control. The base Tier and OVR are read only.
- [ ] A level change in the "Teams" tab applies at once, with no "Save" button. Like any other edit, it is an unsaved change of the database (MVP2).
- [ ] A click on a team name in League Detail opens the team modal. The places: the standings, the group cards, the fixtures, the tie cards, the Seed List, and the Chart legend.
- [ ] The team modal shows the items of a "Teams" tab row. The base Tier and OVR are read only.
- [ ] The team modal has "Cancel" and "Save". "Save" applies the new level and closes the modal.
- [ ] "Cancel", the X, and Escape close the modal and drop the change. If the user changed the level, the status line shows "Operation cancelled".
- [ ] A click on a team name in the Season "Teams" tab opens the team modal with no control. A Season team can be in more than one league.
- [ ] Could: a click on a team name in the Season "Resume" tab opens the team modal, with the control for the league of that row. The build task decides.
- [ ] A played match keeps its score. A match scorinated or re-scorinated after the change uses the new real OVR.

**Notes:** Task 197 left the place open: a "Teams" tab or a modal. Task 203 (2026-11-13) gave both, from the notes and the sketches of the user in `docs/14-condition-sketches-and-drafts/`. The modal sketch is a rough idea only. The place of the wizard overlay is for the build task: above or below the current condition, relative to the row or to the condition. The "Teams" tab and the modal show no real OVR, for now. League Detail has these tabs today: Standings, Fixtures, Chart, Bracket, Seed List.

---

### US-14.3: the condition of a playoff team

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Team condition, §1 Season (C5)

As a user, I want to set the condition of each team in a Season playoff, so that a playoff can show the form of the two teams.

**Acceptance criteria:**

- [ ] The playoff wizard sets the condition of each of the two teams (US-13.7).
- [ ] The condition of a playoff team is for that playoff only. It does not come from a league of the Season.
- [ ] The playoff uses the real OVR of each team, with the percentages of US-14.1.

**Notes:** answer of round 1. This changes US-13.7: a playoff team plays with the Season base OVR and Tier, plus its condition. US-13.7 has the edit since 2026-11-12.

---

### US-14.4: the condition in the slug list

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Team condition

As a user, I want the slug list to carry the condition level of each team, so that a later league imports the team with its condition.

**Acceptance criteria:**

- [ ] The slug list stays a `.txt` file. Each line has the slug, a space, and the level, for example `north-fc +1`.
- [ ] The export (US-10.5) writes the level of each team.
- [ ] The import (US-08.7) sets the level of each team. The real OVR follows US-14.1.
- [ ] A line with no level imports with level 0. An old slug list file stays valid.
- [ ] A line with a level that is not valid shows in an alert, as a slug that is not found does. The team imports with level 0.
- [ ] The parse and the write are pure functions in `adapters/txt`, with tests.

**Notes:** answers of rounds 1 and 2. The file carries the level, not the amount. The `+` sign on a positive level, the level written also for 0, and the alert for a level that is not valid are Claude choices. The user agreed them on 2026-11-12.
