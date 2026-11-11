import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { LeaguesDashboardScreen } from './LeaguesDashboardScreen';
import * as exportFile from '@/app/data/exportFile';
import * as teamsFile from '@/app/data/teamsFile';
import { saveDatabase } from '@/app/state/databaseActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { useStatusLineStore } from '@/app/state/statusLineStore';
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
  leagueWrapper,
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
  useStatusLineStore.setState({ status: null });
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
      const dialog = await screen.findByRole('dialog', { name: 'Import teams?' });
      expect(dialog).toHaveAccessibleDescription('1 new, 0 updated. Continue?');
      expect(useDatabaseStore.getState().blueprints).toEqual([]);
      await userEvent.click(within(dialog).getByRole('button', { name: 'Import' }));

      expect(useDatabaseStore.getState().blueprints.map((team) => team.slug)).toEqual([
        'fc-united',
      ]);
      expect(useStatusLineStore.getState().status).toEqual({
        tone: 'info',
        message: 'Imported 1 team: 1 new, 0 updated.',
      });
    });

    it('changes nothing on Cancel in the import confirm', async () => {
      vi.spyOn(teamsFile, 'importTeamsFile').mockResolvedValue([
        { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      ]);
      render(<LeaguesDashboardScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Load teams...' }));
      const dialog = await screen.findByRole('dialog', { name: 'Import teams?' });
      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      expect(
        screen.queryByRole('dialog', { name: 'Import teams?' })
      ).not.toBeInTheDocument();
      expect(useDatabaseStore.getState().blueprints).toEqual([]);
      expect(useStatusLineStore.getState().status).toBeNull();
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

  it('shows the progress badge of each card (Task 131 choice 4, US-01.2)', () => {
    const twoTeams = roundRobinLeague([
      { name: 'FC United', colour: '#E53935' },
      { name: 'FC Rivals', colour: '#1E88E5' },
    ]);
    storeRows(twoTeams, ironValley());
    render(<LeaguesDashboardScreen />);

    // The heading sits in the name block of the title row.
    const card = (name: string): HTMLElement =>
      screen.getByRole('heading', { name }).parentElement!.parentElement!;
    expect(within(card('Coastal Premier')).getByText('MD 1/2')).toBeInTheDocument();
    expect(within(card('Iron Valley Cup')).getByText('Complete')).toBeInTheDocument();
  });

  it('shows the phase formats on the card (Task 131, US-01.2)', () => {
    const row = summarizeLeague(coastal());
    const rows = [
      { ...row, phases: [{ format: 'round-robin', legs: 'single-duels' } as const] },
      {
        ...row,
        uuid: OTHER_LEAGUE,
        name: 'Continental Shield',
        teamCount: 16,
        phases: [
          { format: 'groups', legs: 'two-way' } as const,
          { format: 'bracket' } as const,
        ],
      },
    ];
    useDatabaseStore.setState({ rows, savedRows: rows });
    render(<LeaguesDashboardScreen />);

    expect(
      screen.getByText('Round robin (single duels) · 1 team · Home adv. on')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Group Stage → Bracket · 16 teams · Home adv. on')
    ).toBeInTheDocument();
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

describe('LeaguesDashboardScreen: Import league (US-10.3, Task 149)', () => {
  it('imports from the header button, beside + New League', async () => {
    openTestLeague(coastal());
    vi.spyOn(exportFile, 'openLeagueImportFile').mockResolvedValue({
      leagues: [leagueWrapper([], OTHER_LEAGUE)],
      blueprints: [],
    });
    render(<LeaguesDashboardScreen />);

    await userEvent.click(screen.getByRole('button', { name: 'Import league...' }));

    expect(await screen.findByText('2 leagues running')).toBeInTheDocument();
    expect(useStatusLineStore.getState().status?.message).toBe('1 league imported.');
  });

  it('opens the picker for a file with many leagues', async () => {
    openTestLeague(coastal());
    vi.spyOn(exportFile, 'openLeagueImportFile').mockResolvedValue({
      leagues: [
        leagueWrapper([], OTHER_LEAGUE),
        leagueWrapper([], '00000000-0000-4000-8000-0000000000b3'),
      ],
      blueprints: [],
    });
    render(<LeaguesDashboardScreen />);

    await userEvent.click(screen.getByRole('button', { name: 'Import league...' }));

    expect(
      await screen.findByRole('dialog', { name: 'Import leagues' })
    ).toBeInTheDocument();
  });

  it('imports from the empty state, then shows the league (choice 8)', async () => {
    vi.spyOn(exportFile, 'openLeagueImportFile').mockResolvedValue({
      leagues: [leagueWrapper([], OTHER_LEAGUE)],
      blueprints: [],
    });
    render(<LeaguesDashboardScreen />);

    await userEvent.click(screen.getByRole('button', { name: 'Import league...' }));

    expect(await screen.findByText('1 league running')).toBeInTheDocument();
    expect(screen.queryByText('No leagues yet.')).not.toBeInTheDocument();
  });
});
