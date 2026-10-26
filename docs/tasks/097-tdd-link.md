# Task 97: fix the `docs/tdd` link in `CLAUDE.md`

**Status:** Not started. The acceptance criteria wait for the user's OK.

## Goal

`CLAUDE.md` line 64 links to `/docs/tdd`, but the file is `docs/tdd.md`. The link gives a "file not found" error. Fix it, so a session can open the TDD rules from `CLAUDE.md`.

## Acceptance criteria

- [ ] The `TDD` link in the `CLAUDE.md` Documentation list points to `/docs/tdd.md`.
- [ ] No other text in `CLAUDE.md` changes.
- [ ] A scan of every Markdown link in the repo, outside `node_modules/`, finds no broken link.

## Notes

- **2026-10-26:** Found at the end of Task 85. A scan of the Markdown links outside `docs/archive/` found only this broken link. An earlier scan of `docs/archive/` found none.

## Report

Write this before the task goes to Review.
