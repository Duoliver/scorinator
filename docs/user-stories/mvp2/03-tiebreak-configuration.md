# Epic 03: Tiebreak Configuration

Refined in [Task 88](/docs/tasks/088-refine-tiebreak.md). Source: [`docs/scorinator-mvp2.md`](/docs/scorinator-mvp2.md) §1 Tiebreak Resolution, §2 Epic: Tiebreak Configuration. Layout reference: the MVP2 handoff, `Footballer - League Setup Wizard` (phase step) and `Footballer - League Detail - Mixed` (Bracket phase).

**Terms used in this file:**

- **Tie:** one bracket pairing. A single-match tie has one match. A two-legged tie has two legs.
- **Level:** a single match drawn after 90 minutes, or a two-legged tie level on aggregate after 180 minutes and after the away-goals rule, if it is on (epic 04).
- **Tiebreak:** what decides a level tie: AET, then the tiebreak method.

---

### US-03.1: the "Plays AET" toggle

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Tiebreak Resolution, §2 Tiebreak Configuration

As a user, I want to toggle "Plays AET?" per phase, so that I control whether extra time is simulated on a draw.

**Acceptance criteria:**

- [ ] A Bracket phase has a "Plays AET" toggle in the phase step. The default is on.
- [ ] A round-robin or Groups phase has no AET toggle, because a draw is a valid result there.
- [ ] The Review step shows "AET on" or "AET off" in the bracket detail, for example "Two-legged · AET on · Penalties".
- [ ] With AET on, a level tie plays 30 minutes of AET. The expected goals are the full-match value × 1/3, with the same elasticity as the match (Task 80).
- [ ] The AET of a single-match tie is at a neutral venue: no home boost (Task 74).
- [ ] The AET of a two-legged tie follows the second leg, at the same venue: the home team keeps the home boost (Task 80).
- [ ] The AET goals add to the score of the match they follow. The tie card marks that score with an asterisk, and a footnote says "* score includes AET", as in the handoff.
- [ ] Away goals apply once, after 180 minutes. Goals in AET never count as away goals.
- [ ] With AET off, a level tie goes straight to the tiebreak method.
- [ ] Statistical tests over many seeded runs stay inside the Task 80 AET bands:
  - Equal teams at OVR 35, 65, and 95: 48% to 60% of AETs stay drawn.
  - Equal teams at OVR 35, 65, and 95: the mean AET goals are 0.65 to 0.95.
  - OVR 80 v 65: the stronger team wins 60% to 70% of decided AETs.

**Out of scope:** the away-goals toggle and the two-legged aggregate (epic 04). A replay's AET (US-03.2).

**Notes:** the user chose "no away goals after AET" on 2026-10-27 (Task 88 notes). The AET model and bands come from Task 80.

---

### US-03.2: the tiebreak method

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Tiebreak Resolution, §2 Tiebreak Configuration

As a user, I want to choose between "Penalties" and "Replay → Coin Toss" as the phase's tiebreak method, so that decisive results are resolved the way I intend.

**Acceptance criteria:**

- [ ] A Bracket phase has a "Tiebreak method" choice in the phase step: "Penalties" or "Replay → Coin toss". The default is Penalties.
- [ ] A round-robin or Groups phase has no tiebreak method.
- [ ] The Review step shows "Penalties" or "Replay→Coin toss" in the bracket detail.
- [ ] A level tie follows one of these four sequences. Each row is a test case.

  | AET | Method | Sequence |
  |---|---|---|
  | On | Penalties | AET → Penalties |
  | Off | Penalties | Penalties |
  | On | Replay → Coin toss | AET → Replay → replay AET → Coin toss |
  | Off | Replay → Coin toss | Replay → Coin toss |

- [ ] A replay is one new match, with the fixture id `<tie>.replay` (Task 77). It is at a neutral venue (Task 74).
- [ ] With AET on, a level replay plays AET, by the US-03.1 rules.
- [ ] A replay that is still level after its AET, or level with AET off, goes to the coin toss. There is no second replay.
- [ ] One "Scorinate" click plays the match and every tiebreak step the tie needs. After the click, the tie has a winner.
- [ ] "Scorinate bracket" plays each playable tie the same way.
- [ ] The tie card shows a replay as a second score, labelled "Replay", with the US-03.1 asterisk when it includes AET.
- [ ] When the coin toss decides, the tie card shows the winner with the tag "· Coin toss".

**Out of scope:** the penalty and coin toss models (US-03.3). The re-scorinate cascade and its confirm step (epic 04).

**Notes:** the user chose "the replay plays AET" and "one click" on 2026-10-27 (Task 88 notes). The spec table says "AET → Replay → (if replay also drawn) Coin Toss". Row 3 above adds the replay AET. The spec has the edit since 2026-10-27 (Task 88), with the user's OK.

---

### US-03.3: simulate penalties and the coin toss

**Status:** Agreed
**Spec:** `docs/scorinator-mvp2.md` §1 Tiebreak Resolution (Coin toss), §2 Tiebreak Configuration

As a user, I want the system to simulate penalties as a weighted-but-still-uncertain outcome, and a coin toss as a pure 50/50, so that upsets remain possible even in tiebreaks.

**Acceptance criteria:**

- [ ] Penalties run kick by kick. Each kick scores with p = clamp(0.75 + 0.10 × (own OVR − opponent OVR) / 100, 0.6, 0.9) (Task 80).
- [ ] Penalties use the stored OVRs, with no home boost (Task 80).
- [ ] An injected `Rng` picks the team that kicks first, 50/50. Kicking first gives no edge.
- [ ] The teams take five kicks each, in turn. The shootout stops when one team cannot catch up.
- [ ] If the teams are level after five kicks each, they kick in pairs until one pair has a winner.
- [ ] The engine returns the shootout score, for example 5–4.
- [ ] The tie card shows "· Pens 5-4" after the score or the aggregate, as in the handoff. The card shows no list of single kicks.
- [ ] The coin toss is a pure 50/50 with an injected `Rng`. Team strength plays no part.
- [ ] Statistical tests over many seeded runs stay inside the Task 80 bands:

  | Test | Band |
  |---|---|
  | Penalties, gap 0: either team wins | 47% to 53% |
  | Penalties, gap 15: the stronger team wins | 52% to 59% |
  | Penalties, gap 30: the stronger team wins | 57% to 64% |
  | Penalties, gap 60: the stronger team wins | 66% to 75% |
  | Penalties, equal teams: kicks that score | 72% to 78% |
  | Coin toss, gap 60: the stronger team wins | 47% to 53% |

**Out of scope:** a kick-by-kick display. A first-kicker edge.

**Notes:** the model and bands come from Task 80. The user confirmed the first-kicker rule on 2026-10-27 (Task 88 notes).
