# Epic 01: League Format Configuration

Refined in [Task 86](/docs/tasks/086-refine-league-format.md). Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 League Formats and Phase Chaining, §2 Epic: League Format Configuration.

**Terms used in this file:**

- **Phase:** one stage of a league, with one format. A league is a list of phases, in play order.
- **Phase step:** the new League Setup wizard step for the phase list. The wizard order is Details → Phases → Teams → Review.
- **Qualifiers:** the teams that one phase sends to the next phase.

---

### US-01.1: define several phases in one league

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Phase Chaining, §2 League Format Configuration

As a user, I want to define multiple phases within a single league, so that I can model competitions like "Group Stage → Bracket".

**Acceptance criteria:**

- [ ] The wizard has four steps, in this order: Details, Phases, Teams, Review.
- [ ] A new league starts with one phase: Round robin (two-way). With no change, the league plays as an MVP1 league.
- [ ] The phase step has an "Add phase" action. It adds a phase at the end of the list.
- [ ] Each phase has a "Remove" action. Remove is disabled when the league has one phase only.
- [ ] Each phase has "Move up" and "Move down" actions. Move up is disabled on the first phase. Move down is disabled on the last phase.
- [ ] A league can have any number of phases, from 1 up. There is no upper limit.
- [ ] The phase step shows each phase with its number, from 1, in list order.
- [ ] The phase numbers become fixed when the league starts. The fixture ids use them, for example `p2.g1.md3.m4` (Task 77).
- [ ] The Review step lists the phases in order, with their formats and advancement.

**Out of scope:** a phase edit after the league starts. MVP2 allows phase edits during setup only. The bracket-last rule is US-01.3.

**Notes:** the user chose the wizard order, no phase cap, and the move actions on 2026-10-27 (Task 86 notes). The phase step comes before Teams because the spec shows the single-bracket power-of-2 warning at the Teams step, so the format must be known first.

---

### US-01.2: give each phase a format

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 League Formats, §2 League Format Configuration

As a user, I want to assign a distinct format to each phase (round robin, groups round robin, or bracket), so that each stage of the competition works the way it should.

**Acceptance criteria:**

- [ ] Each phase has a format field with five choices. The field shows the full labels: "Round robin (two-way)", "Round robin (single duels)", "Groups round robin (two-way)", "Groups round robin (single duels)", and "Bracket".
- [ ] A change of format keeps the phase in its place in the list.
- [ ] The phase step and the Review step show the full label. The Review step adds the phase detail, for example "2 groups · Top 2 advance". For a bracket, the detail shows the tie setting, for example "Two-legged · AET on · Penalties".
- [ ] Each format family also has a fixed short name: "Round robin", "Group Stage", or "Bracket". A phase has no custom name.
- [ ] The dashboard card of a one-phase league shows the full label, for example "Round robin (two-way) · 8 teams · Home adv. on", as in MVP1.
- [ ] The dashboard card of a league with several phases joins the short names with " → ", for example "Group Stage → Bracket · 8 teams · Home adv. on".
- [ ] Every dashboard card keeps the points pill, for example "3/1/0 pts".
- [ ] The League Detail header uses the same text as the card, plus the points, for example "Group Stage → Bracket · 16 teams · Home adv. on · 3/1/0 pts".
- [ ] League Detail of a league with several phases has one tab for each phase, with its number and short name, for example "1 · Group Stage" and "2 · Bracket".
- [ ] The card shows a progress badge:
  - "Setup" before the league starts.
  - "MD 7/16" during a round-robin or group phase: the current matchday and the matchday count of that phase.
  - The round name during a bracket phase, for example "Quarter-finals".
  - "Complete" when every phase is finished.
- [ ] The League Detail header shows the progress with the short name, for example "Group Stage · MD 6/6".
- [ ] The manifest summary row holds the phase labels and the progress (Task 76).
- [ ] The phase step shows a note: the league's home-advantage toggle applies to round-robin and group phases, and to two-legged ties only.
- [ ] One points system (win/draw/loss) applies to every round-robin and group phase of the league, as in MVP1. A bracket uses no points.

**Out of scope:** the settings of each format. Group count and group assignment are in epic 02. AET and the tiebreak method are in epic 03. Tie settings, byes, and the power-of-2 warning are in epic 04. Custom phase names are parked in `scorinator-future-features.md` §7. The bracket round names are in epic 04 (Task 89).

**Notes:** the user chose no custom names, and one points system for the league, on 2026-10-27 (Task 86 notes). On 2026-10-27 the user chose the MVP2 handoff for the labels, the short names, and the progress text, and kept the points pill (Task 83, D1 to D4). The card text and progress text come from Task 76 (d).

---

### US-01.3: Bracket only as the last phase

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 League Formats, §2 League Format Configuration

As a user, I want the system to prevent me from placing a Bracket phase anywhere except last, so that the league structure stays valid.

**Acceptance criteria:**

- [ ] The format field offers Bracket only on the last phase.
- [ ] When the last phase is Bracket, "Add phase" is disabled. A hint says: "A bracket must be the last phase."
- [ ] A move that puts a Bracket phase before another phase is disabled.
- [ ] A remove can make a Bracket phase the only phase. That is valid: a league can be one bracket, for example a cup.
- [ ] The engine or domain check rejects a league with a Bracket phase before the last phase. A league file with that shape fails to import, with an error message.
- [ ] Groups can be the last phase. US-01.5 covers its warning.

**Out of scope:** the bracket settings (epic 04).

**Notes:** a check in the data layer, not only in the screen, keeps a bad import file out.

---

### US-01.4: set the advancement for each phase

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Phase Chaining, §2 League Format Configuration

As a user, I want to set advancement requisites per phase (e.g. "top 2 of each group advance"), so that qualification rules are explicit.

**Acceptance criteria:**

- [ ] Each phase except the last has an advancement field. The last phase has none, because the league ends there.
- [ ] A Round robin phase sets "top N": N teams of its table qualify.
- [ ] A Groups phase sets "top N of each group".
- [ ] A Groups phase can also set "best M of place N + 1", per US-01.6.
- [ ] The phase step shows the qualifier count of each phase. For example: "4 groups × top 2 = 8 teams go to phase 2."
- [ ] The order inside a table decides who qualifies. The order uses the Task 78 rules: points, goal difference, goals for, the recursive mini-league, then fixed lots from UUIDs.
- [ ] A count that does not fit shows a warning in the wizard. The league is still created.
- [ ] The league cannot start while a count does not fit. The Start action shows the reason.
- [ ] A count does not fit when one of these is true:
  - Round robin: N is less than 1, or N is equal to or more than the team count.
  - Groups: N is less than 1, or N is equal to or more than the size of the smallest group.
  - The next phase gets fewer than 2 teams.
- [ ] The warning updates when the team list or a phase changes.

**Out of scope:** the seeding of qualifiers in the next phase (epic 04 and epic 07, with the Task 78 cross-group order). Group sizes and the group count (epic 02). The power-of-2 warning for a bracket (epic 04).

**Notes:** the user chose "warn in setup, block Start" on 2026-10-27 (Task 86 notes). Group sizes are known only after the Teams step, so the wizard cannot block at the phase step. The Start action and the pre-start state come from impact review §2.4, and Task 93 refines them.

---

### US-01.5: warning when Groups is the last phase

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Phase Chaining, §2 League Format Configuration

As a user, if I end my league on a Groups phase, I want a non-blocking warning that this produces multiple group winners instead of one champion, so that I understand the outcome before I finish setup.

**Acceptance criteria:**

- [ ] When the last phase is Groups, the phase step and the Review step show a warning.
- [ ] The warning text: "This league ends with groups. Each group winner is a champion. There is no single league winner."
- [ ] The warning does not block Create or Start.
- [ ] The warning goes away when the last phase is not Groups.
- [ ] A one-phase Groups league shows the warning too.

**Out of scope:** what a later MVP does with several winners (Prize events, promotion, Cup feeders). MVP2 shows the warning only.

**Notes:** none.

---

### US-01.6: best M of the next place

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Phase Chaining (line added on 2026-10-27, Task 86, with the user's OK)

As a user, I want a Groups phase to also send the best M teams of the next place, for example the 4 best third-placed teams, so that I can model competitions with best-placed qualifiers.

**Acceptance criteria:**

- [ ] A Groups phase with "top N of each group" has an optional field: "best M of place N + 1". The default is 0.
- [ ] The user types M. When the next phase is a Bracket, the phase step also suggests the smallest M that makes the qualifier count a power of 2. For example: "6 groups × top 2 = 12. Best 4 of place 3 give 16."
- [ ] One click applies the suggested M. The phase step shows no suggestion when the count is already a power of 2, or when no M that fits gives one.
- [ ] The qualifier count is groups × N + M. The phase step shows it, for example "6 groups × top 2 + best 4 of place 3 = 16 teams".
- [ ] The best M come from the teams in place N + 1 of each group, ordered across groups by the Task 78 rules: points, goal difference, goals for, then fixed lots from UUIDs.
- [ ] When the group sizes differ, the order compares per match played.
- [ ] M does not fit when it is more than the group count minus 1, or when N + 1 is more than the size of the smallest group. The US-01.4 warning and Start rule apply.

**Out of scope:** best M from more than one place, for example best thirds and best fourths. The seeding of the best M in the next phase (epic 04 and epic 07).

**Notes:** the user chose "typed, with a suggestion" for M on 2026-10-27 (Task 86 notes). M equal to the group count is not allowed, because "top N + 1 of each group" gives the same result.
