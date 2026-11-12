# Epic 13: Season

Source: [`docs/scorinator-mvp3.md`](/docs/scorinator-mvp3.md) §0 Scope, §1 Season. Refined in [Task 196](/docs/tasks/196-refine-season.md), from the user's answers in eight rounds (2026-11-11 and 2026-11-12). The user agreed all stories on 2026-11-12.

Items: C1 to C5 (Must), C6 (Should), from [Task 195](/docs/tasks/195-mvp3-scope.md).

**Terms used in this file:**

- **Blueprint:** a reusable team in the Teams module (US-09.1).
- **Season team:** the one Instance of a Blueprint in a Season, with one base OVR and one Tier. Every league of the Season uses it (`docs/scorinator-mvp3.md` §1, `PERSISTENCE.md` §2a).
- **Season roster:** all the Season teams of one Season.
- **Running league:** a league runs from its creation.

A league OVR for each team, apart from the Season team, is parked (`scorinator-future-features.md` §28).

---

### US-13.1: create a Season

**Status:** Agreed
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

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to rename and delete a Season, so that I can fix a name or remove a Season that I do not need.

**Acceptance criteria:**

- [ ] The user renames a Season: the name, the year, or both. The pair stays unique (US-13.1).
- [ ] The user deletes a Season, after a confirm. The delete removes its leagues, its Season roster, and its playoffs. The Blueprints stay.

**Notes:** answer of round 3, and the review (the delete keeps the Blueprints). The confirm follows the MVP2 confirm pattern (Task 112).

---

### US-13.3: the Season view

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want one view for a Season, so that I can see and use its leagues, teams, and playoffs in one place.

**Acceptance criteria:**

- [ ] A Season opens from the Seasons list.
- [ ] The view has a "Teams" tab (US-13.4), a "Playoffs" tab (US-13.7), and a "Resume" tab (US-13.8).
- [ ] The view lists the leagues of the Season in the same way as the leagues dashboard: one card for each league (US-08.8, Task 76 d). A league opens in the MVP2 League Detail. Its breadcrumbs start at the Season, so the user can go back to the Season view.
- [ ] The leagues of a Season show only inside the Season. The leagues dashboard does not list them.

**Out of scope:** a "Statistics" tab for the Season and for one league (`scorinator-future-features.md` §27, MVP4). A new view for the leagues of a Season (§32).

**Notes:** round 8 settled the league list: the dashboard cards.

---

### US-13.4: the Season roster

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to add teams to a Season, so that they are ready for its leagues and playoffs.

**Acceptance criteria:**

- [ ] The "Teams" tab lists the Season roster.
- [ ] The user adds Blueprints to the Season roster from the "Teams" tab, at any time while the Season is not finished.
- [ ] A team that joins the Season gets its OVR rolled once, for the whole Season. This is its base OVR.
- [ ] The user can change the OVR and the Tier of a Season team, with the rules of the MVP2 wizard: an OVR inside the Tier range, and a new roll on a Tier change (US-08.4, Task 81).
- [ ] Every league of the Season uses the one Season team: the same base OVR and Tier.
- [ ] The user can change the OVR or the Tier of a Season team while a running league holds it. The change reaches every league of the Season.
- [ ] A match played before the change keeps its score. A match scorinated or re-scorinated after the change uses the new OVR (MVP1 re-scorination).
- [ ] Two Season teams cannot have the same name. The rule is for the Season, not for one league (US-08.4 has it for one league).
- [ ] A trigram is unique in the Season, not in one league (US-09.6 has it for one league).
- [ ] The Season order of precedence, for names and trigrams: the team that joined first, then the higher OVR, then the fixed lots of Task 78. The OVR order also covers the Tier, because the Tier ranges do not overlap.
- [ ] A team that joins with the name of a Season team, and has a lower precedence, gets its Location after the name, in brackets. For example "Ashfield Rovers (Northtown)".
- [ ] A team with no Location gets a number in brackets: "Ashfield Rovers (2)". If the new name also clashes, the team gets the first free number.
- [ ] The trigram pick runs when the first batch of teams joins the Season. A team that joins later picks from the free trigrams.
- [ ] The pick does not run again. A join, an OVR change, or a Tier change does not change a picked trigram. Only a manual edit changes it.
- [ ] A trigram can change while a league runs. The user edits it as the name, the OVR, or the colour. Every screen shows the new trigram, also for past matches.
- [ ] A team cannot leave the Season.
- [ ] A Season team that is in no league rests until a Season league takes it.

**Notes:** answers of rounds 1 to 4, and the review (the original spec: one Season team for all leagues). Round 4 settled the change during a running league, for example a role-play bonus during a league. The team condition, which changes the base OVR into the real OVR in each league, is epic 14. Round 5 settled the precedence, the Location after the name, and the trigram pick. Round 6 settled the empty Location and the single pick. The precedence only resolves a clash, under the hood.

---

### US-13.5: create a league in a Season

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to create a league inside a Season, so that the league uses the Season teams.

**Acceptance criteria:**

- [ ] The user creates a league from the Season view, at any time while the Season is not finished.
- [ ] A Season league is a full league: the MVP2 wizard, with every phase format.
- [ ] The Teams step lists the Season teams first, with a highlight. Then it lists the other Blueprints, with less opacity and a short text with their status.
- [ ] A Blueprint that is not in the Season joins the Season roster when the league is created, with its OVR rolled (US-13.4).
- [ ] Each team of the league is its Season team, with the Season base OVR and Tier.
- [ ] The wizard ✎ Edit changes the Season team. The change reaches every league of the Season. The drawer title says so.
- [ ] A league runs from its creation. No team joins a running league.

**Notes:** answers of rounds 1 to 4, and the review. Round 4: the Edit changes the Season team. The drawer title text is a Claude choice, to confirm.

---

### US-13.6: leagues that run in parallel

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Season (C2, C3)

As a user, I want to play the leagues of a Season in parallel, so that a league does not wait for another one to finish.

**Acceptance criteria:**

- [ ] The user plays any league of the Season while the other leagues are not complete.
- [ ] One Season team can be in more than one league at the same time, for example a league and a cup (C3).
- [ ] The leagues are independent. A result in one league never changes the results or the standings of another league.

**Notes:** answer of round 1: "two leagues, even with shared teams, can be simulated without one of them being completed". The user can refine "at the same time" further.

---

### US-13.7: Season playoffs

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Season (C5)

As a user, I want to play named one-off playoffs between two Season teams, so that the Season can have matches outside its leagues, such as a super cup.

**Acceptance criteria:**

- [ ] The "Playoffs" tab lists the playoffs of the Season, by name.
- [ ] The user creates a playoff: a name, two teams from the Season roster, the home team, and the format.
- [ ] A playoff name is unique in its Season.
- [ ] A playoff team plays as its Season team: the Season base OVR and Tier, plus its condition for that playoff (US-14.3).
- [ ] The format has the options of a bracket tie: one match or two legs, away goals, AET, and the tiebreak method (US-03.1, US-03.2, US-04.1).
- [ ] A playoff belongs to the Season, not to a league.
- [ ] The user plays the playoff, and the tab shows its result.

**Out of scope:** a link from a playoff to a league (later).

**Notes:** answers of rounds 1 and 2, and the review (a unique name, the Season team). The condition came from Task 197 (US-14.3), with the user's agreement on 2026-11-12.

---

### US-13.8: the Resume tab

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want a short resume of the Season, so that I can see its results at a glance.

**Acceptance criteria:**

- [ ] The "Resume" tab lists the winner of each league of the Season.
- [ ] For each league, the tab also lists the teams of the other zones (US-12.5).
- [ ] The winner of each league has a highlight.

**Notes:** round 8 settled the content. The layout is for the build task of this story.

---

### US-13.9: finish and reopen a Season

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to finish a Season and read it later, so that a past Season stays as it ended.

**Acceptance criteria:**

- [ ] The user finishes a Season with a manual action.
- [ ] A finished Season is read only: the user can read all its leagues, teams, matches, and playoffs, but cannot change them.
- [ ] The user can reopen a finished Season with a manual action.

**Notes:** answers of rounds 1 and 2.

---

### US-13.10: import a standalone league into a Season

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Season (C6, Should)

As a user, I want to import a standalone league into a Season, so that a league that I played on its own joins the Season.

**Acceptance criteria:**

- [ ] The Season view imports a standalone league.
- [ ] The import copies the league. The standalone league stays as it is.
- [ ] The copy keeps its results.
- [ ] The copy keeps the UUID of the standalone league. The two leagues share one identity, and the container tells them apart: the Season, or no Season (`scorinator-mvp3.md` §1, League UUID scope).
- [ ] A league that is in the Season already does not import again. The app skips it, with a message: "This league is already in the Season."
- [ ] A team of the league that is not in the Season joins the Season roster with the OVR that it has in the league.
- [ ] A team of the league that is in the Season already becomes its Season team, with the Season OVR.

**Out of scope:** an export from the league view into a Season, and a dialog that asks for a copy or a move (later). A conflict for a league that is in the Season already (`scorinator-future-features.md` §31).

**Notes:** answers of rounds 1 to 3. The review settled the open question of a team in the Season already: the original spec, one Season team, so the Season OVR.

---

### US-13.11: the Season file

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Season

As a user, I want to export and import a Season file, so that I can keep or move a whole Season.

**Acceptance criteria:**

- [ ] The File screen exports a Season to a file of its own, and imports it.
- [ ] The export is one `.zip`. It holds the Season, its leagues, its roster, and its playoffs.
- [ ] The zip also holds the Blueprints of the roster, in a separate file. They are a layer of redundancy, out of the Season scope. An import adds an unknown Blueprint and keeps a known one, as a league import does (US-10.3).
- [ ] One export holds one Season. To move a group of Seasons, the user exports the database, or each Season.
- [ ] The database export and import carry the Season wrappers too (US-10.4).
- [ ] The League Detail of a Season league keeps "Export results (.txt)" (US-10.6) and "Export slug list (.txt)" (US-10.5). It has no "Export league (.json)" (`scorinator-future-features.md` §29).
- [ ] "Export all leagues" (US-10.2) exports standalone leagues only.
- [ ] In a Season import, only the Season can be a conflict, with "Skip" or "Import as new" (US-11.2).
- [ ] "Import as new" gives the Season a fresh UUID. Its leagues keep their UUIDs.
- [ ] An imported Season with the name and year of a local Season gets a number after the name: "Liga (2)", or the first free number.

**Notes:** answers of rounds 3 and 4. The Season wrapper stays one file in the database folder (2026-11-12). A group of Seasons can be an MVP4 idea. Round 5: only the Season can be a conflict. "Import as new" of a Season gives the Season a fresh UUID, and its leagues keep their UUIDs (US-13.10). A clash of name and year adds a number to the name: "Liga (2)", then "Liga (3)". A rename at import is parked (`scorinator-future-features.md` §30).
