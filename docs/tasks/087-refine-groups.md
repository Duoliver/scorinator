# Task 087: refine epic 02, Groups

**Status:** In progress

## Goal

Turn the four spec stories of epic 02 into refined stories, with acceptance criteria, in `docs/user-stories/mvp2/02-groups.md`. Find the gaps in the spec and get an answer for each. The build tasks (Task 84) start from these stories.

## Acceptance criteria

- [ ] `docs/user-stories/mvp2/02-groups.md` has stories US-02.1 to US-02.4, one for each spec story, in the README template.
- [ ] A story that is out of MVP2 scope keeps its ID and gets the status Dropped, with the reason.
- [ ] A new story gets the next free ID, only when a gap needs one.
- [ ] Each story has checkable criteria, an Out of scope line, and Notes that link to the spec and the decisions.
- [ ] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [ ] The stories use the settled decisions: qualification (Task 78), fixture ids (Task 77), and the epic 01 stories (Task 86).
- [ ] A spec edit happens only with the user's OK.
- [ ] The user agrees each story, and its status becomes Agreed.

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

## Report

Write this before the task goes to Review.
