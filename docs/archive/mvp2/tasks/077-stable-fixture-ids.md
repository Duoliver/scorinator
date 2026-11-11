# Task 077: settle open decision 3, stable fixture IDs

**Status:** Done (2026-10-27)

## Goal

Decide how a fixture gets an identity that stays the same across phases, groups, two-legged ties, and replays. A result must find its fixture by that identity. Tasks 86 and 89 build on this rule.

## Acceptance criteria

- [x] The user picks how a fixture is identified.
- [x] The `PROGRESS.md` Decisions log has an entry for the choice.
- [x] The `PROGRESS.md` Open questions list no longer has decision 3.
- [x] The report below records the choice and its effect on Tasks 86 and 89.

## Notes

- **2026-10-27:** Facts from the code. `Fixture` (`src/engine/round-robin/types.ts`) has `matchday`, `home`, and `away`, and no ID. A result finds its fixture by `isSameMatch` and `matchKey` (`src/engine/round-robin/schedule.ts`), which compare that triple. `LeagueRecord` (`src/domain/league.ts`) keeps `fixtures`, `byes`, and `results` as flat arrays. In MVP2, matchday numbers restart in each phase, groups share matchday numbers, and two-legged ties and replays repeat the same pairing. A bracket tie exists before its teams are known (TBD).
- **2026-10-27:** The user agreed the criteria and chose "Position ID". The user asked if the rule fits mixed-format leagues. Claude checked the cases and proposed one change: a phase with no groups uses `g1`, so every round-robin id has the same shape.
- **2026-10-27:** The user chose `g1` for a phase with no groups. The user chose to settle the third-place match now: a toggle for each bracket phase. The user asked for named ties: `third` for the third-place match and `final` for the final, in place of `t1`. The user noted that a third-place match is usually played before the final.
- **2026-10-27 (review):** The user asked for the third-place toggle line in the MVP2 spec. Added to `docs/scorinator-mvp2.md`, Bracket Specifics, after the away-goals line. No other spec text changed.

## Report

- **What was built:** no code. Decision 3 is settled.
  - **Rule:** each fixture gets an `id` when its phase starts, built from its position. The id is unique in its league. A result stores the `fixtureId`. Code treats the id as opaque and never parses it. No random source is needed, so tests stay stable.
  - **Round robin:** `p{phase}.g{group}.md{matchday}.m{match}`, for example `p1.g2.md3.m4`. A phase with no groups uses `g1`.
  - **Bracket tie:** `p{phase}.r{round}.t{tie}`, for example `p3.r2.t1`. Its matches are `.leg1`, `.leg2`, and `.replay`. AET and penalties are part of a match result, not new fixtures. A bye tie has a tie id and no match.
  - **Named ties in the final round:** the final is `p3.r3.final`. The third-place match is `p3.r3.third`.
  - **Third-place match:** a toggle for each bracket phase, like the away-goals toggle. Off by default.
- **Test approach:** none, no code changed.
- **Decisions made:** logged in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Checked for mixed-format leagues:** two round-robin phases in a row, groups that share matchday numbers, single duels and two-way, two-legged ties, replays, byes and TBD teams, the re-scorinate cascade, and an MVP3 Season with several leagues. Each case gets unique, stable ids.
- **Effect on other tasks:**
  - **Task 86 (League Format):** the phase number in the id is its position in the league. Ids are made when the phase starts, so a phase change during setup changes no id.
  - **Task 89 (Bracket Phase):** add the third-place toggle to the refined stories. Show and play the third-place match before the final. Proposed default, for the user to confirm in Task 89: a single-match tie has one match, `.leg1`.
  - **MVP2 spec:** the third-place toggle is new. At the user's request, `docs/scorinator-mvp2.md` (Bracket Specifics) has a line for it since 2026-10-27, after the away-goals line.
  - **Engine:** `isSameMatch` and `matchKey` (`src/engine/round-robin/schedule.ts`) change to compare ids. `MatchIdentity` and `LeagueResult` change with them.
- **What is left, what is next:** next is decision 4 (Task 78).
