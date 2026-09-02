# Design system implementation rules

Concrete rules for anything added to `design-system/`, beyond what the design brief/handoff bundle (`docs/design-reference/`) specifies visually. These are implementation standards, not design decisions — see `docs/design-reference/README.md` for how the handoff bundle is and isn't used, and for the one documented token exception (`--color-fg-muted`'s AAA contrast).

## Fonts are self-hosted, never loaded from a remote CDN

Font files live in `/public/fonts/` and are declared via `@font-face` in `tokens/fonts.css` — the app must not depend on a network request (e.g. `fonts.googleapis.com`) to render its own type. When a new font weight/family is needed:

1. Download the `.woff2` file(s) from Google Fonts (or wherever) — check whether the family is variable (one file can cover a weight range) or static (one file per weight) before downloading every weight separately.
2. Add the file(s) to `/public/fonts/`.
3. Add an `@font-face` block per weight in `tokens/fonts.css`, pointing at the local `/fonts/...` path.
4. Reference the family through a `--font-*` token in `tokens.css`, never inline in a component.

## Sizing is in `rem`, never `px`

Every size in `design-system/` — font sizes, spacing, border widths, shadow offsets, border-radius — is expressed in `rem`, not `px`. This lets the whole system scale with a user's browser font-size/zoom preference instead of staying pixel-fixed. Conversions assume the browser default root font-size (1rem = 16px); don't add a `html { font-size: ... }` override to change that ratio without updating this assumption everywhere it's documented.

## Spacing and font sizes must come from tokens, never a raw literal

`tokens.css` defines the only sanctioned spacing scale (`--space-1` … `--space-16`) and font-size scale (`--font-size-xs` … `--font-size-2xl`). A component's `.module.css` must reference these tokens for `padding`, `gap`, and `font-size` — never a bespoke `rem`/`px` value.

**Why:** the Claude Design handoff bundle's screens don't reliably land on a 4/8px spacing grid themselves (5px, 6px, 10px, 11px, 13px, 17px, 26px, and font sizes a single px apart like 11/12/13/14/15, all show up) — this reads as prototype drift, not intentional design. Reproducing those exact pixel values in the design system would silently bake that drift in as if it were meaningful, and would leave every component with its own one-off numbers instead of a shared, auditable scale.

**When a value from the handoff bundle doesn't already have a matching token:** round it to the nearest existing step (ties round up) rather than adding a new token for one bespoke pixel value. Only add a new `--space-*`/`--font-size-*` step to `tokens.css` if a genuinely new size is needed and no existing step is a reasonable fit — don't grow either scale to preserve a value that was probably never intentional in the first place.

**What's exempt:** `--border-width`/`--border-width-heavy` and the `--shadow-offset-*`/hover-active `translate()` values are their own token system (the neubrutalist hard-offset-shadow language), not layout spacing — they aren't required to land on the `--space-*` grid.

## Layout

- Each primitive lives in its own folder: `design-system/components/{ComponentName}/{ComponentName}.tsx` + `.module.css` + `.test.tsx`, plus a `package.json` whose `main`/`types` point at `./{ComponentName}.tsx` — this lets `./components/{ComponentName}` resolve as a directory import without renaming the component file to `index.tsx`.
- Tokens live in `design-system/tokens/` (`tokens.css`, `tokens.ts`, `fonts.css`), also with a `package.json` pointing `main`/`types` at `tokens.ts`, so `design-system/index.ts` can import from `./tokens` the same way.
- `tokens.ts` is a plain-JS mirror of the colour values in `tokens.css` (needed for the automated AAA contrast check, which can't read CSS custom properties outside a DOM) — `tokens/tokens.sync.test.ts` asserts the two can't drift; update both together.

## A component's types live in a sibling `types.ts`, Props as its default export

`{ComponentName}.tsx` holds the component function only. Every type/interface it needs — its variant/size/tone unions and its props interface — is declared in `{ComponentName}/types.ts` instead, with the props interface as that file's **default export**:

```ts
// components/Badge/types.ts
import type { ComponentChildren } from 'preact';

export type BadgeTone = 'dark' | 'accent' | 'neutral' | 'error' | 'warning';

export default interface BadgeProps {
  children: ComponentChildren;
  tone?: BadgeTone;
}
```

The component file imports the default export (plus any named types it uses) from `./types`, and re-exports the same names so the public API — what `design-system/index.ts` and consumers import — doesn't change:

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

A generic component's props interface is still a plain `export default interface Props<Row> { ... }` in `types.ts` — TypeScript allows a generic default export the same way. Types used only internally by `types.ts` itself (e.g. `TableColumn` backing `TableProps`) are named exports there, re-exported the same way if a consumer needs them.
