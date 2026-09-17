# Task 14 — Fixtures view: generate and show matchdays

**Status:** Review — 2026-09-17

## What was built

`LeagueRecord` (`features/leagues/types.ts`) gained two fields: `fixtures: Fixture<string>[]` and `byes: Bye<string>[]`. A team's slug is its `TeamId` here. This matches how `adapters/json-io/types.ts`'s `SavedLeague` already models the same data.

`app/state/leagueStore.ts`'s `addLeague` now generates the schedule at league creation. It calls `engine/fixtures`'s `generateRoundRobin` (Task 3) on the slugs of the just-rolled teams. It stores the result on the new `LeagueRecord`. Generation needs no RNG. It stays deterministic.

New `features/fixtures/FixturesView.tsx` renders that schedule. It shows one matchday at a time. It has Previous/Next buttons and a `Matchday N / total` header. Below that sits a bordered list of that matchday's matches: home team, colour swatch, a `vs` placeholder, away colour swatch, away team. It shows a Bye row when the matchday has one. It shows an explanatory empty-state message instead, for a league with no fixtures. `LeagueDetailScreen`'s Fixtures tab now renders `FixturesView`. This replaces its Task 14 placeholder.

## Test approach

Per `docs/tdd.md`'s `features/` row, `FixturesView.test.tsx` is a Testing Library integration suite. It covers six cases. Matchday 1 renders with the right matches and team names. Previous disables on matchday 1. Next disables on the last matchday. A click on either button changes the header and the visible matches. A Bye row shows the right team, on an odd-team-count schedule. The empty-state message shows for a league with no fixtures. One more case checks the fallback to a bare slug, for a team no longer in the roster.

`app/state/leagueStore.test.ts` gained two cases. One confirms `addLeague` builds the exact expected schedule for 2 teams. The other confirms it stores an empty schedule, not a thrown error, for 0 or 1 team. Every existing `LeagueRecord` test fixture (`leagueSummary.test.ts`, `LeagueDetailScreen.test.tsx`, `LeaguesDashboardScreen.test.tsx`, `AppShell.test.tsx`) picked up the two new required fields.

## Decisions made

- **`generateRoundRobin` throws for fewer than 2 teams**, a deliberate Task 3 choice. Nothing today stops a user from creating a 0- or 1-team league. Several existing tests do exactly that. `addLeague` guards the call: it only generates a schedule for 2 or more teams. It stores an empty `fixtures`/`byes` pair otherwise. This follows the same propose-and-log pattern as Task 3 and Task 11. It is not one of the named open items in `CLAUDE.md`.
- **Matchday nav uses labeled buttons**, "Previous matchday" and "Next matchday", not the prototype's icon-only 36px arrow buttons. `Button` (`design-system`) has no `aria-label` prop yet. Per `design-reference/README.md`, a screen follows the prototype's layout intent, not its exact markup. A labeled button is the better fit here, without a `Button` change for one caller.
- **No score, ever, in this task.** Every match shows a `vs` placeholder. Task 15 (scorination) replaces that with a real score. It also adds the "Scorinate matchday" action the prototype shows alongside the schedule. Both stay out of this task on purpose.

## What is left, what is next

- Task 15 (scorination UI) wires a real score into each match row. It adds the scorinate actions this task deliberately left out.
- Task 16 (standings) still shows a placeholder inside `LeagueDetailScreen`'s Standings tab. This task did not touch it.
- No save-file wiring was needed. `LeagueRecord`'s new `fixtures`/`byes` fields already match `SavedLeague`'s shape one to one.
