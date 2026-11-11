# Epic 13: Season

Source: [`docs/scorinator-mvp3.md`](/docs/scorinator-mvp3.md) §0 Scope, §1 Season. Refined in [Task 196](/docs/tasks/196-refine-season.md), from the user's answers in three rounds (2026-11-11).

Items: C1 to C5 (Must), C6 (Should), from [Task 195](/docs/tasks/195-mvp3-scope.md).

**Terms used in this file:**

- **Blueprint:** a reusable team in the Teams module (US-09.1).
- **Season team:** the one Instance of a Blueprint in a Season, with one base OVR and one Tier. Every league of the Season uses it (`docs/scorinator-mvp3.md` §1, `PERSISTENCE.md` §2a).
- **Season roster:** all the Season teams of one Season.
- **Running league:** a league runs from its creation.

A league OVR for each team, apart from the Season team, is parked (`scorinator-future-features.md` §28).

---

### US-13.1: create a Season

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to create a Season with a name and a year, so that I can group leagues and teams.

**Acceptance criteria:**

- [ ] The app has a Seasons menu of its own, with a list of the Seasons.
- [ ] The user creates a Season with a name and a year. Both are required.
- [ ] Two Seasons cannot have the same name and year together.
- [ ] The database holds more than one Season (C4). Each Season has its own Season roster and its own leagues.
- [ ] A new Season has no leagues and no teams.

**Out of scope:** the Season search on the list (epic 16, C46).

**Notes:** answers of round 1 (name, year, own menu) and round 2 (unique name and year).

---

### US-13.2: rename and delete a Season

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to rename and delete a Season, so that I can fix a name or remove a Season that I do not need.

**Acceptance criteria:**

- [ ] The user renames a Season: the name, the year, or both. The pair stays unique (US-13.1).
- [ ] The user deletes a Season, after a confirm. The delete removes its leagues, its Season roster, and its playoffs. The Blueprints stay.

**Notes:** answer of round 3, and the review (the delete keeps the Blueprints). The confirm follows the MVP2 confirm pattern (Task 112).

---

### US-13.3: the Season view

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want one view for a Season, so that I can see and use its leagues, teams, and playoffs in one place.

**Acceptance criteria:**

- [ ] A Season opens from the Seasons list.
- [ ] The view has a "Teams" tab (US-13.4), a "Playoffs" tab (US-13.7), and a "Resume" tab (US-13.8).
- [ ] The view lists the leagues of the Season. A league opens in the MVP2 League Detail. Its breadcrumbs start at the Season, so the user can go back to the Season view.
- [ ] The leagues of a Season show only inside the Season. The leagues dashboard does not list them.

**Out of scope:** a "Statistics" tab for the Season and for one league (`scorinator-future-features.md` §27, MVP4).

**Notes:** open: how the leagues show in the Season view (`PROGRESS.md`, Open questions, 2026-11-11).

---

### US-13.4: the Season roster

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to add teams to a Season, so that they are ready for its leagues and playoffs.

**Acceptance criteria:**

- [ ] The "Teams" tab lists the Season roster.
- [ ] The user adds Blueprints to the Season roster from the "Teams" tab, at any time while the Season is not finished.
- [ ] A team that joins the Season gets its OVR rolled once, for the whole Season. This is its base OVR.
- [ ] The user can change the OVR and the Tier of a Season team, with the rules of the MVP2 wizard: an OVR inside the Tier range, and a new roll on a Tier change (US-08.4, Task 81).
- [ ] Every league of the Season uses the one Season team: the same base OVR and Tier.
- [ ] A team cannot leave the Season.
- [ ] A Season team that is in no league rests until a Season league takes it.

**Notes:** answers of rounds 1 to 3, and the review (the original spec: one Season team for all leagues). The team condition, which changes the base OVR into the real OVR in each league, is epic 14. Open: an OVR or Tier change while the team plays a running league (asked at review).

---

### US-13.5: create a league in a Season

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to create a league inside a Season, so that the league uses the Season teams.

**Acceptance criteria:**

- [ ] The user creates a league from the Season view, at any time while the Season is not finished.
- [ ] A Season league is a full league: the MVP2 wizard, with every phase format.
- [ ] The Teams step lists the Season teams first, with a highlight. Then it lists the other Blueprints, with less opacity and a short text with their status.
- [ ] A Blueprint that is not in the Season joins the Season roster when the league is created, with its OVR rolled (US-13.4).
- [ ] Each team of the league is its Season team, with the Season base OVR and Tier.
- [ ] A league runs from its creation. No team joins a running league.

**Notes:** answers of rounds 1 to 3, and the review. Open: the MVP2 wizard "Edit" of a team in a Season league (asked at review).

---

### US-13.6: leagues that run in parallel

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season (C2, C3)

As a user, I want to play the leagues of a Season in parallel, so that a league does not wait for another one to finish.

**Acceptance criteria:**

- [ ] The user plays any league of the Season while the other leagues are not complete.
- [ ] One Season team can be in more than one league at the same time, for example a league and a cup (C3).
- [ ] The leagues are independent. A result in one league never changes the results or the standings of another league.

**Notes:** answer of round 1: "two leagues, even with shared teams, can be simulated without one of them being completed". The user can refine "at the same time" further.

---

### US-13.7: Season playoffs

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season (C5)

As a user, I want to play named one-off playoffs between two Season teams, so that the Season can have matches outside its leagues, such as a super cup.

**Acceptance criteria:**

- [ ] The "Playoffs" tab lists the playoffs of the Season, by name.
- [ ] The user creates a playoff: a name, two teams from the Season roster, the home team, and the format.
- [ ] A playoff name is unique in its Season.
- [ ] A playoff team plays as its Season team: the Season base OVR and Tier.
- [ ] The format has the options of a bracket tie: one match or two legs, away goals, AET, and the tiebreak method (US-03.1, US-03.2, US-04.1).
- [ ] A playoff belongs to the Season, not to a league.
- [ ] The user plays the playoff, and the tab shows its result.

**Out of scope:** a link from a playoff to a league (later).

**Notes:** answers of rounds 1 and 2, and the review (a unique name, the Season team).

---

### US-13.8: the Resume tab

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want a short resume of the Season, so that I can see its results at a glance.

**Acceptance criteria:**

- [ ] The "Resume" tab lists the winner of each league of the Season.

**Notes:** open: the teams of the other zones in the resume (`PROGRESS.md`, Open questions, 2026-11-11).

---

### US-13.9: finish and reopen a Season

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to finish a Season and read it later, so that a past Season stays as it ended.

**Acceptance criteria:**

- [ ] The user finishes a Season with a manual action.
- [ ] A finished Season is read only: the user can read all its leagues, teams, matches, and playoffs, but cannot change them.
- [ ] The user can reopen a finished Season with a manual action.

**Notes:** answers of rounds 1 and 2.

---

### US-13.10: import a standalone league into a Season

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season (C6, Should)

As a user, I want to import a standalone league into a Season, so that a league that I played on its own joins the Season.

**Acceptance criteria:**

- [ ] The Season view imports a standalone league.
- [ ] The import copies the league. The standalone league stays as it is.
- [ ] The copy keeps its results.
- [ ] A team of the league that is not in the Season joins the Season roster with the OVR that it has in the league.
- [ ] A team of the league that is in the Season already becomes its Season team, with the Season OVR.

**Out of scope:** an export from the league view into a Season, and a dialog that asks for a copy or a move (later).

**Notes:** answers of rounds 1 to 3. The review settled the open question of a team in the Season already: the original spec, one Season team, so the Season OVR.

---

### US-13.11: the Season file

**Status:** Refined
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to export and import a Season file, so that I can keep or move a whole Season.

**Acceptance criteria:**

- [ ] The File screen exports a Season to a file of its own, and imports it.

**Notes:** answer of round 3. To ask at review: does a Season import follow the MVP2 import decisions of a league file (US-11.2)?
