import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { LeaguesDashboardScreen } from './LeaguesDashboardScreen';
import * as teamsFile from '@/app/data/teamsFile';
import { saveDatabase } from '@/app/state/databaseActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { useFileStore } from '@/app/state/fileStore';
import { scorinateMatchday } from '@/app/state/leagueWrapperActions';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import { ROUTES, leagueDetailPath } from '@/app/routes';
import type { LeagueWrapper } from '@/domain';
import {
  LEAGUE,
  OTHER_LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
} from '@/test/databaseRecords';

const coastal = (): LeagueWrapper =>
  roundRobinLeague([{ name: 'FC United', colour: '#E53935' }], {
    homeAdvantage: true,
  });

const ironValley = (): LeagueWrapper =>
  roundRobinLeague([], {
    uuid: OTHER_LEAGUE,
    name: 'Iron Valley Cup',
    homeAdvantage: false,
  });

/** Puts manifest rows in the store for leagues that are not open, as a new
 * session finds them. */
function storeRows(...wrappers: LeagueWrapper[]): void {
  const rows = wrappers.map(summarizeLeague);
  useDatabaseStore.setState({ rows, savedRows: rows });
}

beforeEach(() => {
  vi.restoreAllMocks();
  openTestDatabase([]);
  useFileStore.setState({ status: null });
});

describe('LeaguesDashboardScreen', () => {
  it('shows the empty state and hides + New League when there are no leagues', () => {
    render(<LeaguesDashboardScreen />);
    expect(screen.getByText('No leagues yet.')).toBeInTheDocument();
    expect(screen.getByText('0 leagues running')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '+ New League' })
    ).not.toBeInTheDocument();
  });

  it('uses the singular for one league', () => {
    storeRows(coastal());
    render(<LeaguesDashboardScreen />);
    expect(screen.getByText('1 league running')).toBeInTheDocument();
  });

  it('offers + New League once a league exists', () => {
    storeRows(coastal());
    render(<LeaguesDashboardScreen />);
    expect(screen.getByRole('link', { name: '+ New League' })).toHaveAttribute(
      'href',
      ROUTES.leaguesNew
    );
  });

  describe('empty state', () => {
    it('links Create teams to Teams and Create league to the wizard', () => {
      render(<LeaguesDashboardScreen />);
      expect(screen.getByRole('link', { name: 'Create teams' })).toHaveAttribute(
        'href',
        ROUTES.teams
      );
      expect(screen.getByRole('link', { name: 'Create league' })).toHaveAttribute(
        'href',
        ROUTES.leaguesNew
      );
    });

    it('loads teams from one CSV-or-JSON dialog into the Blueprints', async () => {
      vi.spyOn(teamsFile, 'importTeamsFile').mockResolvedValue([
        { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      ]);
      render(<LeaguesDashboardScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Load teams...' }));

      expect(useDatabaseStore.getState().blueprints.map((team) => team.slug)).toEqual([
        'fc-united',
      ]);
      expect(useFileStore.getState().status).toEqual({
        tone: 'info',
        message: 'Imported 1 team: 1 new, 0 updated.',
      });
    });

    it('has no Load league button: leagues live in the database (Task 161)', () => {
      render(<LeaguesDashboardScreen />);
      expect(
        screen.queryByRole('button', { name: 'Load league...' })
      ).not.toBeInTheDocument();
    });
  });

  it('renders one card per manifest row, with its name, meta line, and points pill, and opens no league', () => {
    storeRows(coastal(), ironValley());
    render(<LeaguesDashboardScreen />);

    expect(screen.getByText('2 leagues running')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Coastal Premier' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Iron Valley Cup' })
    ).toBeInTheDocument();
    expect(screen.getByText(/1 team · Home adv\. on/)).toBeInTheDocument();
    expect(screen.getByText(/0 teams · Home adv\. off/)).toBeInTheDocument();
    expect(screen.getAllByText('3/1/0 pts')).toHaveLength(2);
    expect(useDatabaseStore.getState().leagues).toEqual({});
  });

  it('shows an Unsaved badge on a league with unsaved changes, and on no other', () => {
    openTestLeague(coastal());
    openTestLeague(
      roundRobinLeague(
        [
          { name: 'FC United', colour: '#E53935' },
          { name: 'FC Rivals', colour: '#1E88E5' },
        ],
        { uuid: OTHER_LEAGUE, name: 'Iron Valley Cup' }
      )
    );
    scorinateMatchday(OTHER_LEAGUE, 1);
    render(<LeaguesDashboardScreen />);

    expect(screen.getAllByText('Unsaved')).toHaveLength(1);
    const unsavedCard = screen.getByRole('heading', {
      name: 'Iron Valley Cup',
    }).parentElement!;
    expect(within(unsavedCard).getByText('Unsaved')).toBeInTheDocument();
  });

  it('drops the Unsaved badge once the database is saved', async () => {
    openTestLeague(
      roundRobinLeague([
        { name: 'FC United', colour: '#E53935' },
        { name: 'FC Rivals', colour: '#1E88E5' },
      ])
    );
    scorinateMatchday(LEAGUE, 1);
    render(<LeaguesDashboardScreen />);
    expect(screen.getByText('Unsaved')).toBeInTheDocument();

    await act(() => saveDatabase());

    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
  });

  it("links each card to that league's detail page, by UUID", () => {
    storeRows(coastal());
    render(<LeaguesDashboardScreen />);
    expect(screen.getByRole('link', { name: 'Open standings' })).toHaveAttribute(
      'href',
      leagueDetailPath(LEAGUE)
    );
    expect(leagueDetailPath(LEAGUE)).toBe(`/leagues/${LEAGUE}`);
  });
});
