# TDD

## Workflow

Build in MVP order: 1 → 2 → 3 → 4, exactly as the specs are sequenced, since each MVP explicitly builds on the last. This also gives natural regression checkpoints — MVP2 work must not break MVP1's passing tests.

For each user story or epic in the MVP docs:

1. **Restate the story as concrete test case(s).** Many are already test-shaped in the specs — the MVP2 AET/Tiebreak table, the MVP3 16-colour palette, MVP1's Tier→OVR ranges, MVP2's bracket bye assignment rule, MVP4's merger tier math. When a doc has a decision table, each row is a test case — use it directly, don't re-derive it.
2. **Write the failing test(s) first.** Prefer committing this step separately when the workflow allows it, so there's a clean trail of red → green.
3. **Implement the minimum to pass.** This is where module *internals* (function shapes, internal types) get designed — informed by the test, not decided in advance.
4. **Refactor**, re-run the full suite for that module, confirm nothing upstream broke.

**Task scoping:** one epic (per the MVP docs) or one `design-system/` primitive per task. Never take on "implement the whole MVP" or "build the whole team-management flow, styled and wired" as a single task — this is how domain-first TDD collapses into UI-wiring work that swallows it. See §4 for why this matters especially around the design handoff.

**When a spec leaves something as an open/balancing detail** (e.g. MVP1's OVR-difference-vs-absolute-OVR weighting, MVP4's event trigger probability curves) — do not silently pick a number and move on. Propose the concrete value/approach you intend to test against and flag it explicitly, since these are exactly the decisions a locked-in test can quietly ossify.

## Testing strategy by layer

Don't apply one testing philosophy uniformly — it should shift by layer:

| Layer | Primary style | Notes |
|---|---|---|
| `engine/` | Heavy **unit** testing | This is where the spec's actual logic lives, and most of it is already test-shaped (decision tables, fixed rules). Fast, precise, high regression value. Don't under-invest here. |
| `persistence/` (pure decision logic, e.g. conflict resolution) | Unit | Skip-vs-fork logic, manifest sync rules — testable without touching disk. |
| `adapters/` (esp. `tauri-fs`) | **Integration**, against a real temp filesystem | Don't over-mock `fs` — atomic-write-then-rename and "manifest written last" crash-safety claims need to be checked against real disk behaviour, not a mock that just records calls. |
| `features/` (Preact) | **Integration** via Testing Library | Mount the screen, simulate the interaction, assert on rendered state and on calls into a real (not over-mocked) `engine/`. Skip DOM snapshot tests — brittle and low-signal for a UI that will change shape often early on. Unit-testing component internals (e.g. "does Button render class X") is low value here. |
| App-level | Thin layer of **end-to-end smoke tests** | Reserve for load-bearing flows only, e.g. create team → create league → generate fixtures → scorinate → save → load round-trip. Not exhaustive — expensive to maintain. |