# Epic 07: Phase Transition

Refined in [Task 92](/docs/tasks/092-refine-phase-transition.md). Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 Phase Chaining, §2 Epic: Phase Transition. Layout reference: the MVP2 handoff, `Footballer - League Detail - Mixed`.

**Terms used in this file:**

- **Complete phase:** a phase where every match and every tie has a result.
- **Qualifier:** a team that the advancement of a phase sends to the next phase (US-01.4, US-01.6).
- **Locked phase:** a phase whose results can no longer change, because the next phase started.

---

### US-07.1: each phase starts from zero

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Phase Chaining, §2 Phase Transition

As a user, I want each phase's standings/stats to reset to zero when a new phase begins, so that phases are scored independently.

**Acceptance criteria:**

- [ ] Each round-robin or Groups phase computes its standings from its own results only. The fixture ids keep the results of each phase apart (Task 77).
- [ ] At the start of a round-robin or Groups phase, every team has 0 in each column: played, W, D, L, goals, GD, and points.
- [ ] A test checks this: a team with 18 points in phase 1 has 0 points in phase 2 before its first result.
- [ ] A Bracket phase uses no points (US-01.2).
- [ ] The one points system of the league applies to each round-robin and Groups phase (US-01.2).
- [ ] The tab of an earlier phase keeps its final table after the next phase starts.

**Out of scope:** a carry-over of points or stats between phases: not in MVP2.

**Notes:** `calculateStandings` is stateless (impact review §2.5), so the reset needs no stored zeros.

---

### US-07.2: see the qualifiers

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Phase Chaining, §2 Phase Transition

As a user, I want to see which teams qualified from one phase into the next, and by what seed, so that I can follow the league's progress.

**Acceptance criteria:**

- [ ] A round-robin table of a phase that is not the last highlights the qualifier places, with the qualifier highlight of the group cards (US-02.2).
- [ ] The round-robin table shows the advancement line under it, for example "Top 4 advance to the Bracket.", as the group cards do (US-02.4).
- [ ] During the phase, the highlight follows the current order. When the phase is complete, it marks the final qualifiers.
- [ ] When a Groups phase is complete, the best M teams of place N + 1 get the full qualifier highlight. The other teams of that place lose the lighter highlight (US-02.2).
- [ ] The highlight stays on the tables of a locked phase.
- [ ] When the next phase is a Bracket, its Seed List shows each qualifier with its seed and its origin tag, for example "A1" or "3rd" (US-04.2).
- [ ] When the next phase is a round robin or Groups phase, the screen shows no qualifier list. The highlight on the earlier phase shows who qualified.

**Out of scope:** a "Qualifiers" list for a round-robin or Groups next phase: parked in `scorinator-future-features.md` §10.

**Notes:** the user chose "highlight only" on 2026-10-28 (Task 92 gap 3), and parked the list. Seeds matter only for a Bracket: a later Groups phase draws at random (US-02.1). The final highlight of the best M is a Claude choice. The user confirmed it on 2026-10-28.

---

### US-07.3: start the next phase

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Phase Chaining. A new story. The spec has its line since 2026-10-28 (Task 92), with the user's OK.

As a user, I want to start the next phase with a click when a phase is complete, so that I can check and re-scorinate the phase before its qualifiers become final.

**Acceptance criteria:**

- [ ] The league Start (setup) builds phase 1 only. Each later phase builds at its own start.
- [ ] When a phase that is not the last is complete, its tab shows a button with the next phase number and short name, for example "Start phase 2 · Bracket".
- [ ] Until the click, the user can re-scorinate any match or tie of the complete phase. The qualifier highlight follows the new results (US-07.2).
- [ ] The click opens a confirm: "Start phase 2? Phase 1 locks, and its results can no longer change.", with "Cancel" and "Start phase 2". "Cancel" changes nothing.
- [ ] The confirm computes the qualifiers and their seeds by the Task 78 order (US-01.4, US-01.6), and builds the next phase:
  - Round robin: the schedule, with the qualifiers in seed order as the team order (US-06.1, `generateRoundRobin`).
  - Groups: the group draw, with Shuffle and moves until its first result (US-02.1, US-02.5).
  - Bracket: the seeds, the tree, and the byes (US-04.2, US-04.10).
- [ ] The next phase gets its fixture ids when it starts (Task 77). The app stores the phase, its draw, and its fixtures.
- [ ] A locked phase has every Scorinate button disabled, also "Scorinate matchday" and "Scorinate bracket". A hint says: "Phase 2 started. This phase is locked."
- [ ] A phase tab before its start shows an empty state: "This phase starts when phase 1 is complete."
- [ ] The progress badge and the Detail header follow US-01.2. Between the end of a phase and the next start, they show the last progress of the complete phase, for example "Group Stage · MD 6/6".
- [ ] The manifest progress (Task 76) names the latest started phase.

**Out of scope:** a re-scorinate in a locked phase, and an undo of a phase start: parked in `scorinator-future-features.md` §9.

**Notes:** new story, from Task 92 gaps 1 and 2. The user chose the click on 2026-10-28 (gap 1), and the lock, with "allow" parked (gap 2). This settles the open question from Task 78. The confirm text, the empty state text, the seed order as the team order of a round robin, and the badge between phases are Claude choices. The user confirmed them on 2026-10-28.
