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
