# Scorinator — Future Features Backlog

Ideas and gaps that came up during MVP planning but were explicitly decided **out of scope** for MVP 1–4. Nothing here is committed — this is a parking lot, not a roadmap.

## 1. Post-setup roster editing
Editing a league's team roster (Select/Switch/Remove/Edit) once the league has started (fixtures generated) — or later, after results exist. As of MVP2, this flow is scoped to league setup only, before the league starts; there's currently no way to modify the roster afterward.

*Raised during: MVP2 (Team Selection in League Setup).*

## 2. Automatic / assisted saving
With manual save (File > Save, Ctrl+S) as the committed MVP1 mechanism, and unsaved league/season screens instead kept "suspended" in memory (rather than persisted) when the user navigates away, two related ideas came up and were explicitly deferred rather than built now:
- Autosaving automatically when the user navigates away from a league/season screen, instead of (or in addition to) suspending it in memory unsaved.
- Re-prompting the end-of-league/season "save?" dialog if a previously-completed league/season's results are invalidated by re-scorinating an earlier match/tie, and it reaches completion again. Currently the dialog is scoped to fire only once, the first time completion is reached.

*Raised during: persistence / technical caveats discussion (post-MVP2 mockups).*

## 3. Promoting / merging standalone leagues into a Season
Post-hoc linking of an already-existing standalone League (created and played outside any Season, per the Instance Wrapper design) into a Season later on — either by upgrading its existing wrapper in place into a full Season, or by merging two already-existing standalone Leagues (each with their own independently-scoped Team Instances) into one shared Season together. This raises open questions around Team Instance identity/continuity — does existing OVR/Tier state carry over, or re-roll fresh? — that aren't addressed by MVP3/4 as currently scoped, since those specs only describe Seasons being set up fresh, not an existing League being absorbed into one afterward.

*Raised during: technical caveats discussion — Instance Wrapper design (MVP3+).*

## 4. Venue choice for replays
In MVP2, a replay is always played at a neutral venue, with no home advantage. Later, the user picks the venue per replay: neutral, or either team's home. The picker should show which of the two teams had the better campaign so far in that competition, to help the user decide.

* Raised during: MVP1 → MVP2 impact review.

## 6. Second-leg host toggle
In MVP2, the higher seed always hosts the second leg of a two-legged tie (Task 79). Later, a bracket phase gets a toggle to change this, for example so that the lower seed hosts the second leg.

*Raised during: MVP2 sprint 0, Task 79 (second-leg host), 2026-10-27.*

## 7. Custom phase names
In MVP2, a phase has no name of its own. Its format label names it, for example "Groups (two-way)" (Task 86, US-01.2). Later, the user can give each phase a name, for example "Group stage", with the format label as the default.

*Raised during: MVP2 sprint 0, Task 86 (League Format refinement), 2026-10-27.*

## 8. Debug mode
The user drafts a debug mode: extra data on the screens that helps to check the engine. One item for it: in a single-duels phase, show each team's home and away match count, for example "H 4 · A 3", in the standings table or the group card. In MVP2, the balance rule lives in the engine tests only (US-06.1).

*Raised during: MVP2 sprint 0, Task 91 (Single Duels refinement), 2026-10-28.*

## 9. Re-scorinate a locked phase
In MVP2, a phase locks when the next phase starts, and its results can no longer change (US-07.3). Later, the user can re-scorinate a match of a locked phase, after a confirm. The confirm clears every later phase: its draw, its fixtures, and its results. The next phase must then start again. An undo of a phase start fits the same feature.

*Raised during: MVP2 sprint 0, Task 78 (qualification), settled for MVP2 in Task 92 (Phase Transition), 2026-10-28.*

## 10. Qualifiers list for a round-robin or Groups phase
In MVP2, only a Bracket phase lists its qualifiers, in its Seed List (US-04.2). For a round-robin or Groups phase, the highlight on the earlier phase shows who qualified (US-07.2). Later, every phase after the first gets a "Qualifiers" list: seed, team, and origin tag, for example "A1" or "3rd".

*Raised during: MVP2 sprint 0, Task 92 (Phase Transition), 2026-10-28.*

## 11. Restore a team Blueprint from a league
In MVP2, the user can delete a Blueprint at any time. A league keeps its Instances, with their own name, colour, Tier, and OVR (US-08.4), but the team loses its Location (US-09.3). Later, League Detail can restore a deleted Blueprint from an Instance: a new Blueprint with the Instance name, colour, and Tier.

*Raised during: MVP2 sprint 0, Task 94 (Teams Module refinement), 2026-10-28.*

## 12. Import MVP1 files
In MVP2, an MVP1 JSON file (a league save file or a teams JSON) does not import. The user moves teams with the CSV (US-10.3). Later, a converter reads MVP1 files: it gives each team and league a new UUID, and makes one "Round robin (two-way)" phase for each league.

*Raised during: MVP2 sprint 0, Task 95 (File Module refinement), 2026-10-28.*

## 13. Colour distance test for the team palette
In MVP2, the palette tests check the count, the hex format, and unique names and values (US-09.7). Later, a test checks that every pair of palette colours has a CIEDE2000 distance (ΔE) of 12 or more, so that a palette change cannot bring two close colours back. The MVP2 palette of 24 colours passes it: its smallest ΔE is 12.5.

*Raised during: MVP2, Task 101 (team palette), 2026-10-28.*

## 14. Last 5 matches in the group cards
In MVP2, only the round-robin table shows the last 5 matches (US-12.1). The group cards are narrow. Later, a Groups phase can show a full table for each group, with the "Form" column.

**User idea (2026-11-11, Task 195):** refine this for MVP4. A new window or a modal can show the full table of each group.

*Raised during: MVP2, Task 102 (Standings display), 2026-10-28.*

## 15. Points mode for the standings chart
In MVP2, the standings chart shows each team's place after each matchday (US-12.4). Later, a switch shows the points after each matchday instead.

*Raised during: MVP2, Task 102 (Standings display), 2026-10-28.*

## 16. App settings: team name length and group size checks
In MVP2, the app has no settings screen. Later, a settings feature holds:

- **The team name on league screens:** the short name or the full name, by default. It depends on the short team name (§26).
- **A group draw that does not fit:** a group with too few teams, or group sizes that do not match the group size setting. The setting picks a warning or an error. In MVP2, a later Groups phase keeps each group at 2 teams or more (Task 181), and a swap rearranges groups of 2 (Task 183).
- **The draw of a later Groups phase:** seeded from the order of the phase before it (§18), or random, by default.

**Check this entry when MVP3 is refined:** the user asked for it on 2026-11-02.

*Raised during: MVP2, Task 133 (M3 smoke check), 2026-11-02.*

## 17. A better swap menu
In MVP2, the row menu of a later Groups draw lists one "Swap with {team}" item for each team of the other groups (Task 183). A big draw gives a long menu: 16 teams in 4 groups give 12 swap items. Later, a better menu: for example, one "Swap with…" item that opens a list grouped by group, with the group letter of each team.

*Raised during: MVP2, Task 183 (rearrange groups of 2), 2026-11-02.*

## 18. Seeded group draw from the phase before
In MVP2, a later Groups phase draws its qualifiers at random (US-02.1). Later, the draw can take the qualifier order of the phase before (the seeds of `pickQualifiers`) and deal the teams to the groups in turn. For example, 12 qualifiers in 3 groups: Group A gets seeds 1, 4, 7, 10, Group B gets 2, 5, 8, 11, and Group C gets 3, 6, 9, 12. A setting picks the seeded draw or the random draw by default (§16). Shuffle and the manual changes stay.

*Raised during: MVP2, Task 133 (M3 smoke check), 2026-11-02.*

## 19. The current phase on the league card
In MVP2, the dashboard card badge shows the matchday only, for example "MD 6/6" (US-01.2, Task 131 choice 4). Only the League Detail header names the phase ("Group Stage · MD 6/6"). Later, the card also shows which phase the league plays now, for example with the header text.

*Raised during: MVP2, end of the M3 session, 2026-11-02.*

## 20. Rename and delete a league
In MVP2, a league keeps the name it got at "Create league", and the app cannot remove a league. Later, the user can rename a league and delete it, after a confirm. The delete removes the league file and its manifest row at the next save (`PERSISTENCE.md`).

*Raised during: MVP2, end of the M3 session, 2026-11-02.*

## 21. Blueprint collections
In MVP2, the Teams screen holds one flat list of Blueprints. Later, the user can put Blueprints into collections: create a collection, add and remove teams, rename it, and disband it (the teams stay). To settle at refinement: one team in several collections or not, where collections show (Teams screen, wizard add dialog), and how the database files keep them. No spec had this before 2026-11-02.

*Raised during: MVP2, end of the M3 session, 2026-11-02.*

## 22. The score before AET on the tie card
In MVP2, the tie card shows one score for a match that went to AET, with an asterisk and the footnote "* score includes AET" (US-03.1). The user cannot see how many goals came in AET. Later, the tie card also shows the score after 90 minutes, for example "2–2 (1–1)", or the AET goals on their own line. The engine already returns the AET goals apart from the match goals (Task 134 choice 3). The tie record must keep both scores, so check this entry before Task 139 fixes the tie record.

*Raised during: MVP2, Task 134 (AET time share), 2026-11-03.*

## 23. Choose how to seed a bracket before it starts
In MVP2, a bracket after a Groups phase seeds by place, then stats (Task 78), with the standard placement (Task 89). A first-round tie never pairs two teams of one group (Task 185). Later, the user picks the seeding method on the Seed List before the first result, as for the byes today (US-04.10). One method: fixed pairs across groups, as in the World Cup: A1 v B2, B1 v A2, C1 v D2, D1 v C2. It works only with a power of 2 of qualifiers and no best-M teams, so the Seed List offers it only then. A change after the first result asks for a confirm, as the bye change does.

*Raised during: MVP2, Task 142 review, 2026-11-03.*

## 24. Titles for the tie cards of the earlier rounds
In MVP2, only the final and the third-place tie cards show a title (Tasks 187, 188). The ties of the earlier rounds keep a blank first cell in the score header row. A single-match tie has no header row, so a title needs a title row of its own. A title row on each single-match tie of each round adds height to the whole tree. Later, choose the title text, for example "SF 1" or "QF 2", and how a single-match tie shows it, before or after a replay. Decide also what a bye card shows.

*Raised during: MVP2, Task 188, 2026-11-04.*

## 25. A tooltip hint that follows the pointer
In MVP2, a `Tooltip` hint sits above the centre of its trigger. Small triggers that sit close together use `notHoverable` (Task 114): the pointer goes through the hint, and the hint hides at once on leave. The swatches, the `TeamName` hints, and the Form dots use it. Later, a `followPointer` option places the hint near the pointer and moves it with the pointer, so the hint does not cover the next trigger. A keyboard focus still places the hint from the trigger box. Settle at refinement: the distance from the pointer, the side, and which triggers use it (the swatches, the Form dots). Task 166 has the first proposal.

*Raised during: MVP2, Task 114 review, 2026-10-29. Parked at Task 166, 2026-11-11.*

## 26. A short team name
A new Blueprint field: a short, informal name, for example "Munique" for "CF Barrio de Munique". The full name stays the input that makes the slug. Standings, fixtures, and other league screens show the short name, with a setting to show the full name there in its place (§16). When two teams in one view have the same short name, each one gets its place in parentheses: "Munique (San Leo)" and "Munique (Piraporinha)". The user chose the parentheses because the app is in English, but the worldbuilding is language-agnostic. Settled by the user on 2026-11-02: the short name has no link with the trigrams, and the clash check looks at one league only. Still open: what the place in the parentheses is, now that City is out of MVP3.

*Raised during: MVP2, 2026-11-02, as an open question for MVP3. Parked here at Task 195 (MVP3 scope, 2026-11-11).*

## 27. A Statistics tab
A "Statistics" tab in the Season view, and one for a single league. The user named it for MVP4 at the Season refinement. No content is defined yet.

*Raised during: MVP3, Task 196 (Season refinement), 2026-11-11.*

## 28. An OVR for each league team in a Season
In MVP3, a Season has one Instance for each Blueprint, and every league of the Season uses it: one base OVR and one Tier (`scorinator-mvp3.md` §1, `PERSISTENCE.md` §2a). Later, each league can keep its own OVR for a team. The Season team is then a middle layer between the Blueprint and the league team: a change to the Season team does not change a running league, and a league keeps the logic of a single league. A standalone league that a Season imports can also keep its own OVR, or offer the choice.

*Raised during: MVP3, Task 196 (Season refinement), 2026-11-11. The user parked it at review for a later release.*

## 29. Export a Season league as a league file
In MVP3, a Season league exports only its results `.txt` and its slug list `.txt`. Later, the League Detail of a Season league can also export the league as a league `.json` file, as a standalone league does (US-10.1). The open point is identity: the file carries the UUID of the Season league, so an import of it can bring a second league with that UUID.

*Raised during: MVP3, Task 196 (Season refinement), 2026-11-12. The user named it for MVP4.*

## 30. Rename a Season at import
In MVP3, an imported Season with the name and year of a local Season gets a number after the name, for example "Liga (2)" (US-13.11). Later, the import can ask for a new name in place of the number.

*Raised during: MVP3, Task 196 (Season refinement), 2026-11-12. The user parked it.*

## 31. A conflict for a league imported twice into a Season
In MVP3, the Season import of a standalone league skips a league that is in the Season already (US-13.10). Later, the import can show the conflict dialog of US-11.2, with "Skip" or "Import as new". The user called it a corner case with no priority.

*Raised during: MVP3, Task 196 (Season refinement), 2026-11-12. The user parked it.*

## 32. A new view for the leagues of a Season
In MVP3, the Season view lists its leagues in the same way as the leagues dashboard: one card for each league (US-13.3). Later, the Season view can show its leagues in a new and better layout.

*Raised during: MVP3, Task 196 (Season refinement), 2026-11-12. The user named it for later.*
