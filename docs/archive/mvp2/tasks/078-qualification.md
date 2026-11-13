# Task 078: settle open decision 4, qualification

**Status:** Done (2026-10-27)

## Goal

Decide how the app orders teams that stay level when the order decides qualification or a bracket seed. Decide how to seed teams from different groups against each other. Tasks 86, 87, 89, and 92 build on these rules.

## Acceptance criteria

- [x] The user picks the last-resort tie-break, and where its result lives, if it is stored.
- [x] The user picks one mini-league pass or the recursive version.
- [x] The user picks how to seed teams from different groups.
- [x] The `PROGRESS.md` Decisions log has an entry for the choices.
- [x] The `PROGRESS.md` Open questions list no longer has decision 4.
- [x] The report below records the choices and their effect on Tasks 86, 87, 89, and 92.

## Notes

- **2026-10-27:** Facts from the code. `calculateStandings` (`src/engine/standings/standings.ts`) orders by points, goal difference, goals for, then one mini-league pass among the level teams, then roster order. Teams still level share a `position`. The function is pure, and `StandingsView` calls it on each render, so a random draw inside it would change the order on each render. In MVP1 a tie changes only the display. In MVP2 it can decide who qualifies and each bracket seed. The MVP2 spec says bracket slotting is simple seed order, with no anti-clash placement.
- **2026-10-27:** The user agreed the criteria. The user chose fixed lots from UUIDs, the recursive mini-league, and seeding by place, then stats.

## Report

- **What was built:** no code. Decision 4 is settled.
  1. **Last resort:** fixed lots. The order comes from a hash of the league UUID and each team UUID. It is deterministic, not random, so it needs no `Rng` and no stored draw. It gives the same order on each render, and a re-scorinate needs no reset. It replaces the MVP1 roster order.
  2. **Mini-league:** recursive. When a mini-league separates only some of the level teams, a new mini-league runs among the teams still level, until nothing changes. Then the last resort applies. This replaces the MVP1 one-pass rule (MVP1 Task 4).
  3. **Seeding across groups:** by place, then stats. All group winners take the top seeds, then all runners-up, and so on. Inside each place: points, goal difference, goals for, then the last resort. If group sizes differ, compare per match played. A winner can meet a runner-up from its own group, because the spec has no anti-clash rule.
- **Test approach:** none, no code changed.
- **Decisions made:** logged in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Effect on other tasks:**
  - **Engine:** `engine/` does not know UUIDs. So `calculateStandings` takes the last-resort key from its caller, for example a number for each team. The app computes the hash. The recursive mini-league replaces one pass in `orderAndPosition`.
  - **Task 86 (League Format):** "best third-placed teams" style advancement uses the same cross-group order, if the refined stories allow it.
  - **Task 87 (Groups):** decide how the table shows teams that the lots separate. Today they share a `position`, shown as `-`. If one qualifies and one does not, the table must make that clear.
  - **Task 89 (Bracket Phase):** seeds come from the cross-group order above.
  - **Task 92 (Phase Transition):** open point found in this task. Can the user re-scorinate a match of a finished phase after the next phase starts? If so, the qualifiers can change. One option: an earlier phase locks when the next phase starts.
- **What is left, what is next:** decision 5 (Task 79) is deferred by the user. Next is decision 6 (Task 80).
