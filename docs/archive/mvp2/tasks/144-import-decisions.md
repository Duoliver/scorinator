# Task 144: Import decisions

**Status:** Done

## Goal

The rules that decide what an import of leagues or Blueprints does: an unknown UUID, the same content, a conflict, Skip, Import as new, and the embedded Blueprint rule (US-11.2, US-10.3). This task gives the rules and the store actions that apply them to entities in memory. Task 145 reads the files, and Task 149 gives the screens and the dialogs.

## Acceptance criteria

The user agreed the criteria on 2026-11-04.

- [x] A plan step sorts each selected entity: an unknown UUID is `new`, a known UUID with the same content is `same`, and the rest is `conflict`.
- [x] Same content means every field is equal, except `createdByInstallation` and `lastModifiedByInstallation`. For a league, the fields of the League and of its Team Instances count.
- [x] An apply step takes the plan and one choice for each conflict: Skip or Import as new. It never changes a local entity.
- [x] `new` imports the entity as it is, with the provenance of the file (US-11.1).
- [x] `same` imports nothing, and counts as "already up to date".
- [x] Skip keeps the local entity and drops the incoming one.
- [x] Import as new gives a fresh UUID, and the local installation in both provenance fields.
- [x] A Blueprint imported as new gets a unique slug by the `-2` rule (Task 75). Its name stays.
- [x] A league imported as new keeps its name. Its Instances keep the UUIDs of their Blueprints.
- [x] For each embedded Blueprint of an imported league: an unknown UUID adds the Blueprint, and a known UUID keeps the local one, with no prompt.
- [x] The apply step returns the counts for the message: imported, skipped, imported as new, already up to date.
- [x] An imported league is unsaved, and Ctrl+S saves it as a new wrapper file.
- [x] Unit tests for the generic rules. Integration tests for the store actions: each path of US-11.2, and the embedded Blueprint rule.

**Out of scope:** the file parsers and the format versions (Task 145). The `.zip` (Task 146). The picker, the "Resolve conflicts" dialog, the "all" buttons, Cancel, and the messages (Task 149). Cancel needs no rule here: the dialog does not call the apply step.

## Notes

- **2026-11-04:** Facts from the code and the docs.
  - Open question (Task 104): `persistence/` cannot import `domain/`. `module-boundaries.md` also calls `persistence/` "interfaces only". It lists "skip/fork conflict resolution" under `engine/identity`.
  - `docs/tdd.md` names "conflict resolution" as pure decision logic with unit tests.
  - The CSV import already has a plan and apply pair in `app/state/teamBlueprintActions.ts` (`planTeamImport`, `importTeamBlueprints`). The new actions can follow it.
  - The app loads a league wrapper only when the user opens it (`PERSISTENCE.md` §2b). A known league UUID can belong to a league that is not loaded.
  - The fixed lot of a team hashes the league UUID with the team UUID (`engine/identity/lot.ts`, Task 78). The standings compute it live, it is not stored.
- **2026-11-04:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | Where the rules live | Generic rules in `engine/identity`, over an entity with a `uuid` and an injected compare, as the module map says. The domain parts go in `app/state`: the compare, the fork, the slug, the embedded Blueprints. This settles the Task 104 open question. | ⚠ The Module column changes from `persistence/` to `engine/identity`, `app/state`. |
  | 2 | The scope | The rules and the store actions, over entities in memory. No files, no screens. | |
  | 3 | A known league that is not loaded | The plan step loads the local wrapper from disk to compare it. So the league plan is async. | |
  | 4 | An unknown Blueprint whose slug is taken locally | It imports with a unique slug by the `-2` rule, as Import as new does. Its UUID and other fields stay. | ⚠ US-11.2 says "imports as it is". Without the change, two Blueprints share a slug, which US-09.5 forbids. |
  | 5 | The lots of a league imported as new | Accept a new lot order. The fresh UUID gives new lots, so a full tie on every football criterion can change its order. The stored seeds and qualifiers do not change. | ⚠ A table of a phase that is complete can then show a level pair in another order than the one that qualified. Option B: store a lot key on the League. That changes the file format. |
- **2026-11-04:** The user agreed the criteria and the 5 choices.

- **2026-11-04:** Two choices made during the work, for the user to check at review:

  | # | Choice | Made | Flag |
  |---|---|---|---|
  | 6 | Which embedded Blueprints a league import adds | Only the snapshots that an Instance of an added league names. A skipped league or a same league adds none. Two leagues that name one Blueprint add it once. | ⚠ The story says "for each embedded Blueprint snapshot". A snapshot that no added league names stays out. |
  | 7 | The shape of the input | `importLeagues` takes the snapshots of the whole file as one list. Task 145 does not need to group them by league. | |
- **2026-11-04:** The user agreed choices 6 and 7, and that the task is Done.

## Report

- **What was built:**
  - `engine/identity/importPlan.ts`: `planImport` sorts each item as new, same, or conflict. `resolveImport` applies the choices and gives the counts. `isSameContent` compares two values at any depth and skips the given keys. All three are generic over an item with a `uuid`.
  - `app/state/importActions.ts`: `planBlueprintImport` and `importBlueprints`, `planLeagueImport` (async, choice 3) and `importLeagues`. They compare without the provenance fields, make the copy for Import as new, give a free slug (choice 4), and add the embedded Blueprints.
- **Test approach:** 9 unit tests for the engine rules. 13 integration tests for the store actions, on the real store and an in-memory folder: each path of US-11.2 for Blueprints and leagues, the slug rule, the embedded Blueprint rule, the load of a known league, and Ctrl+S after an import. 1717 tests pass. No screen uses the actions yet: Task 149 does.
- **Decisions made:** choices 1 to 5 in the `PROGRESS.md` Decisions log on 2026-11-04. The user agreed choices 6 and 7 at review. The Task 104 open question is closed by choice 1.
- **What is left, what is next:**
  - Task 145 reads the league and Blueprint files, and gives the entities to these actions.
  - The plan and the apply are two calls. If the store changes between them, for example a new Blueprint with the same UUID, the apply does not plan again. Task 149 must keep the conflict dialog modal, so that no edit comes between the two calls.
