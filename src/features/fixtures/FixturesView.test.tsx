import type { JSX } from 'preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { scorinateMatchday, startNextPhase } from '@/app/state/leagueWrapperActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import type { LeagueWrapper, ScheduledPhase } from '@/domain';
import { FixturesView } from './FixturesView';
import {
  groupsLeague,
  LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
  scheduled,
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
  const phase = scheduled(wrapper.content.phases[0]);
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
function fixturesOf(wrapper: LeagueWrapper): ScheduledPhase {
  return scheduled(wrapper.content.phases[0]);
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

  describe('a Groups phase (Task 131 choice 6, US-02.2)', () => {
    const SEVEN = [
      ...ALL_TEAMS,
      { name: 'FC Harbour', colour: '#00838F' },
      { name: 'FC Valley', colour: '#F9A825' },
      { name: 'FC Dunes', colour: '#5D4037' },
    ];

    /** The group tags in page order: the match rows, then the bye lines. */
    const tags = (): string[] =>
      screen.getAllByText(/^Group [A-Z]+$/).map((tag) => tag.textContent ?? '');

    function GroupsFromStore(): JSX.Element | null {
      const found = useDatabaseStore((state) => state.leagues[LEAGUE]);
      return found ? <FixturesView league={found} /> : null;
    }

    it('gives each match its group tag, in group order', () => {
      const wrapper = groupsLeague(SEVEN.slice(0, 4), [
        [3, 4],
        [1, 2],
      ]);
      render(<FixturesView league={wrapper} />);
      expect(tags()).toEqual(['Group A', 'Group B']);
      expect(screen.getAllByRole('button', { name: 'Scorinate' })).toHaveLength(2);
    });

    it('shows one bye line for each group with a bye, with its tag', () => {
      const wrapper = groupsLeague(SEVEN.slice(0, 6), [
        [1, 2, 3],
        [4, 5, 6],
      ]);
      render(<FixturesView league={wrapper} />);

      expect(screen.getAllByText('Bye')).toHaveLength(2);
      expect(tags()).toEqual(['Group A', 'Group B', 'Group A', 'Group B']);
      const phase = scheduled(wrapper.content.phases[0]);
      for (const bye of phase.byes.filter((candidate) => candidate.matchday === 1)) {
        const name = wrapper.teams.find(
          (team) => team.blueprintUuid === bye.team
        )?.name;
        expect(screen.getByText(name ?? '')).toBeInTheDocument();
      }
    });

    it('leaves out a group with no match on the matchday', async () => {
      const wrapper = groupsLeague(SEVEN.slice(0, 6), [
        [1, 2],
        [3, 4, 5, 6],
      ]);
      render(<FixturesView league={wrapper} />);
      expect(screen.getByText(/Matchday 1 \/ 6/)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Next matchday' }));
      await userEvent.click(screen.getByRole('button', { name: 'Next matchday' }));

      expect(screen.getByText(/Matchday 3 \/ 6/)).toBeInTheDocument();
      expect(tags()).toEqual(['Group B', 'Group B']);
    });

    it('plays the matches of every group on Scorinate matchday', async () => {
      openTestLeague(
        groupsLeague(SEVEN.slice(0, 4), [
          [1, 2],
          [3, 4],
        ])
      );
      render(<GroupsFromStore />);

      await userEvent.click(screen.getByRole('button', { name: 'Scorinate matchday' }));

      expect(screen.getAllByRole('button', { name: 'Re-scorinate' })).toHaveLength(2);
      expect(
        screen.queryByRole('button', { name: 'Scorinate' })
      ).not.toBeInTheDocument();
    });

    it('shows no group tag in a round robin', () => {
      render(<FixturesView league={league(4)} phaseIndex={0} />);
      expect(screen.queryByText(/^Group /)).not.toBeInTheDocument();
    });
  });

  describe('a phase that is not the last (Task 132)', () => {
    const FOUR = ALL_TEAMS;
    /** Groups A (1, 2) and B (3, 4), top 1, then a round robin. Phase 1 is
     * complete. */
    function openCompletePhaseOne(): void {
      openTestLeague(
        groupsLeague(
          FOUR,
          [
            [1, 2],
            [3, 4],
          ],
          [
            {
              format: 'groups',
              legs: 'two-way',
              grouping: { by: 'count', count: 2 },
              advance: { top: 1, bestOfNext: 0 },
            },
            { format: 'round-robin', legs: 'two-way' },
          ]
        )
      );
      scorinateMatchday(LEAGUE, 1);
      scorinateMatchday(LEAGUE, 2);
    }

    function PhaseFromStore({
      phaseIndex,
    }: {
      phaseIndex: number;
    }): JSX.Element | null {
      const found = useDatabaseStore((state) => state.leagues[LEAGUE]);
      return found ? <FixturesView league={found} phaseIndex={phaseIndex} /> : null;
    }

    it('shows a Phase complete badge when complete, not League completed (choice 7)', () => {
      openCompletePhaseOne();
      render(<PhaseFromStore phaseIndex={0} />);
      expect(screen.getByText('Phase complete')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.queryByText('League completed')).not.toBeInTheDocument();
    });

    it('keeps Re-scorinate on until the next phase starts (US-07.3)', () => {
      openCompletePhaseOne();
      render(<PhaseFromStore phaseIndex={0} />);
      for (const button of screen.getAllByRole('button', { name: 'Re-scorinate' })) {
        expect(button).not.toBeDisabled();
      }
      expect(screen.queryByText(/This phase is locked/)).not.toBeInTheDocument();
    });

    it('turns every Scorinate button off in a locked phase, with the hint (choice 5)', () => {
      openCompletePhaseOne();
      startNextPhase(LEAGUE);
      render(<PhaseFromStore phaseIndex={0} />);

      expect(
        screen.getByText('Phase 2 started. This phase is locked.')
      ).toBeInTheDocument();
      for (const button of screen.getAllByRole('button', { name: 'Re-scorinate' })) {
        expect(button).toBeDisabled();
      }
      expect(screen.getByRole('button', { name: 'Scorinate matchday' })).toBeDisabled();
    });

    it('leaves the started phase open', () => {
      openCompletePhaseOne();
      startNextPhase(LEAGUE);
      render(<PhaseFromStore phaseIndex={1} />);

      expect(screen.queryByText(/This phase is locked/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Scorinate' })).not.toBeDisabled();
    });
  });
});

describe('FixturesView: the trigrams (Task 157, US-09.6)', () => {
  it('shows the trigram of each team beside its swatch (choice 3)', () => {
    const base = league(2);
    const wrapper: LeagueWrapper = {
      ...base,
      teams: base.teams.map((team, i) => ({ ...team, trigram: ['UNI', 'RIV'][i] })),
    };
    const { container } = render(<FixturesView league={wrapper} />);
    const fixture = fixturesOf(wrapper).fixtures[0];
    const trigramOf = (uuid: string): string =>
      wrapper.teams.find((team) => team.blueprintUuid === uuid)?.trigram ?? '';
    const trigrams = [...container.querySelectorAll('[data-part="trigram"]')];
    expect(trigrams.slice(0, 2).map((t) => t.textContent)).toEqual([
      trigramOf(fixture.home),
      trigramOf(fixture.away),
    ]);
    // Home: name, trigram, swatch. Away: swatch, trigram, name.
    const [homeTrigram, awayTrigram] = trigrams;
    expect(homeTrigram.previousElementSibling?.textContent).toBe(
      wrapper.teams.find((team) => team.blueprintUuid === fixture.home)?.name
    );
    expect(homeTrigram.nextElementSibling?.getAttribute('aria-hidden')).toBe('true');
    expect(awayTrigram.previousElementSibling?.getAttribute('aria-hidden')).toBe(
      'true'
    );
    expect(awayTrigram.nextElementSibling?.textContent).toBe(
      wrapper.teams.find((team) => team.blueprintUuid === fixture.away)?.name
    );
  });

  it('shows no trigram for a team with none (choice 5)', () => {
    const { container } = render(<FixturesView league={league(2)} />);
    expect(container.querySelector('[data-part="trigram"]')).toBeNull();
  });
});
