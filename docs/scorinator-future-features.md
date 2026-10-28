# Scorinator — Future Features Backlog

Ideas and gaps that came up during MVP planning but were explicitly decided **out of scope** for MVP 1–4. Nothing here is committed — this is a parking lot, not a roadmap.

## 1. Post-setup roster editing
Editing a league's team roster (Select/Switch/Remove/Edit) once the league has started (fixtures generated) — or later, after results exist. As of MVP2, this flow is scoped to league setup only, before the league starts; there's currently no way to modify the roster afterward.

*Raised during: MVP2 (Team Selection in League Setup).*

## 2. Automatic / assisted saving
With manual save (File > Save, Ctrl+S) as the committed MVP1 mechanism, and unsaved league/season screens instead kept "suspended" in memory (rather than persisted) when the user navigates away, two related ideas came up and were explicitly deferred rather than built now:
- Autosaving automatically when the user navigates away from a league/season screen, instead of (or in addition to) suspending it in memory unsaved.
- Re-prompting the end-of-league/season "save?" dialog if a previously-completed league/season's results are invalidated by re-scorinating an earlier match/tie, and it reaches completion again. Currently the dialog is scoped to fire only once, the first time completion is reached.

*Raised during: persistence / technical caveats discussion (post-MVP2 mockups).*

## 3. Promoting / merging standalone leagues into a Season
Post-hoc linking of an already-existing standalone League (created and played outside any Season, per the Instance Wrapper design) into a Season later on — either by upgrading its existing wrapper in place into a full Season, or by merging two already-existing standalone Leagues (each with their own independently-scoped Team Instances) into one shared Season together. This raises open questions around Team Instance identity/continuity — does existing OVR/Tier state carry over, or re-roll fresh? — that aren't addressed by MVP3/4 as currently scoped, since those specs only describe Seasons being set up fresh, not an existing League being absorbed into one afterward.

*Raised during: technical caveats discussion — Instance Wrapper design (MVP3+).*

## 4. Venue choice for replays
In MVP2, a replay is always played at a neutral venue, with no home advantage. Later, the user picks the venue per replay: neutral, or either team's home. The picker should show which of the two teams had the better campaign so far in that competition, to help the user decide.

* Raised during: MVP1 → MVP2 impact review.

## 5. Fewer extreme scores in big OVR mismatches
A big OVR gap gives extreme scores too often. The user judged this not a big problem for MVP1, and parked it here on 2026-10-26. Do not change the engine for it without a decision from the user.

**Goal (user stance):** make the common extremes (a margin of 4 to 6 goals) less frequent, but keep a real chance of 11-0 or more for an A or S team against an F team.

**Study (2026-09-25):** the real engine, 300,000 matches per case, home advantage on at 5% (the boost before Task 32). Real-football figures are approximate and from memory.
- **In aggregate, extreme scores are rare.** A same-tier league (OVR 60-69) gives 2-1 13.8%, 6-0 0.14%, draws 28.1%, and a margin of 4+ goals 3.8%. A league of all tiers S to F gives 2-1 10.9%, 6-0 0.82%, draws 23.4%, a margin of 4+ goals 9.6%, and a team with 6+ goals 2.8%. Real football is about 2-3% for a margin of 4+ goals.
- **In big mismatches, extreme scores are common.** Favorite at home, gap 25 OVR (80 v 55): 2-1 7.95%, 6-0 0.73%, a margin of 4+ goals 9.7%. Gap 55 (95 v 40): 2-1 3.0%, 6-0 3.7%, a margin of 4+ goals 27.7%. Gap 69 (99 v 30): 2-1 2.7%, 6-0 4.9%, a margin of 4+ goals 34.0%. From a gap of about 55, 6-0 is as common as 2-1.
- **The favorite with 11+ goals:** 1 in 6,700 matches at 85 v 50, 1 in 910 at 95 v 35, 1 in 520 at 99 v 30.

**Cause:** each OVR point adds 1.5% to expected goals, linearly (`DIFF_WEIGHT`). At a gap of 60, the favorite's factor is about 1.9, and the underdog's hits its floor. The shared elasticity roll (uniform 0.4 to 1.6) then scales both. At the top of the roll, the favorite's expected goals reach about 4.3, and the underdog's stay near 0.2. The same elasticity range also gives low-scoring matches, which is probably why draws are 28% instead of about 25%.

**Design note:** a lower `DIFF_WEIGHT`, a saturated difference factor, or a narrower elasticity range would each cut the rare tail together with the common extremes. To keep a rare tail and cut the common extremes, a separate mechanism for the tail is probably necessary. This is untested.

**Constraints:**
- The OVR-difference vs absolute-OVR weighting is a `CLAUDE.md` open item. A change to the difference factor touches it, so propose an approach and get a decision first.
- One OVR point is worth 1.5% of goals today. A change to that scale changes the meaning of the Task 32 home advantage values (+5 OVR and +5%), so retune Task 32 after the change.
- The study scripts are not in the repo.

*Raised during: MVP1, Task 32 (home advantage tuning).*

## 6. Second-leg host toggle
In MVP2, the higher seed always hosts the second leg of a two-legged tie (Task 79). Later, a bracket phase gets a toggle to change this, for example so that the lower seed hosts the second leg.

*Raised during: MVP2 sprint 0, Task 79 (second-leg host), 2026-10-27.*

## 7. Custom phase names
In MVP2, a phase has no name of its own. Its format label names it, for example "Groups (two-way)" (Task 86, US-01.2). Later, the user can give each phase a name, for example "Group stage", with the format label as the default.

*Raised during: MVP2 sprint 0, Task 86 (League Format refinement), 2026-10-27.*

## 8. Debug mode
The user drafts a debug mode: extra data on the screens that helps to check the engine. One item for it: in a single-duels phase, show each team's home and away match count, for example "H 4 · A 3", in the standings table or the group card. In MVP2, the balance rule lives in the engine tests only (US-06.1).

*Raised during: MVP2 sprint 0, Task 91 (Single Duels refinement), 2026-10-28.*

## 9. Re-scorinate a locked phase
In MVP2, a phase locks when the next phase starts, and its results can no longer change (US-07.3). Later, the user can re-scorinate a match of a locked phase, after a confirm. The confirm clears every later phase: its draw, its fixtures, and its results. The next phase must then start again. An undo of a phase start fits the same feature.

*Raised during: MVP2 sprint 0, Task 78 (qualification), settled for MVP2 in Task 92 (Phase Transition), 2026-10-28.*

## 10. Qualifiers list for a round-robin or Groups phase
In MVP2, only a Bracket phase lists its qualifiers, in its Seed List (US-04.2). For a round-robin or Groups phase, the highlight on the earlier phase shows who qualified (US-07.2). Later, every phase after the first gets a "Qualifiers" list: seed, team, and origin tag, for example "A1" or "3rd".

*Raised during: MVP2 sprint 0, Task 92 (Phase Transition), 2026-10-28.*
