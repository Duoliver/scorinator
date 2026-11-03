# Task 180: A hint with the full team name on a cut name

**Status:** Not started

## Goal

Show the full team name in a hint when the pointer is on a name that the screen cuts with an ellipsis. The group cards of League Detail cut a long name (Task 131). The user asked for it at the Task 131 review.

## Acceptance criteria

Proposed on 2026-11-02. To agree with the user when the task starts.

- [ ] A `design-system/` piece first (`design-reference/README.md`): a text that cuts with an ellipsis, and shows the `Tooltip` with its full text only when the text is cut.
- [ ] A name that is not cut shows no hint, and is not a Tab stop.
- [ ] A keyboard user can read a cut name. To settle: a Tab stop on each cut name, or no keyboard hint because a screen reader reads the full text already.
- [ ] The group cards of League Detail use it for the team names.
- [ ] Other places that cut a team name use it too. To list at the start, for example the Teams step group rows (Task 130).

## Notes

- **2026-11-02:** Task created by User at the Task 131 review: "there could be a tooltip for when hovering an ellipsed team name which would show the full name." Today a `Tooltip` text trigger is always a Tab stop, so the piece must check for the cut before it adds the hint. Task 166 (a hint that follows the pointer) is near: one task can take both, if the user wants. About 2 to 3 hours.

## Report

Write this before the task goes to Review.
