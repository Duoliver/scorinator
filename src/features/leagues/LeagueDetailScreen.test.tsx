import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { LeagueDetailScreen } from './LeagueDetailScreen';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useFileStore } from '@/app/state/fileStore';
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
  results: [],
  ...overrides,
});

beforeEach(() => {
  useFileStore.setState({
    currentLeagueSlug: null,
    paths: {},
    savedLeagues: {},
    status: null,
  });
  useLeagueStore.setState({ leagues: [league()] });
});

describe('LeagueDetailScreen', () => {
  it('renders the league name and a meta summary line for a matching slug', () => {
    render(<LeagueDetailScreen slug="coastal-premier" />);
    expect(
      screen.getByRole('heading', { name: 'Coastal Premier' })
    ).toBeInTheDocument();
    expect(screen.getByText(/2 teams/)).toBeInTheDocument();
    expect(screen.getByText(/Home adv\. on/)).toBeInTheDocument();
    expect(screen.getByText(/3\/1\/0 pts/)).toBeInTheDocument();
  });

  it('shows an Unsaved badge next to the title until the league is saved', () => {
    render(<LeagueDetailScreen slug="coastal-premier" />);
    expect(screen.getByText('Unsaved')).toBeInTheDocument();

    act(() => useFileStore.getState().markSaved(useLeagueStore.getState().leagues[0]));

    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
  });

  it('shows the Unsaved badge again after a scorinate in Fixtures', async () => {
    useFileStore.getState().markSaved(useLeagueStore.getState().leagues[0]);
    render(<LeagueDetailScreen slug="coastal-premier" />);
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Scorinate' })[0]!);

    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('makes the league on screen the current one for Ctrl+S', () => {
    render(<LeagueDetailScreen slug="coastal-premier" />);
    expect(useFileStore.getState().currentLeagueSlug).toBe('coastal-premier');
  });

  it('leaves the current league alone for an unknown slug', () => {
    render(<LeagueDetailScreen slug="no-such-league" />);
    expect(useFileStore.getState().currentLeagueSlug).toBeNull();
  });

  it('shows a not-found message for an unknown slug', () => {
    render(<LeagueDetailScreen slug="no-such-league" />);
    expect(screen.getByText('League not found.')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows the Standings tab by default, with one row per team', () => {
    render(<LeagueDetailScreen slug="coastal-premier" />);
    expect(screen.getByText('Pts')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('No matches played yet.')).toBeInTheDocument();
  });

  it('keeps the visible matchday when switching to Standings and back to Fixtures', async () => {
    render(<LeagueDetailScreen slug="coastal-premier" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    await userEvent.click(screen.getByRole('button', { name: /Next matchday/ }));
    expect(screen.getByText(/Matchday 2 \/ 2/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Standings' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));

    expect(screen.getByText(/Matchday 2 \/ 2/)).toBeInTheDocument();
  });

  it('shows a scorinated match in Standings after switching back from Fixtures', async () => {
    render(<LeagueDetailScreen slug="coastal-premier" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Scorinate' })[0]!);
    await userEvent.click(screen.getByRole('tab', { name: 'Standings' }));

    const played = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.children[2]?.textContent);
    expect(played).toEqual(['1', '1']);
    expect(screen.queryByText('No matches played yet.')).not.toBeInTheDocument();
  });

  it('updates Standings after a re-scorinate in Fixtures', async () => {
    useLeagueStore.setState({
      leagues: [
        league({ results: [{ ...fixtures[0], homeGoals: 99, awayGoals: 99 }] }),
      ],
    });
    render(<LeagueDetailScreen slug="coastal-premier" />);
    expect(screen.getAllByText('99')).not.toHaveLength(0);

    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    await userEvent.click(screen.getByRole('button', { name: 'Re-scorinate' }));
    await userEvent.click(screen.getByRole('tab', { name: 'Standings' }));

    expect(screen.queryByText('99')).not.toBeInTheDocument();
    const played = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.children[2]?.textContent);
    expect(played).toEqual(['1', '1']);
  });

  it('switches to the Fixtures tab on click, showing the generated schedule', async () => {
    render(<LeagueDetailScreen slug="coastal-premier" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    expect(screen.getByText(/Matchday 1 \/ 2/)).toBeInTheDocument();
  });
});
