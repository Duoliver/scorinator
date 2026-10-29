import type { JSX } from 'preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { scorinateMatchday } from '@/app/state/leagueWrapperActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import type { LeagueWrapper, Phase } from '@/domain';
import { FixturesView } from './FixturesView';
import {
  LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
} from '@/test/databaseRecords';

const ALL_TEAMS = [
  { name: 'FC United', colour: '#E53935' },
  { name: 'FC Rivals', colour: '#1E88E5' },
  { name: 'FC Town', colour: '#2E7D32' },
  { name: 'FC Rangers', colour: '#6A1B9A' },
];

type Score = { homeGoals: number; awayGoals: number };

/** A league of the first `teamCount` teams. Score `i` becomes the result
 * of fixture `i` of phase 1. */
function league(teamCount: number, scores: Score[] = []): LeagueWrapper {
  const wrapper = roundRobinLeague(ALL_TEAMS.slice(0, teamCount));
  const [phase] = wrapper.content.phases;
  const results = scores.map((score, i) => {
    const fixture = phase.fixtures[i];
    return { fixtureId: fixture.id, home: fixture.home, away: fixture.away, ...score };
  });
  return {
    ...wrapper,
    content: { ...wrapper.content, phases: [{ ...phase, results }] },
  };
}

/** Phase 1 of the league. */
function fixturesOf(wrapper: LeagueWrapper): Phase {
  return wrapper.content.phases[0];
}

/** Puts the league in the store, for a test that renders through
 * `FixturesViewFromStore`. */
function openLeague(teamCount: number, scores: Score[] = []): LeagueWrapper {
  return openTestLeague(league(teamCount, scores));
}

/** `FixturesView` reads `league` as a plain prop, the same way
 * `LeagueDetailScreen` passes it down in the real app: it holds no store
 * subscription of its own. A Scorinate click only becomes visible if
 * whatever renders `FixturesView` renders again with the fresh league from
 * the store, so the Scorinate tests render through this small harness, as
 * League Detail does. */
function FixturesViewFromStore(): JSX.Element | null {
  const found = useDatabaseStore((state) => state.leagues[LEAGUE]);
  return found ? <FixturesView league={found} /> : null;
}

beforeEach(() => {
  openTestDatabase();
});

describe('FixturesView', () => {
  it('shows an empty-state message when the league has no fixtures', () => {
    render(<FixturesView league={league(1)} />);

    expect(
      screen.getByText('Not enough teams to generate fixtures yet.')
    ).toBeInTheDocument();
  });

  it('renders matchday 1 by default, with the correct matches and team names', () => {
    const wrapper = league(4);
    const { fixtures } = fixturesOf(wrapper);
    render(<FixturesView league={wrapper} />);

    const totalMatchdays = Math.max(...fixtures.map((f) => f.matchday));
    expect(screen.getByText(`Matchday 1 / ${totalMatchdays}`)).toBeInTheDocument();

    const matchdayOne = fixtures.filter((f) => f.matchday === 1);
    expect(screen.getAllByText(/FC (United|Rivals|Town|Rangers)/)).toHaveLength(
      matchdayOne.length * 2
    );
  });

  it('disables Previous on matchday 1, and advances the header and matches on Next', async () => {
    const wrapper = league(4);
    render(<FixturesView league={wrapper} />);

    expect(screen.getByRole('button', { name: /Previous matchday/ })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Next matchday/ }));

    const totalMatchdays = Math.max(
      ...fixturesOf(wrapper).fixtures.map((f) => f.matchday)
    );
    expect(screen.getByText(`Matchday 2 / ${totalMatchdays}`)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Previous matchday/ })
    ).not.toBeDisabled();
  });

  it('opens on initialMatchday, and reports each matchday change through onMatchdayChange', async () => {
    const wrapper = league(4);
    const changes: number[] = [];
    render(
      <FixturesView
        league={wrapper}
        initialMatchday={2}
        onMatchdayChange={(next) => changes.push(next)}
      />
    );

    const totalMatchdays = Math.max(
      ...fixturesOf(wrapper).fixtures.map((f) => f.matchday)
    );
    expect(screen.getByText(`Matchday 2 / ${totalMatchdays}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Next matchday/ }));
    await userEvent.click(screen.getByRole('button', { name: /Previous matchday/ }));
    expect(changes).toEqual([3, 2]);
  });

  it('disables Next on the last matchday', async () => {
    const wrapper = league(4);
    const totalMatchdays = Math.max(
      ...fixturesOf(wrapper).fixtures.map((f) => f.matchday)
    );
    render(<FixturesView league={wrapper} />);

    for (let step = 1; step < totalMatchdays; step++) {
      await userEvent.click(screen.getByRole('button', { name: /Next matchday/ }));
    }

    expect(
      screen.getByText(`Matchday ${totalMatchdays} / ${totalMatchdays}`)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next matchday/ })).toBeDisabled();
  });

  it('shows a Bye row with the correct team, for an odd-team-count schedule', () => {
    const wrapper = league(3);
    render(<FixturesView league={wrapper} />);

    const byeOnMatchdayOne = fixturesOf(wrapper).byes.find((bye) => bye.matchday === 1);
    expect(byeOnMatchdayOne).toBeDefined();
    expect(screen.getByText('Bye')).toBeInTheDocument();
    const byeName = wrapper.teams.find(
      (team) => team.blueprintUuid === byeOnMatchdayOne?.team
    )?.name;
    expect(screen.getByText(byeName ?? '')).toBeInTheDocument();
  });

  it('falls back to the raw UUID when a fixture names a team with no Instance', () => {
    const wrapper = league(2);
    const [, ghost] = wrapper.teams;
    render(<FixturesView league={{ ...wrapper, teams: wrapper.teams.slice(0, 1) }} />);

    expect(screen.getByText(ghost.blueprintUuid)).toBeInTheDocument();
  });

  it('turns a match’s "vs" into a real score on Scorinate, and swaps its button for Re-scorinate', async () => {
    openLeague(2);
    render(<FixturesViewFromStore />);

    expect(screen.getByRole('button', { name: 'Scorinate' })).toBeInTheDocument();
    expect(screen.getByText('vs')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Scorinate' }));

    expect(screen.queryByRole('button', { name: 'Scorinate' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Re-scorinate' })).toBeInTheDocument();
    expect(screen.queryByText('vs')).not.toBeInTheDocument();
    expect(screen.getByText(/^\d+ - \d+$/)).toBeInTheDocument();
  });

  it('replaces a played score on Re-scorinate, and keeps exactly one score for the match', async () => {
    // 99-99 is far outside what the engine can draw, so a changed score proves the overwrite.
    openLeague(2, [{ homeGoals: 99, awayGoals: 99 }]);
    render(<FixturesViewFromStore />);
    expect(screen.getByText('99 - 99')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Re-scorinate' }));

    expect(screen.queryByText('99 - 99')).not.toBeInTheDocument();
    expect(screen.getAllByText(/^\d+ - \d+$/)).toHaveLength(1);
    const stored = useDatabaseStore.getState().leagues[LEAGUE];
    expect(stored?.content.phases[0]?.results).toHaveLength(1);
  });

  it('scorinates every remaining match on Scorinate matchday, then disables that button', async () => {
    openLeague(4);
    render(<FixturesViewFromStore />);

    expect(
      screen.getByRole('button', { name: 'Scorinate matchday' })
    ).not.toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Scorinate matchday' }));

    expect(screen.queryByRole('button', { name: 'Scorinate' })).not.toBeInTheDocument();
    expect(screen.queryByText('vs')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scorinate matchday' })).toBeDisabled();
  });

  describe('score flash', () => {
    const user = (): ReturnType<typeof userEvent.setup> =>
      userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('turns a new score green for 500ms, then back', async () => {
      openLeague(2);
      render(<FixturesViewFromStore />);

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
      openLeague(2, [{ homeGoals: 99, awayGoals: 99 }]);
      render(<FixturesViewFromStore />);
      expect(screen.getByText('99 - 99')).not.toHaveAttribute('data-flashing');

      await user().click(screen.getByRole('button', { name: 'Re-scorinate' }));

      expect(screen.getByText(/^\d+ - \d+$/)).toHaveAttribute('data-flashing');
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByText(/^\d+ - \d+$/)).not.toHaveAttribute('data-flashing');
    });

    it('flashes every score that Scorinate matchday generates', async () => {
      openLeague(4);
      render(<FixturesViewFromStore />);

      await user().click(screen.getByRole('button', { name: 'Scorinate matchday' }));

      const scores = screen.getAllByText(/^\d+ - \d+$/);
      expect(scores).toHaveLength(2);
      scores.forEach((score) => expect(score).toHaveAttribute('data-flashing'));
    });

    it('does not flash scores that already exist when the view opens or the matchday changes', async () => {
      openLeague(2, [{ homeGoals: 2, awayGoals: 1 }]);
      render(<FixturesViewFromStore />);
      expect(screen.getByText('2 - 1')).not.toHaveAttribute('data-flashing');

      await user().click(screen.getByRole('button', { name: /Next matchday/ }));
      await user().click(screen.getByRole('button', { name: /Previous matchday/ }));

      expect(screen.getByText('2 - 1')).not.toHaveAttribute('data-flashing');
    });
  });

  describe('matchday jump buttons', () => {
    // Four teams play six matchdays.
    let lastMatchday = 0;

    beforeEach(() => {
      const wrapper = openLeague(4);
      lastMatchday = Math.max(...fixturesOf(wrapper).fixtures.map((f) => f.matchday));
    });

    it('goes to the last and back to the first matchday, and reports both changes', async () => {
      const changes: number[] = [];
      const found = useDatabaseStore.getState().leagues[LEAGUE]!;
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
      render(<FixturesViewFromStore />);

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
      render(<FixturesViewFromStore />);
      expect(screen.queryByText('League completed')).not.toBeInTheDocument();
    });

    it('swaps Current matchday for a League completed badge once every match is played', () => {
      render(<FixturesViewFromStore />);
      act(() => {
        for (let matchday = 1; matchday <= lastMatchday; matchday += 1) {
          scorinateMatchday(LEAGUE, matchday);
        }
      });

      expect(
        screen.queryByRole('button', { name: 'Current matchday' })
      ).not.toBeInTheDocument();
      expect(screen.getByText('League completed')).toBeInTheDocument();
      // The first and last buttons stay available on a completed league.
      expect(screen.getByRole('button', { name: 'Last matchday' })).not.toBeDisabled();
    });

    it('gives the League completed badge a short Completed form for a compact header, hidden from screen readers', () => {
      render(<FixturesViewFromStore />);
      act(() => {
        for (let matchday = 1; matchday <= lastMatchday; matchday += 1) {
          scorinateMatchday(LEAGUE, matchday);
        }
      });

      expect(screen.getByText('League completed')).not.toHaveAttribute('aria-hidden');
      expect(screen.getByText('Completed')).toHaveAttribute('aria-hidden', 'true');
    });
  });
  describe('compact header on a narrow width (Task 35)', () => {
    // jsdom applies no container query, so these tests check the markup the
    // CSS relies on: stable accessible names, and the short text marked
    // aria-hidden. The narrow look itself needs a browser check.
    const renderView = (): LeagueWrapper => {
      const wrapper = league(4);
      render(<FixturesView league={wrapper} />);
      return wrapper;
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
      const wrapper = renderView();
      const total = Math.max(...fixturesOf(wrapper).fixtures.map((f) => f.matchday));
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

    it('shows each team its own goals after a result, hidden from screen readers', () => {
      openLeague(2, [{ homeGoals: 2, awayGoals: 1 }]);
      render(<FixturesViewFromStore />);

      expect(goals('home')).toHaveTextContent(/^2$/);
      expect(goals('away')).toHaveTextContent(/^1$/);
      expect(goals('home')).toHaveAttribute('aria-hidden', 'true');
      expect(goals('away')).toHaveAttribute('aria-hidden', 'true');
    });

    it('leaves both goals empty before a result, with no vs', () => {
      openLeague(2);
      render(<FixturesViewFromStore />);

      expect(goals('home')).toBeEmptyDOMElement();
      expect(goals('away')).toBeEmptyDOMElement();
    });

    it('puts the home goals in the home team block and the away goals in the away block', () => {
      const wrapper = openLeague(2, [{ homeGoals: 3, awayGoals: 0 }]);
      const [first] = fixturesOf(wrapper).fixtures;
      const nameOf = (uuid: string): string =>
        wrapper.teams.find((team) => team.blueprintUuid === uuid)?.name ?? '';
      render(<FixturesViewFromStore />);

      expect(goals('home').parentElement).toHaveTextContent(nameOf(first.home));
      expect(goals('away').parentElement).toHaveTextContent(nameOf(first.away));
    });

    it('flashes both goals with the score after a scorinate', async () => {
      openLeague(2);
      render(<FixturesViewFromStore />);

      await userEvent.click(screen.getByRole('button', { name: 'Scorinate' }));

      expect(screen.getByText(/^\d+ - \d+$/)).toHaveAttribute('data-flashing');
      expect(goals('home')).toHaveAttribute('data-flashing');
      expect(goals('away')).toHaveAttribute('data-flashing');
    });
  });
});
