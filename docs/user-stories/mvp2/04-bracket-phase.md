# Epic 04: Bracket Phase

Refined in [Task 89](/docs/tasks/089-refine-bracket-phase.md). Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 Bracket Specifics, Bracket Sizing & Byes, Bracket Scorination Workflow, §2 Epic: Bracket Phase. Layout reference: the MVP2 handoff, `Footballer - League Setup Wizard` (phase step) and `Footballer - League Detail - Mixed` (Bracket phase).

**Terms used in this file:**

- **Tie:** one bracket pairing. A single-match tie has one match. A two-legged tie has two legs.
- **Seed:** the rank of a qualifier when the bracket phase starts. Seed 1 is the strongest.
- **Slot:** one place in the first round of the tree. A bracket has the next power of 2 of slots, for example 8 slots for 6 qualifiers.
- **Bye:** a first-round tie with one team and no opponent.
- **Playable tie:** a tie with both teams known and no result.
- **Dependent tie:** a later tie that takes a team from a tie, as its winner or as its loser (the third-place tie). The dependents of a tie also include their own dependents.
- **Level:** as in epic 03.

---

### US-04.1: the tie format

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Specifics, §2 Bracket Phase

As a user, I want to configure a bracket tie as single-match or two-legged aggregate, so that I can model cup-style or two-leg knockout competitions.

**Acceptance criteria:**

- [ ] A Bracket phase has a "Tie format" choice in the phase step: "Single match" or "Two-legged". The default is Single match.
- [ ] The choice applies to every tie of the phase. US-04.13 covers the final.
- [ ] The Review step shows "Single match" or "Two-legged" first in the bracket detail, for example "Two-legged · AET on · Penalties".
- [ ] A single-match tie has one match, with the fixture id `<tie>.leg1` (Task 77). It is at a neutral venue: no home boost (Task 74).
- [ ] A two-legged tie has two matches, `<tie>.leg1` and `<tie>.leg2` (Task 77).
- [ ] In a two-legged tie, the higher seed plays the first leg away and the second leg at home (Task 79).
- [ ] A two-legged tie uses the league's home-advantage toggle in each leg (US-01.2 note).
- [ ] A tie winner keeps its seed in later rounds. So each tie has one higher seed (Task 79).

**Out of scope:** the aggregate and the tiebreak order (US-04.4). A toggle for the second-leg host: parked in `scorinator-future-features.md` §6. A neutral venue choice: `scorinator-future-features.md` §4.

**Notes:** the handoff default is Single match. The `.leg1` id for a single-match tie was a Task 77 proposal, confirmed here.

---

### US-04.2: seed the bracket

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Specifics, Bracket Sizing & Byes, §2 Bracket Phase

As a user, I want the bracket to auto-seed qualifiers based on their final standing from the previous phase, so that I don't have to manually build the bracket tree.

**Acceptance criteria:**

- [ ] After a round-robin phase, the seeds follow the final standings: place 1 is seed 1. Level teams follow the Task 78 rules, with the fixed lots last.
- [ ] After a Groups phase, the seeds go by place, then stats (Task 78): all group winners first, then all runners-up, and so on. Inside one place: points, goal difference, goals for, then the fixed lots. When group sizes differ, compare per match played.
- [ ] The best M of place N + 1 (US-01.6) take the seeds after all teams of place N.
- [ ] When the bracket is the first phase, for example a pure cup, an injected `Rng` draws the seeds when the league starts. The draw is stored. The same seed of the `Rng` gives the same draw.
- [ ] The tree uses the standard bracket placement. Seeds 1 and 2 can meet only in the final, seeds 1 to 4 only from the semi-finals on, and so on.

  | Slots | First-round ties, top to bottom |
  |---|---|
  | 2 | 1 v 2 |
  | 4 | 1 v 4, 2 v 3 |
  | 8 | 1 v 8, 4 v 5, 2 v 7, 3 v 6 |
  | 16 | 1 v 16, 8 v 9, 4 v 13, 5 v 12, 2 v 15, 7 v 10, 3 v 14, 6 v 11 |

- [ ] The winners of two adjacent ties meet in the next round.
- [ ] The placement is a pure engine function in `engine/bracket`. Tests cover the four sizes above and 32 slots.
- [ ] League Detail has two sub-tabs in a Bracket phase: "Bracket" and "Seed List", as in the handoff.
- [ ] The Seed List shows each qualifier with its seed, colour, name, and a tag for its place in the previous phase: "A1" for the winner of Group A, "C3" for a best-M team from Group C, "3rd" after a round-robin phase. A first-phase bracket shows no tag.
- [ ] The Bracket tab shows a header line, as in the handoff, for example "Seeded by Group Stage final standing · All ties two-legged (aggregate, home & away), away goals off · AET → Penalties · * leg score includes AET". A first-phase bracket says "Seeded by random draw".

**Out of scope:** the byes (US-04.10). A Shuffle for the random draw: not in MVP2. Seeded pots: not in MVP2. Who qualifies, and the qualifier display between phases (epic 07).

**Notes:** the user chose the random draw for a first-phase bracket on 2026-10-28 (Task 89 gap 1). The user chose the standard bracket placement on 2026-10-28 (Task 89 gap 2). This replaces the spec's "simple seed order, not the anti-clash placement", and the spec has the edit since 2026-10-28, with the user's OK. The handoff orders group winners by group (A1, B1, ...) and pairs A1 v D2. Task 78 and gap 2 replace both.

---

### US-04.3: the away-goals toggle

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Specifics, §2 Bracket Phase

As a user, I want to toggle the away-goals rule per bracket phase, so that I can decide whether away goals break a level aggregate before AET/tiebreaks kick in.

**Acceptance criteria:**

- [ ] A Bracket phase with Two-legged ties has an "Away goals rule" toggle in the phase step. The default is off.
- [ ] A Single match phase does not show the toggle, as in the handoff.
- [ ] The Review step and the Bracket header show "away goals on" or "away goals off" for a two-legged phase.
- [ ] With the toggle on, a tie level on aggregate after 180 minutes goes to the team with more away goals.
- [ ] Away goals apply once, after 180 minutes. Goals in AET never count as away goals (US-03.1).
- [ ] A single-match final in a two-legged phase (US-04.13) uses no away goals.

**Out of scope:** the AET and tiebreak rules (epic 03).

**Notes:** the default and the visibility follow the handoff.

---

### US-04.4: resolve a tie

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Specifics, Tiebreak Resolution, §2 Bracket Phase

As a user, I want two-legged ties to correctly compute the aggregate score and apply AET/penalty/coin-toss rules only if still level (after away goals, if enabled), so that the tie resolves correctly.

**Acceptance criteria:**

- [ ] A single-match tie: the team with more goals after 90 minutes wins. A draw is level.
- [ ] A two-legged tie: the aggregate is the sum of each team's goals over both legs. The team with the higher aggregate wins.
- [ ] A two-legged tie level on aggregate: the away-goals rule applies when it is on (US-04.3). If it decides, the tie has a winner with no AET.
- [ ] A tie still level goes to the epic 03 sequence: AET, then the tiebreak method (US-03.2).
- [ ] The AET of a two-legged tie follows the second leg, with the home boost of that leg (US-03.1).
- [ ] The engine returns the winner and the loser of each tie. The loser matters for the third-place tie (US-04.12).
- [ ] Tests cover each path: win in 90 minutes, win on aggregate, win on away goals, and each of the four US-03.2 sequences.

**Out of scope:** the AET, penalty, replay, and coin toss models (epic 03).

**Notes:** none.

---

### US-04.5: scorinate one tie, or the current round

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Scorination Workflow, §2 Bracket Phase

As a user, I want to scorinate a bracket tie individually, or scorinate the entire bracket at once, so that I can move at whatever pace I prefer.

**Acceptance criteria:**

- [ ] Each tie card has a "Scorinate" button. One click plays the whole tie: both legs when two-legged, and the tiebreak it needs (US-03.2).
- [ ] The button is enabled on a playable tie, and on a tie with a result (a re-scorinate, US-04.6). It is disabled on a tie with a TBD team, and on a bye.
- [ ] The Bracket tab has a "Scorinate bracket" button. One click plays every playable tie, and only those.
- [ ] So one click plays one round when the user plays round by round. A tie that becomes playable from the click waits for the next click.
- [ ] "Scorinate bracket" never plays a tie that has a result. So it never needs a confirm.
- [ ] "Scorinate bracket" is disabled when no tie is playable.
- [ ] Each match result stores its `fixtureId` (Task 77). The engine takes an injected `Rng`.

**Out of scope:** the re-scorinate confirm (US-04.6).

**Notes:** the user chose "Current round" on 2026-10-28 (Task 89 gap 3). It works like MVP1 "Scorinate matchday". The spec said "Scorinate bracket" shows the confirm when downstream results exist. With this rule that never happens, so the spec line is removed since 2026-10-28, with the user's OK. The handoff plays every tie again.

---

### US-04.6: warn before a re-scorinate clears results

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Scorination Workflow, §2 Bracket Phase

As a user, when I re-scorinate an earlier tie whose result already fed into later rounds, I want a warning before anything is cleared, so that I don't lose downstream results by accident.

**Acceptance criteria:**

- [ ] A re-scorinate of a tie with a dependent tie that has a result opens a confirm modal, as in the handoff:
  - Title: "Clear later rounds?"
  - Text: "This will clear results for later rounds. Continue?"
  - Buttons: "Cancel" and "Clear & scorinate".
- [ ] "Cancel" changes nothing.
- [ ] "Clear & scorinate" clears the dependent ties (US-04.7), then plays the tie again.
- [ ] A re-scorinate with no dependent results plays the tie again with no modal.
- [ ] Only the dependent ties clear. For example, a re-scorinate of the first quarter-final clears its semi-final, the final, and the third-place tie, not the other semi-final.
- [ ] The dependent ties clear even when the same team wins again.

**Out of scope:** a re-scorinate of a match in an earlier phase after the bracket starts (Open question, Task 92).

**Notes:** the user chose "dependent ties only" on 2026-10-28 (Task 89 gap 5). This is the spec rule. The handoff clears every later tie.

---

### US-04.7: cleared ties return to unplayed

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Scorination Workflow, §2 Bracket Phase

As a user, once I confirm clearing downstream results, I want those ties to return to an unplayed state with their "Scorinate" button re-enabled and "TBD" shown for undetermined teams, so that I can replay the bracket from that point forward.

**Acceptance criteria:**

- [ ] A cleared tie loses every match result: the legs, the AET, the replay, the penalties, and the coin toss.
- [ ] A team slot that waits for an unplayed tie shows "TBD", in a grey swatch, as in the handoff.
- [ ] After the re-scorinate, the slots fed by the re-scorinated tie show its new winner (or loser, for the third-place tie).
- [ ] A cleared tie with both teams known is playable again: its "Scorinate" button is enabled.
- [ ] A tie with a TBD slot has its "Scorinate" button disabled.
- [ ] A clear is one pure engine function. Tests cover a clear from the first round, a semi-final, and a tie next to a bye.

**Out of scope:** the confirm modal (US-04.6).

**Notes:** none.

---

### US-04.8: the tie card

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Scorination Workflow, §2 Bracket Phase

As a user, I want each tie card to show the aggregate score and penalty result (when applicable) alongside its "Scorinate" button, so that I can read a tie's full outcome at a glance.

**Acceptance criteria:**

- [ ] Each tie card shows two team rows, each with a colour swatch and a name, as in the handoff.
- [ ] A single-match tie shows one score column.
- [ ] A two-legged tie shows one column for each leg, and a footer with "Agg" and the aggregate, for example "Agg 3–1".
- [ ] A score that includes AET has an asterisk. The Bracket header has the footnote "* leg score includes AET" (US-03.1).
- [ ] A replay shows as a second score, labelled "Replay" (US-03.2).
- [ ] A tie decided by penalties shows "· Pens 5-4" after the score or the aggregate (US-03.3).
- [ ] A tie decided by the coin toss shows "· Coin toss" (US-03.2).
- [ ] A tie decided by away goals shows "· Away goals".
- [ ] The winner's row is marked, for example in bold.
- [ ] The footer holds the "Scorinate" button (US-04.5).
- [ ] The ties of each round sit in one column, with the round name at the top (US-04.14). The rounds go from left to right.

**Out of scope:** a kick-by-kick shootout display (US-03.3).

**Notes:** the "· Away goals" tag and the bold winner are Claude choices. The user confirmed them on 2026-10-28. The handoff shows neither.

---

### US-04.9: the early power-of-2 warning

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Sizing & Byes, §2 Bracket Phase

As a user, I want to be warned early if my bracket's qualifier count isn't a power of 2 — during team selection for a single-bracket league, or during phase configuration for a mixed league — so that I can adjust before it's a problem.

**Acceptance criteria:**

- [ ] A league with one Bracket phase: the Teams step shows the warning when the team count is not a power of 2.
- [ ] A league with a Bracket after another phase: the phase step shows the warning on the Bracket phase, from the qualifier count of US-01.4.
- [ ] When the qualifier count needs the team count (group size mode), the Teams step shows the warning.
- [ ] The warning text gives the byes, for example: "6 qualifiers: the bracket has 8 slots, so 2 teams get a bye."
- [ ] The warning does not block Next or Start. The byes make the bracket valid.
- [ ] A bracket with fewer than 2 qualifiers blocks Start, with the reason. This is the US-01.4 fit rule.

**Out of scope:** the best M suggestion that makes a power of 2 (US-01.6).

**Notes:** the warning text is a Claude choice. The user confirmed it on 2026-10-28. The handoff does not show this warning.

---

### US-04.10: assign the byes

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Sizing & Byes, §2 Bracket Phase

As a user, I want byes auto-assigned to the top seeds when the qualifier count isn't a power of 2, with the option to manually reassign who gets one, so that the bracket still makes sense without extra setup work.

**Acceptance criteria:**

- [ ] The bye count is the slot count minus the qualifier count.
- [ ] By default, the top seeds get the byes. For example, 6 qualifiers: seeds 1 and 2 get a bye.
- [ ] A bye team takes a top-seed slot. The tree uses the US-04.2 placement, with each missing seed as a bye.
- [ ] The Seed List has a star on each row: filled for a team with a bye, empty for the others, as in the handoff.
- [ ] The Seed List shows "x / y byes assigned", and the text "Top seeds get a bye by default. Star any seed to grant it a bye instead — first-round only."
- [ ] With no byes, the Seed List shows "8 qualifiers fill the bracket exactly — no byes needed." and the stars are disabled.
- [ ] A click on an empty star gives that team a bye. A click on a filled star takes the bye away. When all byes are assigned, the empty stars are disabled.
- [ ] After a change, the bye teams take the bye slots in seed order. The other teams take the other slots in seed order. The seeds do not change.
- [ ] Before the first bracket result, a star change applies at once.
- [ ] After the first bracket result, a star change opens the US-04.6 confirm modal. "Clear & scorinate" reads "Clear & change byes" here. A confirm clears every result of the bracket phase, then applies the change.
- [ ] A star change with fewer bye teams than byes needed: the first round cannot start. The Bracket tab shows "Assign 2 / 2 byes to play the first round.", and "Scorinate" and "Scorinate bracket" are disabled.
- [ ] The bye choice is stored with the league.

**Out of scope:** byes after the first round. The bye UI on the tree (US-04.11).

**Notes:** the user chose "Any time, with the confirm" on 2026-10-28 (Task 89 gap 4), as in the handoff. The slot rule after a change, the button text "Clear & change byes", and the rule for missing byes are Claude choices. The user confirmed them on 2026-10-28.

---

### US-04.11: the bye on the tree

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Sizing & Byes, §2 Bracket Phase

As a user, I want a bye to auto-advance its team with a "BYE" placeholder and a disabled "Scorinate" button, so that it's visually consistent with every other tie even though there's nothing to simulate.

**Acceptance criteria:**

- [ ] A bye tie card shows the team, and "BYE — advances automatically" in the opponent slot, as in the handoff.
- [ ] The bye team goes to its next-round slot when the bracket phase starts, with no click.
- [ ] The bye tie has a tie id and no match (Task 77).
- [ ] The bye tie shows the "Scorinate" button, disabled.
- [ ] "Scorinate bracket" skips a bye.
- [ ] A bye change (US-04.10) moves the teams in the next round with it.

**Out of scope:** none.

**Notes:** none.

---

### US-04.12: the third-place tie

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Specifics (third-place line)

As a user, I want an optional third-place tie between the two semi-final losers, so that the bracket also ranks third and fourth.

**Acceptance criteria:**

- [ ] A Bracket phase has a "Third-place playoff" toggle in the phase step. The default is off (Task 77).
- [ ] The toggle is disabled when the bracket has fewer than 4 slots, because it has no semi-finals.
- [ ] The Review step adds "· Third place" to the bracket detail when the toggle is on.
- [ ] With the toggle on, the two semi-final losers play a tie with the id `p<phase>.r<round>.third` (Task 77). The final is `p<phase>.r<round>.final`.
- [ ] The third-place tie uses the tie format of the final (US-04.13).
- [ ] The third-place tie and the final are both playable when the semi-finals end. One "Scorinate bracket" click plays both.
- [ ] The tie card shows under the final, with the name "Third-place playoff", as in the handoff.
- [ ] The phase is complete when the final and the third-place tie both have a result.

**Out of scope:** places below fourth.

**Notes:** new story, from Task 77. The user said on 2026-10-27 that a third-place tie usually plays before the final. With "Scorinate bracket" by round (US-04.5), both play in one click. The user can play the third-place tie first with its own button.

---

### US-04.13: the single-match final

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Bracket Specifics (single-match final line)

As a user, I want a two-legged bracket to end with a one-match final if I choose, so that I can model a cup with a final at a neutral venue.

**Acceptance criteria:**

- [ ] A Bracket phase with Two-legged ties has a "Single-match final" toggle in the phase step. The default is off.
- [ ] A Single match phase does not show the toggle.
- [ ] The Review step adds "· Single-match final" to the bracket detail when the toggle is on.
- [ ] With the toggle on, the final is one match, `<final>.leg1`, at a neutral venue with no home boost (Tasks 74, 79).
- [ ] The third-place tie plays the same way as the final (Task 79).
- [ ] With the toggle off, the final and the third-place tie have two legs, like the other ties.

**Out of scope:** a single-match semi-final or any other round.

**Notes:** new story, from Task 79. The default "off" was a Task 79 proposal, confirmed here.

---

### US-04.14: round names and the winner

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §2 Bracket Phase. Progress text: US-01.2 and Task 76.

As a user, I want each round to have a name, and the bracket to show its winner, so that I can follow the bracket and see who won.

**Acceptance criteria:**

- [ ] A round takes its name from the teams it can hold: "Final" (2), "Semi-finals" (4), "Quarter-finals" (8), then "Round of 16", "Round of 32", and so on.
- [ ] Byes count as slots. So a bracket of 6 qualifiers starts with the "Quarter-finals".
- [ ] The third-place tie is "Third-place playoff".
- [ ] The tree shows the round name at the top of each column (US-04.8).
- [ ] The progress badge and the League Detail header show the earliest round with a tie that has no result, for example "Quarter-finals" and "Bracket · Quarter-finals" (US-01.2).
- [ ] When the phase is complete, the Bracket tab shows "Winner: <team>", with the team colour, above the tree. The badge shows "Complete" when it is the last phase (US-01.2).
- [ ] The round names come from one pure function. Tests cover 2 to 64 slots.

**Out of scope:** custom round names.

**Notes:** new story, from Task 76 and US-01.2. The user chose the hyphen names on 2026-10-28 (Task 89 gap 6). The handoff writes "Quarterfinals" and "Semifinals". The user chose the winner line on 2026-10-28 (Task 89 gap 7).
