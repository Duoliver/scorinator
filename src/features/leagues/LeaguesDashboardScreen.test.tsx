import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { LeaguesDashboardScreen } from './LeaguesDashboardScreen';
import { useLeagueStore } from '@/app/state/leagueStore';
import { ROUTES, leagueDetailPath } from '@/app/routes';
import type { LeagueRecord } from '@/features/leagues/types';

const league = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: true,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [{ slug: 'fc-united', ovr: 70 }],
  ...overrides,
});

beforeEach(() => {
  useLeagueStore.setState({ leagues: [] });
});

describe('LeaguesDashboardScreen', () => {
  it('shows an empty message and still offers + New League when there are no leagues', () => {
    render(<LeaguesDashboardScreen />);
    expect(screen.getByText('No leagues yet.')).toBeInTheDocument();
    expect(screen.getByText('0 leagues running')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+ New League' })).toHaveAttribute(
      'href',
      ROUTES.leaguesNew
    );
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
    expect(screen.getByRole('heading', { name: 'Coastal Premier' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Iron Valley Cup' })).toBeInTheDocument();
    expect(screen.getByText(/1 team · Home adv\. on/)).toBeInTheDocument();
    expect(screen.getByText(/0 teams · Home adv\. off/)).toBeInTheDocument();
    expect(screen.getAllByText('3/1/0 pts')).toHaveLength(2);
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
