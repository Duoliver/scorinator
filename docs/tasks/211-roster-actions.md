# Task 211: the Season roster actions

**Status:** Refactor

## Goal

Let the store add Blueprints to a Season roster, and edit a Season team. A join rolls the OVR and gives each team a free name and trigram, with the rules of Task 208. Task 213 builds the Teams tab on these actions (Task 205, M1).

## Acceptance criteria

- [x] A Blueprint joins the roster with its OVR rolled once, from its Tier. This is its base OVR (US-13.4).
- [x] A team that clashes on its name gets its Location, or the first free number (US-13.4, Task 208).
- [x] The first batch picks its trigrams. A later join picks from the free trigrams. A join never changes a picked trigram (US-13.4).
- [x] The roster keeps the join order.
- [x] The user edits the name, the colour, the Tier, the OVR, and the trigram of a Season team. The OVR stays in the Tier range. The name and the trigram stay unique in the Season (US-13.4).
- [x] An edit reaches every league of the Season, because they share the one Season team (US-13.4).
- [x] A finished Season takes no join and no edit (US-13.9).
- [x] Store tests written first (`docs/tdd.md`). The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-13:** Started. Inputs: Task 208 (`pickJoinNames`, `pickTrigrams`, `fixedLot`), Task 210 (`seasonActions.ts`, `requireRunningSeason`), `app/state/teamInstances.ts` (`newTeamInstances` rolls the OVR), `engine/tier-ovr` (`isOvrInTier`, `ovrAfterTierChange`), the wizard Edit drawer (`useEditTeam`: the roll on a Tier change happens in the drawer). Six choices sent to the user.
- **2026-11-13:** The user agreed the six choices. (1) `addSeasonTeams` and `updateSeasonTeam` in `seasonActions.ts`. (2) A join skips a Blueprint in the roster, and throws for an unknown one. (3) The names with `pickJoinNames` and `fixedLot(seasonUuid, blueprintUuid)`. (4) The trigrams with `pickTrigrams`, the roster trigrams fixed. (5) The edit checks the name, the OVR range, and the trigram, and throws. (6) A running Season, and the stamp.
- **2026-11-13:** Tests first: 19 new cases failed, then passed.
- **2026-11-13:** Claude choices in the code, for the review. (a) A Blueprint UUID twice in one call joins once. (b) `addSeasonTeams` takes an injected `Rng`, as `newTeamInstances` does, so a test can fix the roll. (c) The edit trims the name, and writes the trigram in capitals: "atw" becomes "ATW". (d) A roster team goes into the trigram pick with an empty trigram list, because its trigram is fixed.
- **2026-11-13:** The user agreed the review and the Claude choices. Commit 1. Status Refactor.

## Report

- **What was built:** `addSeasonTeams` and `updateSeasonTeam` in `app/state/seasonActions.ts`. The store helper of Task 210 also takes a new roster.
- **Test approach:** store tests in `seasonActions.test.ts`, 19 new cases. The join: the order, the OVR in the Tier range, the first batch trigrams, a later join, the Location suffix, the number, the OVR precedence, the slug, the skip, an empty list, an unknown Blueprint, a finished Season. The edit: each field, the fields left out, the shared team, a case change, a blank or taken name, an OVR out of range, a bad or taken trigram, an unknown team, a finished Season. The full suite passes: 2182 tests. The type check, the lint, and the format check pass.
- **Decisions made:** the six choices (Decisions log). The Claude choices (a) to (d) are in the notes.
- **What is left:** Task 213 builds the Teams tab, the add dialog, and the edit drawer on these actions. The drawer rolls the OVR on a Tier change with `ovrAfterTierChange`.
- **Refactor:** waits for the review.
