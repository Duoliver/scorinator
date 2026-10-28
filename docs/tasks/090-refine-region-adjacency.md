# Task 090: refine epic 05, Region Adjacency

**Status:** Done (2026-10-28)

## Goal

Turn the one spec story of epic 05 into a refined story in `docs/user-stories/mvp2/05-region-adjacency.md`, or record why MVP2 does not build it. First check the MVP3 Location scope, because Regions arrive in MVP3. The build tasks (Task 84) start from the result.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/05-region-adjacency.md` has US-05.1, in the README template, with the status Agreed or Dropped.
- [x] The story Notes give the MVP3 scope check, with links to `docs/scorinator-mvp3.md`.
- [x] If the story is Dropped, the Notes name where the work goes instead.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees the story and its status.

## Notes

- **2026-10-28:** Spec story of epic 05 (`docs/scorinator-mvp2.md` §2): "link two Regions as adjacent when creating or editing them, so that future grouping logic (MVP3) can favor geographically close teams". Spec rule (§1 Groups Assignment): each Region stores a manually-linked list of adjacent Regions. The rule "lands whenever Regions are introduced (MVP3), but is decided now since it affects that model's shape".
- **2026-10-28:** MVP3 scope check. `docs/scorinator-mvp3.md` §1 Location Model brings Country, Region, and City, and repeats the adjacency rule "(from MVP2)". MVP3 §2 Epic: Location Management has the same story: "link a Region to other adjacent Regions, so that adjacency can inform tournament grouping". MVP2 has no Region, no Location screen, and no location field on a team (Task 74: an MVP2 Blueprint has no City). The only MVP2 user of adjacency, geographic clustering (US-02.3), is Dropped (Task 87).
- **2026-10-28:** Claude's finding: MVP2 cannot build the story without Regions, and Regions are MVP3 scope (`CLAUDE.md`: do not add a City field, do not build MVP3 features). The design decision is already in the spec, so MVP2 loses nothing. Proposal: Drop US-05.1, and point to the MVP3 Location Management epic.

- **2026-10-28:** The user agreed the criteria, the drop, and the spec note. The user asked to make sure that phase-1 groups allow manual moves. Claude checked US-02.5 (Agreed): drag or "Move to group", phase 1 until the league starts, a later phase until its first result. So a user can still build groups that make geographic sense by hand.

## Report

- **What was built:** `docs/user-stories/mvp2/05-region-adjacency.md`, with US-05.1 Dropped. The work goes to the MVP3 Location Management epic.
- **Test approach:** none, no code changed.
- **Decisions made:** the drop, logged in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edit:** one note under `### Epic: Region Adjacency` in `docs/scorinator-mvp2.md` §2, with the user's OK.
- **Effect on other tasks:** Task 84 makes no build task for epic 05. `engine/locations` stays empty in MVP2.
- **What is left, what is next:** nothing. Next is Task 91, Single Duels Home/Away Balancing.
