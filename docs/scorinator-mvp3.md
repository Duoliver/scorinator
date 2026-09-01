# Scorinator — MVP 3 Specification

Builds on MVP 1 (single round-robin league) and MVP 2 (mixed-format phases). MVP 3 introduces **locations**, **location-based tournaments**, and a **league tier system** (promotion/relegation linkage between leagues).

## 1. Confirmed Design Decisions

### Location Model
- Hierarchy: **Country → Region → City**, strict containment.
- A team selects a **City**; its **Region** and **Nation** are automatically derived from that City (not independently settable).
- **Region adjacency** (from MVP2): each Region has a manually-linked list of adjacent Regions, usable when building geographically-aware groupings.

### Tournament ↔ Location Linking
- A league's **Scope** (City / Regional / National — from the original doc) remains a descriptive label.
- The actual location linkage is **flexible**: a league can be tied to a **custom multi-select of Cities and/or Regions**, not strictly one single city/region/nation. This lets a "regional" tournament span multiple adjacent regions if desired, or a "national" cup include only specific cities, etc.
- **Location is filtering/eligibility only, never automatic enrollment.** A team's City/Region/Nation is used to *suggest or narrow down candidate teams* when building a tournament (e.g. "show me teams based in this City"), but actual participation is always a **separate, explicit membership assignment**. This is what allows a team promoted to a national tier to stop appearing in its old City tournament without any special-casing — it was never automatically entered in the first place.

### League Tier System (Promotion / Relegation Linkage)
- Each league can configure (per the original doc's League Rules):
  - **Promotes to**: which league(s) its top N finishers move up to.
  - **Relegates to**: which league it relegates its bottom N finishers to.
- **MVP3 scope is one-time setup only**:
  - Upper-tier leagues (e.g. Série A/B/C equivalents) can start with a **fixed member team list**, manually assigned by the user.
  - The lowest tier in a chain can be **auto-populated** from the best-performing teams of its linked regional/city tournaments — excluding any teams that are already members of an upper-tier league.
  - Running an actual promotion/relegation cycle automatically **after a season completes** is out of scope for MVP3 — that's a Story Mode (MVP4) behavior, executed within a **Season** (see below). MVP3 only defines and stores the linkage/config so a Season has something to execute later.

### Season (standalone grouping, precursor to Story Mode)
- A **Season** is a standalone entity that groups a set of linked leagues (e.g. a City→Regional→National chain, or any set the user links together). It's introduced now, independent of Story Mode, so Story Mode (MVP4) can reuse it as-is rather than needing its own grouping machinery.
- A Season can run **entirely on its own**, with none of MVP4's story features (events, mergers, newcomers) enabled — it's just "a set of linked leagues that share team state and a promotion/relegation pipeline."
- **Team Instance scope**: per MVP2's Blueprint/Instance split, a Team Blueprint's live state (current OVR, current Tier, league memberships) is scoped to one **Instance Wrapper** — not strictly to a Season. An Instance Wrapper holds a set of Team Instances alongside either a single standalone League or a full Season; a standalone League therefore has its own scoped Team Instances without needing to be wrapped inside a Season at all. Within a wrapper, a Blueprint has exactly one shared Instance across every league it's concurrently a member of (whether that's the wrapper's one standalone League, or all the leagues linked inside its Season). If the same Blueprint is also used in a *different* wrapper (a different standalone League, or an unrelated Season — even within the same local database), it gets an **independent Instance** there — the two don't affect each other. *(See the technical caveats doc for the Instance Wrapper's structure and identity handling.)*
- A single database can contain **multiple independent Instance Wrappers** running in parallel (e.g. a standalone Cup League alongside a full City→Regional→National Season, or two unrelated hobby league setups), each with its own Team Instances.
- Promotion/Relegation execution (once implemented in Story Mode, MVP4) operates **within** a Season's set of linked leagues.

### Team ↔ League Membership
- A team **can belong to more than one league at the same time** (e.g. a City league and a Cup, or any other combination). Membership is not exclusive.

### Team CSV Format (extended)
- The Team CSV (import/export) from MVP1 gains a **`City`** column, since teams now carry location data. Region and Nation are **not** included as separate columns — they're auto-derived from City on import, per the strict containment rule above.
- Updated columns: `ID/slug`, `Name`, `Colours`, `Tier`, `City`.

### Team Colours
- Colours are picked from a **16-colour palette**.
- For MVP3, we lock in a **placeholder palette** (final palette/hex values to be revisited in the Claude Design phase):

| # | Name | Hex (placeholder) |
|---|------|------|
| 1 | Red | #E53935 |
| 2 | Maroon | #7B1E1E |
| 3 | Orange | #FB8C00 |
| 4 | Gold | #F9A825 |
| 5 | Yellow | #FDD835 |
| 6 | Olive | #827717 |
| 7 | Green | #2E7D32 |
| 8 | Teal | #00897B |
| 9 | Sky Blue | #039BE5 |
| 10 | Navy | #1A237E |
| 11 | Blue | #1E88E5 |
| 12 | Purple | #6A1B9A |
| 13 | Pink | #D81B60 |
| 14 | Black | #212121 |
| 15 | Grey | #9E9E9E |
| 16 | White | #FAFAFA |

---

## 2. User Stories — MVP 3

### Epic: Location Management
- As a user, I want to create Countries, Regions, and Cities, so that I can represent the geography my leagues will use.
- As a user, I want to link a Region to other adjacent Regions, so that adjacency can inform tournament grouping.
- As a user, when I create a team, I want to pick its City and have Region/Nation auto-fill, so that team location data stays consistent.
- As a user, I want the Team CSV import/export to include a City column (with Region/Nation auto-derived), so that location data round-trips correctly.

### Epic: Location-Based Tournaments
- As a user, I want to create a City, Regional, or National tournament, so that I can run competitions scoped to a level of the location hierarchy.
- As a user, I want to link a tournament to a custom set of Cities and/or Regions (not strictly one), so that I can model tournaments that don't perfectly match a single hierarchy level.
- As a user, I want to use a team's location to filter/suggest candidates when adding teams to a tournament, but still explicitly confirm each team's membership, so that a team's location never silently enrolls it somewhere (e.g. a nationally-promoted team isn't auto-kept in its old city tournament).

### Epic: League Tier Linking
- As a user, I want to configure a league's "Promotes to" and "Relegates to" targets with a count of teams, so that the tier system's rules are explicit.
- As a user, I want to manually assign a fixed member list to an upper-tier league, so that established divisions start with the correct teams.
- As a user, I want the lowest tier in a chain to auto-populate from the best teams of its linked local tournaments (excluding teams already in an upper tier), so that I don't have to manually curate that list.

### Epic: League Tier Linking (continued)
- As a user, I want a team to be able to belong to multiple leagues at once (e.g. its regular league and a cup), so that overlapping competitions are supported.

### Epic: Season
- As a user, I want to group a set of linked leagues into a Season, so that they share team state and a promotion/relegation pipeline without needing full Story Mode.
- As a user, I want a team's OVR/Tier to stay consistent across every league it plays within the same Season, so that its strength doesn't fragment across competitions.
- As a user, I want to run multiple independent Seasons in the same database, so that unrelated league setups don't interfere with each other.

### Epic: Team Colours
- As a user, I want to pick a team's colours from the 16-colour placeholder palette, so that every team has a consistent, valid colour choice.
- As a user, I want the crest generator (from the original spec) to use the team's selected colours when no custom crest image is provided, so that every team has a usable visual identity.

---

## 3. Open Items
- Exact final 16-colour palette/hex values — placeholder above, to be revisited during the Claude Design phase.
