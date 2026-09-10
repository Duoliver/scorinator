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

This rule applies to any parametrized, reusable Preact component. Today that means `design-system/` primitives. The same shape will apply later to `features/` screen sections and other complex components. The component file (`{ComponentName}.tsx`) holds only the component function. Every type or interface it needs goes in a sibling file, `{ComponentName}/types.ts`. This includes variant, size, and tone-style unions, and the props interface. The props interface is that file's **default export**:

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
