# Epic 02: Groups

Refined in [Task 87](/docs/tasks/087-refine-groups.md). Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 League Formats and Groups Assignment, §2 Epic: Groups. Layout reference: the MVP2 handoff, `Footballer - League Setup Wizard` (Teams step) and `Footballer - League Detail - Mixed` (Group phase). The Task 83 decisions D6 to D8 apply.

**Terms used in this file:**

- **Groups phase:** a phase with the format "Groups round robin (two-way)" or "Groups round robin (single duels)".
- **Draw:** the random split of a phase's teams into its groups.

---

### US-02.1: split the teams into groups at random

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Groups Assignment, §2 Groups

As a user, I want teams to be randomly split into groups when a Groups Round Robin phase starts, so that I don't have to assign them manually.

**Acceptance criteria:**

- [ ] A Groups phase has a switch: "Set by: Group size | Group count". Group size is the default, with the value 4. Only the chosen field shows.
- [ ] Group count: 2 or more. Group size: 2 or more.
- [ ] In size mode, the size is a maximum. Groups = teams ÷ size, rounded up. For example, 18 teams with size 4 give 5 groups.
- [ ] The teams split as evenly as possible: group sizes differ by 1 at most. The first groups get the extra teams. For example, 18 teams in 5 groups give 4, 4, 4, 3, 3.
- [ ] A summary line shows the result, for example "5 groups: 4, 4, 4, 3, 3", once the team count is known.
- [ ] The groups have the names "Group A", "Group B", and so on, in order.
- [ ] The draw is pure random. Seeds and Tiers play no part.
- [ ] The draw takes an injected `Rng` (`ENGINE.md`). The same seed gives the same draw.
- [ ] Phase 1 Groups: the draw happens in the Teams step of setup, when the first teams are added.
- [ ] A team added later goes into the smallest group, the first one if several are equal. A removed team leaves its group. A Switch puts the new team in the group of the old one. The rest of the draw stays.
- [ ] A later Groups phase: the draw happens when the phase starts, with its qualifiers.
- [ ] The app stores the draw. It never draws again by itself, for example on a render or a reload.
- [ ] A "⟲ Shuffle groups" action draws again. It shows for phase 1 until the league starts, and for a later phase until its first match has a result.
- [ ] A group with fewer than 2 teams is a fit problem: the US-01.4 warning and Start rule apply.

**Out of scope:** manual moves (US-02.5). Geographic clustering (US-02.3, MVP3). Seeded pots: not in MVP2.

**Notes:** the user chose the size or count switch, group size as the default (changed from group count on 2026-10-27, at review), the size as a maximum, the pure random draw, and the draw times on 2026-10-27 (Task 87 notes, Task 83 D6 and D8). A Shuffle is a new draw from the `Rng`. The fixed lots of Task 78 are a separate thing: they order level teams, and a Shuffle does not change them.

---

### US-02.2: one round robin and one table for each group

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 League Formats, §2 Groups

As a user, I want each group to run as its own independent round-robin, with its own standings table, so that group results don't mix.

**Acceptance criteria:**

- [ ] Each group gets its own schedule: `generateRoundRobin` for two-way, `generateSingleDuels` for single duels (Task 82).
- [ ] Each fixture id holds the phase and group numbers, for example `p1.g2.md3.m4` (Task 77).
- [ ] A group's table counts only the results of its own matches.
- [ ] The table order uses the Task 78 rules: points, goal difference, goals for, the recursive mini-league, then the fixed lots.
- [ ] Teams level on every criterion show the MVP1 shared place: the first row of the tied block shows the place number, and each row after it shows "-". The fixed lots set the row order inside the block.
- [ ] Each group card shows the columns W, D, L, GD, and Pts.
- [ ] The rows in places 1 to N (top N, US-01.4) have the qualifier highlight at all times.
- [ ] When the phase sends the best M of place N + 1 (US-01.6), each group's place N + 1 row has a second, lighter highlight during the phase.
- [ ] When the phase is finished, the best M rows get the qualifier highlight. The other place N + 1 rows lose the second highlight.
- [ ] The Fixtures tab shows one list for each matchday. Each match carries its group tag, as in the handoff.
- [ ] "Scorinate matchday" plays the unplayed matches of that matchday in every group.
- [ ] A group with a bye on that matchday shows the bye under its group tag.
- [ ] Groups of different sizes can have different matchday counts. The phase has as many matchdays as its longest group. A group with no match on a matchday does not show in that list.
- [ ] The progress badge "MD x/y" uses the matchday count of the phase (US-01.2).

**Out of scope:** what happens to the qualifiers in the next phase (epic 07). The tiebreak flags (epic 03), which apply to a bracket only.

**Notes:** the user chose the columns (Task 83 D7) and the two highlights on 2026-10-27 (Task 87 notes). The user chose the MVP1 shared place display: `calculateStandings` already makes `positionText` this way (`src/engine/standings/standings.ts`). The highlights need colour tokens in `design-system/`. The handoff uses a raw hex value, `#EAF3EA`, for the qualifier highlight.

---

### US-02.3: geographic clustering for national tournaments

**Status:** Dropped
**Spec:** `docs/scorinator-mvp2.md` §1 Groups Assignment, §2 Groups

As a user, I want national-level Groups Round Robin tournaments to cluster teams by region/adjacent-region proximity instead of pure randomness, so that groups make geographic sense.

**Acceptance criteria:** none in MVP2.

**Out of scope:** all of it. The clustering needs Regions and their adjacency, which arrive in MVP3 (`docs/scorinator-mvp3.md`).

**Notes:** dropped on 2026-10-27 (Task 87). MVP2 is a standalone league with no location scope, so every Groups phase uses the pure random draw of US-02.1. The ID stays, per `docs/user-stories/README.md`.

---

### US-02.4: group cards wrap

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Groups Assignment (Layout), §2 Groups

As a user, I want group cards to wrap onto new lines instead of scrolling horizontally when there are many groups, so that I can see everything without side-scrolling.

**Acceptance criteria:**

- [ ] The group cards of a phase sit in a grid that wraps to the next line.
- [ ] The Standings tab has no horizontal scroll, at any group count, at the app's minimum window width.
- [ ] Each card shows its group name, for example "Group A".
- [ ] When the phase is not the last, the cards show the advancement line, for example "Top 2 of each group advance to the Bracket."
- [ ] The Teams step of setup shows the phase-1 groups in the same wrapping layout.

**Out of scope:** the card content rules (US-02.2).

**Notes:** the handoff shows the advancement line once, under the cards.

---

### US-02.5: move teams between groups

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Groups Assignment (line added on 2026-10-27, Task 87, with the user's OK)

As a user, I want to move a team from one group to another after the draw, so that I can set the groups the way I want.

**Acceptance criteria:**

- [ ] The user can drag a team to another group, as in the handoff.
- [ ] Each team row menu (⋮) has "Move to group", with a list of the other groups. A keyboard user can move a team this way.
- [ ] Moves are allowed at the same times as "⟲ Shuffle groups" (US-02.1): phase 1 until the league starts, a later phase until its first match has a result.
- [ ] A move can make the group sizes uneven. A group with fewer than 2 teams is a fit problem: the US-01.4 warning and Start rule apply.
- [ ] The app stores the moved groups, as it stores a draw.
- [ ] A Shuffle replaces the moves with a new draw.

**Out of scope:** a move after the first result of the phase.

**Notes:** the user chose drag and drop plus a "Move to group" menu on 2026-10-27 (Task 87 notes). The handoff also has a button mode (`teamAssignMode: 'button'`). It is not used. The user agreed free moves with uneven sizes on 2026-10-27.
