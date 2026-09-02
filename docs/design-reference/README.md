# Working from the Claude Design handoff — read this before touching any screen

- The **Claude Design handoff bundle** — is the actual export from Claude Design, containing full rendered prototype screens (HTML/CSS, interactive mockups), not just a style guide.

**Do not treat it as a per-screen implementation guide to build directly from.** The handoff bundle in particular can look enough like working code that it's tempting to port it wholesale — resist this. Its markup has no real state, no real data shapes, and its styling may duplicate rather than reuse a token system, so copying it in risks baking in one-off styles that drift the moment a second screen needs the same component.

**Sequencing (mandatory):**
1. Before any feature screen work begins, do a single dedicated pass — informed by *both* the brief and the handoff bundle — that produces `design-system/`:
   - A **tokens** file (CSS variables for colour, spacing, shadow offset, border weight, radius, typography) reconciling the brief's stated direction with whatever the handoff bundle actually rendered.
   - A small set of **primitives** (Button, Card, Badge/Tag, Table, Tabs, Input) — real, tested Preact components styled from those tokens, not copies of the bundle's markup.

   Both are built and reviewed in isolation, with their own tests (rendering, basic interaction, and the AAA contrast check below).
2. The bundle's **full screen prototypes are kept as reference only** — not deleted, not copied in wholesale. When a `features/` task builds a specific screen (e.g. the standings table, the team creation form), it may look at the corresponding prototype screen for layout intent — spacing, hierarchy, which elements sit where — but implements it as a real Preact component using `engine/` data and `design-system/` primitives, not by porting the prototype's static HTML.
3. Only after `design-system/` exists does any `features/` work start. If a feature needs a primitive that doesn't exist yet, that's a separate task against `design-system/` first, not an inline detour inside the feature task.

**Why this matters:** without this separation, a task like "build the team creation form" tends to become "read the whole handoff bundle and build a fully styled, fully wired screen in one pass" — which bypasses TDD for the UI layer entirely and tends to reintroduce coupling between domain logic and presentation that the `module-boundaries` docs are meant to prevent.

**Automated check:** once `design-system/` tokens exist, add a test that checks the brief's WCAG AAA contrast requirement (text/background, text/accent pairings) programmatically against the token values — this is cheap to automate and should fail the build if a future token edit regresses contrast.

---

**Known contrast exception (`--color-fg-muted`):** the Foundations reference screen states all foreground/background pairings meet AAA (7:1+), but `--color-fg-muted` (#5C5C5C) on `--color-surface` (#FFFFFF) actually measures ~6.69:1 — it clears AA (4.5:1) and AAA-large-text, but not AAA normal-text. Confirmed with the user (2026-09-02): `fg-muted` is intended for disabled/de-emphasized elements, not primary body text, so the value is being kept as-is rather than darkened. The design-system's automated AAA contrast test (`src/design-system/tokens/contrast.test.ts`) excludes this pairing from its strict 7:1 checks accordingly — don't use `fg-muted` for text that needs to read as fully legible/primary content.