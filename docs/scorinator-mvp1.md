# Scorinator — MVP 1 Specification

## 1. Confirmed Design Decisions

### Scorination Engine
- Each team has a **Tier** (S, A, B, C, D, E, F) — an abstraction of overall team strength.
- Each Tier maps to an **OVR range** (e.g. S = 90–99). Default ranges ship with MVP1; ranges become configurable per season in Story Mode (later MVP).
- A team's **OVR is rolled from its Tier's range at the start of every season** (picking up any tier-range reconfiguration from Story Mode) and stays fixed for that season's matches.
- Each individual match applies a **small random variance** on top of the team's base OVR (form on the day).
- **Tier is always the single source of truth for OVR** — OVR is derived from Tier, never the other way around. Whenever a team's Tier changes (via a Story Mode event, see MVP4), its OVR is re-rolled immediately from the new Tier's range, not just at the next season boundary.
- Match simulation combines three factors, kept conceptually distinct so tier level doesn't blindly inflate scoring:
  - **OVR difference (primary driver of margin)**: the gap between the two teams' OVR is what mainly determines who's favored and by how much — this is what makes lopsided matchups (e.g. S-tier vs. F-tier) produce lopsided scorelines.
  - **Absolute OVR (secondary influence)**: overall OVR level still has some smaller pull on baseline scoring — it's a blend, not a pure difference-only model. The exact weighting between difference and absolute level is left as an implementation/balancing detail.
  - **Match elasticity (shared per-match randomness)**: a single random "openness" value rolled once per match and applied equally to both teams — it scales the total goal volume up or down (anywhere from a tight 0-0 to an open 6-5) without touching the relative split OVR already established. This is deliberately **not** a persistent per-team "playstyle" attribute — it's pure match-to-match randomness, so the same two teams can produce a tight 1-0 one match and a wild 4-3 the next.
  - Net effect: two evenly-matched teams (regardless of whether they're both S-tier or both F-tier) trend toward similar, moderate scorelines on average — elasticity is what varies the game open or shut, not tier level. A large OVR gap still reliably produces a lopsided result.
  - Feeds a **Poisson-style distribution** per team for the actual score generation, producing a **weighted-probability outcome** — stronger teams are favored, upsets remain possible.
- **Home advantage** (league-level toggle): when enabled, the home team gets a **percentage boost to its OVR** for that match only.
- Scoreline distribution follows **standard 11-a-side football** (not high-scoring) — league average around ~1.3 goals/team.
- Match output for MVP1: **final score only** (e.g. 2–1). No events, no stats.
- **Matches can be re-scorinated** after already having a result — this simply overwrites the previous score and recalculates standings. Since round-robin matches don't feed into anything downstream (no advancement at stake), re-scorination here has no cascading effects — unlike Bracket ties in MVP2, which do.

### Fixtures
- Format: **Round robin (two-way)** — every team plays every other team home-and-away.
- Fixtures are grouped into **matchdays/rounds** (Matchday 1, 2, ...) — no real calendar dates required for MVP1.
- **Odd number of teams**: one team auto-receives a **bye** each matchday (standard round-robin scheduling).

### Standings
- Points system is **configurable per league**, defaulting to **3 / 1 / 0** (win/draw/loss).

### Data Portability
- **Team CSV** (import/export) columns: `ID/slug`, `Name`, `Colours`, `Tier`. *(Extended in MVP3 to add `City`, once teams gain location data.)*
- **Save/Load**: JSON, fully re-importable (teams, fixtures, results, league config).
- **Export (.txt)**: read-only, human-readable results summary — for headless reading, not re-importable.

---

## 2. User Stories — MVP 1

### Epic: Team Management
- As a user, I want to create a team with a Name, Colours, and Tier, so that it can be entered into a league.
- As a user, I want the system to auto-generate an ID/slug for each team, so that it can be reliably matched on re-import.
- As a user, I want to import a list of teams from a CSV file, so that I don't have to manually re-enter teams I already have.
- As a user, I want to export my current team list to CSV, so that I can back it up or reuse it elsewhere.

### Epic: League Setup
- As a user, I want to create a league with a Name and a "Has home advantage?" toggle, so that I can configure how matches are simulated.
- As a user, I want to add teams to a league, so that a round-robin schedule can be generated.
- As a user, I want to set the points-per-result (win/draw/loss) for a league, defaulting to 3/1/0, so that standings are calculated the way I want.

### Epic: Fixtures & Scheduling
- As a user, I want the system to auto-generate a two-way round-robin schedule (home and away) once teams are locked in, so that I don't have to build fixtures manually.
- As a user, I want matches grouped into matchdays, so that I can play through the season in order.
- As a user, if I have an odd number of teams, I want the system to auto-assign a bye each matchday, so that scheduling doesn't break.

### Epic: Scorination (Match Simulation)
- As a user, I want to "scorinate" a scheduled match, so that the system generates a realistic final score based on both teams' strength.
- As a user, I want stronger teams (higher OVR) to be statistically favored but not guaranteed to win, so that the league feels realistic and occasionally surprising.
- As a user, when home advantage is enabled for the league, I want the home team to get a strength boost for that match, so that home advantage is reflected in outcomes.
- As a user, I want two evenly-matched teams to produce tight, moderate-scoring games regardless of whether they're top-tier or bottom-tier, with match-to-match randomness (not team tier) deciding whether a game opens up or stays tight, so that elite-vs-elite matches feel realistic rather than turning into shootouts by default.
- As a user, I want to scorinate an entire matchday (all its matches) at once, so that I can progress through a season quickly.
- As a user, I want to re-scorinate a match that already has a result, so that I can generate a new outcome if I want to change it, with standings updating automatically.

### Epic: Standings
- As a user, I want to see a live standings table update as matches are scorinated, so that I can track the league table.
- As a user, I want standings calculated using the league's configured points system, so that the table reflects the right rules.

### Epic: Data Portability
- As a user, I want to save my league (teams, fixtures, results, config) to a JSON file, so that I can close the program and resume later.
- As a user, I want to load a previously saved league from JSON, so that I can continue exactly where I left off.
- As a user, I want to export final results to a plain .txt file, so that I can read them without opening the program.

---

## 3. Open Items for Later MVPs
- Continental/world/national-team leagues (mentioned as future scope in original doc).
- Season-to-season OVR/tier-range reconfiguration (Story Mode).
- Match events/stats beyond final score.
