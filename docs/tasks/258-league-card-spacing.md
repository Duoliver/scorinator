# Task 258: tighter spacing on the league cards

**Status:** Done

## Goal

The user liked the spacing of the Season Teams tab cards (Task 257). Give the league cards a tighter spacing too: padding `--space-3`, and gap `--space-2`. One shared component, `LeagueList` in `features/components/`, draws the league cards of the Leagues dashboard and of the Season view, so both change. A layout tweak, before M3 starts.

Today: the `Card` padding `md` is `--space-6`. The card column gap and the body gap are `--space-3`. The grid gap between two cards is `--space-5`.

## Acceptance criteria

To agree with the user before the work starts. The choices below are part of the criteria.

- [x] The user's change to `Card.module.css` is part of this task: the Card padding scale moves down, `sm` to `--space-3`, `md` to `--space-4`, `lg` to `--space-6`. Every Card of the app changes with it.
- [x] Each league card, standalone and in a Season, keeps `padding="md"`, now `--space-4`.
- [ ] (Dropped by the user.) The vertical gaps inside the league card are `--space-2`: between the title row, the meta line, the points pill, and the button (choice 1). The gap between two cards stays `--space-5`.
- [x] The title row and the name row keep `--space-3` between the items of one line (choice 3).
- [x] The look is CSS, so the user checks it in the real app. The full suite, the type check, the lint, and the format check pass.

## Notes

- **2026-11-15:** Task created by the user. Three choices wait for the user.
- **2026-11-15:** The user changed `Card.module.css` by hand: `sm` `--space-3`, `md` `--space-4`, `lg` `--space-6`. The user's answers: the league card stays `md`, at `--space-4`. This replaces the padding `--space-3` of the request, and choice 2 (a new `xs` step) goes. A second request, a horizontal padding of `--space-4` on the teams table, needs no work: the `Table` rows already have it. Choices 1 and 3 keep the defaults. The revised criteria wait for the user.
- **2026-11-15:** The user said "258 is done". The user's Card change is the whole task. The gap change to `--space-2` was not made: the league card gaps stay `--space-3`. The user closed the task with no Review and no refactor pass. The full suite (2336 tests) and the format check pass. One commit.

## Report

- **What was built:** the user's change to `Card.module.css`: `sm` `--space-3`, `md` `--space-4`, `lg` `--space-6`. Every Card of the app changes with it, the league cards (`md`) among them.
- **Test approach:** CSS only. The user checked it. The full suite passes: 2336 tests. The format check passes.
- **Decisions made:** the Card padding scale (the user). The league card gaps stay `--space-3`.
- **What is left:** nothing.
- **Refactor:** none. The user closed the task.
