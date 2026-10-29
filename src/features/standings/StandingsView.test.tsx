import type { JSX } from 'preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import { scorinateFixture } from '@/app/state/leagueWrapperActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import type { LeagueWrapper, PhaseResult } from '@/domain';
import { StandingsView } from './StandingsView';
import {
  LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
  testUuid,
} from '@/test/databaseRecords';

const UNITED = testUuid(1);
const RIVALS = testUuid(2);
const TOWN = testUuid(3);

const TEAMS = [
  { name: 'FC United', colour: '#E53935' },
  { name: 'FC Rivals', colour: '#1E88E5' },
  { name: 'FC Town', colour: '#2E7D32' },
];

/** A three-team league with the given results in phase 1, and other
 * league fields from `details`. */
function league(
  results: PhaseResult[] = [],
  details: Parameters<typeof roundRobinLeague>[1] = {},
  teams = TEAMS
): LeagueWrapper {
  const wrapper = roundRobinLeague(teams, details);
  const [phase] = wrapper.content.phases;
  return {
    ...wrapper,
    content: { ...wrapper.content, phases: [{ ...phase, results }] },
  };
}

function score(
  fixtureId: string,
  home: string,
  away: string,
  homeGoals: number,
  awayGoals: number
): PhaseResult {
  return { fixtureId, home, away, homeGoals, awayGoals };
}

/** Every data row of the rendered table as an array of cell texts, header
 * row skipped. `Table` renders each cell as a direct child of its row. */
function dataRows(): string[][] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => Array.from(row.children).map((cell) => cell.textContent ?? ''));
}

/** The Pts cell, always the last one in a row. */
function pointsOf(row: string[] | undefined): string | undefined {
  return row?.[row.length - 1];
}

/** `StandingsView` reads `league` as a plain prop, the same way
 * `FixturesView` does: `LeagueDetailScreen` is what subscribes to the
 * store. A scorinate call only shows up if whatever renders the view
 * renders again with the fresh league from the store, so the live update
 * test renders through this small harness, as League Detail does. */
function StandingsViewFromStore({ uuid }: { uuid: string }): JSX.Element | null {
  const found = useDatabaseStore((state) => state.leagues[uuid]);
  return found ? <StandingsView league={found} /> : null;
}

beforeEach(() => {
  openTestDatabase();
});

describe('StandingsView', () => {
  it('shows the column headers from the design reference', () => {
    render(<StandingsView league={league()} />);
    for (const header of ['#', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts']) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
  });

  it('ranks teams by points, then goal difference, with the full stat line per team', () => {
    render(
      <StandingsView
        league={league([
          score('a', UNITED, RIVALS, 2, 0),
          score('b', TOWN, RIVALS, 1, 1),
        ])}
      />
    );

    expect(dataRows()).toEqual([
      ['1', 'FC United', '1', '1', '0', '0', '2', '0', '2', '3'],
      ['2', 'FC Town', '1', '0', '1', '0', '1', '1', '0', '1'],
      ['3', 'FC Rivals', '2', '0', '1', '1', '1', '3', '-2', '1'],
    ]);
  });

  it("uses the league's configured points system", () => {
    const results = [score('a', UNITED, RIVALS, 2, 0)];
    const { unmount } = render(<StandingsView league={league(results)} />);
    expect(pointsOf(dataRows()[0])).toBe('3');
    unmount();

    render(
      <StandingsView
        league={league(results, { points: { win: 2, draw: 1, loss: 0 } })}
      />
    );
    expect(pointsOf(dataRows()[0])).toBe('2');
  });

  it("shows a joint place as '-' on the second row of a tied block", () => {
    render(
      <StandingsView
        league={league([score('a', UNITED, RIVALS, 1, 1)], {}, TEAMS.slice(0, 2))}
      />
    );

    const rows = dataRows();
    expect(rows[0]?.[0]).toBe('1');
    expect(rows[1]?.[0]).toBe('-');
  });

  it('shows the Instance name, not the Blueprint name (US-09.2)', () => {
    openTestDatabase([
      { slug: 'team-1', name: 'Renamed Blueprint', colour: '#000000', tier: 'B' },
    ]);
    render(<StandingsView league={league()} />);

    expect(screen.getByText('FC United')).toBeInTheDocument();
    expect(screen.queryByText('Renamed Blueprint')).not.toBeInTheDocument();
  });

  it('shows an empty-state message and no table for a league with no teams', () => {
    render(<StandingsView league={league([], {}, [])} />);
    expect(screen.getByText('No teams in this league yet.')).toBeInTheDocument();
    expect(screen.queryByRole('row')).not.toBeInTheDocument();
  });

  it('shows every team at zero, plus a note, before any match is played', () => {
    render(<StandingsView league={league()} />);
    expect(screen.getByText('No matches played yet.')).toBeInTheDocument();
    expect(dataRows()).toHaveLength(3);
    expect(dataRows()[0]?.slice(2)).toEqual(['0', '0', '0', '0', '0', '0', '0', '0']);
  });

  it('updates live when a match is scorinated', () => {
    const wrapper = openTestLeague(league([], {}, TEAMS.slice(0, 2)));
    render(<StandingsViewFromStore uuid={LEAGUE} />);
    expect(screen.getByText('No matches played yet.')).toBeInTheDocument();

    const first = wrapper.content.phases[0]?.fixtures[0];
    if (!first) throw new Error('expected a generated fixture');
    act(() => scorinateFixture(LEAGUE, first.id));

    const rows = dataRows();
    expect(rows.map((row) => row[2])).toEqual(['1', '1']);
    // Scorination is random: a win gives 3 points in total, a draw gives 2.
    const totalPoints = rows.reduce((sum, row) => sum + Number(pointsOf(row)), 0);
    expect([2, 3]).toContain(totalPoints);
    expect(screen.queryByText('No matches played yet.')).not.toBeInTheDocument();
  });
});
