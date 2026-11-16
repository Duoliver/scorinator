# Epic 17: Brackets and phases

Source: [`docs/scorinator-mvp3.md`](/docs/scorinator-mvp3.md) §0 Scope, §1 Brackets and phases. C29 refined in [Task 260](/docs/tasks/260-manual-bracket-seeding.md), from the user's answers in three rounds (2026-11-16). The user agreed US-17.1 to US-17.3 on 2026-11-16.

Items: C29 (Must since 2026-11-16, Task 260), C25, C27 (Should). Task 200 refines C25 and C27 later.

**Terms used in this file:**

- **First-phase bracket:** a bracket that is phase 1 of a league, for example a pure cup. Its seeds come from a random draw (US-04.2).
- **Stored draw:** the seed order of the random draw, kept with the league.
- **Seed List:** the "Seed List" sub-tab of a bracket phase in League Detail (US-04.2, US-04.10).
- **Bye side:** the empty side of a first-round tie with a bye.

Parked: the pick of the team of a tree slot with the team picker modal (`scorinator-future-features.md` §43). A seeding method such as World Cup pairs, and manual seeding of a bracket after another phase (§23).

---

### US-17.1: move a team in the Seed List

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Brackets and phases (C29)

As a user, I want to change the seed order of a first-phase bracket with drag and drop, so that the bracket has the ties I want.

**Acceptance criteria:**

- [ ] In the Seed List of a first-phase bracket, the user drags a row and drops it at a new place.
- [ ] The row moves to the new place. The rows between move one place up or down. The seed numbers follow the new order.
- [ ] A team with a bye keeps its bye after the move.
- [ ] The tree follows the new seeds with the standard placement (US-04.2).
- [ ] A drop at the same place changes nothing.

**Out of scope:** a bracket after another phase (§23). A move with touch or with the keyboard: drag and drop with a mouse only.

**Notes:** answers of rounds 1 to 3. "A team keeps its bye" is a Claude choice. The user agreed it on 2026-11-16.

---

### US-17.2: move a team on the bracket tree

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Brackets and phases (C29)

As a user, I want to move a team on the first round of the bracket tree with drag and drop, so that I set a tie directly.

**Acceptance criteria:**

- [ ] On the Bracket tab of a first-phase bracket, the user drags a team of the first round and drops it on another team. The two teams swap places.
- [ ] The user drops a team on a bye side. The team then plays the team of that tie. The old opponent of the moved team gets the bye.
- [ ] A team with a bye cannot drop on a bye side, because the bye count stays the same.
- [ ] After a move, the seeds follow the tree: seed N is the team in the slot of seed N in the standard placement. The Seed List shows the new order and the new byes.
- [ ] A drop at the same place changes nothing.

**Out of scope:** a team in a later round. The pick of a slot with the team picker modal (§43). A move with touch or with the keyboard.

**Notes:** answers of rounds 2 and 3. The bye rule for a team with a bye, and the new seed numbers, are Claude choices. The user agreed them on 2026-11-16.

---

### US-17.3: the stored draw, the lock, and the header

**Status:** Agreed
**Spec:** `docs/scorinator-mvp3.md` §1 Brackets and phases (C29)

As a user, I want to go back to the random draw, and to see that the seeds changed, so that a manual change is safe and clear.

**Acceptance criteria:**

- [ ] The league stores the random draw of a first-phase bracket, apart from the current seeds.
- [ ] The Seed List has a "Back to the draw" button. It sets the seeds to the stored draw, and the byes to the top seeds of the draw (US-04.10). It is disabled when the seeds and the byes are those of the draw.
- [ ] A manual change applies at once and is stored with the league.
- [ ] After the first bracket result, the user cannot drag a team, and "Back to the draw" is disabled.
- [ ] The bye stars stay as they are today: a change after the first result asks for a confirm, and clears the bracket results (US-04.10).
- [ ] In a finished Season, the user cannot drag a team, and "Back to the draw" does not show (US-13.9).
- [ ] After a manual change, the Bracket tab header says "Seeded by random draw, then by hand". With the seeds of the draw, it says "Seeded by random draw", as today.
- [ ] A league file of MVP2 with no stored draw keeps its current seeds as its draw.

**Notes:** answers of rounds 1 to 3. The button name, the byes on "Back to the draw", the header text, and the old league files are Claude choices. The user agreed them on 2026-11-16.
