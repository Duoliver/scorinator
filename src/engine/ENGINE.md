## Determinism requirements for `engine/`

Every stochastic decision must take an **injected RNG**, never call `Math.random()` inline. This includes, non-exhaustively:

- OVR roll from Tier range (MVP1)
- Match elasticity roll (MVP1)
- Penalty shootout / coin toss outcomes (MVP2)
- Groups round robin random assignment (MVP2)
- Merger tier bump chance (MVP4)
- Team event trigger rolls, newcomer generation (MVP4)

Same requirement for **UUID generation and clock/time** in `engine/identity/` — inject rather than call directly, so identity/provenance tests are reproducible.

**Testing the scorination engine specifically:** do not write exact-output assertions for match simulation — the spec describes it as a "weighted-probability outcome," not a deterministic formula. Instead, write **statistical assertions over many seeded runs**, e.g.:

- Run N (e.g. 1,000) seeded matches between an S-tier and F-tier team; assert the higher-tier team's win rate exceeds a defined threshold.
- Run N seeded matches between two same-tier teams (repeat at multiple tiers); assert average combined goals stays within a defined band across tiers — this is what backs the spec's claim that elasticity, not tier level, determines whether a game opens up.
- Assert scoreline distribution's overall average stays near the spec's ~1.3 goals/team baseline over a large sample.

These thresholds/bands are themselves a "balancing detail" per `tdd` doc — propose them explicitly rather than picking silently.
