# Epic 06: Single Duels Home/Away Balancing

Refined in [Task 91](/docs/tasks/091-refine-single-duels-balancing.md). Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 Round Robin (Single Duels) — Home/Away Balancing, §2 Epic: Single Duels Home/Away Balancing.

**Terms used in this file:**

- **Single-duels phase:** a phase with the format "Round robin (single duels)" or "Groups round robin (single duels)".
- **N:** the team count of one round robin: the whole phase, or one group.

---

### US-06.1: random but balanced home and away

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Round Robin (Single Duels), §2 Single Duels Home/Away Balancing

As a user, I want home/away assignment in a single-duels round robin to be randomized but balanced, so that each team plays an equal (or as close to equal as possible) number of home and away matches across the phase.

**Acceptance criteria:**

- [ ] A single-duels phase gets its schedule from `generateSingleDuels(teams, rng)`, with a required `rng` (Task 82). A Groups phase calls it once for each group (US-02.2).
- [ ] Each pair of teams meets once.
- [ ] The pairings come from the same circle-method step as `generateRoundRobin`. So the phase has N − 1 matchdays for an even N, and N matchdays for an odd N, with one bye on each matchday (MVP1 §1).
- [ ] Each team's home and away counts differ by at most 1. They differ by 0 when N is odd. A test checks this rule for N from 2 to 20, over many seeds.
- [ ] When N is even, the `rng` picks which teams get the extra home match.
- [ ] Home and away are random inside the balance rule. A test checks that, for each pairing, each team is home in 40% to 60% of 2,000 seeds.
- [ ] There is no limit on home or away streaks.
- [ ] The same `rng` seed gives the same schedule.
- [ ] The `rng` also shuffles the match order inside each matchday, as `generateRoundRobin` does (Task 30).
- [ ] The app makes the schedule once, when the phase starts, and stores it. A re-scorinate never changes it.
- [ ] Each fixture gets its id when the phase starts, for example `p1.g2.md3.m4` (Task 77).
- [ ] When the league's home-advantage toggle is on, the home team of each match gets the MVP1 boost: +5, plus 5% of its OVR. When the toggle is off, no team gets a boost.
- [ ] The fixtures list shows the home team first, as in MVP1. The screen shows no home and away count.
- [ ] `generateSingleDuels` rejects fewer than 2 teams, as `generateRoundRobin` does.
- [ ] `generateRoundRobin` and its tests do not change. Its doc comment no longer says that single duels is "MVP2's `groups round robin`" (Task 82).

**Out of scope:** a home and away count on the screen: parked in `scorinator-future-features.md` §8 (debug mode). A streak limit (Task 82). A random pairing order: the pairings follow the team order, as in a two-way round robin.

**Notes:** the user chose "fixtures only" on 2026-10-28 (Task 91 gap 1), and parked the count for a debug mode. The 40% to 60% band and the 2,000 seeds are Claude choices. The user confirmed them on 2026-10-28, with the pairing order from the team order. The algorithm that keeps the balance while it randomizes is a build-task choice (Task 82).
