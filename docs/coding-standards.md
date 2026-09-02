# Coding standards

General implementation rules that apply across the codebase, not scoped to one module. Module-specific rules live with the module instead (see `CLAUDE.md`'s Documentation section) — put a rule here only once it applies beyond a single module.

## Preact: import types from the top-level `preact` namespace, not `JSX.*`

Preact's `JSX` namespace (`import type { JSX } from 'preact'`) still exists, but most of its members — `JSX.TargetedEvent`, `JSX.TargetedMouseEvent`, `JSX.CSSProperties`, and the rest of the `Targeted*Event`/`*EventHandler` family — are individually marked `@deprecated` in Preact's own type definitions, in favor of importing the same type directly from `preact`:

```ts
// Don't
import type { JSX } from 'preact';
onClick?: (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => void;

// Do
import type { TargetedMouseEvent } from 'preact';
onClick?: (event: TargetedMouseEvent<HTMLButtonElement>) => void;
```

If a type isn't available as a top-level export from `preact` (check `node_modules/preact/src/index.d.ts` / `dom.d.ts`), only then fall back to the `JSX` namespace — and check whether that specific member is flagged `@deprecated` before relying on it.

## A component's types live in a sibling `types.ts`, Props as its default export

Applies to any parametrized, reusable Preact component — `design-system/` primitives today, but the same shape will apply to `features/` screen sections and any other complex component once those exist. The component file (`{ComponentName}.tsx`) holds only the component function; every type/interface it needs — variant/size/tone-style unions and its props interface — is declared in a sibling `{ComponentName}/types.ts`, with the props interface as that file's **default export**:

```ts
// components/Badge/types.ts
import type { ComponentChildren } from 'preact';

export type BadgeTone = 'dark' | 'accent' | 'neutral' | 'error' | 'warning';

export default interface BadgeProps {
  children: ComponentChildren;
  tone?: BadgeTone;
}
```

The component file imports the default export (plus any named types it uses) from `./types`, and re-exports the same names — so the public API (what a barrel `index.ts` or any other consumer imports) doesn't change:

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

A generic component's props interface is still a plain `export default interface Props<Row> { ... }` in `types.ts` — TypeScript allows a generic default export the same way (see `design-system/components/Table/types.ts` for a real example: `TableProps<Row>` as the default export, `TableColumn<Row>` as a named one it depends on). Types used only internally by `types.ts` itself are named exports there, re-exported from the component file the same way only if a consumer actually needs them.
