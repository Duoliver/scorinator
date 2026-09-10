# Design system implementation rules

Concrete rules for anything added to `design-system/`, beyond what the design brief/handoff bundle (`docs/design-reference/`) specifies visually. These are implementation standards, not design decisions. See `docs/design-reference/README.md` for how the handoff bundle is used, and how it is not. It also documents the one token exception: the AAA contrast case for `--color-fg-muted`.

## Fonts are self-hosted, never loaded from a remote CDN

Font files live in `/public/fonts/` and are declared via `@font-face` in `tokens/fonts.css`. The app must not depend on a network request (for example `fonts.googleapis.com`) to render its own type. A new font weight or family needs these steps:

1. Download the `.woff2` file(s) from Google Fonts, or another source. First check whether the family is variable (one file can cover a weight range) or static (one file per weight), so you do not download every weight separately.
2. Add the file(s) to `/public/fonts/`.
3. Add an `@font-face` block per weight in `tokens/fonts.css`, pointing at the local `/fonts/...` path.
4. Reference the family through a `--font-*` token in `tokens.css`, never inline in a component.

## Sizing is in `rem`, never `px`

Every size in `design-system/` is expressed in `rem`, not `px`. This includes font sizes, spacing, border widths, shadow offsets, and border-radius. This lets the whole system scale with the browser font-size or zoom preference of the user, instead of staying pixel-fixed. Conversions assume the browser default root font-size, where 1rem equals 16px. Do not add an `html { font-size: ... }` override that changes this ratio, without updating this assumption everywhere it is documented.

## Spacing and font sizes must come from tokens, never a raw literal

`tokens.css` defines the only sanctioned spacing scale (`--space-1` … `--space-16`) and font-size scale (`--font-size-xs` … `--font-size-4xl`). A `.module.css` file for a component must reference these tokens for `padding`, `gap`, and `font-size`. Never use a bespoke `rem`/`px` value.

**Why:** the screens in the Claude Design handoff bundle do not reliably land on a 4/8px spacing grid. Several odd values show up: 5px, 6px, 10px, 11px, 13px, 17px, 26px, and font sizes a single px apart, like 11/12/13/14/15. This reads as prototype drift, not intentional design. Reproducing those exact pixel values in the design system would bake that drift in silently, as if it were meaningful. It would also leave every component with its own one-off numbers, instead of a shared, auditable scale.

**When a value from the handoff bundle has no matching token yet:** round it to the nearest existing step, with ties rounding up. Do not add a new token for one bespoke pixel value. Only add a new `--space-*`/`--font-size-*` step to `tokens.css` when a genuinely new size is needed, and no existing step is a reasonable fit. Do not grow either scale just to preserve a value that was probably never intentional in the first place.

**What is exempt:** `--border-width`/`--border-width-heavy` and the `--shadow-offset-*`/hover-active `translate()` values form their own token system — the neubrutalist hard-offset-shadow language, not layout spacing. They do not need to land on the `--space-*` grid.

## Base HTML element typography lives in `tokens/elements.css`, not inline

`h1` and `h2` carry their type style (`font-family`, `font-size`, `margin: 0`) from a global rule in `tokens/elements.css`, imported once in `main.tsx` alongside `tokens.css`/`fonts.css`. A screen or component using a plain `<h1>`/`<h2>` for a page or section title needs no `style` prop at all.

This rule exists because every current use of `<h1>`/`<h2>` in the app is the same plain title, styled the same way, previously repeated inline in five different places. It is also the first concrete step on `coding-standards.md`'s "No inline styling" rule.

**Only element selectors with zero per-instance variation belong here.** Heading level follows document structure, not desired style — pick `h1`/`h2`/`h3` by outline position, never by which one happens to look right. A heading that needs a different look overrides with its own class, rather than growing `elements.css` into a pile of per-case exceptions. Do not add a new element selector here for a one-off case — that belongs in the component's own `.module.css` instead.

## Layout

- Each primitive lives in its own folder: `design-system/components/{ComponentName}/{ComponentName}.tsx`, plus `.module.css`, `.test.tsx`, and `types.ts` (see below). It also has a `package.json` whose `main`/`types` point at `./{ComponentName}.tsx`. This lets `./components/{ComponentName}` resolve as a directory import, with no need to rename the component file to `index.tsx`.
- Tokens live in `design-system/tokens/`: `tokens.css`, `tokens.ts`, `fonts.css`, `elements.css`. This folder also has a `package.json` pointing `main`/`types` at `tokens.ts`. That lets `design-system/index.ts` import from `./tokens` the same way as a component.
- `tokens.ts` is a plain-JS mirror of the colour values in `tokens.css`. This exists for the automated AAA contrast check, which cannot read CSS custom properties outside a DOM. `tokens/tokens.sync.test.ts` asserts the two stay in sync. Update both files together.

## Component types live in a sibling `types.ts`

This module follows the general `types.ts`-per-component convention: a props interface as the default export, named unions alongside it, re-exported from the component file. See [`coding-standards`](/docs/coding-standards.md) for the rule and examples. Nothing design-system-specific needs adding beyond that.
