# MVP1 — First Tasks, Worked Example

This is a concrete example of the `tdd` doc workflow applied to the
first two rows of PROGRESS.md's status board, so the first session (or
you, reviewing its output) has a worked pattern to check against — not a
prescription to follow to the letter. Sessions should still write their
own test cases from the spec tables directly; this is a starting point,
and a sanity check on what "test-shaped" means in practice.

---

## Task 2 — Tier→OVR range mapping + roll logic

**Spec source:** `scorinator-mvp1.md` §1, "Scorination Engine" — first
five bullets. `scorinator-readme.md` §1 reinforces "Tier is always the
single source of truth."

**Note on the range values themselves:** the spec gives one example
(`S = 90–99`) and says "default ranges ship with MVP1" without listing
all seven. This is a small open item — propose a full S–F table (evenly
spaced, non-overlapping, matching the S=90–99 anchor) in the session
report rather than picking silently, per `tdd` doc.

**Test cases to write first:**

1. Each Tier (S/A/B/C/D/E/F) maps to a defined, non-overlapping numeric
   range.
2. Rolling OVR for a team of a given Tier, with an injected seeded RNG,
   always returns a value within that Tier's range (property-based: run
   across many seeds, assert bound-inclusive for all).
3. Rolling OVR is deterministic for a given seed — same seed, same
   result (this is what makes the rest of the engine's tests
   reproducible; worth a test in its own right).
4. Changing a team's Tier and re-rolling produces a value in the *new*
   Tier's range, not the old one (guards the "Tier is always source of
   truth" rule — this becomes more relevant once MVP4's Tier Shift
   exists, but the underlying re-roll function should already satisfy it
   now).
5. OVR is never settable independently of a Tier-driven roll — i.e. there
   should be no code path in `engine/tier-ovr` that sets OVR without
   going through the roll-from-Tier function. (This is more of a design
   constraint than a runtime test, but worth a lint-style check or at
   minimum a comment flagging it if there's no natural way to test it.)

**Not yet in scope for this task:** re-rolling on Tier *change* specifically
(vs. season start) is described in MVP1 but the "immediate re-roll on
change" trigger is more naturally exercised once there's something that
changes Tier mid-season — that's MVP4 (Tier Shift, Merger). For MVP1,
it's enough that `rollOVR(tier, rng)` exists as a pure function callable
whenever needed; don't build a Tier-change *event system* now (see
CLAUDE.md §0).

---

## Task 3 — Two-way round-robin fixture generation

**Spec source:** `scorinator-mvp1.md` §1 "Fixtures," and the corresponding
user stories in §2 "Epic: Fixtures & Scheduling."

**Test cases to write first:**

1. Given N teams (even), generates a full home-and-away round robin: every
   team plays every other team exactly twice, once at home once away.
2. Fixtures are grouped into matchdays; within a matchday, no team appears
   more than once (standard round-robin scheduling constraint, implied by
   "grouped into matchdays/rounds" even though not stated as an explicit
   rule — flag this inference in the report).
3. Given N teams (odd), each matchday has exactly one team with a bye, and
   over the full schedule every team gets an equal number of byes (or as
   equal as integer division allows).
4. Total match count matches the closed-form expectation: `N × (N-1)`
   matches for N teams, two-way (each ordered pair plays once as that
   fixture's home team).
5. Small edge cases: N=2 (minimal case, one matchday each direction), and
   confirm the function rejects or sensibly handles N=1 or N=0 (not
   explicitly specced — flag as an open question in the report rather
   than guessing silently, per CLAUDE.md §6/§7).
6. Determinism: given the same team list and same input order, fixture
   generation produces the same schedule (round-robin scheduling here is
   not stochastic per the spec — no RNG injection needed for this
   function, unlike scorination).

**Explicitly not in scope for this task:** single-duels round robin's
randomized-but-balanced home/away assignment — that's MVP2. Don't
generalize the fixture generator for it preemptively; build the MVP1
two-way case cleanly, and let MVP2's task extend or replace it once
that's the active task.

---

## How to use this file

Treat this as a template, not a fixed pair of tasks. When a new session
picks up Task 4 (standings) or later, the expected shape is the same:
pull the relevant spec section and user stories, list the test cases
that fall directly out of the confirmed decisions, separately note
anything the spec leaves ambiguous, and explicitly say what's out of
scope so the task doesn't creep into MVP2 territory or invent unspecified
generality. Once a session does this for a new task, this file doesn't
need to be updated — the task's own `PROGRESS.md` report is the durable
record; this file is just the first example.
