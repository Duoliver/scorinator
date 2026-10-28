# Epic 05: Region Adjacency

Refined in [Task 90](/docs/tasks/090-refine-region-adjacency.md). Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 Groups Assignment (Region adjacency), §2 Epic: Region Adjacency.

---

### US-05.1: link adjacent Regions

**Status:** Dropped
**Spec:** `docs/scorinator-mvp2.md` §1 Groups Assignment, §2 Region Adjacency

As a user, I want to manually link two Regions as adjacent when creating or editing them, so that future grouping logic (MVP3) can favor geographically close teams.

**Acceptance criteria:** none in MVP2.

**Out of scope:** all of it. The story needs Regions, which arrive in MVP3. It goes to [`docs/scorinator-mvp3.md`](/docs/scorinator-mvp3.md) §2 Epic: Location Management, which has the same story: "link a Region to other adjacent Regions". The design rule stays in the MVP2 spec §1 and in MVP3 §1 Location Model: each Region stores a list of adjacent Regions that the user links by hand.

**Notes:** dropped on 2026-10-28 (Task 90). MVP2 has no Region, no Location screen, and no City on a team (Task 74). Its only MVP2 user, geographic clustering (US-02.3), is Dropped too (Task 87). In MVP2, a user who wants groups that make geographic sense moves the teams by hand: drag, or "Move to group" (US-02.5). Phase-1 groups allow moves until the league starts. A later Groups phase allows moves until its first result. The ID stays, per `docs/user-stories/README.md`.
