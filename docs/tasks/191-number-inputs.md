# Task 191: Number fields as real number inputs

**Status:** Done

## Goal

Each field that takes only a whole number is a real `type="number"` input, so the user can change its value with the Up and Down arrow keys. The "Top" field of a wizard phase card is an example.

## Acceptance criteria

Proposed on 2026-11-10. The user agreed them with the three points below, on 2026-11-10.

- [x] Each number-only field below uses `type="number"`, with a `min`, and a `max` where a limit is known.
- [x] Up and Down change the value by 1. The new value goes to the plan or the draft at once, as a typed value does.
- [x] A field that is empty or holds a bad value still shows its problem text, as today (Task 129 choice 4, Task 177).
- [x] Integration tests for the arrow keys on one field of each screen.

The fields with `inputMode="numeric"` today:

- The wizard phase card: "Group size" or "Group count", "Top", and "Best of place N + 1" (`PhaseCard.tsx`).
- The zone editor: "From" and "To" (`ZoneEditor.tsx`).

The fields with `type="number"` today, to check for the arrow keys only: the three points fields of the Details step, and the OVR field of the Edit drawer.

**Out of scope:** the trigram and text fields.

## Notes

- **2026-11-10:** Task created by User - 2026-11-10: "turning number-only inputs into real type number inputs so I can change the values up and down with the arrow keys. The 'top' input for qualifiers in league setup phase 2 (phases) is an example."
- **2026-11-10:** Facts from the code.
  - The phase card fields use `inputMode="numeric"` with a text value (Task 129 choice 6). A text that is not a whole number gives `NaN` in the plan, and the fit check reports it (choice 4). A number input gives `''` for a bad value, so the check must still see a bad value.
  - `Input` already passes `type`, `min`, `max`, and `step`.
  - The fields are uncontrolled, so a value from the arrow keys reaches the `onChange` handler as a typed value does.
  - To settle at the start: the `max` of each field, for example "Top" up to the team count of the phase, and a hidden spin button or the browser default.
- **2026-11-10:** The user settled three points: (1) each field gets its highest value, for example "Top" up to the team count of the phase. (2) A bad value still shows its problem text. (3) The spin buttons keep the browser default.
- **2026-11-10:** During the work.
  - jsdom does not change a number field on the Up arrow: `userEvent.keyboard('{ArrowUp}')` leaves the value as it is. `stepUp()` works. So the tests call `stepUp()` and send an `input` event, as the browser does on an arrow key. The real-app check covers the key itself.
  - The ranges come from a new `getPhaseFieldRanges` in `phaseChecks.ts`, with the same numbers as `checkPhaseFit`: the group size up to the team count, the group count up to half of it, Top up to the team count less 1 or the smallest group less 1, and the best M up to the group count less 1. The highest values show only when the team count is known. The Phases step comes before the Teams step, so a new league first gets the lowest values only.
  - The zone "From" and "To" fields get a lowest value of 1, and no highest value (Task 189 choice 7).
  - A number field gives its value as a number to `toHaveValue`, so 7 older checks changed from `'2'` to `2`.
- **2026-11-10:** The user checked the real app and agreed that the task is done.

## Report

- **What was built:** the group size or count, Top, and Best fields of a phase card, and the zone "From" and "To" fields, are `type="number"` fields with their lowest and highest values. The Up and Down arrows change them, and the plan follows at once. An empty or bad value still shows its problem text. The points and OVR fields were already number fields.
- **Test approach:** 5 unit tests for `getPhaseFieldRanges`. 5 `PhasesStep` tests and 1 `ZoneEditor` test check the type, the range, and a value change from `stepUp()`. The test of an empty Top checks the problem text. 2052 tests pass. Type check, lint, and Prettier are clean. The arrow keys need the real-app check.
- **Decisions made:** the three points the user settled, in the notes.
- **What is left, what is next:** Task 158.
