# Code review checklist

Use this list for every review in this repo, and first in the refactor pass of each task ([`tdd.md`](/docs/tdd.md#the-refactor-step)). Read the diff of the task against it. Check only the sections that apply to the diff. Each entry ends with a link to its rule. Read the rule when an entry is not clear: the rule holds the reason and the examples. *(Rewritten on 2026-11-11, Task 194.)*

## 1. Local docs

- [ ] Read the local docs of each module or feature folder that the diff touches: `ENGINE.md`, `DOMAIN.md`, `PERSISTENCE.md`, `DESIGN_SYSTEM.md`, `FEATURES.md`, and any `.md` file in the folder. Check the diff against their rules too. ([`CLAUDE.md`](/CLAUDE.md#documentation))

## 2. Scope

- [ ] The change stays inside the scope line of `PROGRESS.md`. It adds no feature of a later MVP, not even a part of one. ([`CLAUDE.md`](/CLAUDE.md#implementation-scope--mvp1-and-mvp2-only-for-now))
- [ ] The change does not build an item of `scorinator-future-features.md`. If it touches one, stop and flag it. ([`CLAUDE.md`](/CLAUDE.md#open-items-to-flag-not-silently-resolve))
- [ ] A change that touches an open item of `CLAUDE.md` names the chosen approach in the task notes. No value is picked silently. ([`CLAUDE.md`](/CLAUDE.md#open-items-to-flag-not-silently-resolve))
- [ ] A new balancing number (a threshold, a band, a weight) has a user decision in the task notes. ([`tdd.md`](/docs/tdd.md#workflow))

## 3. Module boundaries

- [ ] `engine/` imports nothing from `features/`, `design-system/`, `adapters/`, `app/`, `domain/`, Preact, or Tauri. It makes no file call. ([`module-boundaries.md`](/docs/module-boundaries.md))
- [ ] `features/` does not import `adapters/` or `persistence/`. It calls `engine/` and the `app/data` layer. ([`module-boundaries.md`](/docs/module-boundaries.md))
- [ ] `persistence/` holds interfaces only, with no `fs` or Tauri call. `adapters/` implements them. ([`module-boundaries.md`](/docs/module-boundaries.md))
- [ ] `domain/` holds types only and imports only `engine/` types. `engine/` and `adapters/` never import it. Code imports it from the `@/domain` barrel. ([`DOMAIN.md`](/src/domain/DOMAIN.md#rules))
- [ ] A file in `features/components/` never imports from a screen folder. ([`FEATURES.md`](/src/features/FEATURES.md#featurescomponents))
- [ ] Code that more than one screen folder needs (a component, a hook, a function, a view type) lives in `features/components/`. ([`FEATURES.md`](/src/features/FEATURES.md#featurescomponents))
- [ ] Only `design-system/` reads the design brief and the handoff bundle. `features/` uses `design-system/`. ([`module-boundaries.md`](/docs/module-boundaries.md))
- [ ] The diff adds no empty folder or scaffolding for a module that no task builds yet. ([`module-boundaries.md`](/docs/module-boundaries.md))

## 4. Components and files

- [ ] A component keeps its types in a sibling `types.ts`, with the props interface as the default export. The component file re-exports its props type, and other types only when a file outside the folder needs them. ([`coding-standards.md`](/docs/coding-standards.md#a-components-types-live-in-a-sibling-typests-props-as-its-default-export))
- [ ] A component in `features/` or `app/` has three layers: `helpers.ts(x)` for code with no props or state, a `useX` hook for state and handlers, and markup with no logic. ([`coding-standards.md`](/docs/coding-standards.md#a-component-has-three-layers-helpers-a-usex-hook-and-the-markup))
- [ ] `useMemo` and `useCallback` appear only where the rule asks for them. ([`coding-standards.md`](/docs/coding-standards.md#when-to-use-usememo-and-usecallback))
- [ ] A screen folder with more than one component gives each one its own subfolder, with an `index.ts` barrel. ([`FEATURES.md`](/src/features/FEATURES.md#one-folder-for-each-component))
- [ ] An import across folders uses `@/`. A relative import is only `./` for a sibling file, never `../`. ([`coding-standards.md`](/docs/coding-standards.md#use-absolute-imports-not-relative))
- [ ] Preact event and CSS types come from `preact`, not from a deprecated `JSX.*` member. ([`coding-standards.md`](/docs/coding-standards.md#preact-import-types-from-the-top-level-preact-namespace-not-jsx))

## 5. Stores and state

- [ ] A store file holds state only. Each action is a plain function in a sibling `xActions.ts`, named with the subject of the store, such as `setStatusLine`. ([`coding-standards.md`](/docs/coding-standards.md#a-store-holds-state-only-its-actions-live-in-a-sibling-actionsts-file))
- [ ] An action changes another store only through that store's actions. A component imports actions directly, and uses the store hook only to read. ([`coding-standards.md`](/docs/coding-standards.md#a-store-holds-state-only-its-actions-live-in-a-sibling-actionsts-file))
- [ ] A screen that keeps a draft across a nav switch uses a cold-cache store, read and written at the three points only. Text fields stay uncontrolled. ([`coding-standards.md`](/docs/coding-standards.md#a-screen-that-must-survive-a-nav-switch-keeps-its-draft-in-a-cold-cache-store))

## 6. Names and values

- [ ] A new function name starts with a verb in the imperative. `get` always gives a value, `find` can give `undefined`, and a boolean function starts with `is`, `has`, or `can`. ([`coding-standards.md`](/docs/coding-standards.md#start-a-function-name-with-a-verb-in-the-imperative))
- [ ] A boolean prop is off by default, and its name says the behavior that the caller turns on. ([`coding-standards.md`](/docs/coding-standards.md#a-boolean-prop-is-off-by-default))
- [ ] A value set of the data model is an `as const` object with UPPER_SNAKE_CASE members, and the code uses the members, not the plain strings. Tests keep the plain strings. ([`coding-standards.md`](/docs/coding-standards.md#a-value-set-of-the-data-model-is-an-as-const-object))
- [ ] A `catch` in `app/` or `features/` reads the error with `getErrorMessage`. ([`coding-standards.md`](/docs/coding-standards.md#in-a-catch-read-the-error-with-geterrormessage))

## 7. CSS

- [ ] No `!important`. A specificity conflict uses source order or a stronger selector. ([`coding-standards.md`](/docs/coding-standards.md#no-important-in-css))
- [ ] No `style` prop, except for a value that comes from data at runtime, such as a team colour. ([`coding-standards.md`](/docs/coding-standards.md#no-inline-styling))
- [ ] A centered container also centers its own children: `justify-content: center` on a row, `text-align: center` on text. ([`coding-standards.md`](/docs/coding-standards.md#a-centered-container-centers-its-own-children))
- [ ] Each size is in `rem`. Padding, gap, and font size use a `tokens.css` step. A handoff value with no token rounds to the nearest step. ([`DESIGN_SYSTEM.md`](/src/design-system/DESIGN_SYSTEM.md#spacing-and-font-sizes-must-come-from-tokens-never-a-raw-literal))
- [ ] A bold uppercase field label uses `--font-size-sm`. ([`DESIGN_SYSTEM.md`](/src/design-system/DESIGN_SYSTEM.md#spacing-and-font-sizes-must-come-from-tokens-never-a-raw-literal))

## 8. Design system

- [ ] A new primitive has its folder: `{Name}.tsx`, `.module.css`, `.test.tsx`, `types.ts`, and a `package.json` that points at the component file. ([`DESIGN_SYSTEM.md`](/src/design-system/DESIGN_SYSTEM.md#layout))
- [ ] A primitive that holds a value uses `useFieldHandle`. Inside `design-system/`, `FieldHandle` comes from `@/design-system/field`, not from the barrel. ([`DESIGN_SYSTEM.md`](/src/design-system/DESIGN_SYSTEM.md#a-field-primitive-uses-usefieldhandle))
- [ ] An overlay is a native `<dialog>`, opened by its mount. No `open` prop and no hand-made focus trap. ([`DESIGN_SYSTEM.md`](/src/design-system/DESIGN_SYSTEM.md#an-overlay-is-a-native-dialog-mounted-to-open-it))
- [ ] A new font file is in `/public/fonts/` and `tokens/fonts.css`. No remote font link. ([`DESIGN_SYSTEM.md`](/src/design-system/DESIGN_SYSTEM.md#fonts-are-self-hosted-never-loaded-from-a-remote-cdn))
- [ ] A colour change in `tokens.css` has the same change in `tokens.ts`. ([`DESIGN_SYSTEM.md`](/src/design-system/DESIGN_SYSTEM.md#layout))
- [ ] A team colour lives only in `tokens/teamPalette.ts`. ([`DESIGN_SYSTEM.md`](/src/design-system/DESIGN_SYSTEM.md#the-team-colour-palette-lives-in-tokensteampalettets-only))
- [ ] A rule in `tokens/elements.css` is an element selector with no case-by-case change. A one-off look goes in the component's CSS module. ([`DESIGN_SYSTEM.md`](/src/design-system/DESIGN_SYSTEM.md#base-html-element-typography-lives-in-tokenselementscss-not-inline))

## 9. Comments

- [ ] A new or changed comment says why the code exists. It does not list the callers of a function or the users of a file. ([`coding-standards.md`](/docs/coding-standards.md#write-why-the-code-exists-not-who-calls-it))
- [ ] After a rename or a move, a search for the old name finds nothing in `src/` and `docs/`, or the task notes say why a match stays. ([`coding-standards.md`](/docs/coding-standards.md#after-a-rename-or-a-move-search-for-the-old-name))

## 10. Tests

- [ ] The tests came first, and failed before the code. ([`tdd.md`](/docs/tdd.md#workflow))
- [ ] Each layer has its test style: unit tests in `engine/`, integration tests on a real temp folder in `adapters/`, Testing Library through the screen in `features/`. ([`tdd.md`](/docs/tdd.md#testing-strategy-by-layer))
- [ ] Each row of a spec decision table has a test case. ([`tdd.md`](/docs/tdd.md#workflow))
- [ ] No DOM snapshot test, and no test of a component's internal markup. ([`tdd.md`](/docs/tdd.md#testing-strategy-by-layer))
- [ ] A hook gets its own `useX.test.ts` only when it is shared, or when the screen tests cannot reach its logic easily. ([`coding-standards.md`](/docs/coding-standards.md#a-component-has-three-layers-helpers-a-usex-hook-and-the-markup))
- [ ] A new or changed load-bearing flow has an end-to-end smoke test. ([`tdd.md`](/docs/tdd.md#testing-strategy-by-layer))

## 11. Engine

- [ ] Each random decision takes an injected RNG. No `Math.random()`. ([`ENGINE.md`](/src/engine/ENGINE.md#determinism-requirements-for-engine))
- [ ] `engine/identity/` takes UUID generation and the clock as inputs. ([`ENGINE.md`](/src/engine/ENGINE.md#determinism-requirements-for-engine))
- [ ] A match simulation test makes statistical assertions over many seeded runs, not exact scores. ([`ENGINE.md`](/src/engine/ENGINE.md#determinism-requirements-for-engine))

## 12. Persistence

- [ ] A disk write goes to a temp file, then a rename, one file at a time. ([`PERSISTENCE.md`](/src/persistence/PERSISTENCE.md#3-consequences-to-design-for))
- [ ] A save that changes the manifest and a wrapper writes the manifest last. ([`PERSISTENCE.md`](/src/persistence/PERSISTENCE.md#3-consequences-to-design-for))
- [ ] A wrapper has the UUID of its content, not a UUID of its own. ([`PERSISTENCE.md`](/src/persistence/PERSISTENCE.md#2a-instance-wrapper-design))
- [ ] The database export is a bundle of the manifest and the wrapper files. A league or Blueprint export stays one self-contained JSON file. ([`PERSISTENCE.md`](/src/persistence/PERSISTENCE.md#3-consequences-to-design-for))
- [ ] No autosave, unless the user scoped it in a task. ([`PERSISTENCE.md`](/src/persistence/PERSISTENCE.md#5-open-items))

## 13. Process

- [ ] The status board row and the task file show the current state: the status, the dates, and the notes. ([`CLAUDE.md`](/CLAUDE.md#maintaining-progressmd))
- [ ] An open item or a question for the user is in the open questions of `PROGRESS.md`, not only in the chat. ([`CLAUDE.md`](/CLAUDE.md#maintaining-progressmd))
- [ ] The refactor pass reads only the diff of the task. A gap outside the diff, or a bug, goes in the task notes, not in the pass. ([`tdd.md`](/docs/tdd.md#the-refactor-step))
- [ ] `npm run lint`, `npm run format:check`, `npm run type-check`, and `npm test` pass. ([`CLAUDE.md`](/CLAUDE.md#before-finishing-a-task))
- [ ] The task report has its "Refactor" line: what changed, or "no change". ([`tdd.md`](/docs/tdd.md#the-refactor-step))
