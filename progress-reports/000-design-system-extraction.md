# Task 0 — Extract design-system: tokens + primitives

**Status:** Done — 2026-09-02

## What was built

`src/design-system/` now holds the tokens and primitive set the module map calls for:

- `tokens.css`: CSS custom properties for colour, typography, border/radius, shadow, and spacing. The Foundations reference screen (`docs/design-reference/MVP1/Footballer - Foundations.dc.html`) supplies these values. A check against the other five reference screens confirms the values match real use. Those screens are Teams, League Detail, League Setup Wizard, File Manager, and Leagues Dashboard.

- `tokens.ts`: a plain-JS mirror of the colour values. The contrast test needs this file, because it cannot read CSS custom properties outside a DOM. `tokens.sync.test.ts` checks that the two files never drift apart.

- Six primitives, each with its own `.module.css` and test file: `Button`, `Card`, `Badge`, `Table`, `Tabs`, `Input`.

- `contrast.test.ts`: the automated WCAG AAA check that the sequencing note in `design-reference/README.md` asks for.

- `src/main.tsx` now imports `tokens.css` globally. `index.html` loads the Barlow, Barlow Semi Condensed, and JetBrains Mono fonts from Google Fonts. These match the `<link>` tags in the reference bundle.

- Minimal vitest scaffolding: `vitest.config.ts`, `src/test/setup.ts`, and `jsdom` plus `@testing-library/jest-dom` as devDependencies. This scaffolding lets the primitives run their own tests, since none existed yet. It covers only a subset of the "vitest config" line in Task 1. Task 0 needs it, because Task 0 cannot have "own tests" without it. Task 1 still owns the rest of the repo scaffold: the module folders under `engine/`, `persistence/`, and `adapters/`.

## Decisions made

- **fg-muted contrast exception:** the Foundations screen claims all pairings meet AAA, at 7:1 or higher. But `--color-fg-muted` (#5C5C5C) on `--color-surface` measures only about 6.69:1. This session flagged the gap to the user. The user confirmed the colour stays as is. The reason: it is meant for disabled or de-emphasized elements, not primary text. `docs/design-reference/README.md` documents this at the end of the file. `contrast.test.ts` excludes this one pairing from its strict 7:1 assertions.

- **The spacing scale is a reconciliation, not a spec value.** The brief does not enumerate a spacing scale. The `--space-*` tokens come from the step sizes actually used across the screens in the bundle: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. This is flagged because it is a judgment call. The colour, type, and shadow tokens, by contrast, all come directly from the Foundations screen.

- **Excluded the 16-colour team palette on purpose.** The Foundations screen shows a 16-swatch team colour palette. Its own caption labels the palette "placeholder values per MVP3, pending final review." Per `CLAUDE.md` §0 (MVP3/4 out of scope), `tokens.ts` and `tokens.css` leave this palette out entirely, rather than extract it now. Extracting it now would front-run a not-yet-approved MVP3 decision, one the source file itself calls unfinished.

- **Styling approach: plain CSS Modules, not Tailwind.** The tech-stack section of `CLAUDE.md` lists Tailwind. It is not installed or configured anywhere in the repo, with no dependency and no config file. Installing and configuring it is a stack decision bigger than the scope of this task. So the primitives use the built-in CSS Modules support in Vite (`*.module.css`), against the `tokens.css` custom properties. This gives real `:hover`, `:focus`, and `:active` selectors, and locally scoped class names, with no new build tooling. Wiring Tailwind, if still wanted, is a separate task. It would change only how components reference the tokens, not what the tokens are.

- **Generalized `Table` and `Tabs` beyond their one reference instance.** Only the standings grid in League Detail is genuinely tabular in the bundle. `Table` is a generic `{columns, rows, rowKey}` component, with a CSS grid and a dark header row. It is not hard-coded to the 10 columns of the standings grid, because a real primitive needs to serve fixtures and team lists too. `Tabs` mirrors the League Detail bordered-container pattern, with an accent background for the active tab, as a controlled `{tabs, activeId, onChange}` component.

- **The `Input` primitive covers only the labeled text-input pattern**, matching the exact primitive list in the README: Button, Card, Badge/Tag, Table, Tabs, Input. The Foundations screen also shows a select, a numeric-trio input group, a checkbox, and a toggle switch. None of these sit in the requested primitive set, so this session left them out, rather than add them ahead of need.

## Test approach

Tests use `@testing-library/preact` and `@testing-library/user-event`. This follows the `tdd.md` layer table: the `features/`-style Testing-Library approach. These components live in `design-system/`, but they are real interactive components, not engine logic.

Each primitive test does three things. It renders the component. It exercises the variants, sizes, and tones of the component, without throwing. It covers one piece of real interaction: the `onClick` and disabled state on Button, the `onChange` and `aria-selected` on Tabs, and the controlled value and `onChange` on Input.

`contrast.test.ts` and `tokens.sync.test.ts` are the two non-component tests. There are 49 tests in total, and all of them pass. `npm run type-check` and `npm run lint` are both clean. Lint shows 0 errors, with only pre-existing-style warnings: `explicit-function-return-type` on components, the same warning already present on `App.tsx`.

Not covered: visual or screenshot testing, left out on purpose, per the guidance in `tdd.md` to skip DOM snapshot tests. Real font loading and hover/active pixel-level offsets are not testable under jsdom. The tests check only that the component applies the right CSS Module classes.

## What is left, what is next

- Task 1 (repo scaffold, vitest config, module folders) was open at the time of this report. It is now done. See the status board in `PROGRESS.md`, and its Task 1 decision entry, dated 2026-09-04. This task only added the minimal vitest wiring needed to test `design-system/` itself.
- If Tailwind is still wanted, per the tech stack in `CLAUDE.md`, installing and configuring it is a separate decision. See "Styling approach" above.
- The 16-colour team palette will need real extraction once MVP3 is approved for implementation. Do not do this early.
- No `features/` work should start until Task 1 also exists. Per the sequencing rule in `design-reference/README.md`, `design-system/` existing is necessary. But the module-boundaries scaffold is the other prerequisite.
