# Task 087: refine epic 02, Groups

**Status:** Done (2026-10-27)

## Goal

Turn the four spec stories of epic 02 into refined stories, with acceptance criteria, in `docs/user-stories/mvp2/02-groups.md`. Find the gaps in the spec and get an answer for each. The build tasks (Task 84) start from these stories.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/02-groups.md` has stories US-02.1 to US-02.4, one for each spec story, in the README template.
- [x] A story that is out of MVP2 scope keeps its ID and gets the status Dropped, with the reason.
- [x] A new story gets the next free ID, only when a gap needs one.
- [x] Each story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] The stories use the settled decisions: qualification (Task 78), fixture ids (Task 77), and the epic 01 stories (Task 86).
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees each story, and its status becomes Agreed.

## Notes

- **2026-10-27:** Spec stories of epic 02 (`docs/scorinator-mvp2.md` §2): a random split into groups when the phase starts, one round robin and one standings table for each group, geographic clustering for national tournaments, and group cards that wrap. Spec rules: §1 Groups Assignment. The clustering needs Regions, which arrive in MVP3. Settled inputs: the group draw happens once, at phase start, with an injected `Rng`, and is stored (impact review §2.8). Fixture ids hold the group number, for example `p2.g3.md1.m2` (Task 77). The order inside a group uses the Task 78 rules. "Top N" must be less than the size of the smallest group (US-01.4). Task 78 left one point for this task: how the table shows teams that the fixed lots separate.
- **2026-10-27:** The user agreed the criteria. Gap answers so far:
  1. **Group setup:** the user sets the group count or the group size, one of the two, never both and never neither. Group count is the default. The other field is disabled or hidden: this task must define which.
  2. **Draw type:** pure random, for phase 1 and for later phases. Seeds play no part.
  3. **Manual moves:** the user can move teams between groups. No later spec covers this (checked: MVP3, MVP4, future features), so it is MVP2 scope and needs a spec line, with the user's OK. When a move is still allowed is open.
- **2026-10-27:** The user did not add the MVP2 design files yet (Task 83). The user wants the answers kept, and a review of the stories after the design files arrive. The user then gives the files, and the refinement continues. Gaps not asked yet: the group-size remainder rule, group names, how the table shows teams that the lots separate, and the Fixtures view for groups.
- **2026-10-27:** The MVP2 handoff arrived. Task 83 compared it with these answers. Answers from the handoff and the Task 83 decisions:
  - **Group names:** "Group A", "Group B", and so on (handoff).
  - **Fixtures view:** one list for each matchday, each match tagged with its group. "Scorinate matchday" plays every group (handoff).
  - **Draw time (D6):** phase 1 groups are drawn in the Teams step of setup, with "⟲ Shuffle groups" and manual moves until Start. A later Groups phase is drawn when it starts, with Shuffle and moves until its first match has a result. The draw is stored.
  - **Manual moves:** the handoff shows drag and drop, and a button mode that moves a team to the next group. It is a design option (`teamAssignMode`). Pick one in this task.
  - **Group card columns (D7):** W, D, L, GD, Pts.
  - **Count or size (D8):** a switch "Set by: Group count | Group size". Only the chosen field shows. A summary line, for example "4 groups of 4", shows once the team count is known. In size mode the size is a maximum: groups = teams ÷ size, rounded up, with sizes as even as possible. For example, 18 teams with size 4 give 4, 4, 4, 3, 3.
  - Gaps still open: drag and drop or button mode, and how the table shows teams that the fixed lots separate (from Task 78).
- **2026-10-27:** Last gap answers: (a) moves by drag and drop, plus a "Move to group" menu item for the keyboard. (b) Level teams keep the MVP1 shared place: the first row of the tied block shows the number, the next rows show "-". The fixed lots set the row order. (c) Place N + 1 rows get a second, lighter highlight during the phase when the phase sends a best M.
- **2026-10-27:** Claude wrote US-02.1 to US-02.5 with the status Refined. US-02.3 is Dropped (MVP3). US-02.5 is new (manual moves) and needs a spec line, with the user's OK. Claude proposals in the stories, for the user to confirm: the first groups get the extra teams, a team added after the draw goes into the smallest group, a Switch keeps the group (as in the handoff), and the rest of the draw stays, and moves can make group sizes uneven.
- **2026-10-27:** The user agreed all stories and the five Claude choices. US-02.1, 02.2, 02.4, and 02.5 are Agreed. US-02.3 stays Dropped. With the user's OK, Claude added two lines to `docs/scorinator-mvp2.md` §1 Groups Assignment: the count or size rule, and Shuffle with manual moves.
- **2026-10-27 (review):** The user changed the default to group size. US-02.1, the spec line, and the Decisions log now say so. Claude picked 4 as the default size value, and the user confirmed it. The switch reads "Set by: Group size | Group count".

## Report

- **What was built:** `docs/user-stories/mvp2/02-groups.md`, with four Agreed stories and one Dropped story. US-02.1 to US-02.4 come from the spec. US-02.3 is Dropped, because it needs Regions (MVP3). US-02.5 (manual moves) is new.
- **Test approach:** none, no code changed. Each criterion is a check that a build task can test. The draw takes an injected `Rng`, so its tests can use a seed.
- **Decisions made:** the gap answers in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-27.
- **Spec edit:** two lines in `docs/scorinator-mvp2.md` §1 Groups Assignment, with the user's OK.
- **Effect on other tasks:**
  - **Design system:** two highlight colour tokens, one for qualifiers and one for best-M candidates. The handoff uses a raw hex value. A `design-system/` task comes before the feature task (`docs/design-reference/README.md`).
  - **Task 92 (Phase Transition):** a later Groups phase draws when it starts. The best M rows get the qualifier highlight when the phase ends.
  - **Task 93 (Team Selection):** the Teams step shows the phase-1 groups. A team added later goes into the smallest group. A Switch keeps the group.
- **What is left, what is next:** nothing. The user accepted the task on 2026-10-27.
