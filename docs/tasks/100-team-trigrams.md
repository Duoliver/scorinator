# Task 100: team trigrams

**Status:** Done (2026-10-28)

## Goal

Write one refined story for team trigrams: a short three-letter code for each team, with alternatives, so that two teams in one league never share a code. The story goes in epic 09 as US-09.6. Feature #1 of `docs/unplanned-features-draft.md`.

## Acceptance criteria

- [x] `docs/user-stories/mvp2/09-teams-module.md` has US-09.6, in the README template.
- [x] The story says where the trigram list lives, how a league picks one trigram for each team, and what happens when the alternatives run out.
- [x] The story lists each place the trigram shows, and each file format that carries the list.
- [x] Each gap found has a user answer, or an entry in the `PROGRESS.md` Open questions.
- [x] A spec edit happens only with the user's OK.
- [x] The user agrees the story, and its status becomes Agreed.

## Notes

- **2026-10-28:** Task created by the user. The user's draft: "team trigrams, a list for each, so they can get alternatives (priority by tier). Trigrams are always in monospaced font." The user approved all 7 MVP2 items of the draft as MVP2 scope, in three tasks: 100 (trigrams), 101 (palette), and 102 (standings display).
- **2026-10-28:** Facts. The design system has `--font-mono` (JetBrains Mono) in `src/design-system/tokens/tokens.css`. An Instance copies the Blueprint name, colour, slug, and Tier at add (US-09.2). The last-5 hover card (Task 102) shows a trigram for each opponent.
- **2026-10-28:** The user agreed the criteria. Gap answers: (1) an empty list uses a trigram made from the name. (2) For the same Tier, the higher OVR wins, then the fixed lots. (3) With no free trigram, a digit replaces the last character. (4) The league trigram shows in narrow standings, in the fixtures list, and in the chart labels. (5) The wizard picks live, "Create league" stores the pick, and the Edit drawer can fix a trigram. (6) A to Z and 0 to 9, exactly 3 characters. The CSV gets an optional "Trigrams" column, split by spaces.
- **2026-10-28:** Claude wrote US-09.6, with the status Refined.

- **2026-10-28:** The user agreed US-09.6, the four Claude choices, and three spec edits. Status: Agreed.

## Report

- **What was built:** US-09.6 (Agreed) in `docs/user-stories/mvp2/09-teams-module.md`: a trigram list on each Blueprint, a unique pick in each league, and the display places.
- **Test approach:** none, no code changed. The story names the tests of the pick function.
- **Decisions made:** the gap answers and the confirmed Claude choices in the Notes above, and in the `PROGRESS.md` Decisions log on 2026-10-28.
- **Spec edits:** three, in `docs/scorinator-mvp2.md` §1 Teams Module and §2, with the user's OK. Each one is marked with its date and Task 100.
- **Effect on other tasks:**
  - **Task 102 (Standings display):** the last-5 card and the chart labels use the Instance trigram.
  - **US-08.4:** the Edit drawer gets a "Trigram" field. US-09.6 holds the rule.
  - **US-10.1, US-10.2:** the JSON files carry the list and the picked trigram. The CSV gets the "Trigrams" column.
- **What is left, what is next:** nothing. Next is Task 101, the team palette.
