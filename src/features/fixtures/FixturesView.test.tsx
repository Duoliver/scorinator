import type { JSX } from 'preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { generateRoundRobin } from '@/engine/fixtures';
import { useTeamsStore } from '@/app/state/teamsStore';
import { useLeagueStore } from '@/app/state/leagueStore';
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
  results: [],
  ...overrides,
});

/** `FixturesView` reads `league` as a plain prop, the same way
 * `LeagueDetailScreen` passes it down in the real app — it holds no store
 * subscription of its own. A Scorinate click only becomes visible if
 * whatever renders `FixturesView` re-renders with the store's fresh
 * league object, so the two Scorinate tests below render through this
 * small harness instead, mirroring `LeagueDetailScreen`'s own lookup. */
function FixturesViewFromStore({ slug }: { slug: string }): JSX.Element | null {
  const found = useLeagueStore((state) => state.leagues.find((l) => l.slug === slug));
  return found ? <FixturesView league={found} /> : null;
}

beforeEach(() => {
  useLeagueStore.setState({ leagues: [] });
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
    expect(
      screen.getByRole('button', { name: /Previous matchday/ })
    ).not.toBeDisabled();
  });

  it('opens on initialMatchday, and reports each matchday change through onMatchdayChange', async () => {
    const slugs = ['fc-united', 'fc-rivals', 'fc-town', 'fc-rangers'];
    const { fixtures, byes } = generateRoundRobin(slugs);
    const changes: number[] = [];
    render(
      <FixturesView
        league={league({ fixtures, byes })}
        initialMatchday={2}
        onMatchdayChange={(next) => changes.push(next)}
      />
    );

    const totalMatchdays = Math.max(...fixtures.map((f) => f.matchday));
    expect(screen.getByText(`Matchday 2 / ${totalMatchdays}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Next matchday/ }));
    await userEvent.click(screen.getByRole('button', { name: /Previous matchday/ }));
    expect(changes).toEqual([3, 2]);
  });

  it('disables Next on the last matchday', async () => {
    const slugs = ['fc-united', 'fc-rivals', 'fc-town', 'fc-rangers'];
    const { fixtures, byes } = generateRoundRobin(slugs);
    const totalMatchdays = Math.max(...fixtures.map((f) => f.matchday));
    render(<FixturesView league={league({ fixtures, byes })} />);

    for (let step = 1; step < totalMatchdays; step++) {
      await userEvent.click(screen.getByRole('button', { name: /Next matchday/ }));
    }

    expect(
      screen.getByText(`Matchday ${totalMatchdays} / ${totalMatchdays}`)
    ).toBeInTheDocument();
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

  it('turns a match’s "vs" into a real score on Scorinate, and swaps its button for Re-scorinate', async () => {
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
    render(<FixturesViewFromStore slug="coastal-premier" />);

    expect(screen.getByRole('button', { name: 'Scorinate' })).toBeInTheDocument();
    expect(screen.getByText('vs')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Scorinate' }));

    expect(screen.queryByRole('button', { name: 'Scorinate' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Re-scorinate' })).toBeInTheDocument();
    expect(screen.queryByText('vs')).not.toBeInTheDocument();
    expect(screen.getByText(/^\d+ - \d+$/)).toBeInTheDocument();
  });

  it('replaces a played score on Re-scorinate, and keeps exactly one score for the match', async () => {
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
          // 99-99 is far outside what the engine can draw, so a changed score proves the overwrite.
          results: [{ ...fixtures[0], homeGoals: 99, awayGoals: 99 }],
        }),
      ],
    });
    render(<FixturesViewFromStore slug="coastal-premier" />);
    expect(screen.getByText('99 - 99')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Re-scorinate' }));

    expect(screen.queryByText('99 - 99')).not.toBeInTheDocument();
    expect(screen.getAllByText(/^\d+ - \d+$/)).toHaveLength(1);
    expect(useLeagueStore.getState().leagues[0].results).toHaveLength(1);
  });

  it('scorinates every remaining match on Scorinate matchday, then disables that button', async () => {
    const { fixtures, byes } = generateRoundRobin([
      'fc-united',
      'fc-rivals',
      'fc-town',
      'fc-rangers',
    ]);
    useLeagueStore.setState({
      leagues: [
        league({
          teams: [
            { slug: 'fc-united', ovr: 70 },
            { slug: 'fc-rivals', ovr: 65 },
            { slug: 'fc-town', ovr: 60 },
            { slug: 'fc-rangers', ovr: 55 },
          ],
          fixtures,
          byes,
        }),
      ],
    });
    render(<FixturesViewFromStore slug="coastal-premier" />);

    expect(
      screen.getByRole('button', { name: 'Scorinate matchday' })
    ).not.toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Scorinate matchday' }));

    expect(screen.queryByRole('button', { name: 'Scorinate' })).not.toBeInTheDocument();
    expect(screen.queryByText('vs')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scorinate matchday' })).toBeDisabled();
  });

  describe('score flash', () => {
    const twoTeams = (results: LeagueRecord['results'] = []): void => {
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
            results: results.map((result, i) => ({ ...fixtures[i], ...result })),
          }),
        ],
      });
    };
    const user = (): ReturnType<typeof userEvent.setup> =>
      userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('turns a new score green for 500ms, then back', async () => {
      twoTeams();
      render(<FixturesViewFromStore slug="coastal-premier" />);

      await user().click(screen.getByRole('button', { name: 'Scorinate' }));

      const score = screen.getByText(/^\d+ - \d+$/);
      expect(score).toHaveAttribute('data-flashing');
      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(score).toHaveAttribute('data-flashing');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(score).not.toHaveAttribute('data-flashing');
    });

    it('turns a re-scorinated score green too', async () => {
      twoTeams([{ homeGoals: 99, awayGoals: 99 } as LeagueRecord['results'][number]]);
      render(<FixturesViewFromStore slug="coastal-premier" />);
      expect(screen.getByText('99 - 99')).not.toHaveAttribute('data-flashing');

      await user().click(screen.getByRole('button', { name: 'Re-scorinate' }));

      expect(screen.getByText(/^\d+ - \d+$/)).toHaveAttribute('data-flashing');
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByText(/^\d+ - \d+$/)).not.toHaveAttribute('data-flashing');
    });

    it('flashes every score that Scorinate matchday generates', async () => {
      const { fixtures, byes } = generateRoundRobin([
        'fc-united',
        'fc-rivals',
        'fc-town',
        'fc-rangers',
      ]);
      useLeagueStore.setState({
        leagues: [
          league({
            teams: [
              { slug: 'fc-united', ovr: 70 },
              { slug: 'fc-rivals', ovr: 65 },
              { slug: 'fc-town', ovr: 60 },
              { slug: 'fc-rangers', ovr: 55 },
            ],
            fixtures,
            byes,
          }),
        ],
      });
      render(<FixturesViewFromStore slug="coastal-premier" />);

      await user().click(screen.getByRole('button', { name: 'Scorinate matchday' }));

      const scores = screen.getAllByText(/^\d+ - \d+$/);
      expect(scores).toHaveLength(2);
      scores.forEach((score) => expect(score).toHaveAttribute('data-flashing'));
    });

    it('does not flash scores that already exist when the view opens or the matchday changes', async () => {
      twoTeams([{ homeGoals: 2, awayGoals: 1 } as LeagueRecord['results'][number]]);
      render(<FixturesViewFromStore slug="coastal-premier" />);
      expect(screen.getByText('2 - 1')).not.toHaveAttribute('data-flashing');

      await user().click(screen.getByRole('button', { name: /Next matchday/ }));
      await user().click(screen.getByRole('button', { name: /Previous matchday/ }));

      expect(screen.getByText('2 - 1')).not.toHaveAttribute('data-flashing');
    });
  });

  describe('matchday jump buttons', () => {
    const slugs = ['fc-united', 'fc-rivals', 'fc-town', 'fc-rangers'];
    // Four teams play six matchdays.
    const { fixtures, byes } = generateRoundRobin(slugs);
    const lastMatchday = Math.max(...fixtures.map((f) => f.matchday));

    beforeEach(() => {
      useLeagueStore.setState({
        leagues: [
          league({
            teams: slugs.map((slug) => ({ slug, ovr: 60 })),
            fixtures,
            byes,
          }),
        ],
      });
    });

    it('goes to the last and back to the first matchday, and reports both changes', async () => {
      const changes: number[] = [];
      const found = useLeagueStore.getState().leagues[0]!;
      render(
        <FixturesView league={found} onMatchdayChange={(next) => changes.push(next)} />
      );

      expect(screen.getByRole('button', { name: 'First matchday' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Last matchday' })).not.toBeDisabled();

      await userEvent.click(screen.getByRole('button', { name: 'Last matchday' }));
      expect(
        screen.getByText(`Matchday ${lastMatchday} / ${lastMatchday}`)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last matchday' })).toBeDisabled();

      await userEvent.click(screen.getByRole('button', { name: 'First matchday' }));
      expect(screen.getByText(`Matchday 1 / ${lastMatchday}`)).toBeInTheDocument();
      expect(changes).toEqual([lastMatchday, 1]);
    });

    it('jumps back to the first unplayed matchday on Current matchday', async () => {
      render(<FixturesViewFromStore slug="coastal-premier" />);

      // Nothing played yet: matchday 1 is current, so the button has nothing to do.
      expect(screen.getByRole('button', { name: 'Current matchday' })).toBeDisabled();

      await userEvent.click(screen.getByRole('button', { name: 'Scorinate matchday' }));
      await userEvent.click(screen.getByRole('button', { name: 'Last matchday' }));
      expect(
        screen.getByRole('button', { name: 'Current matchday' })
      ).not.toBeDisabled();

      await userEvent.click(screen.getByRole('button', { name: 'Current matchday' }));
      expect(screen.getByText(`Matchday 2 / ${lastMatchday}`)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Current matchday' })).toBeDisabled();
    });

    it('shows no League completed badge while matches remain', () => {
      render(<FixturesViewFromStore slug="coastal-premier" />);
      expect(screen.queryByText('League completed')).not.toBeInTheDocument();
    });

    it('swaps Current matchday for a League completed badge once every match is played', () => {
      render(<FixturesViewFromStore slug="coastal-premier" />);
      act(() => {
        for (let matchday = 1; matchday <= lastMatchday; matchday += 1) {
          useLeagueStore.getState().scorinateMatchday('coastal-premier', matchday);
        }
      });

      expect(
        screen.queryByRole('button', { name: 'Current matchday' })
      ).not.toBeInTheDocument();
      expect(screen.getByText('League completed')).toBeInTheDocument();
      // The first and last buttons stay available on a completed league.
      expect(screen.getByRole('button', { name: 'Last matchday' })).not.toBeDisabled();
    });
  });
  describe('compact header on a narrow width (Task 35)', () => {
    // jsdom applies no container query, so these tests check the markup the
    // CSS relies on: stable accessible names, and the short text marked
    // aria-hidden. The narrow look itself needs a browser check.
    const slugs = ['fc-united', 'fc-rivals', 'fc-town', 'fc-rangers'];
    const { fixtures, byes } = generateRoundRobin(slugs);

    const renderView = (): void => {
      useLeagueStore.setState({
        leagues: [
          league({ teams: slugs.map((slug) => ({ slug, ovr: 60 })), fixtures, byes }),
        ],
      });
      render(<FixturesView league={useLeagueStore.getState().leagues[0]!} />);
    };

    it('gives the four text buttons a full accessible name that does not depend on the visible label', () => {
      renderView();
      for (const name of [
        'Previous matchday',
        'Next matchday',
        'Current matchday',
        'Scorinate matchday',
      ]) {
        expect(screen.getByRole('button', { name })).toHaveAttribute(
          'aria-label',
          name
        );
      }
    });

    it('hides the arrows of Previous and Next from screen readers', () => {
      renderView();
      for (const name of ['Previous matchday', 'Next matchday']) {
        const arrow = screen
          .getByRole('button', { name })
          .querySelector('[aria-hidden="true"]');
        expect(arrow?.textContent).toMatch(/[←→]/);
      }
    });

    it('keeps the full counter for screen readers, and marks the short counter aria-hidden', () => {
      renderView();
      const total = Math.max(...fixtures.map((f) => f.matchday));
      expect(screen.getByText(`Matchday 1 / ${total}`)).not.toHaveAttribute(
        'aria-hidden'
      );
      expect(screen.getByText(`1 / ${total}`)).toHaveAttribute('aria-hidden', 'true');
    });
  });
  describe('per-team goals for the stacked match row (Task 39)', () => {
    // jsdom applies no container query, so these tests check the markup the
    // stacked layout relies on. The layout itself needs a browser check.
    const goals = (side: 'home' | 'away'): HTMLElement =>
      document.querySelector(`[data-goals="${side}"]`) as HTMLElement;

    const twoTeamLeague = (results: LeagueRecord['results'] = []): void => {
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
            results: results.map((result, i) => ({ ...fixtures[i], ...result })),
          }),
        ],
      });
    };

    it('shows each team its own goals after a result, hidden from screen readers', () => {
      twoTeamLeague([
        { homeGoals: 2, awayGoals: 1 } as LeagueRecord['results'][number],
      ]);
      render(<FixturesViewFromStore slug="coastal-premier" />);

      expect(goals('home')).toHaveTextContent(/^2$/);
      expect(goals('away')).toHaveTextContent(/^1$/);
      expect(goals('home')).toHaveAttribute('aria-hidden', 'true');
      expect(goals('away')).toHaveAttribute('aria-hidden', 'true');
    });

    it('leaves both goals empty before a result, with no vs', () => {
      twoTeamLeague();
      render(<FixturesViewFromStore slug="coastal-premier" />);

      expect(goals('home')).toBeEmptyDOMElement();
      expect(goals('away')).toBeEmptyDOMElement();
    });

    it('puts the home goals in the home team block and the away goals in the away block', () => {
      twoTeamLeague([
        { homeGoals: 3, awayGoals: 0 } as LeagueRecord['results'][number],
      ]);
      render(<FixturesViewFromStore slug="coastal-premier" />);

      expect(goals('home').parentElement).toHaveTextContent('FC United');
      expect(goals('away').parentElement).toHaveTextContent('FC Rivals');
    });

    it('flashes both goals with the score after a scorinate', async () => {
      twoTeamLeague();
      render(<FixturesViewFromStore slug="coastal-premier" />);

      await userEvent.click(screen.getByRole('button', { name: 'Scorinate' }));

      expect(screen.getByText(/^\d+ - \d+$/)).toHaveAttribute('data-flashing');
      expect(goals('home')).toHaveAttribute('data-flashing');
      expect(goals('away')).toHaveAttribute('data-flashing');
    });
  });
});
