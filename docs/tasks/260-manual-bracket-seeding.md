# Task 260: approve manual bracket seeding (C29), refine it, and plan its build

**Status:** Done

## Goal

The user needs to seed a bracket by hand. C29 widens to manual seeding, moves from Should to Must, and joins the build in a new milestone, M6. This task refines its stories and adds its build rows. It writes no code.

## Acceptance criteria

- [x] C29 widens to manual bracket seeding, and moves from Should to Must. `docs/scorinator-mvp3.md` shows the change, with a change note.
- [x] `docs/user-stories/mvp3/17-brackets-phases.md` holds the C29 stories, from the user's answers. The user agrees them. Claude asks, and does not propose the design.
- [x] The `PROGRESS.md` scope line names the C29 stories as approved.
- [x] Task 200 keeps C25 and C27 only.
- [x] The build rows for the C29 stories, from Task 261 on, are in the Task 205 map and on the status board, in a new milestone M6 after M5 (round 1 answer, and the user's choice B). M6 has its own demo and smoke check.
- [x] A `PROGRESS.md` Decisions log entry records the change.
- [x] No code changes.

## Notes

- **2026-11-16:** Task created by User. The user chose: widen C29 (one item, not a new candidate), Must and approved, into M4.
- **2026-11-16:** What exists today (MVP2): the seeds come from the phase before (US-04.2), or from a random draw for a first-phase bracket. The standard placement makes the tree. The Seed List has a bye star on each row (US-04.10). A bye change after the first result asks for a confirm and clears the bracket results. C29 said: pick a seeding method, for example World Cup pairs (future features §23).
- **2026-11-16:** Round 1 answers. (1) A first-phase bracket only, for now. (2) In League Detail. (3) Check first if a change of the tree slots is viable. (4) Drag and drop. (5) No change after the first bracket result. (6) Yes, a way back to the automatic seeds: everything can change until the first match. (7) Yes, C29 keeps the method choice. If the feature grows large, it moves to a new milestone, not M4.
- **2026-11-16:** Viability check of question 3. The tree is not stored. `BracketPhase` holds `seeds` and `byeTeams`, and `buildBracketTree` makes the tree with the standard placement each time. A new seed order needs no format change. A free tree slot needs a stored slot order, a format version change, and a new rule for the seed, because the higher seed hosts the second leg (Task 79). The code has one drag and drop today: the group cards (`features/leagues/GroupCards`), with the native HTML drag events.
- **2026-11-16:** The user parked the pick of a tree slot with the team picker modal (future features §43), for a refinement another day. C29 goes on with drag and drop only.
- **2026-11-16:** Round 2 answers. (1) Drag in the Seed List and on the tree. (2) The way back gives the stored random draw. (3) A first-phase bracket gets the stored random draw, then the user changes it by hand. The method choice (World Cup pairs) needs a phase before, so it stays in future features §23 for now. (4) The user asked which is harder: the bye change as today, or a lock at the first match. (5) Yes, the Bracket tab header changes after a manual change.
- **2026-11-16:** Finding: the app draws the first-phase seeds once, at the league create (`newLeague.ts`), with no stored random seed. A manual order that writes over `seeds` loses the draw. The way back needs the draw in its own stored field.
- **2026-11-16:** Round 3 answers. (1) A Seed List drop moves the row. (2) A tree drop on a team swaps the two teams. A drop on a bye side makes a tie with the bye team. (3) Claude picks the header text. (4) A mouse is enough. (5) The bye stars stay as today.
- **2026-11-16:** Claude wrote US-17.1 to US-17.3 in `docs/user-stories/mvp3/17-brackets-phases.md`, status Refined. The tree can keep its current shape: any first-round order maps to a seed order and a bye list, so the tree drop needs no stored tree. Draft build rows: a demo, an engine move function, the stored draw field, the store actions, the Seed List drag, the tree drag, and a smoke check. That is 7 tasks, so the milestone goes to the user.

- **2026-11-16:** The user agreed choices 1 to 6 and milestone option B. US-17.1 to US-17.3 are Agreed. Claude added M6 (Tasks 261 to 267) after M5.
- **2026-11-16:** The user agreed the review: Done.

## Report

- **What was built:** no code. C29 is a Must item now: manual seeding of a first-phase bracket, with drag and drop in the Seed List and on the tree. Three Agreed stories, US-17.1 to US-17.3. A new milestone M6, after M5, with seven tasks: 261 to 267.
- **Files changed:** `PROGRESS.md` (the scope line, rows 200 and 260 to 267, the milestone note, a Decisions log entry), `docs/tasks/205-mvp3-build-tasks.md` (the M6 map, a dated note), `docs/user-stories/mvp3/17-brackets-phases.md` (new), `docs/scorinator-mvp3.md` (C29 is Must), `docs/scorinator-future-features.md` (§43 new, a note on §23).
- **Test approach:** no code, no tests. The viability check read `engine/bracket/tree.ts`, `domain/league.ts`, and `engine/phases/phaseStart.ts`.
- **Decisions made:** the three rounds of answers, the six Claude choices, and option B. They are in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** Task 200 refines C25 and C27 only. The approved Must stories go from 21 to 24. Tasks 262 and 263 have no dependency, so they can start before the M6 demo.
- **Refactor:** No code, no refactor step.
