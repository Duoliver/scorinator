# Task 172: Edit a team for this league, in the wizard

**Status:** Done

## Goal

Give each row of the wizard team list ✎ Edit: a drawer that changes the Instance of this league only (US-08.4), with the OVR rules of Task 116 and a fixed trigram (US-09.6).

## Acceptance criteria

The user agreed these criteria on 2026-10-30, as part of Task 121 (choice 1 split it from Task 121).

**The Edit drawer (US-08.4, US-09.6):**

- [x] ✎ Edit opens the team drawer, titled "Edit team for this league".
- [x] An "Original state" block, read only: the Blueprint name, colour, slug, base Tier, and Location. With a deleted Blueprint, the block says "The team was deleted from the Teams module."
- [x] The fields: "Team name", "Colour", "Tier", "OVR", and "Trigram". The slug shows read only: the Instance slug.
- [x] The OVR field shows the Tier range, for example "OVR (60 to 69)". "Save" refuses a value outside it (`isOvrInTier`, Task 116).
- [x] A Tier change rolls a new OVR from the new Tier at once (`ovrAfterTierChange`, Task 116).
- [x] A typed trigram is fixed for the team. It must have the trigram format, and no other team of the list can have it fixed. An empty field goes back to the pick.
- [x] Two teams of the list cannot have the same name. The drawer shows the reason, and "Save" saves nothing.
- [x] "Save" changes the Instance only. The Blueprint and every other league stay the same.
- [x] "Reset to original" puts back the Blueprint name, colour, and Tier, rolls a new OVR, and clears the fixed trigram (choice 9).

**Code:**

- [x] The shared `TeamForm` parts move to a place both forms can import, with no change to the Blueprint form.
- [x] Integration tests with Testing Library for the drawer and the Teams step.
- [x] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass.

**Out of scope:** an edit after "Create league" (`scorinator-future-features.md` §1). An edit of the Blueprint from the wizard.

## Notes

- **2026-10-30:** Split from Task 121 (choice 1). Facts from the code are in the Task 121 notes. The fixed trigrams live in the draft as a map (Task 121, choice 2). Task 121 builds the live pick that the fixed trigram feeds.

- **2026-10-30 (review):** The user asked for the Tier and the OVR on one row. They now sit in two equal grid columns, `minmax(0, 1fr)` each, with the OVR error under the OVR field. A plain `1fr` kept the minimum width of the content, so the columns were 150 px and 187 px. Measured in WebKit after the fix: 169 px and 169 px.

## Choices for discussion

The user agreed these choices on 2026-10-30, with the Task 121 numbers.

| # | Choice | Effect | Undo cost |
|---|---|---|---|
| 8 | A fixed trigram must differ only from the other fixed trigrams. The pick moves the other teams. | The user can take a code that another team got from the pick. | Low |
| 9 | "Reset to original" also clears the fixed trigram. | The team goes back to the pick, as a new add. | Low |
| 10 | The Edit drawer is a new component in `TeamsStep/`. It reuses parts of `TeamForm`: the name, colour, and Tier fields as one shared block, the field error line, the name check, and the colour and Tier options. Changed by the user on 2026-10-30. | `TeamForm` stays the Blueprint form, and the two forms share their common fields. | Low |

## Report

- **What was built:**
  - `features/components/TeamForm/fields.tsx`: `TeamNameField`, `TeamColourField`, `TeamTierField`, `FieldError`, and `checkTeamName`, exported from `features/components`. `TeamForm` uses them, with no change to its behaviour.
  - `TeamsStep/EditTeamDrawer/`: "Edit team for this league", with the Original state block, the name, the read-only slug, the colour, the Tier, the OVR with its range in the label, the trigram with the live pick as its placeholder, Save, Cancel, and "Reset to original". A Tier change rolls a new OVR at once.
  - `useTeamList.updateTeam` changes the Instance, and sets or clears its fixed trigram. The Teams step gets ✎ Edit, before ⇄ and ✕.
- **Test approach:** 21 new tests. Integration tests with Testing Library for the drawer: the title, the Original state, a deleted Blueprint, the start values, the placeholder, the Tier roll and the range, a Save, an empty trigram, the four refusals (OVR out of range, a decimal OVR, a bad trigram, a trigram fixed by another team), a name of another team, a name with no letter, Reset, and Cancel. The Teams step: an edit that changes the Instance and not the Blueprint, the pick with a fixed trigram, the name refusal, and a removed team that loses its fixed trigram. The wizard: an edit and a fixed trigram reach the created league. The `TeamForm` tests pass with the shared fields. A WebKit screenshot outside the project shows the drawer after a Tier change. Full suite: 953 tests pass. Lint, format check, type check, and `npm run build` pass.
- **Decisions made:** choices 8, 9, and 10, agreed by the user. Claude choices:
  - The fields are shared one by one, not as one block: the two forms put them in a different order.
  - The drawer order: Original state, name, slug, colour, Tier and OVR on one row (user request at review), trigram. "Reset to original" sits in a row below "Cancel" and "Save", in the `outline` look, as "Delete team" in the team drawer.
  - The error texts: "Another team of this league has this name.", "Use a whole number from 70 to 79.", "Use 3 letters or digits.", and "Another team has this trigram fixed.".
  - The Original state shows the Blueprint name, colour, slug, Location, and Tier in one row.
- **What is left, what is next:** Task 168 (the import confirm), Task 169 (the `Input` slot), then the M2 smoke check (Task 122).
