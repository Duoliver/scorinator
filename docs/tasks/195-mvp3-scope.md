# Task 195: define the MVP3 scope

**Status:** Done

## Goal

Agree what MVP3 builds. The candidates come from five sources. The user marks each one: in MVP3, later, or dropped. The agreed scope then goes into `docs/scorinator-mvp3.md`, with one refinement task for each epic, as MVP2 sprint 0 did.

## Acceptance criteria

- [x] One table lists every candidate, with its source and its links to other rows.
- [x] The user ranks each row by priority, or discards it.
- [x] `docs/scorinator-mvp3.md` holds the agreed scope. A "Later" row goes to `scorinator-future-features.md`, if it is not there yet.
- [x] The status board gets one refinement task for each MVP3 epic.
- [x] The scope line of `PROGRESS.md` changes only when the user approves MVP3 for implementation.
- [x] The user reviews the spec and the board.

## Candidates

Sources: `docs/scorinator-mvp3.md` (spec), `docs/unplanned-features-draft.md` (draft), `PROGRESS.md` open questions (OQ), `HUMAN.md`, and `docs/scorinator-future-features.md` (FF §N).

### Scope

The user ranked each row on 2026-11-11: Must, Should, Could, or Later (MSCL). A Later row is not in MVP3.

| # | Candidate | Group | Source | Note |
|---|---|---|---|---|
| **Must** | | | | |
| C1 | Season: a group of leagues that share team Instances, one OVR and Tier for each team | Season and teams | spec | The core of MVP3. The Instance Wrapper already plans for it (`PERSISTENCE.md` §2a). |
| C2 | The leagues of a Season play at the same time | Season and teams | draft | Part of C1? |
| C3 | A team in more than one league at once, for example a league and a cup | Season and teams | spec | Needs C1. |
| C4 | More than one Season in one database | Season and teams | spec | Needs C1. |
| C5 | Season playoffs: named single matches that belong to the Season, not to a league | Season and teams | draft | The user's "solo matches". A link to a league can come later. |
| C10 | Team condition: an input that buffs or nerfs a team for the Season, with no change to its Tier | OVR and engine | OQ 2026-10-29 (1) | The ranked slug list export carries it, so a later league imports the team with its condition. |
| C15 | The Location label stays a label, because City is out | Team identity | OQ 2026-10-28 | Closes the open question. |
| C21 | Rename and delete a league | League setup and league screens | FF §20 |  |
| C36 | Blueprint collections | Settings, data, and look | FF §21, HUMAN.md |  |
| C44 | Search the Blueprints on the Teams screen | Search | user, 2026-11-11 | No list screen has a search today. |
| C45 | Search the leagues on the leagues dashboard | Search | user, 2026-11-11 |  |
| C46 | Search the Seasons on their list screen | Search | user, 2026-11-11 | Needs C1. |
| **Should** | | | | |
| C6 | Move a standalone league into a Season | Season and teams | FF §3 | Needs C1. Open: does the OVR carry over? |
| C7 | Custom team colour: hex field, RGB sliders, live preview | Team colour | spec | Needs a `Slider` primitive. Its design is open (spec §3). |
| C16 | Debug mode: `[S \| 93]` beside each name, and the home and away count in single duels | Team identity | draft, FF §8 |  |
| C19 | The unsaved changes dialog opens in the screen corner the first time | League setup and league screens | HUMAN.md | A bug. |
| C23 | The current phase on the league card | League setup and league screens | FF §19 |  |
| C25 | A qualifiers list for a round-robin or Groups phase | League setup and league screens | FF §10 |  |
| C27 | Second-leg host toggle | Brackets | FF §6 |  |
| C29 | Choose the bracket seeding before it starts | Brackets | FF §23 |  |
| **Could** | | | | |
| C11 | Push the Instances of a league to the database: a new Blueprint, or an overwrite | OVR and engine | OQ 2026-10-29 (3) | Near C12. |
| C12 | Restore a deleted Blueprint from a league | OVR and engine | FF §11 | Near C11. |
| C17 | An empty state for the Review step of the wizard | League setup and league screens | HUMAN.md |  |
| C22 | Custom phase names | League setup and league screens | FF §7 |  |
| C43 | The plural in `Imported 1 team.` | Small technical items | OQ 2026-10-19 | `formatTeamCount` lives in `features/`. |
| **Later** | | | | |
| C28 | The score before AET on the tie card | Brackets | FF §22 |  |
| C32 | Seeded group draw from the phase before | Groups and standings | FF §18 | C35, its settings default, is discarded. |

### Discarded

The user discarded these rows on 2026-11-11. They are not in MVP3. A row from `scorinator-future-features.md` stays parked there.

| # | Candidate | Source | Reason |
|---|---|---|---|
| C8 | Crest generator from the team colours | spec |  |
| C9 | Custom Tier-OVR table: new top and bottom Tiers, Tiers that overlap | draft |  |
| C13 | Fewer extreme scores in a big OVR gap | FF §5 | Not what the user meant (2026-11-11). |
| C14 | Short team name, with the Location in parentheses on a clash | OQ 2026-11-02 |  |
| C20 | Edit the team list after the league starts | FF §1 |  |
| C24 | Scorinate a match of a locked phase again | FF §9 |  |
| C30 | Titles for the tie cards of the earlier rounds | FF §24 |  |
| C34 | Points mode for the standings chart | FF §15 |  |
| C37 | Import MVP1 files | FF §12 |  |
| C38 | Toasts for short messages | HUMAN.md |  |
| C39 | A better File screen | HUMAN.md |  |
| C40 | A review of the design fonts | HUMAN.md | Claude Design material, not app work. |
| C41 | Colour distance test for the palette | FF §13 |  |
| C42 | A tooltip hint that follows the pointer | FF §25 |  |
| C18 | Away goals with AET and the tiebreak method | HUMAN.md | Not a gap: the rules stack already (Task 135). |
| C26 | Venue choice for a replay | FF §4 | A replay stays at a neutral venue in MVP3. |
| C31 | A shorter swap menu | FF §17 |  |
| C33 | Last 5 matches in the group cards | FF §14 | Needs refinement for MVP4. User idea: a new window or a modal with the full group tables. |
| C35 | App settings: short or full name, group fit warning or error, seeded draw default | FF §16 |  |

**Out, by the user (2026-11-11):** locations (Country, Region, City), location tournaments, and league tier links (promotion and relegation). Region adjacency was out already (US-05.1). **Not a candidate:** autosave (FF §2), which `CLAUDE.md` keeps out until the user scopes it. **Open, not a feature:** the user's thought about a drop of MVP4 (OQ 2026-10-29 (2)).

## Notes

- **2026-11-11:** Task created by User. From `docs/scorinator-mvp3.md`, MVP3 keeps only Season and the custom team colour. "The empty state for 3 teams" is an empty state for the Review step of the wizard. The away goals item asks if away goals can stack with AET, penalties, or another tiebreak, and if that is a gap.
- **2026-11-11:** Away goals, from the code. `playTie` (Task 135) plays a level two-legged tie in this order: away goals, then AET, then the method. AET goals never count as away goals. `BracketSettings` shows "Away goals rule" only for a two-legged tie. So the rules stack already. The wizard does not say the order.

- **2026-11-11:** The user discarded 14 rows: C8, C9, C13, C14, C20, C24, C30, C34, C37 to C42. C13 was not what the user meant. C40 is Claude Design material. They moved to the Discarded table.
- **2026-11-11:** The user's answers on the two discarded rows. C13: future features §5 is removed. Its study stays in the git history. The numbers of the other sections stay as they are, so the links to them still work. C14: the short team name leaves the open questions of `PROGRESS.md`, and becomes future features §26. §16 now points to §26.
- **2026-11-11:** The user discarded 5 more rows: C18, C26, C31, C33, C35, with the reasons in the Discarded table. The user added three rows: a search on the Blueprint, league, and Season list screens (C44 to C46).
- **2026-11-11:** The user ranked 10 rows as Must: C1 to C5, C10, C36, C44 to C46. The other 17 rows wait for a rank.
- **2026-11-11:** The user ranked the other 17 rows. Must: C15, C21. Should: C6, C7, C16, C19, C23, C25, C27, C29. Could: C11, C12, C17, C22, C43. Later: C28, C32. One Scope table holds all 27 rows, by rank.
- **2026-11-11:** The user's answers on the epics. C5 goes to the Season epic. The "solo matches" are Season playoffs: single matches that belong to the Season, not to a league, and that can have a name. A link to a league can come later. C10 is the team "condition": an input that buffs or nerfs a team for the Season, with no direct change to its Tier. The ranked slug list export carries it, so a later league can import the team with its condition. MVP3 can end with the Must rows only, but the refinement covers the Must and the Should rows at least.
- **2026-11-11:** The epics, after the user's answers. E1 Season: C1 to C5 (M), C6 (S). E2 Team condition: C10 (M). E3 Teams module: C36, C44 (M), C7 (S), C11, C12 (C). E4 League and Season lists: C21, C45, C46 (M), C23 (S), C22 (C). E5 Brackets and phases: C25, C27, C29 (S). E6 Debug mode: C16 (S). E7 Fixes and polish: C19 (S), C17, C43 (C). C15 needs no build. C28 and C32 are Later.
- **2026-11-11:** The user agreed six choices for step 3. (1) A full rewrite of `docs/scorinator-mvp3.md`. (2) It keeps the Season rules that still hold. (3) Seven refinement tasks, for the Must and the Should rows. (4) Epic 13 (Season) first. (5) C15 closes now. (6) The scope line and the MVP3 notes of `CLAUDE.md` stay until MVP3 is approved. The user added: in a refinement, Claude asks questions, and does not propose how a feature works.
- **2026-11-11:** The epic numbers are 13 to 19, not 1 to 7. MVP2 used epics 01 to 12, and a story ID is never reused (`docs/user-stories/README.md`).

## Report

- **What was built:** the candidate tables (Scope by rank, Discarded), a rewritten `docs/scorinator-mvp3.md` with 7 epics (13 to 19), and Tasks 196 to 202 on the board. Future features: §5 removed, §26 (short team name) added, a note in §14. The Location label question is closed.
- **Test approach:** no code. Every absolute doc link resolves.
- **Decisions made:** the user's marks and ranks, and the six choices for step 3.
- **What is left, what is next:** Task 196 refines the Season epic, by questions to the user. `CLAUDE.md` still names City as MVP3 scope, and still has the MVP3 Instance-scoping note. Both change when the user approves MVP3. Task 195 has no code, so it skips the refactor step.
- **Refactor:** No code, no refactor step.
