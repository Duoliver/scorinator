import { beforeEach, describe, expect, it } from 'vitest';
import { findBracketWinner } from '@/engine/bracket';
import type { TeamInstance } from '@/domain';
import {
  GROUPS_THEN_BRACKET,
  instance,
  openTestDatabase,
  testUuid,
} from '@/test/databaseRecords';
import { bracketTreeOf } from './bracket';
import { useDatabaseStore } from './databaseStore';
import { leagueFinalRanking } from './finalRanking';
import {
  createLeague,
  scorinateBracket,
  scorinateMatchday,
  startNextPhase,
} from './leagueWrapperActions';
import { phaseStandings } from './phases';

function teamsOf(n: number): TeamInstance[] {
  return Array.from({ length: n }, (_, i) =>
    instance({
      blueprintUuid: testUuid(700 + i),
      slug: `team-${i + 1}`,
      name: `Team ${i + 1}`,
    })
  );
}

const league = (
  uuid: string
): ReturnType<typeof useDatabaseStore.getState>['leagues'][string] =>
  useDatabaseStore.getState().leagues[uuid];

/** Scorinates each matchday of the current scheduled phase. */
function playAllMatchdays(uuid: string): void {
  const { phases } = league(uuid).content;
  const phase = phases[phases.length - 1];
  if (!phase || phase.format === 'bracket')
    throw new Error('expected a scheduled phase');
  const matchdays = Math.max(...phase.fixtures.map((fixture) => fixture.matchday));
  for (let matchday = 1; matchday <= matchdays; matchday++)
    scorinateMatchday(uuid, matchday);
}

beforeEach(() => {
  openTestDatabase();
});

describe('leagueFinalRanking (US-10.5, Task 147)', () => {
  it('a one-phase round robin: the table order, as Blueprint UUIDs', () => {
    const { uuid } = createLeague({
      name: 'League',
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      teams: teamsOf(4),
      plans: [{ format: 'round-robin', legs: 'two-way' }],
    });
    playAllMatchdays(uuid);
    const [table] = phaseStandings(league(uuid), 0);
    expect(leagueFinalRanking(league(uuid))).toEqual(table.map((row) => row.team));
  });

  it('Groups → Bracket: the bracket winner first, and each team once', () => {
    const teams = teamsOf(8);
    const { uuid } = createLeague({
      name: 'Cup',
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      teams,
      plans: GROUPS_THEN_BRACKET,
    });
    playAllMatchdays(uuid);
    startNextPhase(uuid);
    scorinateBracket(uuid);
    scorinateBracket(uuid);

    const ranking = leagueFinalRanking(league(uuid));
    const tree = bracketTreeOf(league(uuid), 1);
    const bracket = league(uuid).content.phases[1];
    if (tree.status !== 'ready' || bracket.format !== 'bracket')
      throw new Error('no bracket');
    expect(ranking[0]).toBe(findBracketWinner(tree.rounds, bracket.results));
    expect([...ranking].sort()).toEqual(teams.map((team) => team.blueprintUuid).sort());
    // The four bracket teams come before the four teams that went out.
    expect(new Set(ranking.slice(0, 4))).toEqual(new Set(bracket.seeds));
  });

  it('a league with only phase 1 started ranks by phase 1', () => {
    const { uuid } = createLeague({
      name: 'Cup',
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      teams: teamsOf(8),
      plans: GROUPS_THEN_BRACKET,
    });
    const ranking = leagueFinalRanking(league(uuid));
    expect(ranking).toHaveLength(8);
    // Before any result, the first place of each group comes first.
    const leaders = phaseStandings(league(uuid), 0).map(([first]) => first.team);
    expect(new Set(ranking.slice(0, 2))).toEqual(new Set(leaders));
  });
});
