import { useMemo, useState } from 'preact/hooks';
import { hasLowGraphicContrast } from '@/design-system';
import { groupLabel } from '@/engine/round-robin';
import { getPlacesByMatchday } from '@/engine/standings';
import { leagueLotOf, phaseTeamLists } from '@/app/state/phases';
import { useTeamLookup } from '@/features/components';
import type { LeagueWrapper } from '@/domain';
import { formatOrdinal, getMatchdayX, getPlaceY } from './helpers';
import type { ChartHint, ChartLine, PositionChartView } from './types';

/**
 * The lines of the position chart of one phase (US-12.4): one line for each
 * team of the table, or of the chosen group of a Groups phase. A place
 * comes from `getPlacesByMatchday`, with the fixed lots of the league. The
 * group selector, the team that stands out, and the point hint are local
 * state.
 */
export function usePositionChart(
  league: LeagueWrapper,
  phaseIndex = league.content.phases.length - 1
): PositionChartView {
  const lookupTeam = useTeamLookup(league.teams);
  const [groupIndex, setGroupIndex] = useState(0);
  const [highlight, setHighlight] = useState<string>();
  const [hint, setHint] = useState<ChartHint>();
  const phase = league.content.phases[phaseIndex];

  const chart = useMemo(() => {
    if (!phase || phase.format === 'bracket') {
      return { groupCount: 0, matchdays: 0, lines: [] as ChartLine[] };
    }
    const lists = phaseTeamLists(league, phaseIndex);
    const teams = lists[groupIndex] ?? [];
    const members = new Set(teams);
    // A group chart counts the fixtures of its own group only (Task 153).
    const fixtures = phase.fixtures.filter(
      (fixture) => members.has(fixture.home) && members.has(fixture.away)
    );
    const matchdays = Math.max(0, ...fixtures.map((fixture) => fixture.matchday));
    const points = getPlacesByMatchday(
      teams,
      fixtures,
      phase.results,
      league.content.points,
      leagueLotOf(league)
    );
    const lines = teams
      .map((team): ChartLine => {
        const { name, colour, trigram } = lookupTeam(team);
        const teamPoints = points.map(({ matchday, places }) => ({
          matchday,
          place: places.get(team) ?? 0,
        }));
        return {
          team,
          name,
          label: trigram || name,
          isTrigram: trigram !== '',
          colour,
          outlined: hasLowGraphicContrast(colour),
          points: teamPoints,
          lastPlace: teamPoints[teamPoints.length - 1]?.place ?? 0,
        };
      })
      .sort((a, b) => a.lastPlace - b.lastPlace);
    return {
      groupCount: phase.format === 'groups' ? lists.length : 0,
      matchdays,
      lines,
    };
  }, [league, phase, phaseIndex, groupIndex, lookupTeam]);

  return {
    hasResults: chart.lines.some((line) => line.points.length > 0),
    groupOptions:
      chart.groupCount > 0
        ? Array.from({ length: chart.groupCount }, (_, i) => ({
            value: String(i),
            label: `Group ${groupLabel(i)}`,
          }))
        : undefined,
    selectGroup: (value): void => {
      setGroupIndex(Number(value));
      setHighlight(undefined);
      setHint(undefined);
    },
    matchdays: chart.matchdays,
    placeCount: chart.lines.length,
    lines: chart.lines,
    highlight,
    setHighlight,
    hint,
    showHint: (line, point) =>
      setHint({
        text: `${line.label} · MD ${point.matchday} · ${formatOrdinal(point.place)}`,
        x: getMatchdayX(point.matchday, chart.matchdays),
        y: getPlaceY(point.place),
      }),
    hideHint: () => setHint(undefined),
  };
}
