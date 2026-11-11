import type { JSX } from 'preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { scorinateFixture } from '@/app/state/leagueWrapperActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import type { LeagueWrapper, PhaseResult, ScheduledPhase } from '@/domain';
import type { PhasePlan } from '@/engine/phases';
import { StandingsView } from './StandingsView';
import { getTextWithoutHints } from '@/test/textWithoutHints';
import {
  groupsLeague,
  LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
  testUuid,
  scheduled,
} from '@/test/databaseRecords';

const UNITED = testUuid(1);
const RIVALS = testUuid(2);
const TOWN = testUuid(3);

const TEAMS = [
  { name: 'FC United', colour: '#E53935' },
  { name: 'FC Rivals', colour: '#1E88E5' },
  { name: 'FC Town', colour: '#2E7D32' },
];

/** The name of one of the three `TEAMS`, by its Blueprint UUID. */
const nameOf = (uuid: string): string =>
  TEAMS[[UNITED, RIVALS, TOWN].indexOf(uuid)].name;

/** A three-team league with the given results in phase 1, and other
 * league fields from `details`. */
function league(
  results: PhaseResult[] = [],
  details: Parameters<typeof roundRobinLeague>[1] = {},
  teams = TEAMS
): LeagueWrapper {
  const wrapper = roundRobinLeague(teams, details);
  const phase = scheduled(wrapper.content.phases[0]);
  return {
    ...wrapper,
    content: { ...wrapper.content, phases: [{ ...phase, results }] },
  };
}

function score(
  fixtureId: string,
  home: string,
  away: string,
  homeGoals: number,
  awayGoals: number
): PhaseResult {
  return { fixtureId, home, away, homeGoals, awayGoals };
}

/** Every data row of the rendered table as an array of cell texts, header
 * row skipped. `Table` renders each cell as a direct child of its row. */
function dataRows(): string[][] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => Array.from(row.children).map(getTextWithoutHints));
}

/** The Pts cell of a round-robin row: #, Team, P, W, D, L, GD, Pts, Form. */
function pointsOf(row: string[] | undefined): string | undefined {
  return row?.[7];
}

/** The Pts cell of a group card row, always the last one. */
function groupPointsOf(row: string[]): string {
  return row[row.length - 1];
}

/** `StandingsView` reads `league` as a plain prop, the same way
 * `FixturesView` does: `LeagueDetailScreen` is what subscribes to the
 * store. A scorinate call only shows up if whatever renders the view
 * renders again with the fresh league from the store, so the live update
 * test renders through this small harness, as League Detail does. */
function StandingsViewFromStore({ uuid }: { uuid: string }): JSX.Element | null {
  const found = useDatabaseStore((state) => state.leagues[uuid]);
  return found ? <StandingsView league={found} /> : null;
}

beforeEach(() => {
  openTestDatabase();
});

describe('StandingsView', () => {
  it('shows the column headers from the design reference', () => {
    render(<StandingsView league={league()} />);
    for (const header of ['#', 'Team', 'P', 'W', 'D', 'L', 'GD', 'Pts']) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
  });

  it('ranks teams by points, then goal difference, with the full stat line per team', () => {
    render(
      <StandingsView
        league={league([
          score('a', UNITED, RIVALS, 2, 0),
          score('b', TOWN, RIVALS, 1, 1),
        ])}
      />
    );

    expect(dataRows()).toEqual([
      ['1', 'FC United', '1', '1', '0', '0', '2', '3', '—'],
      ['2', 'FC Town', '1', '0', '1', '0', '0', '1', '—'],
      ['3', 'FC Rivals', '2', '0', '1', '1', '-2', '1', '—'],
    ]);
  });

  it("uses the league's configured points system", () => {
    const results = [score('a', UNITED, RIVALS, 2, 0)];
    const { unmount } = render(<StandingsView league={league(results)} />);
    expect(pointsOf(dataRows()[0])).toBe('3');
    unmount();

    render(
      <StandingsView
        league={league(results, { points: { win: 2, draw: 1, loss: 0 } })}
      />
    );
    expect(pointsOf(dataRows()[0])).toBe('2');
  });

  it("shows a joint place as '-' on the second row of a tied block", () => {
    render(
      <StandingsView
        league={league([score('a', UNITED, RIVALS, 1, 1)], {}, TEAMS.slice(0, 2))}
      />
    );

    const rows = dataRows();
    expect(rows[0]?.[0]).toBe('1');
    expect(rows[1]?.[0]).toBe('-');
  });

  it('shows the Instance name, not the Blueprint name (US-09.2)', () => {
    openTestDatabase([
      { slug: 'team-1', name: 'Renamed Blueprint', colour: '#000000', tier: 'B' },
    ]);
    render(<StandingsView league={league()} />);

    expect(screen.getByText('FC United')).toBeInTheDocument();
    expect(screen.queryByText('Renamed Blueprint')).not.toBeInTheDocument();
  });

  it('shows an empty-state message and no table for a league with no teams', () => {
    render(<StandingsView league={league([], {}, [])} />);
    expect(screen.getByText('No teams in this league yet.')).toBeInTheDocument();
    expect(screen.queryByRole('row')).not.toBeInTheDocument();
  });

  it('shows every team at zero, plus a note, before any match is played', () => {
    render(<StandingsView league={league()} />);
    expect(screen.getByText('No matches played yet.')).toBeInTheDocument();
    expect(dataRows()).toHaveLength(3);
    expect(dataRows()[0]?.slice(2)).toEqual(['0', '0', '0', '0', '0', '0', '—']);
  });

  it('updates live when a match is scorinated', () => {
    const wrapper = openTestLeague(league([], {}, TEAMS.slice(0, 2)));
    render(<StandingsViewFromStore uuid={LEAGUE} />);
    expect(screen.getByText('No matches played yet.')).toBeInTheDocument();

    const first = scheduled(wrapper.content.phases[0]).fixtures[0];
    if (!first) throw new Error('expected a generated fixture');
    act(() => scorinateFixture(LEAGUE, first.id));

    const rows = dataRows();
    expect(rows.map((row) => row[2])).toEqual(['1', '1']);
    // Scorination is random: a win gives 3 points in total, a draw gives 2.
    const totalPoints = rows.reduce((sum, row) => sum + Number(pointsOf(row)), 0);
    expect([2, 3]).toContain(totalPoints);
    expect(screen.queryByText('No matches played yet.')).not.toBeInTheDocument();
  });

  describe('a Groups phase (Task 131, US-02.2, US-02.4)', () => {
    const SIX = [
      ...TEAMS,
      { name: 'FC Harbour', colour: '#6A1B9A' },
      { name: 'FC Valley', colour: '#F9A825' },
      { name: 'FC Dunes', colour: '#00838F' },
    ];
    const sixInTwo = (): LeagueWrapper =>
      groupsLeague(SIX, [
        [1, 2, 3],
        [4, 5, 6],
      ]);

    /** The cell texts of each data row of one group table. */
    function groupRows(name: string): string[][] {
      const table = screen.getByRole('table', { name });
      return within(table)
        .getAllByRole('row')
        .slice(1)
        .map((row) => Array.from(row.children).map(getTextWithoutHints));
    }

    it('shows one card for each group, in group order, with its name', () => {
      render(<StandingsView league={sixInTwo()} />);
      expect(
        screen.getAllByRole('table').map((t) => t.getAttribute('aria-label'))
      ).toEqual(['Group A', 'Group B']);
      expect(screen.getByText('Group A')).toBeInTheDocument();
      expect(screen.getByText('Group B')).toBeInTheDocument();
      expect(
        groupRows('Group A')
          .map((row) => row[1])
          .sort()
      ).toEqual(['FC Rivals', 'FC Town', 'FC United']);
      expect(
        groupRows('Group B')
          .map((row) => row[1])
          .sort()
      ).toEqual(['FC Dunes', 'FC Harbour', 'FC Valley']);
    });

    it('has the columns #, Team, W, D, L, GD, Pts (choice 5)', () => {
      render(<StandingsView league={sixInTwo()} />);
      const table = screen.getByRole('table', { name: 'Group A' });
      expect(
        within(table).getAllByRole('columnheader').map(getTextWithoutHints)
      ).toEqual(['#', 'Team', 'W', 'D', 'L', 'GD', 'Pts']);
    });

    it('shows the MVP1 shared place for level teams', () => {
      render(<StandingsView league={sixInTwo()} />);
      expect(groupRows('Group A').map((row) => row[0])).toEqual(['1', '-', '-']);
    });

    it('counts only the results of the own group', () => {
      const wrapper = sixInTwo();
      const phase = scheduled(wrapper.content.phases[0]);
      const fixture = phase.fixtures.find(
        (candidate) => candidate.home === UNITED || candidate.away === UNITED
      );
      if (!fixture) throw new Error('expected a group A fixture');
      const played: LeagueWrapper = {
        ...wrapper,
        content: {
          ...wrapper.content,
          phases: [
            {
              ...phase,
              results: [score(fixture.id, fixture.home, fixture.away, 2, 0)],
            },
          ],
        },
      };
      render(<StandingsView league={played} />);

      expect(groupPointsOf(groupRows('Group A')[0])).toBe('3');
      expect(groupRows('Group B').map(groupPointsOf)).toEqual(['0', '0', '0']);
      expect(screen.queryByText('No matches played yet.')).not.toBeInTheDocument();
    });

    it('shows the advancement line under the cards', () => {
      render(
        <StandingsView
          league={sixInTwo()}
          advanceText="Top 2 of each group advance to the Bracket."
        />
      );
      expect(
        screen.getByText('Top 2 of each group advance to the Bracket.')
      ).toBeInTheDocument();
    });

    it('shows the phase at the given index', () => {
      const wrapper = league();
      render(<StandingsView league={wrapper} phaseIndex={0} />);
      expect(screen.getByRole('table', { name: 'Standings' })).toBeInTheDocument();
    });
  });

  describe('the zones (Task 155, US-12.5, US-02.2, US-07.2)', () => {
    const SIX = [
      ...TEAMS,
      { name: 'FC Harbour', colour: '#6A1B9A' },
      { name: 'FC Valley', colour: '#F9A825' },
      { name: 'FC Dunes', colour: '#00838F' },
    ];
    const GROUPS_BEST_M: PhasePlan[] = [
      {
        format: 'groups',
        legs: 'two-way',
        grouping: { by: 'count', count: 2 },
        advance: { top: 1, bestOfNext: 1 },
      },
      { format: 'bracket' },
    ];
    const tones = (name: string): (string | null)[] =>
      within(screen.getByRole('table', { name }))
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.getAttribute('data-tone'));
    const legend = (): string[] =>
      within(screen.getByRole('list', { name: 'Zones' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent ?? '');
    const withPlans = (base: LeagueWrapper, plans: PhasePlan[]): LeagueWrapper => ({
      ...base,
      content: { ...base.content, plans },
    });

    it('colours the top N of each group green, and place N + 1 yellow, with a best M', () => {
      render(
        <StandingsView
          league={groupsLeague(
            SIX,
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
            GROUPS_BEST_M
          )}
        />
      );
      expect(tones('Group A')).toEqual(['green', 'yellow', null]);
      expect(tones('Group B')).toEqual(['green', 'yellow', null]);
      expect(legend()).toEqual(['Qualify', 'Best 1 of place 2']);
    });

    it('shows one legend under many group cards', () => {
      render(
        <StandingsView
          league={groupsLeague(
            SIX,
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
            GROUPS_BEST_M
          )}
        />
      );
      expect(screen.getAllByRole('list', { name: 'Zones' })).toHaveLength(1);
    });

    it('colours the top N of a round robin that is not the last green, with its line', () => {
      const wrapper = withPlans(league(), [
        { format: 'round-robin', legs: 'two-way', advance: { top: 2 } },
        { format: 'bracket' },
      ]);
      render(
        <StandingsView league={wrapper} advanceText="Top 2 advance to the Bracket." />
      );
      expect(tones('Standings')).toEqual(['green', 'green', null]);
      expect(screen.getByText('Top 2 advance to the Bracket.')).toBeInTheDocument();
    });

    it('shows no zone and no legend in a last phase with no zones', () => {
      render(<StandingsView league={league()} />);
      expect(tones('Standings')).toEqual([null, null, null]);
      expect(screen.queryByRole('list', { name: 'Zones' })).not.toBeInTheDocument();
    });

    it('shows the free zones of a last phase, with the places when a zone has no label', () => {
      const wrapper = withPlans(league(), [
        {
          format: 'round-robin',
          legs: 'two-way',
          zones: [
            { colour: 'red', places: { from: 2, to: 3 }, label: '' },
            { colour: 'blue', places: { from: 1, to: 1 }, label: '' },
          ],
        },
      ]);
      render(<StandingsView league={wrapper} />);
      expect(tones('Standings')).toEqual(['blue', 'red', 'red']);
      expect(legend()).toEqual(['Place 1', 'Places 2–3']);
    });

    it('follows the current order after a scorinate', () => {
      const wrapper = withPlans(league(), [
        { format: 'round-robin', legs: 'two-way', advance: { top: 1 } },
        { format: 'bracket' },
      ]);
      const phase = scheduled(wrapper.content.phases[0]);
      const fixture = phase.fixtures[0];
      const played = {
        ...wrapper,
        content: {
          ...wrapper.content,
          phases: [
            {
              ...phase,
              results: [score(fixture.id, fixture.home, fixture.away, 0, 3)],
            },
          ],
        },
      };
      render(<StandingsView league={played} />);
      const rows = within(screen.getByRole('table', { name: 'Standings' }))
        .getAllByRole('row')
        .slice(1);
      expect(rows[0]).toHaveAttribute('data-tone', 'green');
      expect(within(rows[0]).getByText(nameOf(fixture.away))).toBeInTheDocument();
    });

    it('turns the best M green and clears the other yellow rows of a complete phase', () => {
      const drawn = groupsLeague(
        SIX,
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        GROUPS_BEST_M
      );
      const phase = scheduled(drawn.content.phases[0]);
      // Every home team wins 1-0, so places 1 to 3 are level in each group:
      // the lots and `pickQualifiers` decide the order and the best place 2.
      const results = phase.fixtures.map((f) => score(f.id, f.home, f.away, 1, 0));
      const complete: LeagueWrapper = {
        ...drawn,
        content: { ...drawn.content, phases: [{ ...phase, results }] },
      };
      render(<StandingsView league={complete} />);
      const all = [...tones('Group A'), ...tones('Group B')];
      expect(all.filter((tone) => tone === 'green')).toHaveLength(3);
      expect(all).not.toContain('yellow');
      expect(legend()).toEqual(['Qualify']);
    });
  });
});

describe('StandingsView: Form, the GD hint, and header hints (Task 154)', () => {
  const FOUR = [...TEAMS, { name: 'FC Rovers', colour: '#6A1B9A' }];

  /** Every fixture of a team, in matchday order. */
  function fixturesOf(
    wrapper: LeagueWrapper,
    team: string
  ): ScheduledPhase['fixtures'] {
    return scheduled(wrapper.content.phases[0])
      .fixtures.filter((f) => f.home === team || f.away === team)
      .sort((a, b) => a.matchday - b.matchday);
  }

  /** The league with these results: each entry gives the goals of `team`
   * and of its opponent, for its next fixture. */
  function withResults(
    wrapper: LeagueWrapper,
    team: string,
    goals: [number, number][]
  ): LeagueWrapper {
    const results = fixturesOf(wrapper, team)
      .slice(0, goals.length)
      .map((f, index) => {
        const [mine, theirs] = goals[index];
        return f.home === team
          ? score(f.id, f.home, f.away, mine, theirs)
          : score(f.id, f.home, f.away, theirs, mine);
      });
    const phase = scheduled(wrapper.content.phases[0]);
    return {
      ...wrapper,
      content: { ...wrapper.content, phases: [{ ...phase, results }] },
    };
  }

  const rowOf = (name: string): HTMLElement =>
    screen.getByRole('cell', { name: new RegExp(name) }).parentElement as HTMLElement;
  const formCell = (name: string): HTMLElement =>
    rowOf(name).children[8] as HTMLElement;

  beforeEach(() => {
    openTestDatabase();
  });

  it('has no GF and GA columns, and Form after Pts', () => {
    render(<StandingsView league={league()} />);
    expect(screen.getAllByRole('columnheader').map(getTextWithoutHints)).toEqual([
      '#',
      'Team',
      'P',
      'W',
      'D',
      'L',
      'GD',
      'Pts',
      'Form',
    ]);
  });

  it('shows a dash for a team with no match', () => {
    render(<StandingsView league={league()} />);
    expect(formCell('FC United')).toHaveTextContent('—');
  });

  it('shows a letter for each match, the oldest on the left', () => {
    render(
      <StandingsView
        league={withResults(league(), UNITED, [
          [2, 0],
          [0, 1],
          [1, 1],
        ])}
      />
    );
    expect(getTextWithoutHints(formCell('FC United'))).toBe('WLD');
  });

  it('shows at most the last 5', () => {
    const wrapper = league([], {}, FOUR);
    render(
      <StandingsView
        league={withResults(wrapper, UNITED, [
          [0, 1],
          [1, 0],
          [1, 0],
          [1, 0],
          [1, 0],
          [1, 0],
        ])}
      />
    );
    expect(getTextWithoutHints(formCell('FC United'))).toBe('WWWWW');
  });

  it('marks each dot with its outcome, for its colour', () => {
    render(<StandingsView league={withResults(league(), UNITED, [[2, 0]])} />);
    expect(within(formCell('FC United')).getByText('W')).toHaveAttribute(
      'data-outcome',
      'W'
    );
  });

  it('gives each dot a hint with the trigram, H or A, the score, and the matchday', async () => {
    const base = league();
    const [first] = fixturesOf(base, UNITED);
    const opponent = first.home === UNITED ? first.away : first.home;
    const wrapper = {
      ...base,
      teams: base.teams.map((team) =>
        team.blueprintUuid === opponent ? { ...team, trigram: 'ASH' } : team
      ),
    };
    render(<StandingsView league={withResults(wrapper, UNITED, [[2, 1]])} />);

    await userEvent.hover(within(formCell('FC United')).getByText('W'));

    const venue = first.home === UNITED ? 'H' : 'A';
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      `ASH · ${venue} · 2–1 · MD ${first.matchday}`
    );
    // The pointer goes through the hint to the next dot (Task 157 review).
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-not-hoverable');
  });

  it('shows the opponent name in the hint when it has no trigram (choice 3)', async () => {
    render(<StandingsView league={withResults(league(), UNITED, [[2, 1]])} />);
    await userEvent.hover(within(formCell('FC United')).getByText('W'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      /^FC (Rivals|Town) · /
    );
  });

  it('shows the goals in the GD hint', async () => {
    render(<StandingsView league={withResults(league(), UNITED, [[3, 1]])} />);
    await userEvent.hover(
      within(rowOf('FC United').children[6] as HTMLElement).getByText('2')
    );
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Scored 3 · Conceded 1'
    );
  });

  it('underlines the GD number, because it has a hint', () => {
    render(<StandingsView league={withResults(league(), UNITED, [[3, 1]])} />);
    const number = within(rowOf('FC United').children[6] as HTMLElement).getByText('2');
    expect(number.parentElement?.className).toMatch(/underline/);
  });

  it('names each short header with its full name', () => {
    render(<StandingsView league={league()} />);
    for (const name of [
      'Position',
      'Played',
      'Won',
      'Drawn',
      'Lost',
      'Goal difference',
      'Points',
      'Last 5 matches',
    ]) {
      expect(screen.getByRole('columnheader', { name })).toBeInTheDocument();
    }
  });

  describe('a group card', () => {
    const groups = (): LeagueWrapper =>
      groupsLeague(FOUR, [
        [1, 2],
        [3, 4],
      ]);

    it('has no Form column', () => {
      render(<StandingsView league={groups()} />);
      expect(screen.queryByRole('columnheader', { name: 'Last 5 matches' })).toBeNull();
    });

    it('has the header hints', () => {
      render(<StandingsView league={groups()} />);
      for (const name of [
        'Position',
        'Won',
        'Drawn',
        'Lost',
        'Goal difference',
        'Points',
      ]) {
        expect(screen.getAllByRole('columnheader', { name })).toHaveLength(2);
      }
    });

    it('has the GD hint', async () => {
      const base = groups();
      const phase = scheduled(base.content.phases[0]);
      const f = phase.fixtures[0];
      const wrapper = {
        ...base,
        content: {
          ...base.content,
          phases: [{ ...phase, results: [score(f.id, f.home, f.away, 5, 1)] }],
        },
      };
      render(<StandingsView league={wrapper} />);
      await userEvent.hover(screen.getByText('4'));
      expect(await screen.findByRole('tooltip')).toHaveTextContent(
        'Scored 5 · Conceded 1'
      );
    });
  });
});

describe('StandingsView: trigrams and the Location hint (Task 157, US-09.3, US-09.6)', () => {
  const TRIGRAMS = ['UNI', 'RIV', 'TOW'];
  const withTrigrams = (
    wrapper: LeagueWrapper,
    trigrams = TRIGRAMS
  ): LeagueWrapper => ({
    ...wrapper,
    teams: wrapper.teams.map((team, i) => ({ ...team, trigram: trigrams[i] ?? '' })),
  });
  const teamCell = (name: string): HTMLElement => {
    const row = screen.getAllByRole('row').find((candidate) => {
      const full = candidate.querySelector('[data-part="full"]');
      return full !== null && getTextWithoutHints(full) === name;
    });
    if (!row) throw new Error(`No row for ${name}`);
    return row.children[1] as HTMLElement;
  };
  const part = (cell: HTMLElement, name: 'full' | 'short'): HTMLElement | null =>
    cell.querySelector<HTMLElement>(`[data-part="${name}"]`);

  beforeEach(() => {
    openTestDatabase([
      {
        slug: 'fc-united',
        name: 'FC United',
        colour: '#E53935',
        tier: 'B',
        location: 'Coastal City',
      },
      { slug: 'fc-rivals', name: 'FC Rivals', colour: '#1E88E5', tier: 'B' },
      { slug: 'fc-town', name: 'FC Town', colour: '#2E7D32', tier: 'B' },
    ]);
  });

  it('gives a team with a Location a hint on its name, on hover and on focus', async () => {
    render(<StandingsView league={withTrigrams(league())} />);
    const full = part(teamCell('FC United'), 'full');
    if (!full) throw new Error('No name');
    await userEvent.hover(within(full).getByText('FC United'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Coastal City');
    // The pointer goes through the hint to the rows under it (review).
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-not-hoverable');
    // A text trigger of `Tooltip` is a Tab stop, so a keyboard user gets
    // the same hint on focus. The trigger holds the name text (Task 180).
    expect(within(full).getByText('FC United').closest('[tabindex]')).toHaveAttribute(
      'tabindex',
      '0'
    );
  });

  it('gives a team with no Location no hint and no Tab stop', () => {
    render(<StandingsView league={withTrigrams(league())} />);
    const full = part(teamCell('FC Rivals'), 'full');
    expect(full?.querySelector('[tabindex]')).toBeNull();
  });

  it('has the trigram for a narrow table, with the name and the Location in its hint', async () => {
    render(<StandingsView league={withTrigrams(league())} />);
    const short = part(teamCell('FC United'), 'short');
    expect(short).toHaveTextContent('UNI');
    if (!short) throw new Error('No trigram');
    await userEvent.hover(within(short).getByText('UNI'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'FC United · Coastal City'
    );
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-not-hoverable');
  });

  it('gives a trigram of a team with no Location the name as its hint', async () => {
    render(<StandingsView league={withTrigrams(league())} />);
    const short = part(teamCell('FC Rivals'), 'short');
    if (!short) throw new Error('No trigram');
    await userEvent.hover(within(short).getByText('RIV'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('FC Rivals');
  });

  it('keeps the name only for a team with no trigram (choice 5)', () => {
    render(<StandingsView league={withTrigrams(league(), ['UNI', '', 'TOW'])} />);
    expect(part(teamCell('FC Rivals'), 'short')).toBeNull();
    expect(part(teamCell('FC United'), 'short')).not.toBeNull();
  });

  it('has the trigram and the Location hint in a group card too', async () => {
    const FOUR = [...TEAMS, { name: 'FC Rangers', colour: '#6A1B9A' }];
    const drawn = groupsLeague(FOUR, [
      [1, 2],
      [3, 4],
    ]);
    render(
      <StandingsView league={withTrigrams(drawn, ['UNI', 'RIV', 'TOW', 'RAN'])} />
    );
    const cell = teamCell('FC United');
    expect(part(cell, 'short')).toHaveTextContent('UNI');
    const full = part(cell, 'full');
    if (!full) throw new Error('No name');
    await userEvent.hover(within(full).getByText('FC United'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Coastal City');
  });
});
