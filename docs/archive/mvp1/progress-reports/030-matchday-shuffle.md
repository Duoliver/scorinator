# Task 30 — Shuffle the match order inside each matchday

**Status:** Done — 2026-10-05 (review closed by the user)

## What was built

`generateRoundRobin` (`engine/fixtures/roundRobin.ts`) takes an optional second parameter, `rng?: Rng`. With an `Rng`, it shuffles the order of the matches inside each matchday (Fisher-Yates on each matchday's run of fixtures). The pairings, the home and away sides, the byes, and the matchday order do not change. Without an `Rng`, the output is the same as before.

`leagueStore.addLeague` passes the same seeded `rng` it uses for the OVR roll. So in a new league, the first roster team no longer plays the first match of every matchday.

Cause, for the record: the circle method keeps the first slot fixed as the anchor, and the anchor is always in the first pairing of a round.

## Test approach

- `roundRobin.test.ts` (5 new unit tests): with an `Rng`, the same fixtures and byes as without one (for 4, 5, and 8 teams), still in matchday order, deterministic for one seed, and a statistical test. Over 200 seeds and 14 matchdays with 8 teams, the first roster team plays the first match in 20% to 30% of matchdays (a fair shuffle gives 25%). One more test pins the old behavior without an `Rng`. The existing determinism test now says "without an Rng".
- `leagueStore.test.ts` (1 new test): an 8-team league does not put the first team in the first match of all 14 matchdays. A real shuffle fails this with a chance of about 1 in 270 million, because the store seed is not injectable.

`type-check` and `lint` are clean. The full suite passes: 551 tests in 54 files (545 before).

## Decisions made

The user confirmed the approach on 2026-10-05: an optional `Rng`, and no roster shuffle. See the Decisions log in `PROGRESS.md`.

One judgment call: Prettier also reformats lines in `roundRobin.ts` and `roundRobin.test.ts` that this task does not touch. These two files were not Prettier-clean before. The diff keeps only the Task 30 lines, and the two files stay unformatted, as before.

## What is left, what is next

- Not in this task: a roster shuffle before generation (the `HUMAN.md` on/off idea). Today the same roster order always gives the same pairings on each matchday.
- Leagues created before this change keep their old fixture order. A loaded save file keeps the order it stored.
