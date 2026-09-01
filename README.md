# Scorinator — Project Overview

**NOTE FOR AGENTS:** For implementation work, consider `CLAUDE.md` and the docs it links over this file.

**Scorinator** is a desktop app for building and simulating fictional football (soccer) league ecosystems — from a single round-robin among a handful of teams up to a full national pyramid with cups, promotion/relegation, and a multi-season "story mode" where teams and leagues evolve, merge, and vanish over time.

This README ties together the four MVP specs. Read it first for the big picture, then dive into the individual MVP docs for full detail.

## Document Index
| Doc | Covers |
|---|---|
| `scorinator-mvp1.md` | Core scorination engine, a single two-way round-robin league, save/load/export |
| `scorinator-mvp2.md` | Multi-phase leagues, groups, brackets, tiebreak rules, the Teams Module (Blueprint/Instance split), the generalized File Module, and the Identity/Provenance system |
| `scorinator-mvp3.md` | Locations (City/Region/Nation), location-based tournaments, league tiers, the **Season** entity, colours |
| `scorinator-mvp4.md` | Story Mode: the season-to-season cycle, promotion/relegation execution, team events, mergers, the Cup |
| `scorinator-future-features.md` | Backlog of ideas explicitly out of scope for MVP 1–4 |

---

## Core Systems (cross-MVP)

These are the systems that were built up incrementally across MVPs — this section reads them as one coherent whole.

### 1. Tier & OVR (the scorination engine)
*Introduced MVP1, restructured around Blueprint/Instance in MVP2, scoped to the Instance Wrapper in MVP3, extended MVP4.*
- Every team has a **Tier** (S/A/B/C/D/E/F), an abstraction of overall strength. Each Tier maps to a numeric **OVR range**, which is configurable per season (Story Mode).
- **Tier is always the single source of truth.** A team's OVR is rolled from its Tier's range at the **start of every season**, and re-rolls immediately whenever Tier changes (Tier Shift event, or a Merger's resulting Tier). OVR is never set independently of Tier.
- Tier and OVR live on the team's **Instance** (see #5 below) — scoped to one Instance Wrapper — not on its reusable Blueprint.
- Each individual match adds a small per-match variance on top of the base OVR ("form on the day").
- Match outcome combines three distinct factors rather than mapping OVR straight to expected goals: **OVR difference** (primary driver of margin/lopsidedness), a smaller **absolute-OVR** influence on baseline scoring, and a **shared per-match "elasticity" roll** (applied equally to both teams) that scales total goal volume up or down — anywhere from a tight 0-0 to an open 6-5 — without touching the relative split. This keeps evenly-matched games realistic regardless of tier: two S-tier teams trend toward tight, moderate scorelines just like two F-tier teams would, with match-to-match randomness (not team tier) deciding whether a game opens up. It's deliberately not a persistent per-team "playstyle" attribute. Feeds a Poisson-style distribution for the actual score, producing a realistic, standard-football scoreline (not high-scoring on average) — stronger teams favored, upsets possible.
- Matches (and Bracket ties specifically) can be **re-scorinated**; for Brackets this cascades, clearing every downstream tie that depended on the old result (with a confirmation prompt).

### 2. Match Formats & Tiebreaks
*Introduced MVP1–2.*
- Formats: two-way round robin, single-duels round robin (randomized but balanced home/away), groups round robin, and bracket (single-match or two-legged, final phase only).
- A league is a **sequence of phases**, each with its own format; points reset between phases.
- Decisive-result tiebreaks combine two flags — **Plays AET?** and **Tiebreak method** (Penalties, or Replay → Coin Toss as a one-shot fallback) — giving four possible resolution paths.
- **Bracket sizing needs a power-of-2 team count.** Non-power-of-2 qualifier counts get **auto-assigned byes** (top seeds skip round 1; user can manually reassign), with an early warning shown in the league creation wizard — at team-selection for a single-bracket league, or at phase-configuration for a mixed league. A bye auto-advances its team with a "BYE" placeholder and a disabled (not hidden) Scorinate button.

### 3. Locations & Geography
*Introduced MVP3.*
- Strict containment: **Country → Region → City**. A team picks a City; Region/Nation auto-derive.
- **Regions store a manually-linked list of adjacent Regions** — used to geographically cluster national-level Groups Round Robin tournaments instead of pure randomness.
- Tournaments link to a **flexible multi-select of Cities/Regions**, not strictly 1:1 with their City/Regional/National scope label.
- **Location is filtering only, never automatic enrollment** — a team's location narrows candidate suggestions when building a tournament, but actual participation is always an explicit, separate membership assignment. A team can belong to multiple leagues at once.

### 4. League Tiers, Promotion & Relegation
*Introduced MVP3, executed MVP4.*
- Leagues configure **Promotes-to** / **Relegates-to** targets with team counts (e.g. a 4-division national chain).
- **Tournament order within a season is sequential by location level: City → Regional → National.** This creates a deliberate asymmetry:
  - **Promotion cascades intra-season** — a team can climb City → Regional → National in the same season, since each lower level finishes before the next starts.
  - **Relegation always takes effect next season** — the lower level has already finished by the time the upper level's relegation is known.
- **Local Participation Rule**: independent of promotion/relegation, each broader league configures — per specific lower level it links to — whether member teams also play that local tournament **Always**, **Transition-only** (the season they move between levels), or **Never**. This is what lets the system model both Brazil's concurrent state championships and England's single-pyramid structure with the same mechanism.

### 5. Teams Module: Blueprint, Instance & Season
*Introduced MVP2 (Blueprint/Instance), formalized MVP3 (Season).*
- Teams split into two layers: a **Blueprint** (reusable template — Name, Colours, base Tier, City, Crest — living in a global "Teams" module, not tied to any league) and an **Instance** (the live state — current OVR, current Tier, current league memberships — that a Blueprint gets once it's actually in play).
- A **Season** is a standalone entity (independent of Story Mode) that groups a set of linked leagues. **Instance scope is per-Instance-Wrapper**, not strictly per-Season: an Instance Wrapper holds a set of Team Instances alongside either a single standalone League or a full Season, so a standalone League has its own scoped Team Instances without needing to be wrapped inside a Season. Within one wrapper, a Blueprint has exactly one shared Instance across every league it's concurrently a member of (one club, one strength — never a different OVR per competition). The same Blueprint used in a *different* wrapper (a different standalone League, or an unrelated Season) gets an independent Instance.
- A database can hold multiple independent Instance Wrappers running in parallel.
- **Picking teams during league setup** uses a bulk-selection dialog (searchable, checkbox per row showing colour/name/tier) or a "Load them all" shortcut (scoped to eligible Blueprints — location-filtered if the league has a scope). Once added, each team row has **Edit** (edits the team's Instance for this wrapper only — never the global Blueprint), **Switch** (same picker, single-select, excludes teams already in the league), and **Remove** (allowed even below the format's minimum, with a soft warning). This flow is scoped to setup time, before the league starts — ongoing roster editing afterward isn't designed yet.

### 6. File Module & Identity
*Introduced MVP2.*
- Export/import is scoped at three levels: a single **League** (button on its Detail screen, self-contained — embeds Blueprint + Instance snapshots), bulk **all Leagues** or **all Team Blueprints** (with a picker to import a subset), or the **entire database** (everything, including Locations and Story Mode state).
- **Identity**: every exportable entity gets a **permanent UUID**, assigned once at creation and never reassigned — this is what lets data survive being exported and re-imported any number of times without losing or duplicating identity. Each installation also has its own UUID, used only for provenance metadata (never for identity).
- **Import conflicts** are never resolved by silent overwrite: if an incoming entity's UUID already exists locally, the user is prompted to either **skip** it or **import it as a new, forked entity** with a fresh UUID. The local original is always left untouched.

### 7. Story Mode (seasons, events, mergers, the Cup)
*MVP4.*
- Story Mode advances a **Season** (as defined in MVP3) through a repeating cycle over time — it doesn't redefine what a Season is, it defines what happens at the boundary between one and the next. Each season is labeled with a fixed time unit (e.g. "Season 2026").
- **End-of-season pipeline:** Relegation (queued from the season that just ended) → Team Events → Newcomer Generation → next season setup. (Promotion already happened intra-season, per above.)
- **Team Events** (tier shift, prize, dismantlement, merger) are configurable per season — which types are active and how often they fire — and can be system-suggested or player-triggered.
- **Mergers**: two or more teams combine into a new "United" team, starting from the highest merging Tier with a chance to bump one Tier higher; the system suggests a combined name/colours (user-editable); original teams become inactive, not deleted.
- **Dismantlement** (teams or leagues) always leaves things recoverable: dismantled teams go inactive (manually revivable); a dismantled league's teams become free agents.
- **The Cup** is just a Bracket-format competition whose qualifying teams are manually pulled from user-chosen leagues each season — no separate mechanic from what MVP2 already built.

---

## Data Model Summary (high-level entities)

| Entity | Key Fields |
|---|---|
| **Team Blueprint** | UUID, Name, Colours (16-colour palette), base Tier, City (→ Region/Nation derived), Crest |
| **Team Instance** | Reference to Blueprint, Season, current OVR, current Tier, league membership(s) |
| **Location** | Country, Region (with adjacent-Region links), City |
| **League** | UUID, Name, Scope label, Home-advantage toggle, Points system, Phases, Promotes-to/Relegates-to, Local Participation Rules |
| **Phase** | Format, Advancement requisites, AET/Tiebreak config, (Bracket) legs + away-goals toggle |
| **Match** | Teams, Home/Away, Score, Matchday/Round |
| **Season** | UUID, Time label, linked Leagues, Team Instances, queued relegations |
| **Team Event** | Type (Tier Shift / Prize / Dismantlement / Merger), trigger source (system/player) |
| **Cup** | Feeder leagues + qualifier counts, Bracket phase config |
| **Installation** | UUID — used only for provenance metadata on exported entities, never for identity |

---

## Spec Status
All four MVP docs are fully resolved with no open items. (Post-setup roster editing was raised during MVP2 but explicitly deferred — see `scorinator-future-features.md`.) A **design brief for Claude Design** (`scorinator-design-brief.md`) has been drafted — neubrutalist direction, colour system, typography (Barlow + JetBrains Mono), WCAG AAA target. A **technical caveats doc** (`scorinator-technical-caveats.md`) covering persistence/storage architecture has also been written.

This section describes the *specs*, not the build — it doesn't change as implementation progresses, only if the specs themselves are revised. **For current implementation status, task progress, and what's approved to build right now, see `PROGRESS.md`. For the rules governing how implementation work is done, see `CLAUDE.md`.** This README is a static overview of what Scorinator is and how the specs fit together — it is not a live status tracker.
