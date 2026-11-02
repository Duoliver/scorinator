import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { serializeLeagueWrapper } from '@/app/data/databaseFile';
import { saveDatabase } from '@/app/state/databaseActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import {
  createLeague,
  scorinateMatchday,
  startNextPhase,
} from '@/app/state/leagueWrapperActions';
import { newTeamInstances } from '@/app/state/teamInstances';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import type { LeagueWrapper } from '@/domain';
import { LeagueDetailScreen } from './LeagueDetailScreen';
import {
  groupsLeague,
  LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
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
      const [phase] = wrapper.content.phases;
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
      expect(screen.getAllByText('99')).not.toHaveLength(0);

      await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
      await userEvent.click(screen.getByRole('button', { name: 'Re-scorinate' }));
      await userEvent.click(screen.getByRole('tab', { name: 'Standings' }));

      expect(screen.queryByText('99')).not.toBeInTheDocument();
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

    it('turns the Start button off for a Bracket next phase, with the reason (choice 4)', () => {
      openTestLeague(
        groupsLeague(FOUR, [
          [1, 2],
          [3, 4],
        ])
      );
      scorinateMatchday(LEAGUE, 1);
      scorinateMatchday(LEAGUE, 2);
      render(<LeagueDetailScreen uuid={LEAGUE} />);

      const button = screen.getByRole('button', { name: 'Start phase 2 · Bracket' });
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAccessibleDescription(
        'A Bracket phase cannot start yet. It comes with the bracket screens.'
      );
    });
  });
});
