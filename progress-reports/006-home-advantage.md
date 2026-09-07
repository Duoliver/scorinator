# Task 6 — Home advantage OVR boost

**Status:** Done — 2026-09-07

## What was built

`src/engine/scorination/scorination.ts` gains two new exports.

- `HOME_ADVANTAGE_BOOST`: the boost percentage, as a constant.
- `applyHomeAdvantage(ovr)`: returns the OVR value boosted by that percentage. It rounds the result to a whole number.

The function takes no on/off flag. A league with home advantage enabled calls it on the home team's OVR. It does this before that value reaches `scorinateMatch`. A league without home advantage never calls it at all. This matches the shape Task 5's report set up. The spec also notes that MVP2 single-duels uses the same boost rule.

`App.tsx`'s scorinator playground now has a "Home advantage (Team 1)" switch. It sits next to the two tier selects. It calls `applyHomeAdvantage` on the home OVR before scorination. A browser check confirms the score display updates. No console errors appear with the switch on or off.

## Test approach

Unit tests cover `applyHomeAdvantage` directly. One test checks the exact boosted value for a sample OVR. Another checks the function never lowers an OVR. A statistical test covers `scorinateMatch`, over 3,000 seeded trials. It checks that the home team's win rate rises, against an otherwise even away team, once the boost applies. This is the same statistical style Task 5 used. The check runs through the same Poisson-based match generator.

## Decisions made

- **Home-advantage percentage:** the spec names no exact value. This item does not sit on CLAUDE.md's named open-items list. Task 5's OVR-weighting ratio did sit on that list. So this session followed `tdd.md`'s general rule for a balancing detail instead. That rule says: propose a concrete number, document the reasoning, and move on. It does not call for a blocking question here. This session proposed and used 5 percent. That figure sits in line with real-world home-advantage effect sizes. `HOME_ADVANTAGE_BOOST` is the one place to change it.
- **Rounding to a whole number:** OVR stays an integer everywhere else in the engine. `rollOVR` floors its own result, for the same reason. Rounding `applyHomeAdvantage`'s output keeps that same rule. It stops a fractional OVR from reaching `scorinateMatch`.
- **No enabled/disabled parameter on `applyHomeAdvantage` itself:** the toggle is a league-level setting. It is not a scorination-engine concern. The function does one job: boost a number. The caller decides whether to call it. Task 5 used this same split, between `computeExpectedGoals` and the elasticity roll around it.

## What is left, what is next

- Re-scorinate (Task 7) is next, per the status board. It calls `scorinateMatch` again. It then overwrites the prior result. This task adds no new logic there. Home advantage applies the same way on every scorination of a given match.
- No league entity exists yet to hold the actual "has home advantage" toggle. That setting, and the call to `applyHomeAdvantage`, belongs to whichever layer builds `League`. That is likely `persistence/` or `features/leagues`, once either one exists.
