# FEATURES — screens vs. shared components

`src/features/` holds two kinds of folders. The difference matters for imports.

## Screen folders

A screen folder (`teams/`, `leagues/`, and any later MVP1/2 screen) holds one routed screen. It owns everything specific to that screen: the screen component, its own sub-steps or drawers, its own I/O seam (`csvIO.ts`, `jsonIO.ts`), and its own tests. A screen folder may import from `features/components/` freely.

### One folder for each component

A screen folder that holds one screen, such as `standings/` or `file/`, keeps that screen's files at its root.

A screen folder that holds more than one component gives each component its own subfolder, named after the component. The component file, its CSS module, its test, its `types.ts`, its `helpers.ts`, and its hooks go in that subfolder, with an `index.ts` barrel. A component that only one other component uses goes inside that component's folder. A file that several components of the folder share stays at the folder root. `features/leagues/` is the example:

```
features/leagues/
  index.ts                  the barrel for the three screens
  types.ts                  domain types (LeagueRecord), shared
  leagueSummary.ts          used by LeagueDetailScreen and LeagueList
  LeagueDetailScreen/
  LeaguesDashboardScreen/
    LeagueList/             only the dashboard uses it
    LeaguesEmptyState/
  LeagueSetupScreen/
    leagueName.ts           used by useLeagueSetup and DetailsStep
    steps/
      DetailsStep/
      TeamsStep/
      ReviewStep/
      SetupChips/           used by TeamsStep and ReviewStep
```

## `features/components/`

Holds components with real business logic that more than one screen needs. This is not `design-system/` primitives — those carry no domain knowledge, a `Button` does not know what a team is. It is also not screen-specific. `TeamForm` is the first example: both Team Management and League Setup need to create or edit a team the same way.

**Rule: `features/components/` never imports from a screen folder (`features/teams/`, `features/leagues/`, and so on). Only the reverse.**

This is a one-way dependency. No lint rule enforces it yet — flag it in review if a `features/components/` file ever imports from a screen folder. The reason is cyclic imports. If `features/leagues` imported `TeamForm` straight out of `features/teams`, and a later change made `features/teams` import something from `features/leagues`, the two folders would import each other. Routing every shared component through `features/components/` instead keeps the dependency graph one-directional: screens depend on shared components, shared components depend on nothing above them in `features/`.

A hook that more than one screen folder needs lives here too, as `features/components/useX.ts`, with the same import rule. `useTeamLookup` is the first example: `StandingsView` and `FixturesView` both show a team name and colour from a slug. Its `TeamDisplay` type lives in `features/components/types.ts`. See the three-layer rule in `docs/coding-standards.md`.

A type that a shared component needs also lives in `features/components/`, not in the screen folder that happens to use it most. `TeamRecord`, which `TeamForm` takes as its `initial` prop, is the example — see `features/components/types.ts`. A screen folder that also needs that type imports it from `features/components/`, the same way it imports the component itself.

## Where this fits with `module-boundaries.md`

`module-boundaries.md` fixes the top-level `/features` boundary: it never imports `/adapters` or `/persistence` directly. This file adds the one rule needed once more than one screen exists inside `/features` — the internal split between screens and shared components, and the direction that split must run.
