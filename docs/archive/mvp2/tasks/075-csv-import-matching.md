# Task 075: settle open decision 1, CSV import matching

**Status:** Done (2026-10-27)

## Goal

Decide how a team CSV import matches its rows to the Blueprints that already exist. MVP2 gives Blueprints a UUID, and JSON and league imports prompt Skip or Import as new on a conflict. The CSV has no UUID column, so it needs its own rule. Tasks 94, 95, and 96 build on this rule.

## Acceptance criteria

- [x] The user picks the CSV matching rule.
- [x] The user picks the slug rule for two Blueprints with the same name.
- [x] The `PROGRESS.md` Decisions log has an entry for each choice.
- [x] The `PROGRESS.md` Open questions list no longer has decision 1.
- [x] The report below records the choices and their effect on Tasks 94, 95, and 96.

## Notes

- **2026-10-27:** Facts from the code. `mergeImportedTeams` (`src/app/data/importMerge.ts`) upserts by slug: a known slug overwrites the team, a new slug appends. A blank CSV slug is filled from the name. `slug()` (`src/engine/identity/slug.ts`) does no de-duplication, so two teams with the same name share a slug. The CSV columns stay `ID/slug, Name, Colours, Tier` in MVP2 (MVP2 spec, Teams Module).

- **2026-10-27:** The user agreed the criteria. The user chose "Upsert, confirm first" over "Upsert, no confirm" and "Prompt each conflict". The user chose "Make it unique" over "Allow duplicates".

## Report

- **What was built:** no code. Decision 1 is settled.
  1. **CSV matching:** a row whose slug matches a Blueprint updates its Name, Colours, and Tier. A row with a new slug creates a Blueprint with a fresh UUID. Before the import applies, one confirm dialog shows the counts, for example "4 new, 8 updated. Continue?". Cancel changes nothing.
  2. **Unique slugs:** a second Blueprint with the same name gets the suffix `-2`, a third gets `-3`. Each CSV row then matches one Blueprint at most.
- **Test approach:** none, no code changed.
- **Decisions made:** both rules, logged in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Effect on other tasks:**
  - **Task 94 (Teams Module):** `slug()` stays pure. The unique-suffix step needs the list of existing slugs, so it is a separate function that takes that list. The CSV update changes the Blueprint only. The Instances in league wrappers keep their own OVR and Tier.
  - **Task 95 (File Module):** the CSV import uses the same confirm modal primitive as the bracket cascade (impact review §2.13). JSON and league imports keep the Skip or Import as new prompt.
  - **Task 96 (Identity & Provenance):** CSV is the one import that matches by slug, not by UUID. The CSV columns do not change.
- **What is left, what is next:** two points for Task 94. Does a Blueprint keep its slug when the user renames it? Does the unique suffix also apply to a CSV row with a blank slug? Next is decision 2 (Task 76).
