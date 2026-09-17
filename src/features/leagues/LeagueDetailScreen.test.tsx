import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { LeagueDetailScreen } from './LeagueDetailScreen';
import { useLeagueStore } from '@/app/state/leagueStore';
import { generateRoundRobin } from '@/engine/fixtures';
import type { LeagueRecord } from '@/features/leagues/types';

const { fixtures, byes } = generateRoundRobin(['fc-united', 'fc-rivals']);

const league = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: true,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [
    { slug: 'fc-united', ovr: 70 },
    { slug: 'fc-rivals', ovr: 65 },
  ],
  fixtures,
  byes,
  ...overrides,
});

beforeEach(() => {
  useLeagueStore.setState({ leagues: [league()] });
});

describe('LeagueDetailScreen', () => {
  it('renders the league name and a meta summary line for a matching slug', () => {
    render(<LeagueDetailScreen slug="coastal-premier" />);
    expect(screen.getByRole('heading', { name: 'Coastal Premier' })).toBeInTheDocument();
    expect(screen.getByText(/2 teams/)).toBeInTheDocument();
    expect(screen.getByText(/Home adv\. on/)).toBeInTheDocument();
    expect(screen.getByText(/3\/1\/0 pts/)).toBeInTheDocument();
  });

  it('shows a not-found message for an unknown slug', () => {
    render(<LeagueDetailScreen slug="no-such-league" />);
    expect(screen.getByText('League not found.')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows the Standings tab by default', () => {
    render(<LeagueDetailScreen slug="coastal-premier" />);
    expect(
      screen.getByText(/Standings for this league will show here/)
    ).toBeInTheDocument();
  });

  it('switches to the Fixtures tab on click, showing the generated schedule', async () => {
    render(<LeagueDetailScreen slug="coastal-premier" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    expect(screen.getByText(/Matchday 1 \/ 2/)).toBeInTheDocument();
  });
});
