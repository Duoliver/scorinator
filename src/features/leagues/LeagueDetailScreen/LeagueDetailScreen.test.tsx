import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { serializeLeagueWrapper } from '@/app/data/databaseFile';
import * as exportFile from '@/app/data/exportFile';
import * as resultsTxt from '@/app/data/resultsTxt';
import * as slugListTxt from '@/app/data/slugListTxt';
import { useFileStore } from '@/app/state/fileStore';
import { saveDatabase } from '@/app/state/databaseActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import {
  createLeague,
  scorinateFixture,
  scorinateMatchday,
  startNextPhase,
} from '@/app/state/leagueWrapperActions';
import { newTeamInstances } from '@/app/state/teamInstances';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import type { GroupsPhase, LeagueWrapper } from '@/domain';
import { LeagueDetailScreen } from './LeagueDetailScreen';
import {
  groupsLeague,
  LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
  scheduled,
} from '@/test/databaseRecords';

const TEAMS = [
  { name: 'FC United', colour: '#E53935' },
  { name: 'FC Rivals', colour: '#1E88E5' },
];

const league = (): LeagueWrapper => roundRobinLeague(TEAMS, { homeAdvantage: true });

let memory: ReturnType<typeof openTestDatabase>;

/** Puts the league file on the test disk and its row in the manifest, as a
 * new session finds a league it did not open yet. */
function storeOnDisk(
  wrapper: LeagueWrapper,
  text = serializeLeagueWrapper(wrapper)
): void {
  memory.files.wrappers[wrapper.uuid] = text;
  const row = summarizeLeague(wrapper);
  useDatabaseStore.setState({ rows: [row], savedRows: [row] });
}

beforeEach(() => {
  memory = openTestDatabase();
});

describe('LeagueDetailScreen', () => {
  describe('with an opened league', () => {
    let wrapper: LeagueWrapper;

    beforeEach(() => {
      wrapper = openTestLeague(league());
    });

    it('shows the phase format in the meta line (Task 131, US-01.2)', () => {
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      expect(
        screen.getByText('Round robin (two-way) · 2 teams · Home adv. on · 3/1/0 pts')
      ).toBeInTheDocument();
    });

    it('shows the progress badge with the short name (Task 131 choice 3)', () => {
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      expect(screen.getByText('Round robin · MD 1/2')).toBeInTheDocument();
    });

    it('has no phase tabs for a one-phase league (choice 2)', () => {
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
        'Standings',
        'Fixtures',
      ]);
    });

    it('renders the league name and a meta summary line', () => {
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      expect(
        screen.getByRole('heading', { name: 'Coastal Premier' })
      ).toBeInTheDocument();
      expect(screen.getByText(/2 teams/)).toBeInTheDocument();
      expect(screen.getByText(/Home adv\. on/)).toBeInTheDocument();
      expect(screen.getByText(/3\/1\/0 pts/)).toBeInTheDocument();
    });

    it('shows the Unsaved badge after a scorinate in Fixtures', async () => {
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
      await userEvent.click(screen.getAllByRole('button', { name: 'Scorinate' })[0]!);

      expect(screen.getByText('Unsaved')).toBeInTheDocument();
    });

    it('shows the Standings tab by default, with one row per team', () => {
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      expect(screen.getByText('Pts')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(3);
      expect(screen.getByText('No matches played yet.')).toBeInTheDocument();
    });

    it('keeps the visible matchday when switching to Standings and back to Fixtures', async () => {
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
      await userEvent.click(screen.getByRole('button', { name: /Next matchday/ }));
      expect(screen.getByText(/Matchday 2 \/ 2/)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: 'Standings' }));
      await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));

      expect(screen.getByText(/Matchday 2 \/ 2/)).toBeInTheDocument();
    });

    it('shows a scorinated match in Standings after switching back from Fixtures', async () => {
      render(<LeagueDetailScreen uuid={LEAGUE} />);
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
      const phase = scheduled(wrapper.content.phases[0]);
      const [first] = phase.fixtures;
      const played: LeagueWrapper = {
        ...wrapper,
        content: {
          ...wrapper.content,
          phases: [
            {
              ...phase,
              results: [
                {
                  fixtureId: first.id,
                  home: first.home,
                  away: first.away,
                  homeGoals: 99,
                  awayGoals: 99,
                },
              ],
            },
          ],
        },
      };
      useDatabaseStore.setState({ leagues: { [LEAGUE]: played } });
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      expect(screen.getAllByText('Scored 99 · Conceded 99')).not.toHaveLength(0);

      await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
      await userEvent.click(screen.getByRole('button', { name: 'Re-scorinate' }));
      await userEvent.click(screen.getByRole('tab', { name: 'Standings' }));

      expect(screen.queryByText('Scored 99 · Conceded 99')).not.toBeInTheDocument();
      const rows = screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.children[2]?.textContent);
      expect(rows).toEqual(['1', '1']);
    });

    it('switches to the Fixtures tab on click, showing the generated schedule', async () => {
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
      expect(screen.getByText(/Matchday 1 \/ 2/)).toBeInTheDocument();
    });
  });

  it('shows the Unsaved badge on a new league until the database saves', async () => {
    openTestDatabase([
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      { slug: 'fc-rivals', name: 'FC Rivals', colour: '#1E88E5', tier: 'C' },
    ]);
    const { blueprints } = useDatabaseStore.getState();
    const created = createLeague({
      name: 'Coastal Premier',
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      teams: newTeamInstances(blueprints),
    });
    render(<LeagueDetailScreen uuid={created.uuid} />);
    expect(screen.getByText('Unsaved')).toBeInTheDocument();

    await act(() => saveDatabase());

    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
  });

  it('reads a league that is not open yet from the database, with a note while it reads', async () => {
    storeOnDisk(league());
    render(<LeagueDetailScreen uuid={LEAGUE} />);

    expect(screen.getByText('Opening the league…')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Coastal Premier' })
    ).toBeInTheDocument();
    expect(useDatabaseStore.getState().leagues[LEAGUE]).toBeDefined();
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
  });

  it('shows the error when the league file cannot be read', async () => {
    storeOnDisk(league(), '{ not json');
    render(<LeagueDetailScreen uuid={LEAGUE} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /^The league could not open: /
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('shows a not-found message for an unknown UUID', () => {
    render(<LeagueDetailScreen uuid="no-such-league" />);
    expect(screen.getByText('League not found.')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  describe('a league with several phases (Task 131)', () => {
    const FOUR = [
      { name: 'FC United', colour: '#E53935' },
      { name: 'FC Rivals', colour: '#1E88E5' },
      { name: 'FC Town', colour: '#2E7D32' },
      { name: 'FC Rangers', colour: '#6A1B9A' },
    ];

    it('shows the short names, the badge, and one tab for each phase', () => {
      openTestLeague(
        groupsLeague(FOUR, [
          [1, 2],
          [3, 4],
        ])
      );
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      expect(
        screen.getByText('Group Stage → Bracket · 4 teams · Home adv. off · 3/1/0 pts')
      ).toBeInTheDocument();
      expect(screen.getByText('Group Stage · MD 1/2')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '1 · Group Stage' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByRole('tab', { name: '2 · Bracket' })).toBeInTheDocument();
    });

    it('shows the group cards and the advancement line in phase 1', () => {
      openTestLeague(
        groupsLeague(FOUR, [
          [1, 2],
          [3, 4],
        ])
      );
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      expect(screen.getByRole('table', { name: 'Group A' })).toBeInTheDocument();
      expect(screen.getByRole('table', { name: 'Group B' })).toBeInTheDocument();
      expect(
        screen.getByText('Top 2 of each group advance to the Bracket.')
      ).toBeInTheDocument();
    });

    it('shows the US-07.3 line in a phase that has not started (Task 132 choice 6)', async () => {
      openTestLeague(
        groupsLeague(FOUR, [
          [1, 2],
          [3, 4],
        ])
      );
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      await userEvent.click(screen.getByRole('tab', { name: '2 · Bracket' }));

      expect(
        screen.getByText('This phase starts when phase 1 is complete.')
      ).toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: 'Standings' })).not.toBeInTheDocument();
    });

    describe('with two started phases', () => {
      beforeEach(() => {
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
        startNextPhase(LEAGUE);
      });

      it('opens the current phase, and shows the earlier phase on its tab', async () => {
        render(<LeagueDetailScreen uuid={LEAGUE} />);
        expect(screen.getByRole('tab', { name: '2 · Round robin' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
        expect(screen.getByText('Round robin · MD 1/2')).toBeInTheDocument();
        expect(screen.getByRole('table', { name: 'Standings' })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('tab', { name: '1 · Group Stage' }));

        expect(screen.getByRole('table', { name: 'Group A' })).toBeInTheDocument();
      });

      it('keeps the matchday of each phase across tab switches', async () => {
        render(<LeagueDetailScreen uuid={LEAGUE} />);
        await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
        await userEvent.click(screen.getByRole('button', { name: 'Next matchday' }));
        expect(screen.getByText(/Matchday 2 \/ 2/)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('tab', { name: '1 · Group Stage' }));
        await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
        expect(screen.getByText(/Matchday 1 \/ 2/)).toBeInTheDocument();

        await userEvent.click(screen.getByRole('tab', { name: '2 · Round robin' }));
        await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
        expect(screen.getByText(/Matchday 2 \/ 2/)).toBeInTheDocument();
      });
    });

    it('shows Complete in the header for a complete league', () => {
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
            },
          ]
        )
      );
      scorinateMatchday(LEAGUE, 1);
      scorinateMatchday(LEAGUE, 2);
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('the phase start (Task 132, US-07.3)', () => {
    const FOUR = [
      { name: 'FC United', colour: '#E53935' },
      { name: 'FC Rivals', colour: '#1E88E5' },
      { name: 'FC Town', colour: '#2E7D32' },
      { name: 'FC Rangers', colour: '#6A1B9A' },
    ];
    const toRoundRobin = (): LeagueWrapper =>
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
      );
    const START = 'Start phase 2 · Round robin';

    it('shows no Start button before the phase is complete', () => {
      openTestLeague(toRoundRobin());
      scorinateMatchday(LEAGUE, 1);
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      expect(screen.queryByRole('button', { name: START })).not.toBeInTheDocument();
    });

    it('asks first, and Cancel changes nothing', async () => {
      openTestLeague(toRoundRobin());
      scorinateMatchday(LEAGUE, 1);
      scorinateMatchday(LEAGUE, 2);
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      await userEvent.click(screen.getByRole('button', { name: START }));
      const dialog = screen.getByRole('dialog', { name: 'Start phase 2?' });
      expect(dialog).toHaveTextContent(
        'Phase 1 locks, and its results can no longer change.'
      );
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(useDatabaseStore.getState().leagues[LEAGUE]?.content.phases).toHaveLength(
        1
      );
    });

    it('starts the next phase on the confirm, and opens its tab (choice 3)', async () => {
      openTestLeague(toRoundRobin());
      scorinateMatchday(LEAGUE, 1);
      scorinateMatchday(LEAGUE, 2);
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      await userEvent.click(screen.getByRole('button', { name: START }));
      await userEvent.click(screen.getByRole('button', { name: 'Start phase 2' }));

      expect(useDatabaseStore.getState().leagues[LEAGUE]?.content.phases).toHaveLength(
        2
      );
      expect(screen.getByRole('tab', { name: '2 · Round robin' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByText('Round robin · MD 1/2')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: START })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: '1 · Group Stage' }));
      await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
      expect(
        screen.getByText('Phase 2 started. This phase is locked.')
      ).toBeInTheDocument();
    });

    it('starts a Bracket next phase, and shows its Bracket tab (Task 141)', async () => {
      openTestLeague(
        groupsLeague(FOUR, [
          [1, 2],
          [3, 4],
        ])
      );
      scorinateMatchday(LEAGUE, 1);
      scorinateMatchday(LEAGUE, 2);
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      await userEvent.click(
        screen.getByRole('button', { name: 'Start phase 2 · Bracket' })
      );
      await userEvent.click(screen.getByRole('button', { name: 'Start phase 2' }));
      expect(
        screen.getByRole('tab', { name: 'Bracket', selected: true })
      ).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Final' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '⚽ Scorinate bracket' })
      ).toBeEnabled();
      // The Seed List sub-tab comes after the Bracket tab (Task 142 choice 1).
      await userEvent.click(screen.getByRole('tab', { name: 'Seed List' }));
      expect(screen.getByRole('table', { name: 'Seed List' })).toBeInTheDocument();
      expect(screen.getByText('A1')).toBeInTheDocument();
    });
  });

  describe('a later Groups draw (Task 181, US-02.1, US-02.5)', () => {
    const SEVEN = [
      { name: 'FC United', colour: '#E53935' },
      { name: 'FC Rivals', colour: '#1E88E5' },
      { name: 'FC Town', colour: '#2E7D32' },
      { name: 'FC Rangers', colour: '#6A1B9A' },
      { name: 'FC Harbour', colour: '#00838F' },
      { name: 'FC Valley', colour: '#F9A825' },
      { name: 'FC Dunes', colour: '#5D4037' },
    ];
    const LINE =
      'You can change the groups until the first match has a result. A group needs at least 2 teams.';

    /** Round robin of 7 (top 6), then 2 groups of 3, by default. With
     * `eight`, a round robin of 8 (top 8), then 4 groups of 2. Phase 2 has
     * started, with no result. */
    function openPhaseTwoGroups(eight = false): void {
      const teams = eight ? [...SEVEN, { name: 'FC Moors', colour: '#AD1457' }] : SEVEN;
      const base = roundRobinLeague(teams);
      openTestLeague({
        ...base,
        content: {
          ...base.content,
          plans: [
            { format: 'round-robin', legs: 'two-way', advance: { top: eight ? 8 : 6 } },
            {
              format: 'groups',
              legs: 'two-way',
              grouping: { by: 'count', count: eight ? 4 : 2 },
            },
          ],
        },
      });
      for (let matchday = 1; matchday <= 14; matchday++)
        scorinateMatchday(LEAGUE, matchday);
      startNextPhase(LEAGUE);
    }
    const phaseTwo = (): GroupsPhase => {
      const phase = useDatabaseStore.getState().leagues[LEAGUE]?.content.phases[1];
      if (phase?.format !== 'groups') throw new Error('expected a Groups phase 2');
      return phase;
    };
    const card = (name: string): HTMLElement => screen.getByRole('region', { name });
    const nameOf = (uuid: string): string =>
      useDatabaseStore
        .getState()
        .leagues[LEAGUE]!.teams.find((t) => t.blueprintUuid === uuid)!.name;

    it('shows the editable cards, Shuffle, and the line before the first result', () => {
      openPhaseTwoGroups();
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      expect(within(card('Group A')).getAllByRole('listitem')).toHaveLength(3);
      expect(within(card('Group B')).getAllByRole('listitem')).toHaveLength(3);
      expect(
        screen.getByRole('button', { name: '⟲ Shuffle groups' })
      ).toBeInTheDocument();
      expect(screen.getByText(LINE)).toBeInTheDocument();
      expect(screen.queryByRole('table', { name: 'Group A' })).not.toBeInTheDocument();
    });

    it('offers the moves and the swaps in the row menu, and moves a team with new fixtures', async () => {
      openPhaseTwoGroups();
      const before = phaseTwo();
      const team = before.groups[0][0];
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      await userEvent.click(
        screen.getByRole('button', { name: `Options for ${nameOf(team)}` })
      );
      expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
        'Move to Group B',
        ...before.groups[1].map((other) => `Swap with ${nameOf(other)}`),
      ]);
      await userEvent.click(screen.getByRole('menuitem', { name: 'Move to Group B' }));

      const after = phaseTwo();
      expect(after.groups[1]).toContain(team);
      expect(after.groups.map((group) => group.length)).toEqual([2, 4]);
      expect(after.fixtures).not.toEqual(before.fixtures);
      expect(within(card('Group B')).getAllByRole('listitem')).toHaveLength(4);
    });

    it('turns the moves off for a team in a group of 2 (choice 4)', async () => {
      openPhaseTwoGroups();
      const [groupA] = phaseTwo().groups;
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      await userEvent.click(
        screen.getByRole('button', { name: `Options for ${nameOf(groupA[0])}` })
      );
      await userEvent.click(screen.getByRole('menuitem', { name: 'Move to Group B' }));

      const [stayed] = phaseTwo().groups[0];
      await userEvent.click(
        screen.getByRole('button', { name: `Options for ${nameOf(stayed)}` })
      );

      expect(screen.getByRole('menuitem', { name: 'Move to Group B' })).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });

    it('does nothing on a drop that leaves a group with 1 team', async () => {
      openPhaseTwoGroups();
      const [groupA] = phaseTwo().groups;
      render(<LeagueDetailScreen uuid={LEAGUE} />);
      await userEvent.click(
        screen.getByRole('button', { name: `Options for ${nameOf(groupA[0])}` })
      );
      await userEvent.click(screen.getByRole('menuitem', { name: 'Move to Group B' }));
      const before = phaseTwo();

      const data = new Map<string, string>();
      const dataTransfer = {
        setData: (type: string, value: string): void => {
          data.set(type, value);
        },
        getData: (type: string): string => data.get(type) ?? '',
      };
      const row = within(card('Group A'))
        .getByText(nameOf(before.groups[0][0]))
        .closest('li') as HTMLElement;
      fireEvent.dragStart(row, { dataTransfer });
      fireEvent.drop(card('Group B'), { dataTransfer });

      expect(phaseTwo()).toBe(before);
    });

    it('draws again on Shuffle', async () => {
      openPhaseTwoGroups();
      const before = phaseTwo();
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      await userEvent.click(screen.getByRole('button', { name: '⟲ Shuffle groups' }));

      expect(phaseTwo()).not.toBe(before);
      expect(phaseTwo().groups.flat().sort()).toEqual(before.groups.flat().sort());
    });

    it('shows the normal group cards after the first result, with no Shuffle', () => {
      openPhaseTwoGroups();
      scorinateFixture(LEAGUE, phaseTwo().fixtures[0].id);
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      expect(screen.getByRole('table', { name: 'Group A' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: '⟲ Shuffle groups' })
      ).not.toBeInTheDocument();
      expect(screen.queryByText(LINE)).not.toBeInTheDocument();
    });

    it('swaps two teams with the row menu in 4 groups of 2 (Task 183)', async () => {
      openPhaseTwoGroups(true);
      const before = phaseTwo();
      const [a] = before.groups[0];
      const [b] = before.groups[1];
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      await userEvent.click(
        screen.getByRole('button', { name: `Options for ${nameOf(a)}` })
      );
      expect(screen.getByRole('menuitem', { name: 'Move to Group B' })).toHaveAttribute(
        'aria-disabled',
        'true'
      );
      const swap = screen.getByRole('menuitem', { name: `Swap with ${nameOf(b)}` });
      expect(swap).not.toHaveAttribute('aria-disabled');
      await userEvent.click(swap);

      const after = phaseTwo();
      expect(after.groups.map((group) => group.length)).toEqual([2, 2, 2, 2]);
      expect(after.groups[0]).toContain(b);
      expect(after.groups[1]).toContain(a);
    });

    it('swaps two teams on a drop onto a team row of another group (Task 183)', () => {
      openPhaseTwoGroups(true);
      const before = phaseTwo();
      const [a] = before.groups[0];
      const [b] = before.groups[1];
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      const data = new Map<string, string>();
      const dataTransfer = {
        setData: (type: string, value: string): void => {
          data.set(type, value);
        },
        getData: (type: string): string => data.get(type) ?? '',
      };
      const rowOf = (group: string, uuid: string): HTMLElement =>
        within(card(group)).getByText(nameOf(uuid)).closest('li') as HTMLElement;
      fireEvent.dragStart(rowOf('Group A', a), { dataTransfer });
      fireEvent.drop(rowOf('Group B', b), { dataTransfer });

      const after = phaseTwo();
      expect(after.groups[0]).toContain(b);
      expect(after.groups[1]).toContain(a);
    });
  });
});

describe('LeagueDetailScreen: the export menu (US-10.1, Task 150)', () => {
  const pickItem = async (name: string): Promise<void> => {
    await userEvent.click(screen.getByRole('button', { name: /^Export/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name }));
  };
  const statusMessage = (): string | undefined =>
    useFileStore.getState().status?.message;

  beforeEach(() => {
    vi.restoreAllMocks();
    useFileStore.setState({ status: null });
  });

  it('lists the three exports, in order', async () => {
    openTestLeague(league());
    render(<LeagueDetailScreen uuid={LEAGUE} />);

    await userEvent.click(screen.getByRole('button', { name: /^Export/ }));

    expect(
      (await screen.findAllByRole('menuitem')).map((item) => item.textContent)
    ).toEqual([
      'Export league (.json)',
      'Export results (.txt)',
      'Export slug list (.txt)',
    ]);
  });

  it('exports the league file', async () => {
    const wrapper = openTestLeague(league());
    const save = vi.spyOn(exportFile, 'saveLeagueFile').mockResolvedValue('/c.json');
    render(<LeagueDetailScreen uuid={LEAGUE} />);

    await pickItem('Export league (.json)');

    expect(save.mock.calls[0][0]).toBe(wrapper);
    expect(statusMessage()).toBe('Saved to /c.json');
  });

  it('exports the results text', async () => {
    const wrapper = openTestLeague(league());
    const write = vi.spyOn(resultsTxt, 'exportResultsTxt').mockResolvedValue('/r.txt');
    render(<LeagueDetailScreen uuid={LEAGUE} />);

    await pickItem('Export results (.txt)');

    expect(write.mock.calls[0][0]).toBe(wrapper);
    expect(statusMessage()).toBe('Saved to /r.txt');
  });

  it('exports the slug list', async () => {
    const wrapper = openTestLeague(league());
    const write = vi
      .spyOn(slugListTxt, 'exportSlugListTxt')
      .mockResolvedValue('/s.txt');
    render(<LeagueDetailScreen uuid={LEAGUE} />);

    await pickItem('Export slug list (.txt)');

    expect(write.mock.calls[0][0]).toBe(wrapper);
    expect(statusMessage()).toBe('Saved to /s.txt');
  });

  it('exports the live league with its unsaved changes, and keeps it unsaved', async () => {
    openTestLeague(league());
    render(<LeagueDetailScreen uuid={LEAGUE} />);
    act(() => {
      scorinateMatchday(LEAGUE, 1);
    });
    const live = useDatabaseStore.getState().leagues[LEAGUE];
    const save = vi.spyOn(exportFile, 'saveLeagueFile').mockResolvedValue('/c.json');

    await pickItem('Export league (.json)');

    expect(save.mock.calls[0][0]).toBe(live);
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('says so when the dialog is canceled', async () => {
    openTestLeague(league());
    vi.spyOn(resultsTxt, 'exportResultsTxt').mockResolvedValue(null);
    render(<LeagueDetailScreen uuid={LEAGUE} />);

    await pickItem('Export results (.txt)');

    expect(statusMessage()).toBe('Export canceled.');
  });

  it('shows the error of a failed export', async () => {
    openTestLeague(league());
    vi.spyOn(exportFile, 'saveLeagueFile').mockRejectedValue(new Error('Disk full'));
    render(<LeagueDetailScreen uuid={LEAGUE} />);

    await pickItem('Export league (.json)');

    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Disk full',
    });
  });

  it('has no menu for a league that is not found', () => {
    render(<LeagueDetailScreen uuid={LEAGUE} />);
    expect(screen.getByText('League not found.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Export/ })).not.toBeInTheDocument();
  });
});
