# Task 31 — Scroll to the top on a League Setup step change

**Status:** Done — 2026-10-05 (review closed by the user)

## What was built

`Tabs` has a new opt-in prop, `scrollToTopOnChange` (false by default, like `fullWidth`). When it is on, a change of the active tab scrolls the window to the top. A tab click and `ref.setValue` both count, so the Back and Next buttons of League Setup use the same path. The mount does not scroll, and a click on the active tab does not scroll. Only `LeagueSetupScreen` passes the prop, so `LeagueDetailScreen` does not change.

How: a ref holds the tab id of the last change, and it starts at `defaultTab`, so the mount needs no extra flag. A `useLayoutEffect` on the active id scrolls with `window.scrollTo({ top: 0 })`. A layout effect runs before the paint, so the new step never shows at the old scroll position. No CSS sets `scroll-behavior`, so the jump is instant.

`src/test/setup.ts` now replaces jsdom's `window.scrollTo`, which logs a not-implemented error, with a no-op.

## Test approach

- `Tabs.test.tsx` (5 new tests): scroll on a tab click, scroll on `ref.setValue`, no scroll on mount, no scroll on a click on the active tab, no scroll without the prop. Each test spies on `window.scrollTo`.
- `LeagueSetupScreen.test.tsx` (1 new test): Next scrolls to the top.

`type-check` and `lint` are clean. The full suite passes: 539 tests in 54 files (533 before).

**Browser check:** Playwright Chromium and WebKit, on the Vite dev server, with a 400px-high window. On `/leagues/new`, the page was scrolled to about 175px, and a click on `Next: Teams →` set `window.scrollY` to 0 in both engines. The Tauri app itself was not run.

## Decisions made

None beyond the plan in the status board row. The prop name and its default came from the user on 2026-09-25 (see the Decisions log in `PROGRESS.md`).

## What is left, what is next

- Not in this task, as the row says: after a step change, keyboard focus stays on a button that the old step removed. This is a separate issue.
