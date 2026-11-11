# Task 155: Zones: the rules, the files, and the table display

**Status:** Done

## Goal

A phase can have up to four position zones, with a tint, a stripe, and a legend on its tables (US-12.5). The zones replace the qualifier highlight of US-02.2 and US-07.2. This task gives the rules, the data, and the display. A new Task 189 gives the two editors, if the user agrees the split (choice 1).

## Acceptance criteria

Proposed on 2026-11-09. The user agreed them on 2026-11-10.

**The rules:**

- [x] A round-robin or Groups phase can have up to four zones: green, blue, yellow, and red, each colour once at most.
- [x] A zone has a colour, a place range, and an optional label of 24 characters at most. Two zones cannot share a place.
- [x] In a phase that is not the last, green is places 1 to N from the advancement, with the default label "Qualify". It follows the advancement.
- [x] With a best M, yellow is place N + 1, with the default label "Best 4 of place 3". It follows the advancement too.
- [x] In the last phase, there is no zone by default.
- [x] `engine/phases` holds the rules as pure functions, with unit tests.

**The files:**

- [x] The league file and the wrapper file keep the zones of each phase plan. A file with no zones still reads.

**The display:**

- [x] A row in a zone has the tint of the zone colour and a coloured stripe on its left side, in the round-robin table and the group cards.
- [x] In a Groups phase, the zones apply to each group by place.
- [x] During a phase, the green and yellow rows follow the current order. When the phase is complete, the best M rows turn green, and the other rows of that place lose the yellow (US-07.2). A locked phase keeps these rows.
- [x] A legend under the tables shows each zone: its colour, and its label or its place range, for example "Places 18–20".
- [x] `--color-row-positive` and `--color-row-caution` go, and `Table` uses the zone tokens of Task 152.
- [x] Integration tests through `StandingsView`, on real results.

**Out of scope:** the "Zones" section of the wizard and "Edit zones" in League Detail (Task 189, choice 1). More than four zones. Custom colours. A link with promotion or relegation (MVP3).

## Notes

- **2026-11-09:** Facts from the code.
  - `phaseQualifierMarks` in `app/state/phases.ts` already gives the green and yellow rows, also for a complete phase. The zones can reuse it.
  - `League.plans` holds the chain of phases. A comment says that it is fixed at "Create league".
  - Task 106 rule 2: a field added later with a default keeps the file version. Task 185 did this for `avoidGroupTies`.
  - The handoff has no zone design.
- **2026-11-09:** Proposed choices, for the user to agree before the work starts:

  | # | Choice | Proposal | Flag |
  |---|---|---|---|
  | 1 | The split | Task 155 keeps the rules, the files, and the display. A new Task 189 takes the wizard section and "Edit zones". Until Task 189, a user sees only the automatic green and yellow zones. | ⚠ A new task before Task 158. |
  | 2 | Where the zones live | An optional `zones` list on the round-robin and Groups plans. The plans stay fixed at "Create league", except this list. | ⚠ A change to the rule in the `League.plans` comment. |
  | 3 | What is stored | Blue, red, and a free green or yellow store a range and a label. An automatic green or yellow stores only its label, because the advancement gives its range. | |
  | 4 | The file version | It stays 4: the field is optional, by Task 106 rule 2. | |
  | 5 | A place | The row number, 1 to N, as in the chart (Task 153 choice 5). | A joint "2=" pair can sit across a zone edge. |
  | 6 | The row tone | `TableRowTone` becomes the four colour names. The stripe is an inset shadow, so the columns do not move. | A `design-system/` change. |
  | 7 | The legend | One legend under the tables, also for many group cards, in place order. A single place reads "Place 3". | |
- **2026-11-10:** The user agreed the seven choices and the criteria. Task 189 now holds the two editors.
- **2026-11-10:** Three choices made during the work. The user agreed them on 2026-11-10:
  - **A.** Yellow is free in a phase with no best M: a round robin, or a Groups phase with best M = 0. The story names yellow as automatic only with a best M.
  - **B.** The legend shows only the zones that colour a row. So the yellow zone leaves the legend when a phase is complete, and a free zone below the last place does not show.
  - **C.** The bracket tie card used `--color-row-positive` for the winner. It now uses `--color-zone-green-tint`, the same value.

- **2026-11-10:** The user checked the real app and agreed that the task is done.

## Report

- **What was built:** `engine/phases/zones.ts` gives the zones of a plan (`getPhaseZones`), their check (`checkZones`), and the colour of each row (`getZoneColours`). The plans store an optional `zones` list, and the file reader checks it. `getPhaseZoneView` in `app/state/phases.ts` replaces `phaseQualifierMarks`. `Table` has the four zone tones with an inset stripe, and `StandingsView` shows one legend under the tables.
- **Test approach:** 18 unit tests in `zones.test.ts` cover the rules. 16 file tests cover the round trip, a file with no zones, and each error text. The `getPhaseZoneView` tests use real standings, also a complete phase with `pickQualifiers`. The `StandingsView` tests mount the screen on real results: groups, a round robin, a last phase with free zones, a scorinate, and a complete phase. 1962 tests pass. Type check, lint, and Prettier are clean. Not checked yet: the look in the real app.
- **Decisions made:** the seven agreed choices, and choices A to C above. All are in the `PROGRESS.md` Decisions log.
- **What is left, what is next:** Task 189 gives the two zone editors. Until then, a user sees only the automatic green and yellow zones, or zones from a file. The zone of a row has no text for a screen reader. Only the legend names it.
