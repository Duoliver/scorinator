# TDD

## Workflow

Build in MVP order: 1 → 2 → 3 → 4, exactly as the specs are sequenced, since each MVP explicitly builds on the last. This also gives natural regression checkpoints — MVP2 work must not break MVP1's passing tests.

For each user story or epic in the MVP docs:

1. **Restate the story as concrete test case(s).** Many are already test-shaped in the specs — the MVP2 AET/Tiebreak table, the MVP3 16-colour palette, MVP1's Tier→OVR ranges, MVP2's bracket bye assignment rule, MVP4's merger tier math. When a doc has a decision table, each row is a test case — use it directly, don't re-derive it.
2. **Write the failing test(s) first.** Prefer committing this step separately when the workflow allows it, so there's a clean trail of red → green.
3. **Implement the minimum to pass.** This is where module *internals* (function shapes, internal types) get designed — informed by the test, not decided in advance.
4. **Refactor**, re-run the full suite, confirm nothing upstream broke. In this repo the refactor runs once for each task, after the review: see "The refactor step" below.

**Task scoping:** one epic (per the MVP docs) or one `design-system/` primitive per task. Never take on "implement the whole MVP" or "build the whole team-management flow, styled and wired" as a single task — this is how domain-first TDD collapses into UI-wiring work that swallows it. See `design-reference/README` doc for why this matters especially around the design handoff.

**When a spec leaves something as an open/balancing detail** (e.g. MVP1's OVR-difference-vs-absolute-OVR weighting, settled in MVP1 Task 5, or MVP4's event trigger probability curves) — do not silently pick a number and move on. Propose the concrete value/approach you intend to test against and flag it explicitly, since these are exactly the decisions a locked-in test can quietly ossify.

## The refactor step

*(Added on 2026-11-11, Task 193.)* Each task with code gets a refactor step after its review and before Done. The step checks the changes of the task against the rules, and fixes each gap at once. It replaces a long cleanup at the end of an MVP, as MVP1 needed (Task 49 and the tasks after it).

**The flow of a task:**

1. **In progress:** the tests first, then the code, then lint, the type check, and the full suite.
2. **Review:** the user checks the work. Every change after the implementation happens here, in as many rounds as the user asks.
3. **Commit 1:** when the user agrees with the review, commit the work of the task, and set the status to 🟦 Refactor.
4. **Refactor:** run the pass below.
5. **Refactor review:** the user checks the pass.
6. **Commit 2:** when the user agrees, set the status to Done, and commit the refactor.

**At Refactor, the task is closed to new work.** Only plain refactoring: no change in behavior. A new request from the user for that task becomes a new task.

**The pass:**

1. Read the diff of the task, from commit 1, against [`docs/code-review-checklist.md`](/docs/code-review-checklist.md). The checklist comes first. One of its entries says to read the local docs of each module or feature that the task touched.
2. Fix each gap at once, in the same task.
3. After a rename or a move, search for the old name (`coding-standards.md`).
4. Run lint, the format check, the type check, and the full suite again.
5. Write one "Refactor" line in the task report: what changed, or "no change".

**What the pass does not fix:**

- A gap in code outside the diff of the task. Write it in the task notes. The user decides if it gets a task.
- A bug. A fix changes behavior. Write it in the task notes. The user decides on a new task.

**The refactor review** lists each change to markup or CSS, for example a class rename. The user then chooses a new check in the real app, or not. A change to names, comments, or code structure needs no new check.

**A task with no code** (docs, the log, a decision) skips the step. It goes from Review to Done, with one commit.

## Testing strategy by layer

Don't apply one testing philosophy uniformly — it should shift by layer:

| Layer | Primary style | Notes |
|---|---|---|
| `engine/` | Heavy **unit** testing | This is where the spec's actual logic lives, and most of it is already test-shaped (decision tables, fixed rules). Fast, precise, high regression value. Don't under-invest here. |
| `persistence/` (pure decision logic, e.g. conflict resolution) | Unit | Skip-vs-fork logic, manifest sync rules — testable without touching disk. |
| `adapters/` (esp. `tauri-fs`) | **Integration**, against a real temp filesystem | Don't over-mock `fs` — atomic-write-then-rename and "manifest written last" crash-safety claims need to be checked against real disk behaviour, not a mock that just records calls. |
| `features/` (Preact) | **Integration** via Testing Library | Mount the screen, simulate the interaction, assert on rendered state and on calls into a real (not over-mocked) `engine/`. Skip DOM snapshot tests — brittle and low-signal for a UI that will change shape often early on. Unit-testing component internals (e.g. "does Button render class X") is low value here. |
| App-level | Thin layer of **end-to-end smoke tests** | Reserve for load-bearing flows only, e.g. create team → create league → generate fixtures → scorinate → save → load round-trip. Not exhaustive — expensive to maintain. |