# Task 145: League and Blueprint files

**Status:** Done

## Goal

The two export files of the File module: the league file (one or many leagues, with their Blueprint snapshots) and the Blueprint file (all Blueprints, with UUID and provenance). Each file has a format version. The read gives the domain records that the Task 144 import actions take, or an error that says which import button to use (US-10.1 to US-10.3).

## Acceptance criteria

The user agreed the criteria on 2026-11-04.

- [x] `adapters/json-io` writes and reads a league file: `kind: 'leagues'`, `formatVersion`, `leagues` (each league with its Instances, as in a wrapper file), and `blueprints` (the snapshots).
- [x] `adapters/json-io` writes and reads a Blueprint file: `kind: 'blueprints'`, `formatVersion`, `blueprints`, with UUID, provenance, name, colour, slug, Tier, Location, and trigrams (US-10.2).
- [x] One league and many leagues use the same file shape (US-10.1, US-10.2).
- [x] The league file holds a snapshot of each Blueprint that an Instance names and that still exists. A deleted Blueprint has no snapshot (US-10.1).
- [x] The read checks the format version, as the database files do. A newer version gives the "newer version" error.
- [x] The read rejects two leagues or two Blueprints with the same UUID in one file.
- [x] Each wrong file gives its own error, and imports nothing (US-10.3). See choice 4 for the texts.
- [x] `app/data` maps the files to the domain types: `LeagueWrapper[]` with `TeamBlueprint[]`, and `TeamBlueprint[]`.
- [x] A test exports a league, reads the file, and imports it into an empty database with the Task 144 actions. The league and its Blueprints are equal to the original (US-10.1, US-11.1).
- [x] Unit tests for each file shape, each error, and a round trip.

**Out of scope:** the save and open dialogs, the picker, and the messages (Task 149). The export menu (Task 150). The `.zip` (Task 146). The team list import of the Teams screen (`.csv` or a plain `.json` list), which does not change.

## Notes

- **2026-11-04:** Facts from the code.
  - `adapters/json-io/database.ts` reads and writes `manifest.json` and `wrapper-{uuid}.json`, with `kind` and `formatVersion` (Task 106). The parsers read versions 2 to 4. The current version is 4 (Task 139).
  - The readers of a league, an Instance, and a phase already exist for the wrapper file. The Blueprint reader exists for the manifest, with the error prefix `manifest.json is not valid:`.
  - `isMvp1File` finds an MVP1 league save file or an MVP1 teams JSON (a plain list).
  - The Teams screen still imports a plain `.json` team list with `parseTeamsJson` (Task 29). That is a team list, not an MVP2 Blueprint file.
  - Task 144 choice 7: `importLeagues` takes the snapshots of the whole file as one list.
- **2026-11-04:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | Where the snapshots go | One `blueprints` list for the whole league file, with no copy of a Blueprint that two leagues name (Task 144 choice 7). | The spec says each league "embeds" its snapshots. One list keeps each Blueprint once. |
  | 2 | The format version | The same counter as the database files, now 4. The league file reuses the wrapper readers, so one counter keeps them in step. | |
  | 3 | The scope | The file shapes in `adapters/json-io`, and the map to the domain types in `app/data`. No dialogs. | |
  | 4 | The wrong-file errors | MVP1 file: "This file is from Scorinator MVP1. MVP2 cannot import it. Move your teams with the CSV." (US-10.3). A Blueprint file in "Import leagues": "This is a team blueprints file. Use \"Import teams\" for it." A league file in "Import teams": "This is a league file. Use \"Import leagues\" for it." A database file (`manifest.json` or a wrapper file): "This file is part of a database folder. Use \"Import database\" with a .zip file." | ⚠ The last three texts are new. Task 149 shows them. |
  | 5 | A plain JSON list in "Import teams" | The MVP1 message, as US-10.3 says. The Teams screen keeps its own team list import. | ⚠ The same `.json` list gives an error in the File screen and imports on the Teams screen. |
- **2026-11-04:** The user agreed the criteria and the 5 choices.

- **2026-11-04:** Three choices made during the work, for the user to check at review:

  | # | Choice | Made | Flag |
  |---|---|---|---|
  | 6 | An empty file | A league file with no league, or a Blueprint file with no Blueprint, is not valid. The File screen disables both exports when there is nothing to export (US-10.2). | |
  | 7 | An error in one of many leagues | The error names the league: "A league file is not valid: league 2: team 1 has no valid OVR." | |
  | 8 | Two Blueprints with one slug in a file | Allowed. The manifest rejects it, but the import gives the second one a `-2` slug (Task 144 choice 4). | |
- **2026-11-04:** The user agreed choices 6 to 8, and that the task is Done.

## Report

- **What was built:**
  - `adapters/json-io/exportFiles.ts`: the league file (`kind: 'leagues'`) and the Blueprint file (`kind: 'blueprints'`), with write, read, and checks. `detectFileKind` finds the kind of any file, also an MVP1 file.
  - `adapters/json-io/database.ts`: `readWrapperBody` holds the wrapper reader, so a league file reads each league with it. The Blueprint reader takes the error prefix of its file. The kind error names a league file "league file" and a Blueprint file "team blueprints file".
  - `app/data/exportFile.ts`: `serializeLeagueExport`, `readLeagueImport`, `serializeBlueprintExport`, and `readBlueprintImport`, with the wrong-file texts of choices 4 and 5. `app/data/databaseFile.ts` gives its league and Blueprint maps to it.
- **Test approach:** 21 unit tests for the file shapes: round trips, the field order, each error, and `detectFileKind`. 16 tests in `app/data`: the snapshot rule, the domain round trip, each wrong-file text, and the US-10.1 test that exports a league and imports it into an empty database with the Task 144 actions. 1754 tests pass.
- **Decisions made:** choices 1 to 5 in the `PROGRESS.md` Decisions log on 2026-11-04. The user agreed choices 6 to 8 at review.
- **What is left, what is next:** no dialog and no screen use these functions yet. Task 149 adds the File screen, and Task 150 adds the export menu.
