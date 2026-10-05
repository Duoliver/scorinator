# MVP1 → MVP2 impact review

**Date:** 2026-10-01

**Scope:** how the decisions and builds made during MVP1 development affect MVP2. This is a review only. No code changed. MVP2 is still not approved for implementation, and this document does not change that. `PROGRESS.md` stays the single source of truth for scope.

**Sources read:** `PROGRESS.md` (status board, open questions, decisions log), the `decisions-log/` files (000, 013, 023, 024, 025, `inline-style-cleanup`, `teamform-drawer`), the progress reports (002 to 019, 021, 029), `PERSISTENCE.md`, `ENGINE.md`, the four MVP specs, `scorinator-future-features.md`, `module-boundaries.md`, `tdd.md`, `coding-standards.md`, and `docs/design-reference/README.md`. Not read: `progress-reports/000`, `FEATURES.md`, `DESIGN_SYSTEM.md`. None of these was needed for this review.

---

## 1. Settled during the review

The user decided these on 2026-10-01.

1. **No backward compatibility from v1 to v2.** MVP1 is an alpha, not meant to be shared. A `formatVersion: 1` save file can simply be rejected. No v1 loader, no slug-to-UUID mapping, and no Blueprint creation from old save files. MVP2 can rewrite the slug-based shapes, and the tests that assert them, freely. Cost: MVP1 test saves will not open in MVP2.
2. **Replays are played at a neutral venue.** No team gets home advantage in a replay. A post-MVP4 feature lets the user set the venue instead. See section 6 for a draft entry.
3. **Single-match bracket ties are played at a neutral venue.** Extra time in such a tie is neutral too, since it continues at the same venue. The MVP4 Cup inherits this, because it reuses the bracket mechanics.
4. **The coin toss is a pure 50/50.** Team strength plays no part. Penalties stay weighted by strength, as the spec says.

What follows from items 2 and 3: a neutral venue means `applyHomeAdvantage` is never called. The engine needs nothing new. A tie's data should still carry a venue value, always neutral in MVP2, rather than assume a home side. This leaves room for the post-MVP4 venue feature without building it. The league's home-advantage toggle then only affects round-robin phases and two-legged ties. The MVP2 phase setup could say so, so the toggle does not look broken on a cup-only league.

---

## 2. Impacts by area

### 2.1 Identity: slug to UUID

MVP1 settled on slug-only identity (Task 11). The slug is now used throughout the app:

- Fixtures, byes, and results reference teams by slug (`Fixture<string>`).
- League Detail is routed by a league slug, `/leagues/:slug` (Task 25).
- `fileStore` keys the last saved path by league slug (Task 17).
- `saveLeagueBySlug` drives Ctrl+S.
- `leagueDraftStore` holds `selectedSlugs` (Task 23).
- Load detects a clash by matching slugs (Task 17).

`slug()` does no de-duplication, so two teams with the same name share a slug. Two leagues with the same name would also collide on their route.

MVP2 gives every entity a permanent UUID v4, plus an installation UUID for provenance. Every reference above moves to UUIDs. The slug stays a display field, and possibly a CSV matching field (see open decision 1).

### 2.2 Imports overwrite by slug

`importMerge.ts` upserts by slug. A new slug is added, and a matching slug overwrites that team in place. This applies to CSV, to the teams-only JSON, and to the teams inside a loaded league (Task 17). Today, loading a league can silently rename or recolour a team on the roster. Task 17's load flow also asks, then replaces, an open league with the same slug.

MVP2 says a local entity is never overwritten. An incoming entity with a known UUID gets a prompt: Skip, or Import as new with a fresh UUID. League files carry Blueprints with UUIDs, so both the league replace and the team overwrite must become that prompt.

CSV is less clear-cut. MVP2 keeps CSV "for quick bulk list editing", with no provenance metadata. That could justify keeping the slug overwrite for CSV only. See open decision 1.

The teams-only JSON (`parseTeamsJson`, Task 12) has no version field, as far as the reports show. MVP2's full-fidelity Blueprint export, with UUIDs and provenance, needs one.

### 2.3 Persistence: from save files to a database

MVP1 has no local database. Everything lives in memory for one session. That is why Task 29's start screen offers Load teams and Load league.

`PERSISTENCE.md` defines the target:

- `manifest.json`, always loaded at startup: every Team Blueprint, the Locations, the installation UUID, and a summary row per Instance Wrapper.
- `wrapper-{uuid}.json`, one per standalone League (or per Season, from MVP3), loaded only when the user opens it.
- A wrapper with unsaved changes stays in memory when the user navigates away (§2b).
- Explicit save only, no autosave.
- Temp-file-then-rename per file, manifest written last.
- "Export/Import entire database" becomes a bundle, a zip or a directory, not one JSON file.
- Per-league export stays a self-contained JSON file.

Already compatible: Task 21's atomic write is the per-file building block. Rolling OVR once per league (Task 13) matches a standalone wrapper's own Team Instances.

Where MVP1 diverges:

- **Save means something different.** In MVP1, Save writes a standalone file to a path the user picks, `fileStore` remembers that path, and Save as moves it. In the database model, Save and Ctrl+S commit memory into the database. A file at a picked path is an export. So MVP1's Save, Save as, and the remembered paths are really MVP2's per-league export. The File screen's Save league card and `fileStore`'s path map either become export, or go away.
- **The database location is not specified.** It could be a fixed folder in the app data directory (Tauri's path API), or a folder the user picks and opens. This decides the startup screen, whether "open another database" exists, and how meaningful the installation UUID is. The installation UUID lives in the manifest, so copying a database folder copies the "installation" identity too. The broad `fs:scope` (Task 21) covers either choice.
- **Startup changes.** Teams persist between runs. Task 29's empty state becomes a first-run or empty-database state. "Load league" becomes "Import league".
- **Global team edits need unsaved-changes tracking.** Blueprints live in the manifest, so a Teams screen edit is an unsaved database change. MVP1 only plans a flag per league (Task 26, keyed by slug). Ctrl+S needs a defined target: the current wrapper, every dirty wrapper plus the manifest, or everything. The close prompt (Task 28, `PERSISTENCE.md` §2b) needs the same full picture. Tasks 26 and 28 are not built yet, so they could track dirty state per wrapper and for the manifest from the start, without building anything from MVP2.
- **The Leagues dashboard reads summaries, not full leagues.** Today it reads every full `LeagueRecord`. Under lazy loading, it reads the manifest's summary rows: content type, league names, team count. Each card also shows home advantage, a points pill, and a fixture-format line from `describeLeague`. Either the summary row gains those fields, or the cards show less.
- **A multi-file commit is new code.** Committing several dirty wrappers, then the manifest last, belongs behind the interfaces `module-boundaries.md` reserves for `persistence/`. Today that folder only defines `FileSystem` and `SaveFileDialog`.

### 2.4 League lifecycle

`addLeague` builds the fixtures at creation (Task 14). A league with fewer than 2 teams gets an empty schedule. MVP2 separates setup from start: the roster stays editable until fixtures are generated, and Remove below the minimum shows a soft "can't start yet" warning. A league needs a pre-start state and an explicit Start action. The `<2` guard turns into that state.

### 2.5 League structure: one schedule becomes phases

`LeagueRecord` keeps `fixtures`, `byes`, and `results` flat on the league. MVP2 makes a league a sequence of phases, each with its own format, groups, standings, and tiebreak flags. Points reset between phases.

No fixture format is stored anywhere. League Detail hardcodes "Round robin (two-way)", and `describeLeague` (Task 24) builds the same text for dashboard cards. MVP2 needs a real format field per phase, and both places need to read it.

Everything that reads the flat arrays must become phase-aware: `scorinateFixture`, `scorinateMatchday`, `rescorinateFixture`, `findResult`, `isMatchdayFullyPlayed`, `findCurrentMatchday`, the Fixtures and Standings tabs, and the "League completed" badge. That badge should mean all phases are finished.

`StandingsView` and `FixturesView` both take a whole `LeagueRecord`. A group table needs a roster, results, and points config for one group or one phase, so their props need reshaping. The `teamDisplay` code duplicated between the two views (Task 16) is worth sharing at the same time.

`calculateStandings` holds up well. It is stateless and recomputes from a roster and a result set, so it works per group and per phase as it is.

### 2.6 Result identity

`findResult` and `isResultOf` match a result to a fixture by the `(matchday, home, away)` triple (Tasks 7 and 15). In MVP2, matchday numbers restart in each phase, groups share matchday numbers, and two-legged ties and replays repeat the same pairing. Fixtures need stable IDs, or keys that include phase and group. This touches the result lookup, re-scorinate, and the saved result shape. See open decision 3.

### 2.7 Engine: fixtures

`generateRoundRobin` uses the circle method, alternates home and away by round, hides the bye behind a `Symbol`, and takes no RNG (Task 3). Task 3 deliberately left open whether single duels gets a new generator or extends this one. Single duels needs randomized but balanced home and away, so it needs an injected `Rng` (`ENGINE.md`). Task 30's proposal, an `Rng` parameter on `generateRoundRobin`, fits that, and is worth shaping with single duels in mind so the signature changes once. The "no RNG" doc comment and the determinism test from Task 3 need rewording either way. See open decision 8.

### 2.8 Engine: standings and qualification

In MVP1, a tie only affects the display (`positionText: '-'`). In MVP2, advancement requisites and bracket seeding read the order. Two deferred simplifications then decide outcomes:

- Roster order is the final fallback (Task 4). The user wanted to revisit it.
- The mini-league runs one pass, not the recursive version a real competition uses.

A real competition falls back to drawing lots. `ENGINE.md` allows that with an injected `Rng`, but `calculateStandings` is a pure function that `StandingsView` calls on every render. A fresh draw on every call would reorder the table on every render. So a draw must happen once and be stored on the league or phase, or be seeded from stable data such as the league UUID. Random group assignment follows the same rule: draw once at phase start, store it, never re-draw. This makes the tie-break question partly a data-model question: where a stored draw lives, and whether a re-scorinate that changes the tie invalidates it.

Seeding across groups is also unspecified. "Seed by final standing" does not say how to order two group winners against each other. See open decision 4.

### 2.9 Engine: scorination and tiebreaks

- **AET** needs a partial-match version of `computeExpectedGoals`, which only models a full match today.
- **Penalties** need a model for "weighted but still uncertain".
- **The coin toss** is a pure 50/50 (section 1). It still takes an injected `Rng`. Its test checks a win rate near 50% even with a large OVR gap.
- **Re-scorinate** moved to `app/state/leagueStore` in Task 7, because MVP1 had no engine logic to add. MVP2's bracket cascade is real domain logic, and `module-boundaries.md` assigns it to `engine/bracket`. The store action then becomes a thin dispatcher.

`ENGINE.md` says statistical test bands are a balancing detail to propose before testing. AET scaling and the penalty model each need a proposed value and a band. See open decision 6.

Store-level tests can pin a result by mocking `Math.random` to a fixed value, as Task 7 does. That carries over to MVP2 store actions such as "Scorinate bracket". An injectable seed source in the store would be cleaner, but it is not a blocker.

### 2.10 Determinism (`ENGINE.md`)

Every random decision in `engine/` takes an injected `Rng`: penalties, the coin toss, random group assignment, and single-duels home and away. UUID generation and the clock are injected in `engine/identity` too. When MVP2 adds UUID generation there, the function takes a UUID source, such as an `Rng` or a `() => string`. It does not call `crypto.randomUUID()` inline. The app or persistence layer creates the installation UUID and the wrapper UUIDs by calling that function with a real source.

### 2.11 League Setup wizard

Task 13 built the team picker on the flat `TeamRecord` model, and explicitly skipped the MVP2 Blueprint/Instance dialog picker. MVP2 asks for:

- An empty state with "Select teams" and "Load them all", or a prompt to create a first team when none exist.
- A searchable bulk-selection dialog.
- Per-row Edit, Switch, and Remove.
- A phase configuration step, with its warnings (Groups as the last phase, a bracket count that is not a power of 2).

Edit from League Setup changes the Instance only, never the Blueprint. `TeamFormDrawer` serves both the Teams screen and the Teams step today. The generic `Drawer` and the title-less `TeamForm` mean an Instance form can sit in the same `Drawer` without touching `TeamForm`'s Blueprint role.

OVR timing collides with the Instance Edit. MVP2 creates an Instance, with a rolled OVR, when a team is added, and Edit can override that OVR before the league starts. MVP1 rolls OVR at Create (Task 13). The roll moves earlier, into the wizard, and the draft store must hold rolled Instances. See open decision 7.

`leagueDraftStore` grows with phase config and Instance overrides, and its slug keys become UUIDs. The cold-cache pattern itself (three read/write points, uncontrolled fields, `coding-standards.md`) carries over unchanged. The `Select` primitive and `FieldHandle.subscribe()` (Task 0) fit phase-config fields that depend on another field, such as showing AET and tiebreak options only for a Bracket phase. Open Tasks 31 and 33 still apply, with more steps.

### 2.12 Screens and the File module

The File screen follows the MVP1 prototype (Task 17): team import and export, Save league, Load league, Save as, and Export results with a league selector (Task 18). MVP2 rearranges it:

- Per-league export and import, and the `.txt` export, move to a button on League Detail. Task 18's report already notes this.
- The File screen gains Export and Import all leagues and all Blueprints, each with a picker, plus Export and Import entire database.

Ctrl+S survives MVP2: `scorinator-future-features.md` names manual save with Ctrl+S as the committed mechanism. Its target changes with the database model (section 2.3).

League Detail gains views for phases, wrapping group cards, and a bracket with tie cards. Routing moves from the slug to the UUID.

The `.txt` export (Task 10) has to cover phases, groups, and tie details: aggregates, AET, and penalties. Its input type is a structural subset of the save file shape, so it follows the v2 shape.

Task 19's single-`Button` toggle and its object-identity score flash should carry over to bracket ties. Bracket ties also need the confirm modal before a cascade, TBD slots, and a disabled Scorinate button on byes.

### 2.13 Design system prerequisites

MVP2 needs new primitives: a searchable picker dialog, a confirm modal, tie cards, and group cards. `Drawer` is the only overlay primitive today. Under the design-reference README rule, each new primitive is its own `design-system/` task before any feature work uses it.

`Drawer` skipped full focus trapping on purpose. MVP2's modals are where that decision returns, since a confirm modal without a focus trap is a weaker accessibility story than a side drawer.

`Tabs` has no controlled `activeId`, by a Task 0 decision, until something external needs to drive it. Per-phase views in League Detail could be that case, for example opening on the active phase.

### 2.14 What carries over unchanged

- `calculateStandings`, per group and per phase.
- `scorinateMatch`, `computeExpectedGoals`, and `applyHomeAdvantage` (no flag, so a neutral venue simply skips the call).
- The Tier→OVR table and `rollOVR`.
- The atomic write in `adapters/tauri-fs`.
- The `FieldHandle` field pattern, `Drawer`, `Tabs`, and the cold-cache draft pattern.
- `TeamsScreen` editing by list index works the same with UUIDs.

---

## 3. Spec and doc edits to make

The user owns the spec docs. None of these is applied yet.

- **MVP2, Bracket Specifics:** single-match ties and replays are played at a neutral venue (section 1).
- **MVP2, Tiebreak user story:** the story lists penalties and the coin toss together as "weighted-but-still-uncertain". Reword it so the coin toss is a pure 50/50.
- **MVP2, Teams Module:** the CSV column list includes `City`, which is MVP3 scope. Do not add it in MVP2.
- **MVP2, Teams Module:** the Blueprint field list includes City and Crest, both MVP3 scope. Do not add either in MVP2.
- **MVP2, Team Selection:** "Instance for this Season" refers to Season, an MVP3 concept. Read it as Instance Wrapper, per the caveats correction in `CLAUDE.md`.
- **MVP2, Teams Module user story:** "a Blueprint's live state is shared across every league it's concurrently a member of" cannot happen in MVP2. Instances belong to a wrapper, and with no Season until MVP3, every MVP2 league is a standalone wrapper with its own Instances. Sharing arrives with Season in MVP3.
- **`PROGRESS.md`, Task 32 row and open question:** the note says MVP2 §2 uses the words "percentage boost". The MVP2 text only says "same OVR boost rule as two-way", so only MVP1's wording needs an update.
- **`module-boundaries.md`:** add `adapters/txt` (Task 10). MVP2 adds `engine/bracket` and `engine/tiebreak`. `engine/identity` was opened early, in Task 11.

---

## 4. Open decisions

Each needs a user decision before the related MVP2 task starts. The numbering is the one used during the review.

1. **CSV import matching.** Keep the slug upsert for CSV only, while JSON and league imports switch to Skip or Import as new? Or prompt for CSV too?
2. **The database.**
   - Where it lives: a fixed app data folder, or a folder the user opens.
   - What Save and Ctrl+S commit: the current wrapper, every dirty wrapper plus the manifest, or everything.
   - Unsaved-changes tracking per wrapper and for the manifest. This shapes Tasks 26 and 28.
   - What the manifest summary row holds for the dashboard cards.
   - Zip or directory for the entire-database bundle.
3. **Stable fixture IDs.** How fixtures get an identity that survives phases, groups, two-legged ties, and replays.
4. **Qualification.** The tie-break fallback when qualification or seeding depends on it. If lots are drawn, where the draw is stored and when it resets. How to seed across groups.
5. **Who hosts the second leg of a two-legged tie.** Deferred, to be discussed later. Single-match ties and replays are settled as neutral (section 1). A common answer is the higher seed, as in UEFA knockouts.
6. **AET and penalties.** A proposed AET goal scaling and a penalty model, each with its statistical test band, per `ENGINE.md`.
7. **When OVR is rolled.** At add-to-league, so the Instance Edit can override it before the league starts.
8. **Single duels generator.** A new generator, or an extension of `generateRoundRobin`. Shape Task 30's `Rng` parameter to fit.

Related open questions already in `PROGRESS.md`, and still open: the extreme-score study and the Task 32 home-advantage values. Both carry into MVP2. Single duels use the same boost rule, and mixed-tier cups and brackets produce more big mismatches.

---

