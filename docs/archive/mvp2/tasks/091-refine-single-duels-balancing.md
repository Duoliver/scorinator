# Task 091: refine epic 06, Single Duels Home/Away Balancing

**Status:** Done (2026-10-28)

## Goal

Turn the one spec story of epic 06 into a refined story, with acceptance criteria, in `docs/user-stories/mvp2/06-single-duels-balancing.md`. Find the gaps in the spec and get an answer for each. The build tasks (Task 84) start from the story.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/06-single-duels-balancing.md` has US-06.1, in the README template.
- [x] A new story gets the next free ID, only when a gap needs one.
- [x] The story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] The story uses the settled decisions: `generateSingleDuels(teams, rng)` and the balance rule (Task 82), the fixture ids (Task 77), and the per-group schedule (US-02.2).
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees the story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Spec story of epic 06 (`docs/scorinator-mvp2.md` §2): home and away in a single-duels round robin are random but balanced. Spec rule (§1 Round Robin (Single Duels)): the home boost applies to each match (+5 plus 5% of the home OVR, MVP1 §1). Home and away are random for each match, with each team as close to an equal split as possible.
- **2026-10-28:** Settled inputs. A new `generateSingleDuels(teams, rng)` with a required `rng`. It shares the circle-method pairing step with `generateRoundRobin`, which does not change. The balance rule: each team's home and away counts differ by at most 1, and by 0 when N is odd. Home and away are random inside that rule. No streak limit (Task 82). Each group calls the generator for its own teams (US-02.2). Fixture ids `p1.g1.md3.m4` (Task 77).
- **2026-10-28:** Facts from the code. `generateRoundRobin` (`src/engine/round-robin/roundRobin.ts`) builds the pairings from the team order, with no random step. Its optional `rng` only shuffles the match order inside each matchday (Task 30). An odd team count gives one bye each matchday (MVP1 §1). The doc comment says single duels is "MVP2's `groups round robin`". Task 82 asks to correct it.
- **2026-10-28:** Gaps found. Each needs a user answer.
  1. Does the screen show each team's home and away count, or only the fixtures?
- **2026-10-28:** The user agreed the criteria. Gap 1 answer: fixtures only. The home and away count belongs in a debug mode that the user drafts. It is parked in `scorinator-future-features.md` §8.
- **2026-10-28:** Claude wrote US-06.1, with the status Refined. Claude choices for the user to confirm: the 40% to 60% band over 2,000 seeds, and the pairing order from the team order. No spec edit is needed.

- **2026-10-28:** The user agreed US-06.1 and the two Claude choices. Status: Agreed.

## Report

- **What was built:** `docs/user-stories/mvp2/06-single-duels-balancing.md`, with US-06.1 Agreed.
- **Test approach:** none, no code changed. The story names the tests: the balance rule for N from 2 to 20 over many seeds, the 40% to 60% home band for each pairing over 2,000 seeds, and the same schedule for the same seed.
- **Decisions made:** logged in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edit:** none. One new entry in `docs/scorinator-future-features.md`: §8 Debug mode, with the home and away count.
- **Effect on other tasks:**
  - **Task 84 (build tasks):** one engine task for `generateSingleDuels`, with the doc comment fix in `generateRoundRobin`.
  - **Task 87 stories:** US-02.2 already calls the generator for each group. No change.
- **What is left, what is next:** nothing. Next is Task 92, Phase Transition. It also settles the open question on a re-scorinate of an earlier phase.
