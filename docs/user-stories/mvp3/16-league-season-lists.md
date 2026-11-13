# Epic 16: League and Season lists

Source: [`docs/scorinator-mvp3.md`](/docs/scorinator-mvp3.md) §0 Scope, §1 League and Season lists. Refined in [Task 199](/docs/tasks/199-refine-league-season-lists.md), from the user's answers in two rounds (2026-11-12). The user agreed all stories on 2026-11-12.

Items: C21, C45, C46 (Must), from [Task 195](/docs/tasks/195-mvp3-scope.md). C23 (Should) and C22 (Could) have no stories yet. The development starts with the Must items, so their refinement waits (2026-11-12). C23 stays a Should item.

**Terms used in this file:**

- **Container:** the place a league belongs to: the standalone leagues, or one Season (`scorinator-mvp3.md` §1, League UUID scope).
- **League card:** the card of a league on the leagues dashboard, or in the Season view (US-13.3).

Parked: pages for the leagues dashboard and the Season list (`scorinator-future-features.md` §40).

---

### US-16.1: a unique league name

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 League and Season lists (C21)

As a user, I want each league name to be unique in its container, so that I can tell my leagues apart.

**Acceptance criteria:**

- [ ] Two leagues in one container cannot have the same name.
- [ ] A standalone league and a Season league can have the same name. Two leagues in two Seasons can have the same name.
- [ ] The wizard Details step shows the reason, and blocks "Next", for a name that a league in the same container has.
- [ ] The name check ignores case and the spaces at the two ends.
- [ ] An imported league with the name of a league in the same container gets a number after the name: "Liga (2)", as a Season does (US-13.11). This applies to a league file import (US-10.3), and to a standalone league import into a Season (US-13.10).

**Notes:** answer of round 1. This changes an MVP2 rule: league names were not unique, and "Import as new" kept the name (US-11.2). The case and space rule, the "Next" block, and the "(2)" rule are Claude choices. The user agreed them on 2026-11-12. No MVP2 database holds two leagues with one name: the app is not public or shared yet, so no data fix is needed.

---

### US-16.2: rename a league

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 League and Season lists (C21), `scorinator-future-features.md` §20

As a user, I want to rename a league, so that I can fix its name.

**Acceptance criteria:**

- [ ] The user renames a league from its league card, and from League Detail.
- [ ] The new name follows US-16.1.
- [ ] A standalone league and a Season league both have the rename.
- [ ] A rename keeps the league UUID (US-11.1).
- [ ] A league of a finished Season can be renamed too. A rename does not change a result (US-13.9). *(Changed on 2026-11-13, Task 210, by the user. It said: cannot be renamed.)*

**Notes:** answer of round 1. The user puts the league card first, if one place must go.

---

### US-16.3: delete a league

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 League and Season lists (C21), `scorinator-future-features.md` §20

As a user, I want to delete a league, so that I can remove a league that I do not need.

**Acceptance criteria:**

- [ ] The user deletes a league from its league card, and from League Detail, after a confirm.
- [ ] A running league and a finished league have the same delete.
- [ ] The delete of a standalone league removes its file and its manifest row at the next save (`PERSISTENCE.md`).
- [ ] The delete of a Season league removes the league from the Season. Its results leave the Resume tab (US-13.8).
- [ ] The Season teams of a deleted Season league stay in the Season roster (US-13.4).
- [ ] The delete of a league does not delete a league with the same UUID in another container (US-13.10).
- [ ] A league of a finished Season cannot be deleted, because the Season is read only (US-13.9).
- [ ] The Blueprints stay.

**Notes:** answer of round 1. The confirm follows the MVP2 confirm pattern (Task 112). The roster rule comes from US-13.4: a team cannot leave the Season.

---

### US-16.4: search the leagues dashboard

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 League and Season lists (C45)

As a user, I want to search my leagues, so that I find one league in a long list.

**Acceptance criteria:**

- [ ] The leagues dashboard has a search field.
- [ ] The search matches the league name. It ignores case.
- [ ] The dashboard shows only the leagues that match. An empty field shows all leagues.

**Out of scope:** pages (§40). A search in the Season view.

**Notes:** answer of round 1. "No search in the Season view" is a Claude choice. The user agreed it on 2026-11-12.

---

### US-16.5: search the Season list

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 League and Season lists (C46)

As a user, I want to search my Seasons, so that I find one Season in a long list.

**Acceptance criteria:**

- [ ] The Season list has a search field.
- [ ] The search matches the Season name and the year. It ignores case.
- [ ] The list shows only the Seasons that match. An empty field shows all Seasons.

**Out of scope:** pages (§40).

**Notes:** answer of round 1.
