import type { JSX } from 'preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/preact';
import { scorinateFixture } from '@/app/state/leagueWrapperActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import type { LeagueWrapper, PhaseResult } from '@/domain';
import { StandingsView } from './StandingsView';
import {
  groupsLeague,
  LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
  testUuid,
  scheduled,
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
  const phase = scheduled(wrapper.content.phases[0]);
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

    const first = scheduled(wrapper.content.phases[0]).fixtures[0];
    if (!first) throw new Error('expected a generated fixture');
    act(() => scorinateFixture(LEAGUE, first.id));

    const rows = dataRows();
    expect(rows.map((row) => row[2])).toEqual(['1', '1']);
    // Scorination is random: a win gives 3 points in total, a draw gives 2.
    const totalPoints = rows.reduce((sum, row) => sum + Number(pointsOf(row)), 0);
    expect([2, 3]).toContain(totalPoints);
    expect(screen.queryByText('No matches played yet.')).not.toBeInTheDocument();
  });

  describe('a Groups phase (Task 131, US-02.2, US-02.4)', () => {
    const SIX = [
      ...TEAMS,
      { name: 'FC Harbour', colour: '#6A1B9A' },
      { name: 'FC Valley', colour: '#F9A825' },
      { name: 'FC Dunes', colour: '#00838F' },
    ];
    const sixInTwo = (): LeagueWrapper =>
      groupsLeague(SIX, [
        [1, 2, 3],
        [4, 5, 6],
      ]);

    /** The cell texts of each data row of one group table. */
    function groupRows(name: string): string[][] {
      const table = screen.getByRole('table', { name });
      return within(table)
        .getAllByRole('row')
        .slice(1)
        .map((row) => Array.from(row.children).map((cell) => cell.textContent ?? ''));
    }

    it('shows one card for each group, in group order, with its name', () => {
      render(<StandingsView league={sixInTwo()} />);
      expect(
        screen.getAllByRole('table').map((t) => t.getAttribute('aria-label'))
      ).toEqual(['Group A', 'Group B']);
      expect(screen.getByText('Group A')).toBeInTheDocument();
      expect(screen.getByText('Group B')).toBeInTheDocument();
      expect(
        groupRows('Group A')
          .map((row) => row[1])
          .sort()
      ).toEqual(['FC Rivals', 'FC Town', 'FC United']);
      expect(
        groupRows('Group B')
          .map((row) => row[1])
          .sort()
      ).toEqual(['FC Dunes', 'FC Harbour', 'FC Valley']);
    });

    it('has the columns #, Team, W, D, L, GD, Pts (choice 5)', () => {
      render(<StandingsView league={sixInTwo()} />);
      const table = screen.getByRole('table', { name: 'Group A' });
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((cell) => cell.textContent)
      ).toEqual(['#', 'Team', 'W', 'D', 'L', 'GD', 'Pts']);
    });

    it('shows the MVP1 shared place for level teams', () => {
      render(<StandingsView league={sixInTwo()} />);
      expect(groupRows('Group A').map((row) => row[0])).toEqual(['1', '-', '-']);
    });

    it('counts only the results of the own group', () => {
      const wrapper = sixInTwo();
      const phase = scheduled(wrapper.content.phases[0]);
      const fixture = phase.fixtures.find(
        (candidate) => candidate.home === UNITED || candidate.away === UNITED
      );
      if (!fixture) throw new Error('expected a group A fixture');
      const played: LeagueWrapper = {
        ...wrapper,
        content: {
          ...wrapper.content,
          phases: [
            {
              ...phase,
              results: [score(fixture.id, fixture.home, fixture.away, 2, 0)],
            },
          ],
        },
      };
      render(<StandingsView league={played} />);

      expect(pointsOf(groupRows('Group A')[0])).toBe('3');
      expect(groupRows('Group B').map(pointsOf)).toEqual(['0', '0', '0']);
      expect(screen.queryByText('No matches played yet.')).not.toBeInTheDocument();
    });

    it('shows the advancement line under the cards', () => {
      render(
        <StandingsView
          league={sixInTwo()}
          advanceText="Top 2 of each group advance to the Bracket."
        />
      );
      expect(
        screen.getByText('Top 2 of each group advance to the Bracket.')
      ).toBeInTheDocument();
    });

    it('shows the phase at the given index', () => {
      const wrapper = league();
      render(<StandingsView league={wrapper} phaseIndex={0} />);
      expect(screen.getByRole('table', { name: 'Standings' })).toBeInTheDocument();
    });
  });

  describe('the qualifier tint (Task 132, US-02.2, US-07.2)', () => {
    const SIX = [
      ...TEAMS,
      { name: 'FC Harbour', colour: '#6A1B9A' },
      { name: 'FC Valley', colour: '#F9A825' },
      { name: 'FC Dunes', colour: '#00838F' },
    ];
    const tones = (name: string): (string | null)[] =>
      within(screen.getByRole('table', { name }))
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.getAttribute('data-tone'));

    it('tints the top N of each group, and place N + 1 lighter with a best M', () => {
      const wrapper = groupsLeague(
        SIX,
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        [
          {
            format: 'groups',
            legs: 'two-way',
            grouping: { by: 'count', count: 2 },
            advance: { top: 1, bestOfNext: 1 },
          },
          { format: 'bracket' },
        ]
      );
      render(<StandingsView league={wrapper} />);
      expect(tones('Group A')).toEqual(['positive', 'caution', null]);
      expect(tones('Group B')).toEqual(['positive', 'caution', null]);
    });

    it('tints the top N of a round robin that is not the last, with its line', () => {
      const base = league();
      const wrapper: LeagueWrapper = {
        ...base,
        content: {
          ...base.content,
          plans: [
            { format: 'round-robin', legs: 'two-way', advance: { top: 2 } },
            { format: 'bracket' },
          ],
        },
      };
      render(
        <StandingsView league={wrapper} advanceText="Top 2 advance to the Bracket." />
      );
      expect(tones('Standings')).toEqual(['positive', 'positive', null]);
      expect(screen.getByText('Top 2 advance to the Bracket.')).toBeInTheDocument();
    });

    it('tints nothing in the last phase', () => {
      render(<StandingsView league={league()} />);
      expect(tones('Standings')).toEqual([null, null, null]);
    });
  });
});
