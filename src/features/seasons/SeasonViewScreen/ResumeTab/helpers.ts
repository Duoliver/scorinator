import { groupLabel } from '@/engine/round-robin';
import { PhaseFormat, type ZoneColour } from '@/engine/phases';
import type { LeagueWrapper } from '@/domain';
import { bracketRulesFor } from '@/app/state/bracket';
import { leagueFinalRanking } from '@/app/state/finalRanking';
import { getPhaseZoneView, phaseStandings } from '@/app/state/phases';
import { summarizeLeague } from '@/app/state/summarizeLeague';

/** The highlight of a row: the winner, or the colour of its zone. */
export type ResumeTone = 'winner' | ZoneColour;

/** One row of a Resume card: a place, a team, and its label. */
export interface ResumeRow {
  key: string;
  place: string;
  teamUuid: string;
  label: string;
  tone: ResumeTone | undefined;
}

/** The rows of a Resume card, or the note that takes their place. */
export interface ResumeContent {
  rows: ResumeRow[];
  note: string | undefined;
}

const BRACKET_LABELS = ['Champion', 'Runner-up', 'Third place', 'Fourth place'];

/**
 * The content of the Resume card of one league (US-13.8, Task 221), from
 * its last started phase (choice 1).
 *
 * - A round robin: place 1, "Champion" when the league is complete, else
 *   "First place now", then each team in a zone, in place order (choice 2).
 * - A Groups phase: the first place of each group (choice 3).
 * - A bracket: places 1 and 2, and 3 and 4 with a third-place playoff, once
 *   it is complete. Before that, "No winner yet." (choice 4).
 * - A round robin or Groups phase with no result: "No results yet."
 *   (choice 5).
 */
export function getResumeContent(league: LeagueWrapper): ResumeContent {
  const index = league.content.phases.length - 1;
  const phase = league.content.phases[index];
  if (!phase) return { rows: [], note: 'No results yet.' };
  const isComplete = summarizeLeague(league).progress.kind === 'completed';

  if (phase.format === PhaseFormat.BRACKET) {
    if (!isComplete) return { rows: [], note: 'No winner yet.' };
    const hasThirdPlace =
      bracketRulesFor(league, index).thirdPlace && phase.seeds.length >= 4;
    const places = hasThirdPlace ? 4 : 2;
    const ranking = leagueFinalRanking(league).slice(0, places);
    return {
      rows: ranking.map((teamUuid, place) => ({
        key: teamUuid,
        place: String(place + 1),
        teamUuid,
        label: BRACKET_LABELS[place],
        tone: place === 0 ? 'winner' : undefined,
      })),
      note: undefined,
    };
  }

  if (phase.results.length === 0) return { rows: [], note: 'No results yet.' };
  const tables = phaseStandings(league, index);

  if (phase.format === PhaseFormat.GROUPS) {
    return {
      rows: tables.flatMap((table, group) => {
        const [first] = table;
        return first
          ? [
              {
                key: `${group}-${first.team}`,
                place: '1',
                teamUuid: first.team,
                label: `First in Group ${groupLabel(group)}`,
                tone: undefined,
              },
            ]
          : [];
      }),
      note: undefined,
    };
  }

  const zoneView = getPhaseZoneView(league, index);
  const labelOf = new Map(zoneView.zones.map((zone) => [zone.colour, zone.label]));
  const [table = []] = tables;
  return {
    rows: table.flatMap((row, place): ResumeRow[] => {
      if (place === 0) {
        return [
          {
            key: row.team,
            place: '1',
            teamUuid: row.team,
            label: isComplete ? 'Champion' : 'First place now',
            tone: 'winner',
          },
        ];
      }
      const colour = zoneView.colours.get(row.team);
      if (!colour) return [];
      return [
        {
          key: row.team,
          place: String(place + 1),
          teamUuid: row.team,
          label: labelOf.get(colour) ?? '',
          tone: colour,
        },
      ];
    }),
    note: undefined,
  };
}
