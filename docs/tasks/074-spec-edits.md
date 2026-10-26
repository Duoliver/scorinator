# Task 74: spec and doc edits

**Status:** Done (2026-10-26)

## Goal

Apply the spec and doc edits listed in `docs/mvp1-to-mvp2-impact-review.md` §3, so the MVP2 spec agrees with the decisions of the impact review and with the MVP2 scope.

## Acceptance criteria

- [x] The user approves the text of each edit before it is applied.
- [x] Each approved edit is in its file.
- [x] The impact review §3 says that its list is applied.

## Report

This task started before the task file format existed (Task 85), so the report below is the edit proposal, kept as the record of each edit.

**Applied on 2026-10-26.** The user approved all edits as written. Edits 1 to 6 are in `docs/scorinator-mvp2.md`, and edit 8 is in `docs/module-boundaries.md`. The impact review §3 now says that its list is applied. The line numbers below are the ones from before the edits.

Source: `docs/mvp1-to-mvp2-impact-review.md` §3 lists 8 edits. The user owns the spec docs, so each edit needs approval before Claude applies it. Line numbers are in `docs/scorinator-mvp2.md` unless a heading says otherwise.

## Changes to the list in the review

- **Edit 7 is dropped.** It changes the MVP1 Task 32 row in `PROGRESS.md`. That log is now archived in `docs/archive/mvp1/` and is read only.
- **Edits 2, 4, 5, and 6 each fix a second place** in the spec with the same problem. The review named only one place for each.
- **Edit 8 also adds `tauri-window`.** The module map does not list it either.

---

## Edit 1: single-match ties and replays are neutral

**Where:** §1 Bracket Specifics, a new bullet after line 47 (the away-goals rule).

**Why:** the review §1, items 2 and 3, settled this on 2026-10-01. The spec does not say it.

```diff
+ - **Venue:** a single-match tie, its extra time, and a replay are played at a **neutral venue**. No team gets home advantage. A tie still stores a venue value, always neutral in MVP2, so a later venue choice (`scorinator-future-features.md` §4) needs no data change. The league's home-advantage toggle applies only to round-robin phases and two-legged ties.
```

---

## Edit 2: the coin toss is a pure 50/50

**Why:** the review §1, item 4. The story puts the coin toss together with penalties as "weighted".

**Place 1:** §1 Tiebreak Resolution, a new bullet after line 42 (the Note on the Replay).

```diff
+ - **Coin toss:** a pure 50/50. Team strength plays no part. **Penalties** stay weighted by team strength.
```

**Place 2:** §2 Epic: Tiebreak Configuration, line 116.

```diff
- - As a user, I want the system to simulate penalties (or a coin toss) as a weighted-but-still-uncertain outcome, so that upsets remain possible even in tiebreaks.
+ - As a user, I want the system to simulate penalties as a weighted-but-still-uncertain outcome, and a coin toss as a pure 50/50, so that upsets remain possible even in tiebreaks.
```

---

## Edit 3: no `City` column in the MVP2 CSV

**Where:** §1 Teams Module, line 73.

**Why:** `City` is MVP3 scope. MVP1 §1 already says "Extended in MVP3 to add `City`".

```diff
- - The MVP1 CSV import/export (`ID/slug, Name, Colours, Tier, City`) is retained as-is for quick bulk list editing — it operates on Blueprints and carries no provenance metadata.
+ - The MVP1 CSV import/export (`ID/slug, Name, Colours, Tier`) is retained as-is for quick bulk list editing — it operates on Blueprints and carries no provenance metadata. MVP3 adds `City`.
```

---

## Edit 4: no City or Crest on an MVP2 Blueprint

**Why:** City and Crest are MVP3 scope. `CLAUDE.md` uses the City field as its example of what not to build.

**Place 1:** §1 Teams Module, Team Blueprint, line 71.

```diff
- Name, Colours, base Tier, City, Crest. Not tied to any specific league.
+ Name, Colours, base Tier. Not tied to any specific league. MVP3 adds City and Crest.
```

**Place 2:** §1 Team Selection, Edit bullet, line 64.

```diff
- (Name/Colours/base Tier/City/Crest)
+ (Name/Colours/base Tier)
```

---

## Edit 5: Instance Wrapper, not Season

**Why:** Season is MVP3. `CLAUDE.md` makes the Instance Wrapper wording authoritative. In MVP2, every league is a standalone wrapper.

**Place 1:** §1 Team Selection, Edit bullet, line 64.

```diff
- edits the team's **Instance** for this Season
+ edits the team's **Instance** in this league's Instance Wrapper
```

**Place 2:** §1 Team Selection, line 67.

```diff
- - Adding a Blueprint to a league reuses its existing Instance for that Season if one already exists there, or creates a fresh one (OVR rolled from Tier) if not.
+ - Adding a Blueprint to a league creates a fresh Instance in that league's Instance Wrapper (OVR rolled from Tier). In MVP2, each league is its own wrapper, so two leagues never share an Instance. From MVP3, the leagues of one Season share a wrapper, and the add reuses the Instance that is already there.
```

**Place 3:** §2 Epic: Team Selection in League Setup, line 145.

```diff
- - As a user, I want to Edit a team's Instance for this Season (not its global Blueprint) directly from the league's team list, so that per-season tweaks don't leak into every other league that team plays in.
+ - As a user, I want to Edit a team's Instance in this league (not its global Blueprint) directly from the league's team list, so that per-league tweaks do not change the Blueprint or any other league.
```

**Note:** "OVR rolled from Tier" in place 2 does not say when the roll happens. That is open decision 7 (Task 81). This edit does not settle it.

---

## Edit 6: no shared live state in MVP2

**Why:** Instances belong to a wrapper. With no Season until MVP3, two MVP2 leagues cannot share one live state.

**Place 1:** §2 Epic: Teams Module (Blueprints), line 151.

```diff
- - As a user, I want a Blueprint's live state (OVR, current Tier) to be shared across every league it's concurrently a member of, so that a team's strength stays consistent everywhere it plays at once.
+ - As a user, I want each league to keep its own live state for a team (OVR, current Tier), apart from the Blueprint, so that a change in one league does not change the Blueprint. *(From MVP3, the leagues of one Season share one live state.)*
```

**Place 2:** §1 Teams Module, Team Instance, line 72. Add a sentence before "See MVP3 for how Instance scope is formalized".

```diff
+ In MVP2, each league is its own Instance Wrapper, with its own Instances.
```

---

## Edit 7: dropped

The MVP1 Task 32 row is in the archived log, which is read only. MVP2 §2 needs no change for it.

---

## Edit 8: `docs/module-boundaries.md`, the adapters

**Where:** under `/adapters`, after `/json-io` (line 32).

**Why:** `adapters/txt` (MVP1 Task 10) and `adapters/tauri-window` (MVP1 Task 28) exist in `src/`, but the map does not list them.

```diff
      /json-io            manifest + wrapper JSON serialization
+     /txt                results .txt export (read only)
+     /tauri-window       window close event, unsaved-changes dialog
```

The map already lists `engine/bracket`, `engine/tiebreak`, and `engine/identity`, so they need no edit.
