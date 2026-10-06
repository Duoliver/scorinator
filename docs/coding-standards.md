# Coding standards

This file holds general implementation rules. These rules apply across the codebase, not to one module. Module-specific rules live with the module instead. See the Documentation section in `CLAUDE.md`. Add a rule here only when it applies to more than one module.

## Preact: import types from the top-level `preact` namespace, not `JSX.*`

Preact's `JSX` namespace (`import type { JSX } from 'preact'`) still exists. But most of its members are deprecated: `JSX.TargetedEvent`, `JSX.TargetedMouseEvent`, `JSX.CSSProperties`, and the rest of the `Targeted*Event`/`*EventHandler` family. Preact's own type definitions mark each one `@deprecated`. Import the same type directly from `preact` instead:

```ts
// Don't
import type { JSX } from 'preact';
onClick?: (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => void;

// Do
import type { TargetedMouseEvent } from 'preact';
onClick?: (event: TargetedMouseEvent<HTMLButtonElement>) => void;
```

If a type is not available as a top-level export from `preact`, check `node_modules/preact/src/index.d.ts` and `dom.d.ts`. Only then, fall back to the `JSX` namespace. Check whether that specific member carries the `@deprecated` flag before you use it.

## A component's types live in a sibling `types.ts`, Props as its default export

This rule applies to any parametrized, reusable Preact component: the `design-system/` primitives, and the views and screens in `features/` (decided 2026-10-06, Task 42). `features/standings/types.ts` is the first `features/` example. A view's `types.ts` also holds the types its `useX` hook returns. The component file (`{ComponentName}.tsx`) holds only the component function. Every type or interface it needs goes in a sibling file, `{ComponentName}/types.ts`. This includes variant, size, and tone-style unions, and the props interface. The props interface is that file's **default export**:

```ts
// components/Badge/types.ts
import type { ComponentChildren } from 'preact';

export type BadgeTone = 'dark' | 'accent' | 'neutral' | 'error' | 'warning';

export default interface BadgeProps {
  children: ComponentChildren;
  tone?: BadgeTone;
}
```

The component file imports the default export from `./types`, plus any named types it uses. It re-exports the same names. This keeps the public API unchanged — the API is what a barrel `index.ts` or any other consumer imports:

```ts
// components/Badge/Badge.tsx
import type BadgeProps from './types';
import type { BadgeTone } from './types';
import styles from './Badge.module.css';

export type { BadgeProps, BadgeTone };

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  /* ... */
}
```

A generic component's props interface follows the same pattern: a plain `export default interface Props<Row> { ... }` in `types.ts`. TypeScript allows a generic default export the same way. See `design-system/components/Table/types.ts` for a real example: `TableProps<Row>` is the default export, and `TableColumn<Row>` is a named export it depends on. Types used only inside `types.ts` stay as named exports there. Re-export a type from the component file only when a consumer needs it.

## A component has three layers: helpers, a `useX` hook, and the markup

This rule applies to every component in `features/`. Split the code of a component into three layers, each in its own sibling file. The types go in `types.ts`, per the rule above.

1. **A sibling `helpers.tsx` file.** Anything that does not use props, state, or a hook goes here, outside the component file. Examples: static table columns, small render helpers, constants, and pure functions. Use `helpers.ts` when the file holds no JSX. A component with no such code has no helpers file.
2. **A `useX` hook in a sibling `useX.ts` file.** Store reads, derived data, effects, refs, and event handlers go here. The hook returns data that is ready for the view, for example rows with the team name already joined in.
3. **The component.** It calls the hook and returns JSX. It holds no logic of its own.

See `features/standings/` for a worked example:

```
features/standings/
  StandingsView.tsx         the component only
  StandingsView.module.css
  types.ts                  StandingsViewProps (default), StandingsViewRow, Standings
  useStandings.ts           the hook
  helpers.tsx               COLUMNS, mono, rowKey
```

```tsx
// features/standings/useStandings.ts
export function useStandings(league: LeagueRecord): Standings {
  const lookupTeam = useTeamLookup();
  const rows = useMemo(() => /* calculateStandings + team names */, [league, lookupTeam]);
  return { rows, hasTeams: league.teams.length > 0, hasResults: league.results.length > 0 };
}

// features/standings/helpers.tsx
export const COLUMNS: TableColumn<StandingsViewRow>[] = [/* static */];

// features/standings/StandingsView.tsx
export function StandingsView({ league }: StandingsViewProps): JSX.Element {
  const { rows, hasTeams, hasResults } = useStandings(league);
  if (!hasTeams) return <p class={styles.note}>No teams in this league yet.</p>;
  return <Table columns={COLUMNS} rows={rows} rowKey={rowKey} />;
}
```

A large component can have more than one hook, one for each concern, for example `useScoreFlash` and `useMatchdayNav`. A hook that more than one screen folder needs goes in `features/components/`, for example `useTeamLookup`. See `FEATURES.md`.

**Test a component through its screen, with Testing Library, as `docs/tdd.md` says.** Give a hook its own `useX.test.ts` with `renderHook` only when the hook is shared or holds logic that the screen tests cannot reach easily.

### When to use `useMemo` and `useCallback`

A function or object that a render makes again costs microseconds. It causes extra work only when something compares it by reference. So do not wrap everything by default:

- **`useMemo`:** use it for an expensive derivation, such as an `engine/` call over all results. Also use it when another hook lists the value as a dependency and must not run again on each render. `useTeamLookup` does this, so `useStandings` can list the lookup in its own `useMemo`.
- **`useCallback`:** use it only when a `memo()` child or an effect lists the function as a dependency. No component in `src/` uses `memo()` today.
- **Neither:** for a handler passed to a design-system primitive, or for a small value. Move it to `helpers.tsx` if it does not use props or state.

## A screen that must survive a nav switch keeps its draft in a cold-cache store

`preact-router` fully unmounts a screen on nav-away, and fully remounts it on nav-back. Any plain `useState` inside that screen resets on remount. A wizard, a multi-field form, or any screen holding real in-progress work needs a place to keep its draft between those two events. Without one, the user loses it.

Reach for a small Zustand slice under `app/state/`, next to `teamsStore.ts` and `leagueStore.ts` — see `leagueDraftStore.ts` and `leagueDraftActions.ts` for a worked example. Keep that store to exactly this shape, with its two actions in a sibling `xDraftActions.ts` (see the store actions rule below):

```ts
// app/state/xDraftStore.ts
export type XDraftState = XDraft;

// app/state/xDraftActions.ts
export function setXDraft(draft: XDraft): void { /* ... */ }
export function resetXDraft(): void { /* ... */ }
```

No per-field action (`setName`, `toggleTeam`, and so on). Those stay local to the screen, exactly as they would with no store at all. The store holds one snapshot, plus two ways to change it. It is not a live API surface that grows with every field the screen ever gains.

Read and write that store at exactly three points, never per keystroke or per click:

1. **On mount**, once, through `useLeagueDraftStore.getState()` — not a subscribed selector — to seed local `useState`.
2. **On a step or tab change**, in a wizard. Read a value before its field unmounts.
3. **On unmount**, through a `useEffect` cleanup with an empty dependency array, so the draft survives the actual nav-away. See `features/leagues/LeagueSetupScreen/useLeagueDraftSync.ts` for this effect in its own hook.

For a text or number field edited at typing speed, do not wire its `onChange` to the store. Do not even wire it to the screen's own local reactive state. Make the field fully uncontrolled instead. Hold a `FieldHandle` ref to it — `Input`, `Select`, `Switch`, and `Checkbox` all already expose one. Read `.getValue()` only at one of the three points above. If the field lives inside a child component, wrap that child in a small `forwardRef` plus `useImperativeHandle` — see `DetailsStep`'s `getValues()` handle for a worked example. `TeamsStep`'s own `checkboxHandles` map already does the same thing, for a set of checkboxes. This is not a new pattern for this codebase, only a new place to use it.

The point of the three-point rule: a screen with `N` fields and `M` keystrokes should cost the store one read and a handful of writes, never `M` writes. The same rule, and the same uncontrolled-field technique, apply to any future screen with this draft-loss problem. The League Setup wizard is the first case here, not the only one.

## A store holds state only. Its actions live in a sibling `*Actions.ts` file

This rule applies to every Zustand store under `app/state/`. The store file (`xStore.ts`) holds the state interface, the `create()` call with the initial state, and pure read helpers such as `isLeagueUnsaved`. It holds no action. Each action is a plain exported function in a sibling file, `xActions.ts`. The action changes the store through `useXStore.setState` and reads it through `useXStore.getState`. Zustand calls this the "no store actions" pattern.

```ts
// app/state/teamsStore.ts
export interface TeamsState {
  teams: TeamRecord[];
}

export const useTeamsStore = create<TeamsState>()(() => ({
  teams: [],
}));

// app/state/teamsActions.ts
export function addTeam(team: TeamRecord): void {
  useTeamsStore.setState((state) => ({ teams: [...state.teams, team] }));
}
```

A component imports the action directly. It uses the store hook only to read state:

```tsx
// Don't
const addTeam = useTeamsStore((state) => state.addTeam);

// Do
import { addTeam } from '@/app/state/teamsActions';
const teams = useTeamsStore((state) => state.teams);
```

Rules for the actions file:

- **Name an action for what it does, with the store's subject in the name.** The action is a module-level export, so a name like `setStatus` or `reset` loses its context at the call site. Write `setFileStatus` and `resetLeagueDraft`.
- **An action may call an action of another store.** Import it from that store's actions file. For example, `addLeague` calls `setCurrentLeague` from `fileActions.ts`. Do not call another store's `setState` directly.
- **Keep helpers private.** A helper that only actions use, such as `playFixture` in `leagueActions.ts`, stays an unexported function in the actions file.
- **Tests go in `xActions.test.ts`.** A test resets the store with `useXStore.setState(...)` in `beforeEach`, calls the action, and asserts on `useXStore.getState()`.

An action that uses several stores and an `app/data` function, such as a save or a load, is an app action. It lives one level up, in `app/` (`saveActions.ts`, `loadActions.ts`, `exportActions.ts`). It follows the same plain-function shape.

## Use absolute imports, not relative

Import across directories with the `@/` alias, not `../`. The alias maps to `src/`, configured in `tsconfig.json` (`paths`), `vite.config.ts` and `vitest.config.ts` (`resolve.alias`), and `eslint.config.mjs` (`import/resolver`).

```ts
// Don't
import { TIER_ORDER } from '../../engine/tier-ovr';

// Do
import { TIER_ORDER } from '@/engine/tier-ovr';
```

A relative import (`./types`, `./Badge.module.css`) is still correct for a file importing a sibling in the same directory, such as a component and its `types.ts`. Never write a relative import with `../` — use `@/...` instead.

## No `!important` in CSS

This codebase's stylesheets must not use `!important`. It is a specificity escape hatch. It hides the real conflict instead of resolving it. It also silently outranks any rule a later change adds. This includes a future `!important` someone adds to fight the first one.

Two rules of equal specificity sometimes both need to apply in one state. An example is a pseudo-class combo like `:hover:active`. Another is a variant class that must override a size class. Resolve this structurally instead:

- Match the specificity of the rule you need to beat. Rely on source order: on a tie, the later rule wins. Place your rule after it.
- Or raise specificity on purpose, for example with an extra class or attribute selector. Do not force it with `!important`.

See `design-system/components/Button/Button.module.css` for a worked example. The `.ghost` class suppresses a box shadow. That rule is restated in `.ghost:hover` and `.ghost:active`. Each restatement matches the specificity of the size-class hover and active rules it must override. The file places these rules after the size-class rules, instead of using `!important`.

## No inline styling

Do not use the `style` prop (`style={{ ... }}` or a `style="..."` string) on a component or element. Put the rule in a CSS module instead, and reference design tokens from `tokens.css`.

Inline styles skip the cascade. They cannot use `:hover`, `:active`, or media queries without extra JS. They also duplicate values that `tokens.css` already defines, such as `--color-*`, `--font-*`, and spacing tokens. A CSS module keeps every rule in one place per component. It also lets the "No `!important`" rule above still apply.

```tsx
// Don't
<div style={{ display: 'flex', gap: '1rem', color: 'var(--color-fg-muted)' }} />

// Do
import styles from './TeamsScreen.module.css';
<div className={styles.toolbar} />
```

```css
/* TeamsScreen.module.css */
.toolbar {
  display: flex;
  gap: 1rem;
  color: var(--color-fg-muted);
}
```

A `style` prop is acceptable only for a value your code computes at runtime from data. One example is a team's user-chosen hex colour swatch. Never use it for a static layout or token value.
