# Scorinator — MVP 3 Specification

Builds on MVP 1 (one round-robin league) and MVP 2 (leagues with phases). MVP 3 introduces the **Season**: a group of leagues that share their teams, with Season playoffs. It also adds a team **condition**, search and collections in the lists, and smaller items from MVP2.

*Rewritten on 2026-11-11 (Task 195). The user cut the scope. Locations (Country, Region, City), location-based tournaments, and the league tier links (promotion and relegation) left MVP3. The earlier text is in the git history.*

## 0. Scope and ranks

Each item has a rank from the user: **Must**, **Should**, **Could**. MVP3 can end with the Must items only. The refinement covers the Must and the Should items at least. A Could item gets refined stories only when the user asks. The candidate IDs (C1 and on) come from [Task 195](/docs/tasks/195-mvp3-scope.md).

The epic numbers go on from MVP2, which ends at epic 12, so the story IDs stay unique (`docs/user-stories/README.md`).

| Epic | Items |
|---|---|
| 13. Season | C1, C2, C3, C4, C5 (Must), C6 (Should) |
| 14. Team condition | C10 (Must) |
| 15. Teams module | C36, C44 (Must), C7 (Should), C11, C12 (Could) |
| 16. League and Season lists | C21, C45, C46 (Must), C23 (Should), C22 (Could) |
| 17. Brackets and phases | C25, C27, C29 (Should) |
| 18. Debug mode | C16 (Should) |
| 19. Fixes and polish | C19 (Should), C17, C43 (Could) |

**Not in MVP3:** the score before AET on the tie card (future features §22) and the seeded group draw (§18) are Later. The rows that the user discarded are in Task 195.

## 1. Confirmed design decisions

### Season

- A **Season** is a standalone entity that groups a set of leagues. It runs on its own, with no story features.
- The leagues of a Season play at the same time (C2).
- **Team Instance scope:** a Team Blueprint's live state (current OVR, current Tier, league memberships) is scoped to one **Instance Wrapper**. An Instance Wrapper holds a set of Team Instances, with either one standalone League or a full Season. Inside a wrapper, a Blueprint has exactly one Instance, shared by every league of that wrapper. In a different wrapper, the same Blueprint gets an independent Instance. See `src/persistence/PERSISTENCE.md` §2a.
- A team can belong to more than one league at the same time, for example a league and a cup (C3).
- One database can hold more than one Season, each with its own Team Instances (C4).
- **Season playoffs** (C5): single matches that belong to the Season, not to a league. A playoff can have a name. A link from a playoff to a league can come later.
- A standalone league can move into a Season (C6, Should). A team that is not in the Season keeps its league OVR. A team in the Season takes the Season OVR (US-13.10).
- **League UUID scope:** a league UUID is unique in its container: the standalone leagues, or one Season. Two containers can hold one league UUID. The two leagues are related: one is a copy of the other (US-13.10). *(Added on 2026-11-12, Task 196, with the user's approval. It extends the MVP2 rule "one UUID, one entity" for leagues.)*

### Team condition

- An input sets the **condition** of a team: a buff or a nerf, with no direct change to its Tier (C10). The condition is for one team in one league, in a Season or standalone, and for a team in a Season playoff. *(Changed on 2026-11-12, Task 197, with the user's approval. It said "for the Season".)*
- The ranked slug list export (US-10.5) carries the condition, so a later league can import the team with its condition.

### Teams module

- **Blueprint collections** (C36): see `scorinator-future-features.md` §21 for the first notes.
- A **search** on the Teams screen (C44).
- **A custom team colour** (C7, Should): a "Colour" modal, opened from the colour field of a drawer. Row 1: the current colour and the selected colour. Row 2: the palette swatches. Row 3: a hex field and RGB sliders, kept in sync. "Cancel" and "OK". This needs a `Slider` primitive in `design-system/`. *(Changed on 2026-11-12, Task 198, with the user's approval.)*
- Could: copy the Instances of a league to the database, as a new Blueprint or over an existing one (C11). Restore a deleted Blueprint from a league (C12, future features §11).

### League and Season lists

- **Rename and delete a league** (C21, future features §20).
- A **search** on the leagues dashboard (C45) and on the Season list (C46).
- Should: the current phase on the league card (C23, future features §19).
- Could: custom phase names (C22, future features §7).

### Brackets and phases

- Should: a qualifiers list for a round-robin or Groups phase (C25, future features §10).
- Should: a toggle for the host of the second leg (C27, future features §6).
- Should: a choice of bracket seeding before the bracket starts (C29, future features §23).
- A replay stays at a neutral venue in MVP3.

### Debug mode

- Should: extra engine data on the league screens (C16). Two items so far: `[S | 93]` (the Tier and the OVR) beside each team name, and the home and away count of each team in a single-duels phase (future features §8).

### Fixes and polish

- Should: the unsaved changes dialog opens in a corner of the screen the first time (C19). A bug.
- Could: an empty state for the Review step of the wizard (C17).
- Could: the team plural in `Imported 1 team.` (C43). See the open question of 2026-10-19 in `PROGRESS.md`.

### Team Location

- The Location stays a free-text label on the Blueprint (US-09.3). MVP3 adds no City (C15, 2026-11-11).

## 2. Open items

The refinement of each epic settles its details with the user. Known open items: none at this time. *(The C6 team state item closed on 2026-11-12, Task 198: US-13.10 settles it.)*
