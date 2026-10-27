# Task 079: settle open decision 5, who hosts the second leg

**Status:** Done (2026-10-27)

## Goal

Decide which team hosts the second leg of a two-legged bracket tie. The host gets the home boost in the second leg and in its AET (Task 80). Task 89 (Bracket Phase) builds on this rule.

## Acceptance criteria

- [x] The user picks who hosts the second leg.
- [x] The user picks how the final and the third-place tie play in a two-legged bracket phase.
- [x] The `PROGRESS.md` Decisions log has an entry for the choices.
- [x] The `PROGRESS.md` Open questions list no longer has decision 5.
- [x] The report below records the choices and their effect on Task 89.

## Notes

- **2026-10-27:** Facts from the specs and earlier tasks. A bracket phase sets its ties as single match or two-legged (MVP2 spec, Bracket Specifics). Single-match ties and replays are at a neutral venue (Task 74). Seeds come from the previous phase, and the cross-group order makes each seed unique (Task 78). Bracket slotting is simple seed order. AET in a second leg keeps the home boost, and penalties use the stored OVRs (Task 80). The user deferred this decision on 2026-10-26 and chose to settle it on 2026-10-27.
- **2026-10-27:** The user agreed the criteria. The user chose "The higher seed", and asked to park a toggle for the host in the future features file. The user chose "A toggle for the final".
- **2026-10-27 (review):** The user asked for the final toggle line in the MVP2 spec. Added to `docs/scorinator-mvp2.md`, Bracket Specifics, after the third-place line. No other spec text changed.

## Report

- **What was built:** no code. Decision 5 is settled.
  1. **Second-leg host:** the higher seed. It plays the first leg away and the second leg at home, with the AET there. A tie winner keeps its seed in later rounds, so each tie has one higher seed. No random roll.
  2. **Host toggle:** parked in `docs/scorinator-future-features.md` §6. MVP2 has no toggle.
  3. **Single-match final toggle:** a new setting of a two-legged bracket phase. When on, the final is one match at a neutral venue (Task 74 rule). The third-place tie follows the final. When off, the final and the third-place tie have two legs, like the other ties. Proposed default, for the user to confirm in Task 89: off.
- **Test approach:** none, no code changed.
- **Decisions made:** logged in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Effect on other tasks:**
  - **Task 89 (Bracket Phase):** the refined stories add the single-match final toggle and the host rule. The toggle shows only for a two-legged phase. Confirm the default.
  - **MVP2 spec:** the single-match final toggle is new. At the user's request, `docs/scorinator-mvp2.md` (Bracket Specifics) has a line for it since 2026-10-27, after the third-place line. The line states no default, because Task 89 confirms it.
  - **Fixture ids (Task 77):** a single-match final has one match, `p3.r3.final.leg1`, per the Task 89 default.
- **What is left, what is next:** all eight open decisions are settled.
