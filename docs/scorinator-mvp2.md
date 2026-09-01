# Scorinator — MVP 2 Specification

Builds on MVP 1 (single round-robin league). MVP 2 introduces **mixed-format leagues**: multiple phases, each with its own format and tiebreak rules.

## 1. Confirmed Design Decisions

### League Formats (available per phase)
- Round robin (two-way): every team plays every other home-and-away.
- Round robin (single duels): every team plays every other **once** — no home/away distinction required, draws are allowed and award draw points (same as two-way, just single-legged).
- Groups round robin (two-way / single duels): teams split into groups, each group runs its own round robin.
- Bracket: knockout format. **Only valid as the final phase** of a league.

### Phase Chaining
- A league is a sequence of **phases**. Each phase has its own format.
- Each phase defines **advancement requisites**: how many teams qualify from each group/table into the next phase.
- **Points/stats reset to zero between phases** — each phase is scored independently (a team's Group Stage record does not carry into the Bracket phase, etc.).
- **Groups Round Robin can be the final phase** of a league (only Bracket has the "final phase only" restriction). This produces **N winners instead of one** — one per group, with no further consolidation into a single champion. The league creation wizard shows a **non-blocking warning** if the last configured phase is Groups, so the user is aware before finishing setup. Anything downstream that expects "the league winner" or "top N finishers" (the Prize event, promotion, Cup feeder counts) treats **each group winner independently** — e.g. all N teams receive the Prize event, and all N count toward "top N" slots individually.

### Groups Assignment
- Groups round robin: teams are assigned to groups **randomly** by default.
- At the national level (once Regions exist, MVP3+), grouping instead uses **geographic clustering**: teams are grouped by region/adjacent-region proximity first — same-region teams cluster together, adjacent regions cluster next to each other — and only the placement *within* or *between* those adjacent clusters is randomized. This replaces pure randomness for national-scope tournaments specifically; city/regional-scope tournaments still use plain random assignment.
- **Region adjacency**: each Region stores a manually-linked list of adjacent Regions, set by the user when creating/editing a Region. This is a Location-model addition that lands whenever Regions are introduced (MVP3), but is decided now since it affects that model's shape.
- **Layout**: group cards **wrap to the next line** when there are many groups, rather than horizontally scrolling.

### Round Robin (Single Duels) — Home/Away Balancing
- Even though single duels has no return leg, home advantage still applies per-match (same OVR boost rule as two-way).
- Since there's no guaranteed pairing of home/away like a two-way round robin provides, home/away assignment is **randomized per match**, with the schedule generator ensuring each team plays **as close to an equal number of home and away matches as possible** (exact split if the group size allows it, roughly equal — off by one — if not).

### Tiebreak Resolution (for phases/matches requiring a decisive result, e.g. Bracket)
Each phase configures two independent flags:
- **Plays AET?** (yes/no)
- **Tiebreak method**: `Penalties` OR `Replay → Coin Toss`

These combine into 4 possible resolution paths:
| AET? | Tiebreak method | Full sequence if regulation ends in a draw |
|---|---|---|
| Yes | Penalties | AET → Penalties |
| No | Penalties | Penalties |
| Yes | Replay → Coin Toss | AET → Replay → (if replay also drawn) Coin Toss |
| No | Replay → Coin Toss | Replay → (if replay also drawn) Coin Toss |

Note: the Replay itself is a one-shot fallback — if the replay also ends in a draw, it goes straight to Coin Toss (no repeated replay loop).

### Bracket Specifics
- Ties can be configured as **single match** or **two-legged (aggregate score, home/away)** — set per bracket phase.
- Bracket seeding is determined by **final standing** from the previous phase (1st seed vs. last qualifier, 2nd vs. second-last, etc. — standard seeding).
- **Away-goals rule** for two-legged ties is a **configurable toggle per bracket phase** (off = go straight to AET/tiebreak if level on aggregate; on = away goals break the aggregate tie first).

### Bracket Sizing & Byes
- Bracket phases need a **power-of-2** number of participating teams for a clean single-elimination structure. When the qualifier count isn't a power of 2, the system **auto-assigns byes by default** (filling up to the next power of 2), but the user can **manually reassign who gets a bye**.
- **Bye assignment**: the highest seeds get the byes through the first round. Beyond that, bracket slotting is simple seed order — not the full anti-clash placement algorithm that keeps top seeds apart for as long as possible.
- **Early warning in the league creation wizard**, before it becomes a problem:
  - For a league that's a **single Bracket phase** (e.g. a pure Cup), the warning appears at the **team-selection step**, since the qualifier count is determined directly there.
  - For a **mixed-format league** where a Bracket phase follows another phase, the warning appears at the **phase-configuration step**, based on how many teams the advancement requisites say will qualify into the bracket.
- **Bye UI**: a bye is a tie with only one team — it auto-resolves immediately (the team advances, nothing to simulate), shown with a **"BYE"** placeholder in the opponent slot. The tie's "Scorinate" button is shown but **disabled**, rather than hidden, for visual consistency with every other tie card.

### Team Selection in League Setup
Scoped to **league setup, before the league is started** (fixtures generated) — ongoing/mid-league roster editing after that point hasn't been designed yet (see Open Items).
- The setup screen starts from an **empty state** with two actions: **Select teams** or **Load them all**.
  - **Select teams** opens a searchable bulk-selection dialog listing eligible Team Blueprints — each row shows a checkbox, colour swatch, Name, and Tier. Multi-select, confirm to add.
  - **Load them all** adds every eligible Blueprint at once, skipping the dialog. "Eligible" means: filtered by this league's location eligibility (per MVP3's location-filtering rule) if the league has a location scope; otherwise all Blueprints.
  - If **no Blueprints exist yet at all**, this empty state instead prompts the user to create their first team, rather than presenting two options that would both be no-ops.
- Once teams are added, each row in the league's team list has three distinct actions:
  - **Edit** opens the same aside modal used at team creation, but here it edits the team's **Instance** for this Season (current OVR override, current Tier) — the underlying Blueprint (Name/Colours/base Tier/City/Crest) is never touched from this screen.
  - **Switch** reopens the same bulk-selection dialog in **single-select mode**, pre-excluding teams already in this league, and replaces this row's team with the new selection.
  - **Remove** takes the team out of the league's roster. If removal would drop the roster below the format's minimum team count, it's still allowed but shows a **soft warning** that the league can't start yet.
- Adding a Blueprint to a league reuses its existing Instance for that Season if one already exists there, or creates a fresh one (OVR rolled from Tier) if not.

### Teams Module (Blueprints) — supersedes MVP1's flat Team model
- Teams are split into two layers:
  - **Team Blueprint** — the reusable template, living in the global "Teams" module: Name, Colours, base Tier, City, Crest. Not tied to any specific league.
  - **Team Instance** — the live/mutable state a blueprint gets once it's actually put into play: current OVR, current Tier, current league membership(s). See MVP3 for how Instance scope is formalized around the new **Season** concept — within one Season, a blueprint has exactly one shared Instance across every league it's concurrently a member of (matches real football: a club has one strength, not one per competition).
- The MVP1 CSV import/export (`ID/slug, Name, Colours, Tier, City`) is retained as-is for quick bulk list editing — it operates on Blueprints and carries no provenance metadata.

### File Module (generalized)
MVP1's single "Save/Load league" pair is replaced with scoped export/import actions:
- **Per-league export/import** — moved to a button on the **League Detail screen** (no longer a global File-module action). Self-contained JSON: embeds full Blueprint + Instance snapshots of the league's member teams, plus fixtures/results/config.
- **Export all leagues** (bulk, JSON, File module) / **Import leagues** — an import file may contain one or many leagues; if multiple, the user gets a picker to select which specific ones to bring in.
- **Export all team blueprints** (bulk, JSON, File module, full fidelity incl. UUID/provenance) / **Import teams** — same selective-picker pattern as leagues.
- **Export entire database** / **Import entire database** — everything: all Blueprints + Instances, all Leagues, all Seasons (MVP3+), Locations (MVP3+), and Story Mode state (MVP4+) in one file. Import merges into the current database using the same conflict rules as any other import (see below) — it never destructively replaces the local database wholesale.
- **Export results** (plain `.txt`, read-only) stays scoped per-league, moved alongside the league's export button on its Detail screen.

### Identity & Provenance System
- Every exportable entity (Team Blueprint, League, Season, Location, ...) gets a **permanent UUID v4, assigned once at creation and never reassigned or overwritten.**
- Each program installation has its own **installation UUID**, used only for provenance metadata (`created_by_installation`, `last_modified_by_installation`) — never used to derive or override an entity's identity.
- **Import conflict rule**: if an incoming entity's UUID doesn't already exist locally, it's created as-is. If it **does** exist locally, the local version is **never silently overwritten** — the user is prompted per conflict with two choices: **Skip** (discard incoming, keep local) or **Import as new** (the incoming entity is assigned a **fresh UUID**, forking it into a separate entity; the local original is untouched).
- Because UUIDs never change once assigned, an entity keeps its identity across any number of export/import hops — there's no need to track "who exported it last"; only an explicit fork ever creates a new identity.

### Bracket Scorination Workflow
- Each tie can be scorinated individually via a **per-tie "Scorinate" button**, or the whole bracket can be resolved at once via a **"Scorinate bracket" button** that scorinates every currently-playable tie in one action.
- **Re-scorinating an earlier tie is destructive downstream**: it recalculates who advances from that tie and **clears/disables every tie in later rounds that depended on it** (they revert to an unplayed state).
- **Confirmation required**: re-scorinating a tie that has already-scored downstream rounds triggers a confirm modal — *"This will clear results for later rounds. Continue?"* Confirming clears the affected later-round ties (e.g. SF/Final/Third-place) back to unplayed: their "Scorinate" buttons re-enable, and any team slot not yet determined shows a **"TBD"** placeholder.
- The bulk **"Scorinate bracket"** action shows the same confirmation modal, for consistency, whenever downstream results already exist.
- **Tie cards** display a footer containing: the **aggregate score** (for two-legged ties), the **penalty shootout result** (if the tie was decided by penalties), and the tie's **"Scorinate" button**.

---

## 2. User Stories — MVP 2

### Epic: League Format Configuration
- As a user, I want to define multiple phases within a single league, so that I can model competitions like "Group Stage → Bracket."
- As a user, I want to assign a distinct format to each phase (round robin, groups round robin, or bracket), so that each stage of the competition works the way it should.
- As a user, I want the system to prevent me from placing a Bracket phase anywhere except last, so that the league structure stays valid.
- As a user, I want to set advancement requisites per phase (e.g. "top 2 of each group advance"), so that qualification rules are explicit.
- As a user, if I end my league on a Groups phase, I want a non-blocking warning that this produces multiple group winners instead of one champion, so that I understand the outcome before I finish setup.

### Epic: Groups
- As a user, I want teams to be randomly split into groups when a Groups Round Robin phase starts, so that I don't have to assign them manually.
- As a user, I want each group to run as its own independent round-robin, with its own standings table, so that group results don't mix.
- As a user, I want national-level Groups Round Robin tournaments to cluster teams by region/adjacent-region proximity instead of pure randomness, so that groups make geographic sense (e.g. fewer cross-country trips in the story's fiction).
- As a user, I want group cards to wrap onto new lines instead of scrolling horizontally when there are many groups, so that I can see everything without side-scrolling.

### Epic: Tiebreak Configuration
- As a user, I want to toggle "Plays AET?" per phase, so that I control whether extra time is simulated on a draw.
- As a user, I want to choose between "Penalties" and "Replay → Coin Toss" as the phase's tiebreak method, so that decisive results are resolved the way I intend.
- As a user, I want the system to simulate penalties (or a coin toss) as a weighted-but-still-uncertain outcome, so that upsets remain possible even in tiebreaks.

### Epic: Bracket Phase
- As a user, I want to configure a bracket tie as single-match or two-legged aggregate, so that I can model cup-style or two-leg knockout competitions.
- As a user, I want the bracket to auto-seed qualifiers based on their final standing from the previous phase, so that I don't have to manually build the bracket tree.
- As a user, I want to toggle the away-goals rule per bracket phase, so that I can decide whether away goals break a level aggregate before AET/tiebreaks kick in.
- As a user, I want two-legged ties to correctly compute the aggregate score and apply AET/penalty/coin-toss rules only if still level (after away goals, if enabled), so that the tie resolves correctly.
- As a user, I want to scorinate a bracket tie individually, or scorinate the entire bracket at once, so that I can move at whatever pace I prefer.
- As a user, when I re-scorinate an earlier tie whose result already fed into later rounds, I want a warning before anything is cleared, so that I don't lose downstream results by accident.
- As a user, once I confirm clearing downstream results, I want those ties to return to an unplayed state with their "Scorinate" button re-enabled and "TBD" shown for undetermined teams, so that I can replay the bracket from that point forward.
- As a user, I want each tie card to show the aggregate score and penalty result (when applicable) alongside its "Scorinate" button, so that I can read a tie's full outcome at a glance.
- As a user, I want to be warned early if my bracket's qualifier count isn't a power of 2 — during team selection for a single-bracket league, or during phase configuration for a mixed league — so that I can adjust before it's a problem.
- As a user, I want byes auto-assigned to the top seeds when the qualifier count isn't a power of 2, with the option to manually reassign who gets one, so that the bracket still makes sense without extra setup work.
- As a user, I want a bye to auto-advance its team with a "BYE" placeholder and a disabled "Scorinate" button, so that it's visually consistent with every other tie even though there's nothing to simulate.

### Epic: Region Adjacency (Location model groundwork)
- As a user, I want to manually link two Regions as adjacent when creating or editing them, so that future grouping logic (MVP3) can favor geographically close teams.

### Epic: Single Duels Home/Away Balancing
- As a user, I want home/away assignment in a single-duels round robin to be randomized but balanced, so that each team plays an equal (or as close to equal as possible) number of home and away matches across the phase.

### Epic: Phase Transition
- As a user, I want each phase's standings/stats to reset to zero when a new phase begins, so that phases are scored independently.
- As a user, I want to see which teams qualified from one phase into the next, and by what seed, so that I can follow the league's progress.

### Epic: Team Selection in League Setup
- As a user, I want to bulk-select teams for a new league from a searchable checklist (colour, name, tier shown per row), so that I can build a roster quickly.
- As a user, I want a "Load them all" shortcut that adds every eligible team at once, so that I don't have to check boxes one by one when I want everyone.
- As a user, when I have no teams created yet, I want to be prompted to create one instead of seeing options that would do nothing, so that the empty state actually helps me.
- As a user, I want to Edit a team's Instance for this Season (not its global Blueprint) directly from the league's team list, so that per-season tweaks don't leak into every other league that team plays in.
- As a user, I want to Switch a team for a different one via the same picker, pre-filtered to exclude teams already in the league, so that swapping is quick and duplicate-safe.
- As a user, I want to Remove a team from the roster, with a warning (not a hard block) if that drops below the format's minimum, so that I know the league isn't ready to start without being stopped outright.

### Epic: Teams Module (Blueprints)
- As a user, I want a global "Teams" list of reusable Blueprints, separate from any one league, so that I can build a roster once and use it across multiple competitions.
- As a user, I want a Blueprint's live state (OVR, current Tier) to be shared across every league it's concurrently a member of, so that a team's strength stays consistent everywhere it plays at once.

### Epic: File Module (generalized export/import)
- As a user, I want an export button on each League's Detail screen that produces a self-contained file (teams included), so that I can share or back up that one league without extra steps.
- As a user, I want to export all my leagues or all my team blueprints in bulk, so that I can back up everything at once.
- As a user, when I import a file with multiple leagues or teams, I want to pick which specific ones to bring in, so that I'm not forced to import everything in the file.
- As a user, I want to export or import my entire database (teams, leagues, locations, story state) as one file, so that I can fully back up or transfer my whole setup.

### Epic: Identity & Provenance
- As a user, I want every team/league/location to keep the same permanent identity no matter how many times it's exported and re-imported, so that re-sharing data doesn't create confusing duplicates.
- As a user, when an import conflicts with something I already have, I want to be asked whether to skip it or bring it in as a new separate copy, so that my existing data is never silently overwritten.

---

## 3. Open Items
No open items remain for MVP 2. **Post-setup roster editing** was raised but is explicitly out of scope — moved to `scorinator-future-features.md`.
