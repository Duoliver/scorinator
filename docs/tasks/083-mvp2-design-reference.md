# Task 083: MVP2 design reference, and a review of the stories against it

**Status:** Review

## Goal

The user added the MVP2 Claude Design handoff at `docs/design-reference/MVP2/`. Compare it with the epic 01 stories (Task 86) and the Task 87 gap answers. For each difference, the user decides: bring the handoff version, or keep the story version. Record the items that belong to later epics, so their refinement tasks start from them.

## Acceptance criteria

- [x] The handoff is in `docs/design-reference/MVP2/` (8 screens).
- [x] The Notes list each match and each difference between the handoff and the epic 01 stories and Task 87 answers.
- [x] The user decides each difference: bring or keep.
- [x] The epic 01 stories change where the user chose the handoff, and stay Agreed.
- [x] The Task 87 file gets the answers that the handoff gives.
- [x] The Notes list the handoff items for later epics (Tasks 89, 93, 95), with no decision yet.
- [x] The `PROGRESS.md` Open questions item for this review is removed.

## Notes

- **2026-10-27:** The handoff has 8 screens: Sitemap, Foundations, Leagues Dashboard, League Setup Wizard, League Detail (single phase), League Detail - Mixed (groups, then bracket), Teams, and File Manager. Foundations, Teams, and the single-phase League Detail have the same visible text as MVP1. The handoff is reference only (`docs/design-reference/README.md`): layout intent, not code to port.
- **2026-10-27:** Matches with the stories and answers. No decision needed.
  - Wizard order Details → Phases → Teams → Review (US-01.1).
  - Phase actions ↑, ↓, ✕, and "+ Add phase" at the end. ✕ is disabled with one phase, ↑ on the first, ↓ on the last (US-01.1).
  - "+ Add phase" adds Round robin (two-way) (US-01.1).
  - Five formats (US-01.2).
  - Points and home advantage on the Details step, one for the league (Task 86 gap 2).
  - "Top N advance (per group) to the next phase", and no advancement on the last phase (US-01.4).
  - The Review step lists each phase with its detail, for example "2 groups · Top 2 advance" (US-01.1).
  - Group names "Group A", "Group B", and so on (Task 87 gap, group names).
  - Group fixtures: one list for each matchday, each match tagged with its group. "Scorinate matchday" plays every group (Task 87 gap, Fixtures view).
  - Manual moves: the Teams step shows one column for each group, with drag and drop, or a button mode that moves a team to the next group (Task 87 gap 3).
  - Each group card states the advancement, for example "Top 2 of each group advance to the Bracket."
- **2026-10-27:** Differences. Each needs a decision.

  | # | Topic | Handoff | Story or answer |
  |---|---|---|---|
  | D1 | Format labels in setup | "Groups round robin (two-way)" | "Groups (two-way)" (US-01.2) |
  | D2 | Phase text on the card and the Detail header | Short names: "Group Stage → Bracket" | Joined labels: "Groups (two-way) → Bracket (single match)" (US-01.2) |
  | D3 | Card pill for a league with several phases | "2 phases", no points pill | The points pill (MVP1) |
  | D4 | Progress text | Card: "MD 7/16", "Quarter-finals", "Complete". Detail: "Group Stage · MD 6/6", plus phase tabs "1 · Group Stage", "2 · Bracket" | "Phase 2 of 3 · Groups (two-way) · Matchday 3 of 6" (US-01.2) |
  | D5 | Bracket before the last phase | Allowed, with an inline warning: "Bracket can only be the last phase — move this phase down or delete phases after it." | Not offered. "Add phase" disabled after a Bracket (US-01.3) |
  | D6 | Phase-1 group draw | In the Teams step, during setup, with "⟲ Shuffle groups" and manual moves | Draw at phase start (impact review §2.8) |
  | D7 | Group card columns | W, D, L, Pts | Not decided (Task 87) |
  | D8 | Group setup | "Number of groups" only | Count or size, count by default (Task 87 gap 1) |
  | D9 | Not in the handoff | — | Home-advantage note (US-01.2), qualifier count (US-01.4), fit warnings (US-01.4), Groups-last warning (US-01.5), best M field (US-01.6) |

- **2026-10-27:** Handoff items for later epics. No decision in this task.
  - **Task 89 (Bracket):** the seed list tags each qualifier by group place (A1, B1, ...) and seeds group winners in group order, not by stats (Task 78). The first-round pairing is A1 v D2, C1 v B2, B1 v C2, D1 v A2, not simple seed order 1 v 8 (spec). The third-place playoff always shows (Task 77: a toggle). Bye UI: "Top seeds get a bye by default. Star any seed to grant it a bye instead — first-round only." and "x / y byes assigned". An asterisk marks a leg score that includes AET. The confirm modal: "Clear later rounds?", "Cancel", "Clear & scorinate". A "Seed List" sub-tab beside "Bracket".
  - **Task 93 (Team Selection):** the empty state has one action, "+ Add teams", not "Select teams" and "Load them all" (spec). The add dialog can create a new team inline. Row actions ✎ Edit, ⇄ Switch, ✕ Remove. The Edit drawer shows the "Original state" of the team.
  - **Task 95 (File Module):** the CSV line lists `City`, which is MVP3 scope (Task 74). The single-phase League Detail has no per-league export or results button, which the spec moves there.
- **2026-10-27:** The user agreed the criteria. Decisions: D1 + D2 handoff, two levels (full label in setup and Review, short name on the card, the Detail header, and the tabs). D4 handoff progress text, with 'Setup' for a league before Start. D5 story: prevent a Bracket before the last phase.
- **2026-10-27:** The user noted on D1 + D2: "we agreed on custom names for each phase". The record says otherwise: in Task 86 gap 5 the user chose "Format labels only", and custom names are parked in `scorinator-future-features.md` §7. Claude showed the record and the effect of custom names, and asked again.
- **2026-10-27:** More decisions. Phase names: keep the fixed short names, no custom names (§7 stays parked). D3: keep the points pill. D6: handoff, plus a draw at phase start for a later Groups phase. D7: W, D, L, GD, Pts. D8: a switch that hides the field not in use, and the size as a maximum. D9: keep all five story items.

## Report

- **What was built:** no code. The review of the MVP2 handoff against epic 01 and Task 87 is done.

  | # | Decision |
  |---|---|
  | D1 + D2 | Handoff: full labels in setup and Review, for example "Groups round robin (two-way)". Fixed short names "Round robin", "Group Stage", "Bracket" on the card, in the Detail header, and on the phase tabs. A one-phase card keeps the full label. No custom names. |
  | D3 | Keep the points pill on every card. |
  | D4 | Handoff progress badge: "Setup", "MD 7/16", a round name, or "Complete". Detail header: "Group Stage · MD 6/6". |
  | D5 | Keep the story: Bracket is offered only on the last phase. |
  | D6 | Handoff: phase 1 groups are drawn in setup, with Shuffle and moves until Start. A later Groups phase draws when it starts, with Shuffle and moves until its first result. |
  | D7 | Group card columns: W, D, L, GD, Pts. |
  | D8 | A switch "Set by: Group count / Group size". Only the chosen field shows. The size is a maximum. |
  | D9 | Keep the home-advantage note, the qualifier count, the fit warnings, the Groups-last warning, and the best M field. |

- **Files changed:** US-01.2 in `docs/user-stories/mvp2/01-league-format.md` (stays Agreed). Notes in the Task 86 and Task 87 files.
- **Test approach:** none, no code changed.
- **Decisions made:** logged in the `PROGRESS.md` Decisions log on 2026-10-27.
- **What is left, what is next:** the later-epic items above go to Tasks 89, 93, and 95. Task 87 continues with two open gaps.
