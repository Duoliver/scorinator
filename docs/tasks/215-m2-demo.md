# Task 215: demo of the M2 screens

**Status:** Done

## Goal

Give the user a simple demo HTML file of each new M2 screen, before the M2 screen tasks start (Task 205). The user reviews the layout and the content, and can ask for changes. This stops rework in Tasks 218 to 221.

## Acceptance criteria

- [x] `docs/design-reference/MVP3/` holds the M2 demos: the Season view with its league cards, Playoffs tab, playoff dialog, and Resume tab, the wizard Teams step in a Season, and League Detail in a Season.
- [x] The Season view demo shows "+ New league", the league cards, a playoff list with a played and an unplayed playoff, the playoff dialog with the tie format options, and the Resume tab for a complete and a running league (US-13.3, US-13.6, US-13.7, US-13.8).
- [x] The wizard demo shows the Season teams first with a highlight, the other Blueprints with less opacity and a status text, and the Edit drawer of a Season team (US-13.5).
- [x] The League Detail demo shows the breadcrumbs from the Season, and the read-only state of a finished Season (US-13.3, US-13.9).
- [x] The demos use `demo.css`, fake data, and no real logic. No app code changes.
- [x] `index.html` lists the M2 demos and the points that need a decision from the user.

## Notes

- **2026-11-13:** Started. Inputs: US-13.3, US-13.5 to US-13.9, the M1 demos and their agreed points, the wizard bracket settings (`BracketSettings`: "Plays AET", "Tiebreak method", "Tie format", "Away goals rule"), the league dashboard cards, the zones of US-12.5.
- **2026-11-13:** Claude wrote three demo files, and checked each page and dialog in a headless browser. Two fixes: a line of the wizard demo said that a Season has no ⇄ switch. No story says so, so it is now review point 4. The Resume card put place 16 before place 15.
- **2026-11-13:** Handoff. The user left the review of the demo for the next session. The task stays in Review, not committed (`CLAUDE.md`, Git commits). The four ⚠ points are in the `PROGRESS.md` open questions: 3, 4, 5, and 9. Tasks 216 and 217 (the Season league store and the playoff store) do not depend on the demo, and can start first.
- **2026-11-14:** Review, round 1. The user asked for five changes, and Claude made them in `m2-season-view.html`:
  1. The Playoffs tab shows one line for each playoff, in place of a card, so the names do not wrap. The line is the fixtures row of a round robin, under a black head with the name in small upper case.
  2. A tie with more than one match shows each match score, in the format of the bracket .txt export: the total, then "1-0, 0-1* · Pens 4-3".
  3. The playoff dialog says "Team 1" and "Team 2", not "Home team" and "Away team". The names do not depend on the tie format.
  4. Each team field opens the single team picker of the ⇄ switch, in place of a select. Claude choice: the picker lists the Season roster only, and hides the team of the other slot.
  5. A Resume card opens League Detail. A complete bracket shows the champion and the runner-up, plus the third and the fourth place when it has a third-place playoff.
- **2026-11-14:** `index.html` now has 11 M2 points. Still open: the "Home advantage" switch (point 4a), the home team of a single match and of the first leg (point 4b, new), the ⇄ switch (point 5), the two parts of "Add teams" (point 6), and "No winner yet" for a running bracket (point 10). After the answers, US-13.7 and US-13.8 need a text change: "Team 1" and "Team 2", the picker, the card link, and the bracket places.
- **2026-11-14:** Review, round 2 (design). The playoff head keeps the name in bold upper case. The rules are plain text, with no upper case, at the end side. The user set a new rule: an end-side container puts its own children and its text at the end, as a centered container centers them. It is in `docs/coding-standards.md` and in the review checklist. On a narrow screen, the playoff line stacks as the fixtures row (one line for each team, with its goals), and the head stacks with both parts at the start. Claude choice: the match scores go under the two team lines, and the status takes the full width.
- **2026-11-14:** Review, round 3. The "Played" badge looked like a button. It is now the status text "✓ Played", with no box and no fill. On a narrow screen, it moves to the end side of the playoff head, and the head text stacks at the start. The "Play" button stays at the bottom, at full width.
- **2026-11-14:** Review, round 4. On a narrow screen, the head shows the check mark only, with `aria-label="Played"`.- **2026-11-14:** Review, round 5. Each match score and the decision ("1-0, 0-1* · Pens 4-3") go in a row of their own, below the teams and the total, centred under the total. The total cell has a fixed width, so the teams line up from playoff to playoff.- **2026-11-14:** Review, round 6: the answers. Points 1 to 3 and 7 to 11 are agreed as they are. 4a: keep the "Home advantage" switch for each playoff. 4b: Team 1 plays at home in a single match and in the first leg. 4c: the user asked for a disabled entry, not a hidden one: the team of the other slot shows in the picker, disabled, with its slot ("Team 1"). 5: keep the ⇄ switch in a Season wizard. 6: the other teams are not dimmed, because the user can add them. The two groups stay, Season teams first. Claude changed the demos, `index.html`, and US-13.5, US-13.7, and US-13.8.
- **2026-11-14:** For the build. `PickerDialog` in `design-system/` needs two changes: a disabled item with a status text (Task 220, the playoff team picker), and item groups with a title (Task 218, "Add teams" and ⇄ in a Season). Claude choice, in the wizard demo: the ⇄ Switch dialog in a Season has the same two groups as "Add teams".
- **2026-11-14:** Review, round 7. The demo rolled the OVR of a joining team at "Create league", a Claude reading of US-13.5 that no story asked for. The user chose the MVP2 way: the OVR rolls at the add (Task 81). The row shows the Tier and the OVR, and ✎ opens an "Edit team" drawer with a note that the team joins the Season at create. The team joins with that OVR. US-13.5 changed. Claude choice: the drawer title "Edit team" and its note.
## Report

**Delivered:** three demo files in `docs/design-reference/MVP3/`, and 10 review points in `index.html`.

- `m2-season-view.html`: the league cards with "+ New league", the Playoffs tab, the playoff dialog, and the Resume tab.
- `m2-season-wizard.html`: the wizard Teams step in a Season, its "Add teams" dialog, and the Edit drawer of a Season team.
- `m2-league-detail.html`: League Detail in a Season, with the breadcrumbs, and the finished state.
- `demo.css` gets the M2 demo classes.

**Test approach:** no tests, as Task 205 agreed for a demo. A headless browser opened each page and dialog.

**Claude choices to review:** the 10 points in `index.html`. After six review rounds on 2026-11-14, the user agreed 11 points. The rounds are in the notes above. US-13.5, US-13.7, and US-13.8 changed to match.

**Refactor:** no app code. The demo files skip the refactor step.
