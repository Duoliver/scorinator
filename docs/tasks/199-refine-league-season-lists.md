# Task 199: refine epic 16, League and Season lists

**Status:** Done

## Goal

Turn the League and Season list items of the MVP3 spec into refined stories in `docs/user-stories/mvp3/16-league-season-lists.md`. The stories cover C21, C45, and C46 (Must), and C23 (Should). C22 (Could) gets stories only when the user asks. Claude asks the user questions, and writes the stories from the answers. Claude does not propose how a feature works (Task 195).

## Acceptance criteria

- [x] Each Must and Should item of epic 16 has one or more stories, with acceptance criteria, in the story template of `docs/user-stories/README.md`.
- [x] Each story comes from the user's answers. A gap that the user leaves open goes to the open questions of `PROGRESS.md`.
- [x] The user agrees each story (status Agreed).
- [x] A spec line changes only with the user's approval.

## Notes

- **2026-11-12:** Inputs. `docs/scorinator-mvp3.md` §1 League and Season lists. Future features §19 (the current phase on the card) and §20 (rename and delete a league, after a confirm, with the file removed at the next save). Task 195: C21, C45, C46, C23, C22. US-13.1 and US-13.2: the Season list, and the rename and delete of a Season. US-15.6 and US-15.8: the team search and pages.
- **2026-11-12:** Facts from the code and the MVP2 stories. A league name is not unique (US-11.2: "Import as new" keeps the name). The dashboard has no search. The card shows the phase plan, the team count, the home advantage, the points pill, and a progress badge such as "MD 6/6" (US-01.2). League Detail names the current phase in its header.

- **2026-11-12:** The user's answers, round 1.
  - (1) Rename and delete from the league card and from League Detail. If one place must go, the card stays.
  - (2) A league name is unique in its container. A standalone league and a Season league can share a name.
  - (3) A Season league has the rename and the delete. A deleted Season league leaves the Resume tab.
  - (4) A running league and a finished league have the same delete.
  - (5) The dashboard search matches the league name only, for now.
  - (6) The Season list search matches the name and the year.
  - (7) Pages for the dashboard and the Season list come later: parked as future features §40.
  - C22 and C23 come later. C23 is a Should item, so a move to later changes the spec ranks: asked for approval.
- **2026-11-12:** Stories written: US-16.1 to US-16.5, status Refined. Claude found: the unique name changes an MVP2 rule, and an MVP2 database can hold two leagues with one name. A finished Season is read only, so its leagues cannot be renamed or deleted (US-13.9).

- **2026-11-12:** The user's answers, round 2. (1) No MVP2 database holds two leagues with one name: the app is not public or shared yet. (2) The development starts with the Must items only. So C23 keeps its Should rank, and its refinement waits. No spec change. The user agreed US-16.1 to US-16.5, with the Claude choices.

## Report

**Delivered:** 5 Agreed stories in `docs/user-stories/mvp3/16-league-season-lists.md`, US-16.1 to US-16.5. They cover C21, C45, and C46 (Must), from two rounds of answers.

**Not refined:** C23 (Should) and C22 (Could). The development starts with the Must items. The first acceptance criterion of this task is met for the Must items only: C23 waits, by the user's choice.

**Spec changes:** none.

**Parked:** `scorinator-future-features.md` §40, pages for the leagues dashboard and the Season list.

**Changes to MVP2 rules:**

- A league name is unique in its container (US-11.2 kept the name on "Import as new"). An import clash gives "Liga (2)".
- A league can be renamed and deleted (future features §20, now delivered as US-16.2 and US-16.3).

**Open questions:** none for the Must items of epic 16.

**For the build tasks:**

- The wizard Details step sets the league name. It needs the container, to check the name.
- The delete of a standalone league removes its wrapper file at the next save. The save already writes the wrappers first and the manifest last (`PERSISTENCE.md` §2c).
