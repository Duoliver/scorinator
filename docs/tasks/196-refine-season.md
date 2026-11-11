# Task 196: refine epic 13, Season

**Status:** In progress

## Goal

Turn the Season items of the MVP3 spec into refined stories in `docs/user-stories/mvp3/13-season.md`. The stories cover C1 to C5 (Must) and C6 (Should). Claude asks the user questions, and writes the stories from the answers. Claude does not propose how a feature works (Task 195).

## Acceptance criteria

- [ ] Each Must and Should item of epic 13 has one or more stories, with acceptance criteria, in the story template of `docs/user-stories/README.md`.
- [ ] Each story comes from the user's answers. A gap that the user leaves open goes to the open questions of `PROGRESS.md`.
- [ ] The user agrees each story (status Agreed).
- [ ] A spec line changes only with the user's approval.

## Notes

- **2026-11-11:** Inputs. `docs/scorinator-mvp3.md` §1 Season. `PERSISTENCE.md` §2a: a Season sits in one Instance Wrapper, which holds the Team Instances. Each League in the Season keeps its own UUID. Future features §3 (a standalone league into a Season). Today a league is one wrapper with its own Instances, and the dashboard lists leagues only.
- **2026-11-11:** The user's answers, round 1.
  - A Season needs a name and a year. It is a group of leagues and teams.
  - Teams can join the Season while it goes on, but not a league that is running. Leagues can be created at any time.
  - A team imported into the Season gets its OVR rolled for the whole Season.
  - A finished Season can be read: all its leagues, teams, matches, and the rest.
  - Seasons have their own menu.
  - A league in a Season is a full league, with all its phases.
  - "At the same time" means in parallel: two leagues, even with shared teams, can be simulated while the other is not complete. To refine further later.
  - A league is created inside a Season. A team added to the league is added to the Season too. A team only in the Season rests until a Season league calls it.
  - One OVR in two leagues: the team condition (epic 14) brings a "base OVR" (the rolled one) and a "condition" that changes it into the "real OVR". The condition is for each team in each league.
  - Playoffs are free: the user picks the two teams from the Season roster, and picks the format. The Season view has a "Playoffs" tab. The name tells one playoff from another.
  - A standalone league that moves into a Season keeps its results. The OVR and the team state come from the Season.
- **2026-11-11:** The user's answers, round 2.
  - The user finishes a Season, and can open it again. Both are manual actions.
  - The name and the year are unique together.
  - A league runs from its creation.
  - The wizard of a Season league lists both the Season teams and the other Blueprints. The Season teams come first, with a highlight. The other teams show with less opacity and a short status text.
  - The user can change a team's OVR and Tier in the Season, as in the MVP2 league wizard.
  - A team cannot leave the Season.
  - The Season view: the user still thinks about how the leagues show. A "Resume" tab can list the league winners, and maybe the teams of the other zones. A "Statistics" tab, for the Season and for one league, can come in MVP4.
  - A playoff has the same format options as a bracket tie. The user picks the home team.
  - The main flow for a standalone league: the Season view imports it. Other flows, such as an export from the league view into a Season, can come later.
  - A team of the imported league that is not in the Season yet keeps the OVR of the league. A team that is in the Season takes the Season OVR (round 1).
- **2026-11-11:** The user's answers, round 3.
  - The Season view has a "Teams" tab, where teams join the Season.
  - The user can change a Season team's OVR or Tier while it plays a running league. The change does not affect the running league. So each league keeps its own OVR: the Season team is a middle layer between the Blueprint and the league team. This keeps the logic and the structure of a single league.
  - A standalone league that the Season imports should maybe keep its own OVR over the Season's, or offer an option. To refine: open question.
  - The leagues of a Season show only inside the Season.
  - The import copies the league. A later dialog can ask for a copy or a move.
  - The user can rename and delete a Season.
  - A Season has its own file, on the File screen.
  - The Season view layout: an open question. "Resume" is enough as the second tab for now.
  - The "Statistics" tab: parked as future features §27.
- **2026-11-11:** A spec conflict. `docs/scorinator-mvp3.md` §1 says one Instance for each Blueprint, shared by every league of the wrapper (`PERSISTENCE.md` §2a). The round 3 answer gives each league its own OVR, copied from the Season team at creation. The spec line and `PERSISTENCE.md` §2a change only with the user's approval.
- **2026-11-11:** Stories written: US-13.1 to US-13.11, status Refined, in `docs/user-stories/mvp3/13-season.md`.
- **2026-11-11 (review):** The user parked the OVR for each league team (future features §28), and kept the original spec: one Season team for every league. So the spec and `PERSISTENCE.md` §2a do not change. This also settles the open question of an imported league: a team in the Season already takes the Season OVR. Answers: (1) the delete keeps the Blueprints, (2) a Season league opens in League Detail, with breadcrumbs back to the Season, (3) the leagues are independent, (4) a playoff name is unique in its Season, and a playoff team is its Season team, (5) the Season file needs more detail: questions sent.

### Open for the next session (2026-11-11)

The user left before these answers. Ask them first. US-13.1 to US-13.11 are Refined, not Agreed yet.

**The Season file (US-13.11).** The MVP2 league import, for context (US-10.3, US-11.2): a file with many leagues opens a picker. An unknown UUID imports as it is. A known UUID with the same content imports nothing, with no prompt. A known UUID with other content is a conflict: "Skip" or "Import as new" (a fresh UUID). The Blueprints in the file never conflict: an unknown one is added, a known one keeps the local version. The questions:

1. What does a Season file hold: the Season, its leagues, its roster, its playoffs, and the Blueprints?
2. Is the Season the only thing that can be a conflict, or can each league inside it be one too?
3. "Import as new" keeps the name and the year. That breaks the unique pair of US-13.1. What should happen?
4. Can one file hold more than one Season?
5. Can a league of a Season export as a league file of its own, as in MVP2?

**Two gaps from the original spec (US-13.4, US-13.5):**

6. All leagues share the Season team. Can the user change its OVR or Tier while a running league holds it? If so, the change reaches that league too.
7. In a Season league, the MVP2 wizard "Edit" changes a team for one league. With a shared Season team, what does that "Edit" change?

After the answers: update the stories, then ask the user to agree each one, then the report and Review.

## Report

Write this before the task goes to Review.
