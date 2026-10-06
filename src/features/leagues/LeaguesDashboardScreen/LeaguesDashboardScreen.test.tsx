import { beforeEach, describe, expect, it, vi } from 'vitest';
import { markLeagueSaved } from '@/app/state/fileActions';
import { act, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { LeaguesDashboardScreen } from './LeaguesDashboardScreen';
import * as leagueFile from '@/app/data/leagueFile';
import * as teamsFile from '@/app/data/teamsFile';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';
import { ROUTES, leagueDetailPath } from '@/app/routes';
import type { LeagueRecord } from '@/features/leagues/types';

const league = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: true,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [{ slug: 'fc-united', ovr: 70 }],
  fixtures: [],
  byes: [],
  results: [],
  ...overrides,
});

beforeEach(() => {
  vi.restoreAllMocks();
  useLeagueStore.setState({ leagues: [] });
  useTeamsStore.setState({ teams: [] });
  useFileStore.setState({
    currentLeagueSlug: null,
    paths: {},
    savedLeagues: {},
    status: null,
  });
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

  it('offers + New League once a league exists', () => {
    useLeagueStore.setState({ leagues: [league()] });
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

    it('loads teams from one CSV-or-JSON dialog and merges them into the roster', async () => {
      vi.spyOn(teamsFile, 'importTeamsFile').mockResolvedValue([
        { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      ]);
      render(<LeaguesDashboardScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Load teams...' }));

      expect(useTeamsStore.getState().teams.map((team) => team.slug)).toEqual([
        'fc-united',
      ]);
      expect(useFileStore.getState().status).toEqual({
        tone: 'info',
        message: 'Imported 1 team.',
      });
    });

    it('loads a league, and the dashboard then lists it', async () => {
      vi.spyOn(leagueFile, 'loadLeagueFile').mockResolvedValue({
        path: '/saves/coastal.json',
        league: league(),
        teams: [{ slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' }],
      });
      render(<LeaguesDashboardScreen />);

      await userEvent.click(screen.getByRole('button', { name: 'Load league...' }));

      expect(await screen.findByText('Coastal Premier')).toBeInTheDocument();
      expect(screen.queryByText('No leagues yet.')).not.toBeInTheDocument();
      expect(useFileStore.getState().currentLeagueSlug).toBe('coastal-premier');
    });

    it('does not show the empty state actions once a league exists', () => {
      useLeagueStore.setState({ leagues: [league()] });
      render(<LeaguesDashboardScreen />);
      expect(
        screen.queryByRole('button', { name: 'Load league...' })
      ).not.toBeInTheDocument();
    });
  });

  it('renders one card per league, with its name, meta line, and points pill', () => {
    useLeagueStore.setState({
      leagues: [
        league(),
        league({
          slug: 'iron-valley-cup',
          name: 'Iron Valley Cup',
          homeAdvantage: false,
          teams: [],
        }),
      ],
    });
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
  });

  it('shows an Unsaved badge on a league with unsaved changes, and on no other', () => {
    const saved = league();
    const unsaved = league({ slug: 'iron-valley-cup', name: 'Iron Valley Cup' });
    useLeagueStore.setState({ leagues: [saved, unsaved] });
    markLeagueSaved(saved);
    render(<LeaguesDashboardScreen />);

    expect(screen.getAllByText('Unsaved')).toHaveLength(1);
    const unsavedCard = screen.getByRole('heading', {
      name: 'Iron Valley Cup',
    }).parentElement!;
    expect(within(unsavedCard).getByText('Unsaved')).toBeInTheDocument();
  });

  it('drops the Unsaved badge once the league is saved', () => {
    const open = league();
    useLeagueStore.setState({ leagues: [open] });
    render(<LeaguesDashboardScreen />);
    expect(screen.getByText('Unsaved')).toBeInTheDocument();

    act(() => markLeagueSaved(open));

    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
  });

  it("links each card to that league's detail page", () => {
    useLeagueStore.setState({ leagues: [league()] });
    render(<LeaguesDashboardScreen />);
    expect(screen.getByRole('link', { name: 'Open standings' })).toHaveAttribute(
      'href',
      leagueDetailPath('coastal-premier')
    );
  });
});
