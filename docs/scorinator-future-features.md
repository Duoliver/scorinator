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
