# Epic 14: Team condition

Source: [`docs/scorinator-mvp3.md`](/docs/scorinator-mvp3.md) §0 Scope, §1 Team condition. Refined in [Task 197](/docs/tasks/197-refine-team-condition.md), from the user's answers in three rounds (2026-11-12). The user agreed all stories on 2026-11-12.

Items: C10 (Must), from [Task 195](/docs/tasks/195-mvp3-scope.md).

**Terms used in this file:**

- **Base OVR:** the OVR of a team in a league: the OVR of the Instance, or of the Season team (US-13.4).
- **Level:** one of five condition levels: -2, -1, 0, +1, +2.
- **Amount:** the number of OVR points that a level adds or takes away, rolled once.
- **Real OVR:** the base OVR plus the amount. A match uses the real OVR.

A default condition for a Season is parked (`scorinator-future-features.md` §33).

---

### US-14.1: the condition levels

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Team condition

As a user, I want to give a team a condition level, so that a team in good form plays above its OVR, and a team in a crisis plays below it.

**Acceptance criteria:**

- [ ] A condition has five levels: -2, -1, 0, +1, +2. The default is 0.
- [ ] Each level has a range for its amount:

  | Level | Amount |
  |---|---|
  | +2 | +5 to +10 |
  | +1 | +1 to +5 |
  | 0 | 0 |
  | -1 | -1 to -5 |
  | -2 | -5 to -10 |

- [ ] The app rolls the amount once, when the user sets the level. The roll uses the injected RNG of the engine (`ENGINE.md`).
- [ ] The level and the amount stay until the user changes the level. A condition does not end by itself.
- [ ] The real OVR is the base OVR plus the amount. A match uses the real OVR. The home advantage applies to the real OVR (MVP1 spec §1).
- [ ] The real OVR can go out of the Tier range, also above 99 or below 30. The Tier does not change.
- [ ] A base OVR change keeps the amount. The real OVR is the new base OVR plus the same amount (US-13.4).
- [ ] A switch to another level rolls a new amount, also a switch back to an earlier level.
- [ ] The user picks the level with a segmented control (`design-system/`, `SegmentedControl`).
- [ ] Each level has an icon:

  | Level | Icon | Character |
  |---|---|---|
  | +2 | an arrow up, at 90° | `↑` U+2191 |
  | +1 | an arrow up, at 45°, to the top right | `↗` U+2197 |
  | 0 | a dash | `–` U+2013 |
  | -1 | an arrow down, at 45°, to the bottom right | `↘` U+2198 |
  | -2 | an arrow down, at 90° | `↓` U+2193 |

- [ ] The icons are these Unicode characters, not an icon library.
- [ ] The roll is one pure function in `engine/`, with tests: each range, both ends included, and the same result for the same RNG.

**Out of scope:** a default condition for a Season (§33).

**Notes:** answers of rounds 1 and 2. The value 5 is in the ranges of +1 and +2, and of -1 and -2: the user wants it so. The user agreed the home advantage on the real OVR, and a new roll on a switch back (round 3). The user gave the icons on 2026-11-12. The user chose the Unicode characters. The app has no icon library, and `SegmentedControl` shows text labels only.

---

### US-14.2: set the condition of a league team

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Team condition

As a user, I want to set the condition of a team in one league, so that its form in that league changes, and its other leagues do not.

**Acceptance criteria:**

- [ ] Each team in a league has its own condition. In a Season, one Season team can have a different condition in each league.
- [ ] A standalone league and a Season league both have the condition.
- [ ] The Teams step of the wizard sets the condition of each team.
- [ ] The user can change the condition at any time while the league runs.
- [ ] The standings, the fixtures, and the bracket do not show the condition directly.
- [ ] League Detail shows and changes the condition in one of two places: a new "Teams" tab, or a modal that opens from a click on a team name in the standings, the fixtures, or a tie card. This applies to a standalone league and a Season league.
- [ ] A played match keeps its score. A match scorinated or re-scorinated after the change uses the new real OVR.

**Notes:** answers of rounds 1 to 3. Open: which of the two places. It depends on how useful a new "Teams" tab is for MVP3. The user left it open for the build task. The choice can wait for the build task of this story (`PROGRESS.md`, Open questions, 2026-11-12). League Detail has no "Teams" tab today: Standings, Fixtures, Chart, Bracket, Seed List.

---

### US-14.3: the condition of a playoff team

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Team condition, §1 Season (C5)

As a user, I want to set the condition of each team in a Season playoff, so that a playoff can show the form of the two teams.

**Acceptance criteria:**

- [ ] The playoff wizard sets the condition of each of the two teams (US-13.7).
- [ ] The condition of a playoff team is for that playoff only. It does not come from a league of the Season.
- [ ] The playoff uses the real OVR of each team.

**Notes:** answer of round 1. This changes US-13.7: a playoff team plays with the Season base OVR and Tier, plus its condition. US-13.7 has the edit since 2026-11-12.

---

### US-14.4: the condition in the slug list

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Team condition

As a user, I want the slug list to carry the condition level of each team, so that a later league imports the team with its condition.

**Acceptance criteria:**

- [ ] The slug list stays a `.txt` file. Each line has the slug, a space, and the level, for example `north-fc +1`.
- [ ] The export (US-10.5) writes the level of each team.
- [ ] The import (US-08.7) sets the level of each team, and rolls a new amount.
- [ ] A line with no level imports with level 0. An old slug list file stays valid.
- [ ] A line with a level that is not valid shows in an alert, as a slug that is not found does. The team imports with level 0.
- [ ] The parse and the write are pure functions in `adapters/txt`, with tests.

**Notes:** answers of rounds 1 and 2. The file carries the level, not the amount. The `+` sign on a positive level, the level written also for 0, and the alert for a level that is not valid are Claude choices. The user agreed them on 2026-11-12.
