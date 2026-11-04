# Task 139: bracket state

**Status:** Done (2026-11-03)

## Goal

Give a league a real bracket phase: start it, store it, play its ties, and change its byes. The actions in `app/` call the engine of Tasks 134 to 137. The league files get the bracket phase. This task adds no bracket screen: Tasks 140 to 142 build the screens and turn on the paths to a bracket.

Stories: US-04.2 (the first-phase draw, stored), US-04.5 (one tie, or every playable tie), US-04.6 (the re-scorinate clear), US-04.10 (the bye change, stored). The state and file rows only.

## Acceptance criteria

### The domain and the plan

- [x] A `BracketPhase` in `domain/league.ts`: `format: 'bracket'`, `seeds` (Blueprint UUIDs in seed order), `byeTeams`, and `results` (the Task 137 `BracketTieResult` list). `Phase` and `PhaseFormat` include it.
- [x] `BracketPlan` gets its settings: `rules`, the Task 137 `BracketRules` without `homeAdvantage`. The defaults follow the stories: single match, away goals off, AET on, penalties, single-match final off, third place off.
- [x] `buildPhase` builds a bracket phase. Phase 1 draws its seeds with `drawBracketSeeds` (US-04.2). A later phase takes the qualifiers in seed order. The top seeds get the byes (`defaultByeTeams`).
- [x] A selector gives the tree of a bracket phase from its seeds, its byes, and the third-place setting (`buildBracketTree`).

### The actions (`app/state`)

- [x] `createLeague` with a bracket phase 1, and `startNextPhase` into a bracket, build the bracket phase. The draw is stored.
- [x] `scorinateBracketTie(leagueUuid, tieId)` plays one tie with a fresh seed, the stored OVRs, and the league home advantage. On a tie with a result, it clears the dependent ties first (US-04.6).
- [x] `scorinateBracket(leagueUuid)` plays every playable tie, and only those (US-04.5).
- [x] `setBracketByes(leagueUuid, byeTeams)` stores the new bye teams. If the phase has a result, it clears every result of the phase first (US-04.10). Too few bye teams is allowed: the tree then says "missing byes".
- [x] Each action stamps the league with the local installation, as the other actions do.
- [x] The league progress has a bracket kind: the phase and the slot count of the current round, for the dashboard card. A complete bracket as the last phase is "completed".

### The files (`adapters/json-io`)

- [x] The wrapper file reads and writes the bracket phase and the bracket plan rules. The manifest reads and writes the bracket progress.
- [x] The format version goes to 4. The parsers read versions 2, 3, and 4. A bracket plan with no `rules` reads with the defaults.
- [x] A bad bracket phase gives a clear error, as for the other phases: an unknown team, a seed twice, a bye team that is not a seed, a result for an unknown tie.
- [x] A round trip test: save a league with a played bracket, read it back, and get the same league.

### The screens that exist

- [x] The current screens compile with the new phase kind, and do not crash on a bracket phase. A bracket phase shows no fixtures and no standings until Task 141.
- [x] The dashboard card shows the round name of a bracket progress, for example "Quarter-finals".
- [x] Type check, lint, Prettier, and the full test suite pass.

## Out of scope

- The wizard bracket settings (Task 140). The wizard keeps "Create league" off for a bracket phase until Task 140.
- The Bracket tab, the tie cards, the confirm modals, and the "Start phase" button for a bracket (Tasks 141, 142). The button stays off with its Task 132 hint until Task 141.
- The text export of a bracket (Task 148).

## Notes

- **2026-11-03:** Facts from the code.
  - `createLeague` and `startNextPhase` (`app/state/leagueWrapperActions.ts`) throw for a bracket, and `buildPhase` (`engine/phases/phaseStart.ts`) throws "Task 139 adds it".
  - The wizard turns "Create league" off for any bracket phase ("Bracket phases come in a later update.", `useLeagueSetup.ts`). So no saved league holds a bracket plan or phase today.
  - League Detail turns "Start phase" off for a bracket next phase (Task 132 choice 4).
  - The file format is version 3 (Task 176), and the parsers read 2 and 3. `BracketPlan` is `{ format: 'bracket' }` only.
  - About 12 files read a phase: `app/state` (current phase, progress, phases, actions), `app/data` (database file, results text), and `features` (fixtures, standings, League Detail, the league summary).
- **2026-11-03:** `BracketRules` has a field `format` (the tie format), and `BracketPlan` has `format: 'bracket'`. So the rules go in their own `rules` field, not in the plan itself.
- **2026-11-03:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Effect | Undo cost |
  |---|---|---|---|
  | 1 ⚠ | A bracket phase stores its seeds, its bye teams, and its results. The tree is not stored: a selector builds it again from these and the plan. | Small files. A bracket change needs no tree migration. | Low now, high after a release |
  | 2 | `BracketPlan` gets `rules` here, with the story defaults, in the domain and the files. Task 140 adds only the wizard controls. | Part of Task 140 moves here, so this task can play a bracket with real rules. | Low |
  | 3 ⚠ | The file format goes to version 4. The parsers read 2 to 4. | An older app cannot open a database saved by this one. It says which versions it reads. | High after a release |
  | 4 | `buildPhase` builds the bracket: a draw for phase 1, the qualifier order after that, and the default byes. | One build path for every phase, as Task 175 did. | Low |
  | 5 | Three actions: `scorinateBracketTie` (a play and a re-scorinate), `scorinateBracket`, and `setBracketByes`. The confirms stay in the screens (Tasks 141, 142). | The screens call one action after a confirm. | Low |
  | 6 | The progress gets `{ kind: 'bracket', phase, round }`, where `round` is the slot count of the current round. The card shows `roundName(round)`. | The dashboard card shows "Quarter-finals". | Low |
  | 7 | No user path reaches a bracket in this task. "Create league" and "Start phase" stay off for a bracket until Tasks 140 and 141. Tests reach it through the actions. | No half-built screen for the user. The review is by the tests and the report. | Low |

- **2026-11-03:** Size: this is the largest M4 task. If the work runs long, the file part (format version 4) can split into its own task.

- **2026-11-03:** The user agreed the criteria and choices 1 to 7.

- **2026-11-03:** `BracketPlan.rules` is optional, not required. A required field changed 35 places that write `{ format: 'bracket' }`, most of them tests and dashboard summaries. `bracketRulesOf(plan)` gives the plan rules or the defaults, so choice 2 still holds. The manifest summary of a bracket stays `{ format: 'bracket' }`, with no rules.
- **2026-11-03:** A shared test helper, `scheduled(phase)` in `src/test/databaseRecords.ts`, narrows a phase to a round robin or Groups phase. About 40 old test lines read `fixtures` on any phase. They now call it.
- **2026-11-03:** Test order. The engine tests ran red first. The app, file, and screen code came before their tests. To prove the new tests, I broke the code in five ways: the bye change keeps the results, the rules lose the home advantage, the progress reads the wrong round, the parser accepts any tie id, and phase 1 takes no draw. Each break fails a test.

## Report

- **What was built:**
  - `engine/phases`: `BracketPlan.rules`, `DEFAULT_BRACKET_RULES`, `bracketRulesOf`, and the bracket branch of `buildPhase`.
  - `domain`: `BracketPhase`, `ScheduledPhase`, the bracket `LeagueProgress` kind, and a plain bracket `PhaseSummary`.
  - `app/state/bracket.ts`: `bracketRulesFor`, `bracketTreeOf`, `leagueOvrOf`, and `isBracketPhaseComplete`.
  - `app/state/leagueWrapperActions.ts`: `createLeague` and `startNextPhase` build a bracket. New `scorinateBracketTie`, `scorinateBracket`, and `setBracketByes`. The fixture actions throw on a bracket.
  - The progress of a bracket, and the card and header text, for example "Bracket · Quarter-finals".
  - `adapters/json-io`: format version 4, the bracket phase, the plan rules, the bracket progress, and their checks.
  - The fixtures view and the results text treat a bracket as a phase with no fixtures.
- **Test approach:** 47 new tests, 1593 tests in total.
  - Engine: the bracket build, the draw, the default byes, and the rules defaults.
  - Actions (`bracketActions.test.ts`, through the real store): the start, the selectors, one tie, a re-scorinate clear, one round for each call, the bye change, the missing byes, the stamp, and the progress.
  - Files: a round trip of a played 6-team cup with two legs, AET, replays, coin tosses, and a third-place tie. Eleven bad files, a version-3 file with a bracket, and the bracket progress.
  - Screens: the card and the header text.
  - Not tested in the real app on purpose: no user path reaches a bracket yet (choice 7).
- **Decisions made:** choices 1 to 7 above, in the `PROGRESS.md` Decisions log on 2026-11-03. The optional `rules` is in the notes.
- **What is left, what is next:**
  - Task 140 adds the wizard bracket settings, writes `rules` into the plan, and turns on "Create league" for a bracket.
  - Task 141 adds the Bracket tab, and turns on "Start phase" for a bracket.
  - A database saved by this version needs this version or later to open (format version 4).
