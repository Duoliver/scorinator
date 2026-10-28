# Epic 12: Standings display

Refined in [Task 102](/docs/tasks/102-standings-display.md). Source: `docs/unplanned-features-draft.md` (features #2, #3, #4, #5, and #7), approved as MVP2 scope on 2026-10-28. The MVP2 spec has it since 2026-10-28.

**Terms used in this file:**

- **Round-robin table:** the full standings table of a round-robin phase.
- **Group card:** the compact table of one group in a Groups phase (US-02.2, US-02.4).
- **Hint:** a small text box that shows on hover and on keyboard focus. It uses the Tooltip component (also needed by US-09.3).
- **Zone:** a place range in a table with a colour and an optional label.

---

### US-12.1: the last 5 matches

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Standings display, §2 Standings display (since 2026-10-28, Task 102, with the user's OK).

As a user, I want to see the last 5 results of each team in the table, so that I can see which teams are in form.

**Acceptance criteria:**

- [ ] The round-robin table has a "Form" column after Pts.
- [ ] The cell shows up to 5 dots, one for each of the team's last 5 matches in this phase. The oldest is on the left, the newest on the right.
- [ ] Each dot has a letter, W, D, or L, and a colour from design tokens: green, grey, or red. The letter keeps the result readable without colour.
- [ ] A team with fewer than 5 matches shows fewer dots. A team with no match shows "—".
- [ ] The matches go in matchday order, not in the order the user scorinated them. A bye is not a match.
- [ ] Each dot has its own hint, on hover and on keyboard focus: the opponent swatch, the opponent trigram in mono (US-09.6), "H" or "A", the score with the team's goals first, and the matchday. For example "■ ASH · H · 2–1 · MD 7".
- [ ] One pure function gives the last N results of a team from the results of one phase, with tests.

**Out of scope:** the form in the group cards: parked in `scorinator-future-features.md` §14. Bracket phases.

**Notes:** the user chose a hint for each dot on 2026-10-28 (Task 102 gap 1), and the round-robin table only (gap 2). The user kept the header "Form" after a question on the name: the Premier League and BBC Sport use it. The oldest-left order and the matchday in the hint are Claude choices. The user confirmed them on 2026-10-28.

---

### US-12.2: goals for and against in the GD hint

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Standings display, §2 Standings display (since 2026-10-28, Task 102, with the user's OK).

As a user, I want a shorter table that still gives me the goals scored and conceded, so that the table stays easy to read.

**Acceptance criteria:**

- [ ] The round-robin table no longer has the GF and GA columns. Its columns are #, Team, P, W, D, L, GD, Pts, and Form.
- [ ] The GD cell has a hint, on hover and on keyboard focus: "Scored 12 · Conceded 7".
- [ ] The GD cell of a group card has the same hint.
- [ ] The table order still uses goals for, by the Task 78 rules.
- [ ] The results `.txt` export keeps GF and GA in its tables (US-10.6).

**Out of scope:** a switch to show the GF and GA columns again.

**Notes:** the hint text and the `.txt` rule are Claude choices. The user confirmed them on 2026-10-28.

---

### US-12.3: hints on short table headers

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Standings display, §2 Standings display (since 2026-10-28, Task 102, with the user's OK).

As a user, I want each short table header to tell me its full name, so that I know what each column means.

**Acceptance criteria:**

- [ ] These headers have a hint with the full name: # "Position", P "Played", W "Won", D "Drawn", L "Lost", GD "Goal difference", Pts "Points", Form "Last 5 matches".
- [ ] The hints apply to the round-robin table and the group cards. The "Agg" label of a tie card gets "Aggregate" (US-04.8).
- [ ] A header with a hint has a dotted underline and the help cursor.
- [ ] The hint shows on hover and on keyboard focus.
- [ ] A screen reader reads the full name of the header.

**Out of scope:** hints on other screens.

**Notes:** the list of headers and the "Agg" hint are Claude choices. The user confirmed them on 2026-10-28.

---

### US-12.4: the position chart

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Standings display, §2 Standings display (since 2026-10-28, Task 102, with the user's OK).

As a user, I want a chart of each team's place after each matchday, so that I can see how the table changed over the phase.

**Acceptance criteria:**

- [ ] A round-robin phase in League Detail has a "Chart" sub-tab beside "Standings" and "Fixtures".
- [ ] A Groups phase has one chart for each group. A "Group" selector picks the group.
- [ ] The x axis shows the matchdays. The y axis shows the places, with 1 at the top.
- [ ] A matchday with at least one result is a point on the chart. The place at that point uses the results of that matchday and of the matchdays before it, by the Task 78 order. Teams that share a place take their row order.
- [ ] Each team has one line in its team colour. A light colour (for example White, Sand, or Yellow) gets a dark outline, so it shows on the page background.
- [ ] Each line ends with the team trigram, in mono (US-09.6).
- [ ] Hover or keyboard focus on a line or a legend item makes that team stand out. The other lines fade.
- [ ] A point has a hint: the trigram, the matchday, and the place.
- [ ] With no result yet, the tab shows "The chart shows after the first result."
- [ ] One pure function in `engine/standings` gives the places by matchday, with tests.
- [ ] The chart is an SVG component. The project gets no chart library.

**Out of scope:** the points mode: parked in `scorinator-future-features.md` §15. Bracket phases.

**Notes:** the user chose the positions mode first, and parked the points mode, on 2026-10-28 (Task 102 gap 3). The group selector, the outline, the fade, the empty text, and "no chart library" are Claude choices. The user confirmed them on 2026-10-28.

---

### US-12.5: position zones

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Standings display, §2 Standings display (since 2026-10-28, Task 102, with the user's OK).

As a user, I want to colour place ranges in a table, for example green for the top places and red for the bottom ones, so that I can see what each place means.

**Acceptance criteria:**

- [ ] A round-robin phase or a Groups phase can have up to four zones: green, blue, yellow, and red. Each colour is used once at most.
- [ ] A zone has a colour, a place range (from and to), and an optional label of 24 characters at most, for example "Promotion".
- [ ] Two zones cannot share a place.
- [ ] In a Groups phase, the zones apply to each group by place.
- [ ] Zones replace the qualifier highlight of US-02.2 and US-07.2. In a phase that is not the last:
  - The green zone is places 1 to N, from the advancement (US-01.4). It follows the advancement, and its range cannot be edited. Its default label is "Qualify".
  - With best M of place N + 1 (US-01.6), the yellow zone is place N + 1, with the default label "Best 4 of place 3". It follows the advancement too. When the phase is complete, the best M rows turn green, and the other rows of that place lose the yellow (US-07.2).
  - Blue and red are free.
- [ ] In the last phase, all four zones are free, and there is no zone by default.
- [ ] A row in a zone gets a tint of the zone colour and a coloured stripe on its left side. The text keeps AAA contrast on the tint.
- [ ] A legend under the table shows each zone: its colour and its label, or its place range when it has no label, for example "Places 18–20".
- [ ] The wizard phase step has a "Zones" section for each round-robin and Groups phase.
- [ ] League Detail has an "Edit zones" action for each round-robin and Groups phase. It works at any time, also on a locked phase. A change counts as a change to the league (US-11.1).
- [ ] The zone colours and tints are design tokens, with a contrast test.

**Out of scope:** more than four zones. Custom zone colours. A link between zones and promotion or relegation between leagues (MVP3).

**Notes:** the user chose one system for zones and the qualifier highlight (gap 4), editing in the wizard and in League Detail at any time (gap 5), and an optional label with a legend and a stripe (gap 6), on 2026-10-28. The locked green and yellow zones, the default labels, the 24-character limit, and one zone for each colour are Claude choices. The user confirmed them on 2026-10-28.
