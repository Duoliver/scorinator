# Scorinator — MVP 4 Specification (Story Mode)

Builds on MVP 1–3. Story Mode advances a **Season** (the standalone grouping entity introduced in MVP3) through a repeating cycle over time: promotion/relegation execution, team events (including mergers), newcomer generation, and the Cup. A "Story" is, in effect, a sequence of these Seasons with the extra evolving elements below layered on top.

## 1. Confirmed Design Decisions

### Season Structure
- Builds directly on MVP3's **Season** entity (a grouping of linked leagues with shared Team Instances) — Story Mode doesn't redefine what a Season *is*, it defines what happens **at the boundary between one Season and the next**.
- A season cycle completes once every league within that Season has run its phases to completion.
- Each season is labeled with a **fixed time unit** (e.g. "Season 2026" or "Season 2025-26"), matching real football calendar conventions.

### Tournament Order Within a Season
- Tournaments run **sequentially by location level, not concurrently**: **City finishes first → Regional runs next (using City's fresh results) → National runs last.**
- This creates a natural asymmetry between Promotion and Relegation:
  - **Promotion cascades intra-season**: since a lower level always finishes before the level above it starts, a team promoted from City can immediately join Regional's roster for that *same* season, and if it then wins promotion out of Regional, it can join National's roster that *same* season too. A team could climb multiple levels in a single season.
  - **Relegation always takes effect next season**: by the time an upper level (e.g. National) finishes and determines who's relegated, the lower level (Regional) has already run its season. Relegated teams join the lower level's roster starting the **following** season.
- National's own internal divisions (e.g. a 4-tier national chain) are assumed to run in parallel with each other, since they don't have this geographic cascading dependency — only City→Regional→National ordering is sequential.

### End-of-Season Pipeline
1. **Promotion** is resolved continuously as each location level finishes (City → Regional → National), feeding rosters forward within the same season.
2. Once National (the last level) finishes, **Relegation** is resolved for every league chain, queued to take effect at the start of next season.
3. **Team Events** — tier shifts, prizes, dismantlements, mergers (see below) are resolved.
4. **Newcomer Generation** — new teams are created and enter City-level tournaments.
5. Next season's leagues are set up (incorporating queued relegations and newcomers) and ready to run.

### Local Participation Rule (replaces the earlier "professionalization" idea)
- A broader league does **not** get one flat setting — instead, for **each specific lower level it's linked to** (e.g. a National league's link to Regional, separately from its link to City), it configures one of three modes:
  - **Always** — member teams play their local tournament at that level every season, concurrently with the broader league (models Brazil's state championships running alongside the Brasileirão).
  - **Transition-only** — member teams play locally only in the season they get promoted up (which, thanks to intra-season cascading, is the very season they clinch promotion — they can play both levels that same season), or the season they get relegated back down into the lowest tier of the broader league (which takes effect the following season, per the Relegation timing above).
  - **Never** — once a team is a member of the broader league, it never plays that local level again while a member (models the English pyramid: Manchester clubs don't play a "Manchester tournament").
- This is **independent of Promotion/Relegation** — P/R moves a team's actual league membership; the Local Participation Rule only governs whether a *currently-member* team also competes in a specific lower-level tournament concurrently.

### Amateur/Professional Status
- **Dropped entirely.** Teams have no amateur/professional attribute. Newcomers are just newcomers.
- Newcomer teams always spawn into **City-level tournaments** (per original MVP4 note), same as before — no cascading logic needed since there's no status to filter by.

### Team Dismantlement
- A team can be dismantled by:
  - A bad-luck **Team Event**.
  - Automatically, if relegated below the lowest tier / falls out of every league.
  - A **manual "dismantle team"** action by the user.
- Dismantled teams are stored as **inactive** (not deleted).
- Revival is **manual only** — the user can choose to revive an inactive team at will; there's no automatic/random revival.

### League Dismantlement
- Leagues are **dismantled only by explicit user action** — no automatic trigger (unlike teams, which can also be dismantled by bad-luck events or falling out of every league).
- When a league is dismantled, its member teams become **free agents (unassigned)**, not dismantled themselves — the user can place them into another league later.

### OVR Re-roll Timing
- Per MVP1's rule (Tier is always the source of truth for OVR): a team's OVR **re-rolls at the start of every season**, regardless of whether its Tier changed — this ensures any tier-range reconfiguration from Story Mode is picked up. OVR also re-rolls immediately whenever Tier changes mid-cycle (Tier Shift event, or a Merger's resulting Tier).

### Team Events
- The set of active event types is **configurable before each season**, with the previous season's configuration saved as the default.
- **Trigger frequency/probability is also configurable** by the user, rather than a fixed hidden rate.
- Events can be **system-suggested** (the system proposes candidates/targets) or **player-triggered** directly.
- Event types for MVP4:
  - **Tier Shift** — moves a team's tier up or down.
  - **Prize** — awarded for winning a league (distinct from random luck events); typically nets a tier shift or similar bonus. If a league ends in a Groups phase (MVP2), **every group winner independently receives a Prize** — there's no single champion to consolidate down to.
  - **Dismantlement** — bad-luck outcome, team becomes inactive.
  - **Unifying (Merger)** — two or more teams combine into a new "United" team. See below.

### Merger (Unifying Event) Mechanics
- Can be **system-suggested** (e.g. candidates: the smallest teams in a city dominated by one clearly bigger club, or all teams from an underperforming city) or **player-triggered** by manually selecting which teams merge.
- **New team's Tier**: starts from the **highest Tier among the merging teams**, with a **chance to bump up one Tier** above that. This keeps the merger mechanic entirely Tier-driven — no separate OVR formula — so it stays consistent with the rest of the system (Tier is always the single source of truth; OVR is simply re-rolled from whatever Tier results, same as any other Tier change).
- **New team's identity**: the system suggests a combined identity — e.g. a name pattern like `{City Name} United` / `{City Name} FC` / `{City Name} Athletic`, plus blended colours — but the **user can edit/override** any of it before confirming.
- **Original teams**: become **dismantled/inactive** (same state as any other dismantled team — manually revivable later).

### Cup
- Feeder leagues are **fully user-configured**: the user manually picks which specific leagues feed the Cup each season, and how many top finishers qualify from each.
- Two-way vs. single-match ties: uses the same **single-match / two-legged toggle** already defined for Bracket phases in MVP2 — no new mechanic needed, the Cup is itself just a Bracket-format competition with a custom multi-league qualification source.

---

## 2. User Stories — MVP 4

### Epic: Season Lifecycle
- As a user, I want each season labeled with a time unit (e.g. "Season 2026"), so that I can track the league's history over time.
- As a user, I want City tournaments to finish before Regional starts, and Regional to finish before National starts, so that promotion can cascade upward within the same season.
- As a user, I want relegation to only take effect at the start of the following season, so that the lower level (which already finished) isn't disrupted mid-cascade.
- As a user, I want the end-of-season sequence (Relegation → Team Events → Newcomers → next season setup) to run automatically once National's phases are complete, so that the story progresses without manual bookkeeping.

### Epic: Local Participation Rule
- As a user, I want to configure, per level a broader league links to, whether member teams play that local tournament Always / only on Transition / Never, so that I can model different real-world football pyramids (e.g. Brazil vs. England).

### Epic: Newcomer Generation
- As a user, I want the system to generate a list of new teams at the start of each season, entering at the City level, so that the football landscape keeps growing organically.

### Epic: Team Dismantlement & Revival
- As a user, I want a team to become dismantled (inactive) from a bad-luck event, from falling out of every league, or by my own manual action, so that team mortality feels natural.
- As a user, I want to manually revive an inactive team whenever I choose, so that I retain full control over the league's history.

### Epic: League Dismantlement
- As a user, I want to manually dismantle a league, so that I can remove competitions that no longer make sense in the story.
- As a user, when I dismantle a league, I want its member teams to become free agents rather than also being dismantled, so that I can reassign them elsewhere.

### Epic: Team Events
- As a user, I want to configure which event types are active each season and how frequently they trigger (carrying over last season's settings as a default), so that I can control how volatile the story feels.
- As a user, I want the system to suggest event candidates (e.g. merger candidates, tier-shift candidates) which I can accept, modify, or trigger myself, so that I stay in control while still getting inspiration from the system.
- As a user, I want a league-winning team to receive a distinct "Prize" event, so that success is meaningfully rewarded.

### Epic: Team Mergers
- As a user, I want to merge two or more teams into a new "United" team, starting from the strongest merging team's Tier with a chance to bump up one Tier, so that mergers feel historically grounded (e.g. AS Roma, 1927) but still carry some upside uncertainty.
- As a user, I want the system to suggest a combined name and blended colours for the merged team, which I can edit before confirming, so that the result still feels intentional.
- As a user, I want the original merged teams to become inactive (not deleted), so that I could theoretically revive one later if I change my mind.

### Epic: Cup
- As a user, I want to manually select which leagues feed into the Cup each season and how many top finishers qualify from each, so that I have full control over the Cup's prestige and scope.
- As a user, I want the Cup to use the same single-match/two-legged and seeding mechanics already defined for Bracket phases, so that the behavior is consistent with the rest of the system.

---

## 3. Open Items
No open items remain for MVP 4.
