# Task 196: refine epic 13, Season

**Status:** Done

## Goal

Turn the Season items of the MVP3 spec into refined stories in `docs/user-stories/mvp3/13-season.md`. The stories cover C1 to C5 (Must) and C6 (Should). Claude asks the user questions, and writes the stories from the answers. Claude does not propose how a feature works (Task 195).

## Acceptance criteria

- [x] Each Must and Should item of epic 13 has one or more stories, with acceptance criteria, in the story template of `docs/user-stories/README.md`.
- [x] Each story comes from the user's answers. A gap that the user leaves open goes to the open questions of `PROGRESS.md`.
- [x] The user agrees each story (status Agreed).
- [x] A spec line changes only with the user's approval.

## Notes

- **2026-11-11:** Inputs. `docs/scorinator-mvp3.md` §1 Season. `PERSISTENCE.md` §2a: a Season sits in one Instance Wrapper, which holds the Team Instances. Each League in the Season keeps its own UUID. Future features §3 (a standalone league into a Season). Today a league is one wrapper with its own Instances, and the dashboard lists leagues only.
- **2026-11-11:** The user's answers, round 1.
  - A Season needs a name and a year. It is a group of leagues and teams.
  - Teams can join the Season while it goes on, but not a league that is running. Leagues can be created at any time.
  - A team imported into the Season gets its OVR rolled for the whole Season.
  - A finished Season can be read: all its leagues, teams, matches, and the rest.
  - Seasons have their own menu.
  - A league in a Season is a full league, with all its phases.
  - "At the same time" means in parallel: two leagues, even with shared teams, can be simulated while the other is not complete. To refine further later.
  - A league is created inside a Season. A team added to the league is added to the Season too. A team only in the Season rests until a Season league calls it.
  - One OVR in two leagues: the team condition (epic 14) brings a "base OVR" (the rolled one) and a "condition" that changes it into the "real OVR". The condition is for each team in each league.
  - Playoffs are free: the user picks the two teams from the Season roster, and picks the format. The Season view has a "Playoffs" tab. The name tells one playoff from another.
  - A standalone league that moves into a Season keeps its results. The OVR and the team state come from the Season.
- **2026-11-11:** The user's answers, round 2.
  - The user finishes a Season, and can open it again. Both are manual actions.
  - The name and the year are unique together.
  - A league runs from its creation.
  - The wizard of a Season league lists both the Season teams and the other Blueprints. The Season teams come first, with a highlight. The other teams show with less opacity and a short status text.
  - The user can change a team's OVR and Tier in the Season, as in the MVP2 league wizard.
  - A team cannot leave the Season.
  - The Season view: the user still thinks about how the leagues show. A "Resume" tab can list the league winners, and maybe the teams of the other zones. A "Statistics" tab, for the Season and for one league, can come in MVP4.
  - A playoff has the same format options as a bracket tie. The user picks the home team.
  - The main flow for a standalone league: the Season view imports it. Other flows, such as an export from the league view into a Season, can come later.
  - A team of the imported league that is not in the Season yet keeps the OVR of the league. A team that is in the Season takes the Season OVR (round 1).
- **2026-11-11:** The user's answers, round 3.
  - The Season view has a "Teams" tab, where teams join the Season.
  - The user can change a Season team's OVR or Tier while it plays a running league. The change does not affect the running league. So each league keeps its own OVR: the Season team is a middle layer between the Blueprint and the league team. This keeps the logic and the structure of a single league.
  - A standalone league that the Season imports should maybe keep its own OVR over the Season's, or offer an option. To refine: open question.
  - The leagues of a Season show only inside the Season.
  - The import copies the league. A later dialog can ask for a copy or a move.
  - The user can rename and delete a Season.
  - A Season has its own file, on the File screen.
  - The Season view layout: an open question. "Resume" is enough as the second tab for now.
  - The "Statistics" tab: parked as future features §27.
- **2026-11-11:** A spec conflict. `docs/scorinator-mvp3.md` §1 says one Instance for each Blueprint, shared by every league of the wrapper (`PERSISTENCE.md` §2a). The round 3 answer gives each league its own OVR, copied from the Season team at creation. The spec line and `PERSISTENCE.md` §2a change only with the user's approval.
- **2026-11-11:** Stories written: US-13.1 to US-13.11, status Refined, in `docs/user-stories/mvp3/13-season.md`.
- **2026-11-11 (review):** The user parked the OVR for each league team (future features §28), and kept the original spec: one Season team for every league. So the spec and `PERSISTENCE.md` §2a do not change. This also settles the open question of an imported league: a team in the Season already takes the Season OVR. Answers: (1) the delete keeps the Blueprints, (2) a Season league opens in League Detail, with breadcrumbs back to the Season, (3) the leagues are independent, (4) a playoff name is unique in its Season, and a playoff team is its Season team, (5) the Season file needs more detail: questions sent.

- **2026-11-12:** The user asked about one Season file vs one Season folder in the database folder (storage, not export). Claude compared both. The user kept one wrapper file for each Season (`PERSISTENCE.md` §2a, unchanged): it is the more mature design, one atomic save keeps the roster and the leagues consistent, and all leagues share one roster. The user noted that a Season export is one zip either way, so a folder has no copy risk.

- **2026-11-12:** The user's answers, round 4.
  - (1) A Season export holds the Season, its leagues, its roster, and its playoffs. The Blueprints go in a separate file, as a layer of redundancy, because they are out of the Season scope.
  - (2) The Season export is one zip.
  - (3) Conflicts: the user asked for more insight first.
  - (4) The user asked whether a conflict is by UUID only, or also by name and year. An idea: add a number to the name, and park a rename at import as a future feature. To confirm.
  - (5) One Season for each export. A group of Seasons is a database export.
  - (6) No league export from a Season: not in the user's plans.
  - (7) The user can change the OVR or Tier of a Season team while a running league holds it. The change reaches every league of the Season. Example: role-play bonuses that a team gets during a league. This replaces the round 3 answer, which belonged to the parked OVR for each league (§28).
  - (8) The wizard "Edit" of a team in a Season league changes the Season team.
- **2026-11-12:** Claude checked round 4 against the specs. Found: (6) clashes with the League Detail export menu (US-10.1), because a Season league opens in League Detail (US-13.3). (8) clashes with two rules for each league: a unique team name (US-08.4) and a unique trigram (US-09.6). (7) means a re-scorinated match uses the new OVR (MVP1 §re-scorination). (5) means the database export and import must carry Seasons (US-10.4). Questions sent.

- **2026-11-12:** The user's answers, round 5, to settle the clashes.
  - (6) A Season league exports its two `.txt` files. The league `.json` export is for MVP4: parked as future features §29.
  - (8) The unique name and the unique trigram move from one league to the Season.
  - (7) The new OVR for a re-scorinated match is expected.
  - (5) A group of Seasons is a database export, or one export for each Season. Grouping Seasons can be an MVP4 idea.
  - The user noted that a league as a conflict of its own comes from US-13.10. Claude agreed, and added that a Season import can bring it too.
- **2026-11-12:** Stories updated: US-13.4, US-13.5, US-13.11.
- **2026-11-12:** The user's answers, round 6.
  - (1, 2) A Season league can share its UUID with a standalone league. The container tells them apart, and the two keep one identity. "Import as new" of a Season keeps the league UUIDs. Claude reads this as: only the Season can be a conflict.
  - (3) A clash of name and year gives "Liga (2)". Rename at import: parked as future features §30.
  - (4) Two Blueprints with one name: the team with the lower precedence gets its Location after the name, in brackets.
  - (5) The Season precedence for names and trigrams: the join order, then the OVR. The trigram pick runs at the first batch. A trigram can change while a league runs, also by a manual edit.
- **2026-11-12:** Claude checked round 6. Found: a spec change for the shared league UUID (`scorinator-mvp2.md` §1 Identity: one UUID, one entity). Gaps: two leagues with one UUID in one Season, an empty or shared Location, a new pick after the first one. Questions sent.

- **2026-11-12:** The user's answers, round 7.
  - (1) The user approved the spec line on the league UUID scope. A shared UUID means the two leagues are related. Added to `scorinator-mvp3.md` §1.
  - (2) A league imported twice into one Season is a conflict, but a corner case with no priority. Skip it if the conflict is complex. Claude found that the conflict dialog reads file imports only (`PendingFileImport`), so a database-to-Season import needs new wiring and tests. Claude chose the skip, and parked the conflict as future features §31. To confirm at review.
  - (3) A team with no Location gets "(2)". A shared Location is rare, and the user tells the teams apart by it.
  - (4) The trigram pick does not run again. The OVR precedence only resolves a clash, under the hood.

- **2026-11-12:** The user agreed US-13.1 to US-13.11, with the Claude choices of round 7.
- **2026-11-12:** The user's answers, round 8, on the open question of 2026-11-11.
  - US-13.3: the Season view lists its leagues as the leagues dashboard does. A new view is for later: parked as future features §32.
  - US-13.8: the Resume tab also lists the teams of the other zones. The league winner has a highlight. The layout is for the build task.

## Report

**Delivered:** 11 Agreed stories in `docs/user-stories/mvp3/13-season.md`, US-13.1 to US-13.11. They cover C1 to C5 (Must) and C6 (Should), from eight rounds of answers.

**Spec changes, with the user's approval:**

- `scorinator-mvp3.md` §1: the league UUID scope. A league UUID is unique in its container, the standalone leagues or one Season (round 7).
- `PERSISTENCE.md` §2a does not change. A Season stays one wrapper file, with one Season team for every league (review, and 2026-11-12).

**Parked in `scorinator-future-features.md`:** §27 a Statistics tab, §28 an OVR for each league team, §29 the league `.json` export from a Season, §30 a rename at import, §31 a conflict for a league imported twice, §32 a new view for Season leagues.

**Changes to MVP2 rules, for Season teams and leagues only:**

- A name and a trigram are unique in the Season, not in one league (US-08.4, US-09.6).
- A trigram can change while a league runs (US-09.6 fixes it at "Create league").
- One Instance for every league of the Season (US-09.2 has one for each league).
- A Season league exports only its two `.txt` files (US-10.1).
- The database export and import carry the Season wrappers (US-10.4).

**Open questions:** none left for epic 13. The open question of 2026-11-11 on the Season view is closed (round 8), and removed from `PROGRESS.md`.

**For the build tasks:**

- The League Detail route needs the Season UUID for a Season league, because two containers can share one league UUID (US-11.1 routes by the league UUID).
- The Season zip and the database zip both use `.zip`. Each import dialog must tell them apart, as US-10.3 does for the JSON files.
- The conflict dialog reads file imports only (`PendingFileImport`). This is why US-13.10 skips a second import.
- The layout of the Resume tab is open, for the build task of US-13.8.
