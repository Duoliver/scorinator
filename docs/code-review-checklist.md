# Code review checklist

Use this list for every review in this repo. It comes from `CLAUDE.md`, `docs/coding-standards.md`, `docs/module-boundaries.md`, `docs/tdd.md`, and the module docs (`ENGINE.md`, `PERSISTENCE.md`, `DESIGN_SYSTEM.md`). Check only the sections that apply to the change.

## 1. Scope

- [ ] Confirm the change stays inside MVP1 or MVP2. Check the "Current approved scope" line in `PROGRESS.md` first.
- [ ] Confirm the change does not add any MVP3 or MVP4 feature, even a partial one.
- [ ] If the change touches an item in `scorinator-future-features.md`, stop and flag it.
- [ ] If the change touches an open item from `CLAUDE.md` section 6 (OVR weighting, event probability curves, Story Mode autosave, Instance-scoping wording), confirm the PR states the chosen approach. Reject a silently picked value.

## 2. Module boundaries

- [ ] Confirm `engine/` imports nothing from `features/`, `design-system/`, `adapters/`, Preact, or Tauri.
- [ ] Confirm `engine/` makes no direct filesystem call.
- [ ] Confirm `features/` does not import `adapters/` directly. Require it to call `engine/` and a data-access layer built on `persistence/`.
- [ ] Confirm `persistence/` holds interfaces only. Reject any `fs` or Tauri call inside it.
- [ ] Confirm `adapters/` implements a `persistence/` contract, and that `engine/` never imports from `adapters/`.
- [ ] Confirm only `design-system/` reads the design brief in `docs/design-reference/`. Require `features/` to consume `design-system/` instead.
- [ ] Reject new empty module scaffolding for work the team has not started yet.

## 3. General coding standards

- [ ] Confirm Preact event and CSS types come from the top-level `preact` import, not a deprecated `JSX.*` member.
- [ ] Confirm a parametrized component keeps its types in a sibling `types.ts` file, with the props interface as the default export.
- [ ] Confirm the component file re-exports only the names a consumer needs.
- [ ] Reject `!important` in any stylesheet. Require the author to resolve a specificity conflict through source order or an added selector.
- [ ] Reject a `style` prop on a component or element, unless the value comes from data at runtime (e.g. a user-chosen colour). Require static layout and token values in a CSS module instead.

## 4. Tests, by layer

- [ ] Confirm `engine/` changes carry unit tests, and that each spec decision table maps to a test case.
- [ ] Confirm `persistence/` decision logic (e.g. skip-vs-fork conflict resolution) carries unit tests that need no disk access.
- [ ] Confirm `adapters/` changes, especially `tauri-fs`, carry integration tests against a real temp filesystem. Reject a mock in place of real disk behavior for an atomic-write or manifest-last claim.
- [ ] Confirm `features/` changes carry Testing Library integration tests: mount the screen, simulate the interaction, assert on rendered state and on real `engine/` calls.
- [ ] Reject a DOM snapshot test. Reject a unit test of a component's internal render output.
- [ ] Require a smoke test for a new or changed load-bearing end-to-end flow (e.g. create team, then create league, then generate fixtures, then scorinate, then save, then load).
- [ ] Confirm the author wrote tests before the implementation, where the workflow allows a visible red-then-green trail.
- [ ] Confirm the task scope covers one epic or one `design-system/` primitive. Reject a task that implements a whole MVP or a whole styled-and-wired flow in one pass.

## 5. Engine determinism (`src/engine/`)

- [ ] Confirm every stochastic decision takes an injected RNG. Reject an inline `Math.random()` call.
- [ ] Confirm `engine/identity/` injects UUID generation and clock or time reads, instead of calling them directly.
- [ ] Confirm match-simulation tests use statistical assertions over many seeded runs. Reject an exact-output assertion for scorination.
- [ ] Require the author to propose and confirm a new balancing threshold or band (win-rate threshold, goal-average band) explicitly. Reject a silently picked number.

## 6. Persistence (`src/persistence/`, `src/adapters/`)

- [ ] Confirm a disk write uses temp-file-then-rename, one file at a time.
- [ ] When a change touches both `manifest.json` and a wrapper file, confirm the manifest write happens last. A crash should leave at most one orphaned wrapper file.
- [ ] Confirm a wrapper UUID matches its content UUID: the League UUID for a standalone League, the Season UUID for a Season. Reject a separate wrapper-level UUID.
- [ ] Confirm an "export everything" change targets a bundle (zip or directory) of the manifest plus wrapper files, not one flat JSON.
- [ ] Confirm per-League and per-Blueprint export stay self-contained JSON snapshots, unaffected by the wrapper split.
- [ ] Reject autosave for the Story Mode end-of-season pipeline, or for navigating away from a wrapper screen, unless the user has scoped autosave separately. Both stay explicit-save only.

## 7. Design system (`src/design-system/`)

- [ ] Confirm a new font file lives under `/public/fonts/` and appears in `tokens/fonts.css`. Reject a remote font CDN link.
- [ ] Confirm every size value (font size, spacing, border width, shadow offset, border radius) uses `rem`, not `px`.
- [ ] Confirm padding, gap, and font-size values reference a `tokens.css` step (`--space-*`, `--font-size-*`). Reject a bespoke literal.
- [ ] When a handoff-bundle value has no matching token, confirm the author rounded it to the nearest existing step. Reject a new one-off token for that case.
- [ ] Confirm a new primitive follows the folder shape: `{ComponentName}.tsx`, `.module.css`, `.test.tsx`, `types.ts`, and a `package.json` that points `main` and `types` at the component file.
- [ ] Confirm `tokens.ts` and `tokens.css` colour values stay in sync (see `tokens/tokens.sync.test.ts`).

## 8. Process and handoff

- [ ] Confirm `PROGRESS.md`'s status table reflects this task: in progress with a start date, or done with a completion date.
- [ ] Require a session report file under `/progress-reports/` for a non-trivial task, linked from the status table.
- [ ] For a blocked or partial task, confirm `PROGRESS.md` states honestly what is done, what is not, and what the next session needs.
- [ ] Confirm the author recorded a flagged open item (`CLAUDE.md` section 6, or a new one this task raised) in the `PROGRESS.md` open-questions section, not only in chat.
- [ ] Before merge, confirm `npm run lint`, `npm run type-check`, and `npm test` all pass.
