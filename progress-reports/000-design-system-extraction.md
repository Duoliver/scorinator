# Task 0 — Extract design-system: tokens + primitives

**Status:** Done — 2026-09-02

## What was built

`src/design-system/` now holds the tokens and primitive set the module map calls for:

- `tokens.css` — CSS custom properties for colour, typography, border/radius, shadow, and spacing, reconciled from the Foundations reference screen (`docs/design-reference/MVP1/Footballer - Foundations.dc.html`) and cross-checked against how those values are actually used in the other five reference screens (Teams, League Detail, League Setup Wizard, File Manager, Leagues Dashboard).
- `tokens.ts` — a plain-JS mirror of the colour values, needed because the contrast test can't read CSS custom properties outside a DOM. `tokens.sync.test.ts` asserts the two files can't drift.
- Six primitives, each with its own `.module.css` and test file: `Button`, `Card`, `Badge`, `Table`, `Tabs`, `Input`.
- `contrast.test.ts` — the automated WCAG AAA check the `design-reference/README.md` sequencing note asks for.
- `src/main.tsx` now imports `tokens.css` globally; `index.html` loads the Barlow / Barlow Semi Condensed / JetBrains Mono fonts from Google Fonts (matching the reference bundle's `<link>` tags).
- Minimal vitest scaffolding (`vitest.config.ts`, `src/test/setup.ts`, `jsdom` + `@testing-library/jest-dom` added as devDependencies) — needed to run the primitives' own tests at all, since none existed yet. This is a subset of Task 1's "vitest config" line, included here only because Task 0 can't have "own tests" without it; Task 1 still owns the rest of the repo scaffold (module folders under `engine/`, `persistence/`, `adapters/`).

## Decisions made

- **fg-muted contrast exception:** the Foundations screen claims all pairings meet AAA (7:1+), but `--color-fg-muted` (#5C5C5C) on `--color-surface` only measures ~6.69:1. Flagged to the user; confirmed the colour stays as-is since it's meant for disabled/de-emphasized elements, not primary text. Documented at the end of `docs/design-reference/README.md`, and `contrast.test.ts` excludes this one pairing from its strict 7:1 assertions accordingly.
- **Spacing scale is a reconciliation, not a spec value:** the brief doesn't enumerate a spacing scale; `--space-*` tokens were derived from the step sizes actually used across the bundle's screens (4/8/12/16/20/24/32/40/48/64). Flagging this since, unlike the colour/type/shadow tokens (all directly lifted from the Foundations screen), this one is a judgment call.
- **16-colour team palette excluded on purpose.** The Foundations screen shows a 16-swatch team colour palette but labels it "placeholder values per MVP3, pending final review" in its own caption. Per `CLAUDE.md` §0 (MVP3/4 out of scope), this was left out of `tokens.ts`/`tokens.css` entirely rather than extracted now — pulling it in would front-run a not-yet-approved MVP3 decision the source file itself says isn't final.
- **Styling approach: plain CSS Modules, not Tailwind.** `CLAUDE.md`'s tech-stack section lists Tailwind, but it isn't installed or configured anywhere in the repo yet (no dependency, no config file). Installing/configuring it is a stack decision bigger than this task's scope, so primitives use Vite's built-in CSS Modules support (`*.module.css`) against the `tokens.css` custom properties instead — real `:hover`/`:focus`/`:active` selectors, locally scoped class names, no new build tooling. If Tailwind is still wanted, wiring it is a separate task; it wouldn't change what the tokens are, only how components reference them.
- **Table and Tabs generalized beyond their one reference instance.** Only the standings grid in League Detail is genuinely tabular in the bundle; `Table` was built as a generic `{columns, rows, rowKey}` component (CSS grid, dark header row) rather than hard-coded to the standings' exact 10 columns, since a real primitive needs to serve fixtures/team lists too. `Tabs` mirrors the League Detail bordered-container pattern (accent bg for the active tab) as a controlled `{tabs, activeId, onChange}` component.
- **Input primitive covers only the labeled text-input pattern** (matching the README's exact primitive list: Button, Card, Badge/Tag, Table, Tabs, Input) — the Foundations screen also shows a select, a numeric-trio input group, a checkbox, and a toggle switch, but those aren't in the requested primitive set, so they were left out rather than added speculatively.

## Test approach

Unit/integration tests via `@testing-library/preact` + `@testing-library/user-event`, per the `tdd.md` layer table (`features/`-style Testing-Library approach, even though these live in `design-system/`, since they're real interactive components, not engine logic). Each primitive: renders, exercises its variants/sizes/tones without throwing, and covers its one piece of real interaction (Button's onClick + disabled state, Tabs' onChange + aria-selected, Input's controlled value + onChange). `contrast.test.ts` and `tokens.sync.test.ts` are the two non-component tests. 49 tests total, all passing. `npm run type-check` and `npm run lint` are both clean (lint: 0 errors, pre-existing-style warnings only — `explicit-function-return-type` on components, same as already present on `App.tsx`).

Not covered: no visual/screenshot testing (deliberately out of scope per `tdd.md`'s "skip DOM snapshot tests" guidance); real font loading and hover/active pixel-level offsets aren't testable under jsdom and weren't asserted, only that the right CSS Module classes get applied.

## What's left / what's next

- Task 1 (repo scaffold, vitest config, module folders) is still open — this task only added the minimal vitest wiring needed to test `design-system/` itself.
- If Tailwind is still wanted per `CLAUDE.md`'s tech stack, installing/configuring it is a separate decision — see "Styling approach" above.
- The 16-colour team palette will need real extraction once MVP3 is approved for implementation (do not do this early).
- No `features/` work should start until Task 1 exists as well — per `design-reference/README.md`'s sequencing rule, `design-system/` existing is necessary but the module-boundaries scaffold is the other prerequisite.
