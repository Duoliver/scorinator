import type { JSX } from 'preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import { generateRoundRobin } from '@/engine/fixtures';
import { useTeamsStore } from '@/app/state/teamsStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import type { TeamRecord } from '@/features/components';
import type { LeagueRecord } from '@/features/leagues/types';
import { StandingsView } from './StandingsView';

const team = (overrides: Partial<TeamRecord> = {}): TeamRecord => ({
  slug: 'fc-united',
  name: 'FC United',
  colour: '#E53935',
  tier: 'B',
  ...overrides,
});

const league = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: false,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [
    { slug: 'fc-united', ovr: 70 },
    { slug: 'fc-rivals', ovr: 65 },
    { slug: 'fc-town', ovr: 60 },
  ],
  fixtures: [],
  byes: [],
  results: [],
  ...overrides,
});

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
 * `FixturesView` does — `LeagueDetailScreen` is what subscribes to the
 * store. A scorinate call only shows up if whatever renders the view
 * re-renders with the store's fresh league, so the live-update test
 * renders through this small harness, mirroring that lookup. */
function StandingsViewFromStore({ slug }: { slug: string }): JSX.Element | null {
  const found = useLeagueStore((state) => state.leagues.find((l) => l.slug === slug));
  return found ? <StandingsView league={found} /> : null;
}

beforeEach(() => {
  useLeagueStore.setState({ leagues: [] });
  useTeamsStore.setState({
    teams: [
      team({ slug: 'fc-united', name: 'FC United' }),
      team({ slug: 'fc-rivals', name: 'FC Rivals', colour: '#1E88E5' }),
      team({ slug: 'fc-town', name: 'FC Town', colour: '#2E7D32' }),
    ],
  });
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
        league={league({
          results: [
            { matchday: 1, home: 'fc-united', away: 'fc-rivals', homeGoals: 2, awayGoals: 0 },
            { matchday: 2, home: 'fc-town', away: 'fc-rivals', homeGoals: 1, awayGoals: 1 },
          ],
        })}
      />
    );

    expect(dataRows()).toEqual([
      ['1', 'FC United', '1', '1', '0', '0', '2', '0', '2', '3'],
      ['2', 'FC Town', '1', '0', '1', '0', '1', '1', '0', '1'],
      ['3', 'FC Rivals', '2', '0', '1', '1', '1', '3', '-2', '1'],
    ]);
  });

  it("uses the league's configured points system", () => {
    const results = [
      { matchday: 1, home: 'fc-united', away: 'fc-rivals', homeGoals: 2, awayGoals: 0 },
    ];
    const { unmount } = render(<StandingsView league={league({ results })} />);
    expect(pointsOf(dataRows()[0])).toBe('3');
    unmount();

    render(
      <StandingsView league={league({ results, points: { win: 2, draw: 1, loss: 0 } })} />
    );
    expect(pointsOf(dataRows()[0])).toBe('2');
  });

  it("shows a joint place as '-' on the second row of a tied block", () => {
    render(
      <StandingsView
        league={league({
          teams: [
            { slug: 'fc-united', ovr: 70 },
            { slug: 'fc-rivals', ovr: 65 },
          ],
          results: [
            { matchday: 1, home: 'fc-united', away: 'fc-rivals', homeGoals: 1, awayGoals: 1 },
          ],
        })}
      />
    );

    const rows = dataRows();
    expect(rows[0]?.[0]).toBe('1');
    expect(rows[1]?.[0]).toBe('-');
  });

  it("falls back to a team's slug when it is missing from the team roster", () => {
    useTeamsStore.setState({ teams: [] });
    render(<StandingsView league={league()} />);
    expect(screen.getByText('fc-united')).toBeInTheDocument();
  });

  it('shows an empty-state message and no table for a league with no teams', () => {
    render(<StandingsView league={league({ teams: [] })} />);
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
    const { fixtures, byes } = generateRoundRobin(['fc-united', 'fc-rivals']);
    useLeagueStore.setState({
      leagues: [
        league({
          teams: [
            { slug: 'fc-united', ovr: 70 },
            { slug: 'fc-rivals', ovr: 65 },
          ],
          fixtures,
          byes,
        }),
      ],
    });
    render(<StandingsViewFromStore slug="coastal-premier" />);
    expect(screen.getByText('No matches played yet.')).toBeInTheDocument();

    const first = fixtures[0];
    if (!first) throw new Error('expected a generated fixture');
    act(() => useLeagueStore.getState().scorinateFixture('coastal-premier', first));

    const rows = dataRows();
    expect(rows.map((row) => row[2])).toEqual(['1', '1']);
    // Scorination is random: a win gives 3 points in total, a draw gives 2.
    const totalPoints = rows.reduce((sum, row) => sum + Number(pointsOf(row)), 0);
    expect([2, 3]).toContain(totalPoints);
    expect(screen.queryByText('No matches played yet.')).not.toBeInTheDocument();
  });
});
