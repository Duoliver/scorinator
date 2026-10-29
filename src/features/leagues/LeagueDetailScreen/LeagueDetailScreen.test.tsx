import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { serializeLeagueWrapper } from '@/app/data/databaseFile';
import { saveDatabase } from '@/app/state/databaseActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { createLeague } from '@/app/state/leagueWrapperActions';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import type { LeagueWrapper } from '@/domain';
import { LeagueDetailScreen } from './LeagueDetailScreen';
import {
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
      blueprintUuids: blueprints.map((blueprint) => blueprint.uuid),
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
});
