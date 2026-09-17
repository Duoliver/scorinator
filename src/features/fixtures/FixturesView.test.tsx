import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { generateRoundRobin } from '@/engine/fixtures';
import { useTeamsStore } from '@/app/state/teamsStore';
import type { TeamRecord } from '@/features/components';
import type { LeagueRecord } from '@/features/leagues/types';
import { FixturesView } from './FixturesView';

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
  teams: [],
  fixtures: [],
  byes: [],
  ...overrides,
});

beforeEach(() => {
  useTeamsStore.setState({
    teams: [
      team({ slug: 'fc-united', name: 'FC United' }),
      team({ slug: 'fc-rivals', name: 'FC Rivals', colour: '#1E88E5' }),
      team({ slug: 'fc-town', name: 'FC Town', colour: '#2E7D32' }),
      team({ slug: 'fc-rangers', name: 'FC Rangers', colour: '#6A1B9A' }),
    ],
  });
});

describe('FixturesView', () => {
  it('shows an empty-state message when the league has no fixtures', () => {
    render(<FixturesView league={league()} />);

    expect(
      screen.getByText('Not enough teams to generate fixtures yet.')
    ).toBeInTheDocument();
  });

  it('renders matchday 1 by default, with the correct matches and team names', () => {
    const slugs = ['fc-united', 'fc-rivals', 'fc-town', 'fc-rangers'];
    const { fixtures, byes } = generateRoundRobin(slugs);
    render(<FixturesView league={league({ teams: [], fixtures, byes })} />);

    const totalMatchdays = Math.max(...fixtures.map((f) => f.matchday));
    expect(screen.getByText(`Matchday 1 / ${totalMatchdays}`)).toBeInTheDocument();

    const matchdayOne = fixtures.filter((f) => f.matchday === 1);
    expect(screen.getAllByText(/FC (United|Rivals|Town|Rangers)/)).toHaveLength(
      matchdayOne.length * 2
    );
  });

  it('disables Previous on matchday 1, and advances the header and matches on Next', async () => {
    const slugs = ['fc-united', 'fc-rivals', 'fc-town', 'fc-rangers'];
    const { fixtures, byes } = generateRoundRobin(slugs);
    render(<FixturesView league={league({ fixtures, byes })} />);

    expect(screen.getByRole('button', { name: /Previous matchday/ })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Next matchday/ }));

    const totalMatchdays = Math.max(...fixtures.map((f) => f.matchday));
    expect(screen.getByText(`Matchday 2 / ${totalMatchdays}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Previous matchday/ })).not.toBeDisabled();
  });

  it('disables Next on the last matchday', async () => {
    const slugs = ['fc-united', 'fc-rivals', 'fc-town', 'fc-rangers'];
    const { fixtures, byes } = generateRoundRobin(slugs);
    const totalMatchdays = Math.max(...fixtures.map((f) => f.matchday));
    render(<FixturesView league={league({ fixtures, byes })} />);

    for (let step = 1; step < totalMatchdays; step++) {
      await userEvent.click(screen.getByRole('button', { name: /Next matchday/ }));
    }

    expect(screen.getByText(`Matchday ${totalMatchdays} / ${totalMatchdays}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next matchday/ })).toBeDisabled();
  });

  it('shows a Bye row with the correct team, for an odd-team-count schedule', () => {
    const slugs = ['fc-united', 'fc-rivals', 'fc-town'];
    const { fixtures, byes } = generateRoundRobin(slugs);
    render(<FixturesView league={league({ fixtures, byes })} />);

    const byeOnMatchdayOne = byes.find((bye) => bye.matchday === 1);
    expect(byeOnMatchdayOne).toBeDefined();
    expect(screen.getByText('Bye')).toBeInTheDocument();
    const byeName = useTeamsStore
      .getState()
      .teams.find((t) => t.slug === byeOnMatchdayOne?.team)?.name;
    expect(screen.getByText(byeName ?? '')).toBeInTheDocument();
  });

  it('falls back to the raw slug when a team is no longer in the roster', () => {
    const { fixtures, byes } = generateRoundRobin(['fc-united', 'ghost-fc']);
    useTeamsStore.setState({ teams: [team({ slug: 'fc-united', name: 'FC United' })] });
    render(<FixturesView league={league({ fixtures, byes })} />);

    expect(screen.getByText('ghost-fc')).toBeInTheDocument();
  });
});
