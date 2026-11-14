import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { SeasonSummary } from '@/domain';
import { seasonDetailPath } from '@/app/routes';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { useStatusLineStore } from '@/app/state/statusLineStore';
import { serializeSeasonWrapper } from '@/app/data/databaseFile';
import {
  openTestDatabase,
  SEASON,
  seasonRow,
  seasonWrapper,
  testUuid,
} from '@/test/databaseRecords';
import { SeasonsListScreen } from './SeasonsListScreen';

const row = (n: number, overrides: Partial<SeasonSummary> = {}): SeasonSummary => ({
  uuid: testUuid(100 + n),
  name: 'Liga Norte',
  year: '2026',
  finished: false,
  leagueCount: 3,
  teamCount: 8,
  playoffCount: 2,
  ...overrides,
});

/** Puts Season rows in the store, as a new session finds them. */
function storeSeasonRows(...rows: SeasonSummary[]): void {
  useDatabaseStore.setState({ seasonRows: rows, savedSeasonRows: rows });
}

const cards = (): HTMLElement[] => screen.queryAllByRole('article');
const statusLine = (): string | undefined =>
  useStatusLineStore.getState().status?.message;

beforeEach(() => {
  openTestDatabase([]);
  useStatusLineStore.setState({ status: null });
});

describe('SeasonsListScreen: the empty list', () => {
  it('shows the empty state with + New Season, and no search', () => {
    render(<SeasonsListScreen />);
    expect(screen.getByRole('heading', { name: 'No Seasons yet' })).toBeInTheDocument();
    expect(screen.getByText('No Seasons')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '+ New Season' })).toHaveLength(1);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Search')).not.toBeInTheDocument();
  });
});

describe('SeasonsListScreen: the cards (US-13.1, demo point 2)', () => {
  it('shows one card for each Season, in manifest order', () => {
    storeSeasonRows(row(1), row(2, { name: 'Copa Atlântica', year: '2026-27' }));
    render(<SeasonsListScreen />);
    expect(
      cards().map((card) => within(card).getByRole('heading').textContent)
    ).toEqual(['Liga Norte', 'Copa Atlântica']);
    expect(screen.getByText('2 Seasons · 0 finished')).toBeInTheDocument();
  });

  it('shows the year, the state, the counts, and the link to the Season', () => {
    storeSeasonRows(row(1), row(2, { year: '2025', finished: true }));
    render(<SeasonsListScreen />);
    const [running, finished] = cards();
    expect(within(running).getByText('2026')).toBeInTheDocument();
    expect(within(running).getByText('Running')).toBeInTheDocument();
    expect(
      within(running).getByText('3 leagues · 8 teams · 2 playoffs')
    ).toBeInTheDocument();
    expect(within(running).getByRole('link', { name: 'Open Season' })).toHaveAttribute(
      'href',
      seasonDetailPath(testUuid(101))
    );
    expect(within(finished).getByText('Finished')).toBeInTheDocument();
    expect(screen.getByText('2 Seasons · 1 finished')).toBeInTheDocument();
  });

  it('counts one and none in words', () => {
    storeSeasonRows(row(1, { leagueCount: 1, teamCount: 0, playoffCount: 0 }));
    render(<SeasonsListScreen />);
    expect(screen.getByText('1 league · No teams · No playoffs')).toBeInTheDocument();
    expect(screen.getByText('1 Season · 0 finished')).toBeInTheDocument();
  });
});

describe('SeasonsListScreen: + New Season (US-13.1)', () => {
  it('creates a Season, shows its card as unsaved, and says so in the status line', async () => {
    storeSeasonRows(row(1));
    render(<SeasonsListScreen />);
    await userEvent.click(screen.getByRole('button', { name: '+ New Season' }));
    const dialog = screen.getByRole('dialog', { name: 'New Season' });

    const create = within(dialog).getByRole('button', { name: 'Create Season' });
    expect(create).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Name'), ' Copa Sul ');
    expect(create).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Year'), '4E 201');
    await userEvent.click(create);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const card = cards()[1];
    expect(within(card).getByRole('heading', { name: 'Copa Sul' })).toBeInTheDocument();
    expect(within(card).getByText('4E 201')).toBeInTheDocument();
    expect(within(card).getByText('Unsaved')).toBeInTheDocument();
    expect(
      within(card).getByText('No leagues · No teams · No playoffs')
    ).toBeInTheDocument();
    expect(statusLine()).toBe('Created Copa Sul 4E 201.');
  });

  it('shows an error for a name and year that a Season has, and creates nothing', async () => {
    storeSeasonRows(row(1));
    render(<SeasonsListScreen />);
    await userEvent.click(screen.getByRole('button', { name: '+ New Season' }));
    const dialog = screen.getByRole('dialog', { name: 'New Season' });
    await userEvent.type(within(dialog).getByLabelText('Name'), 'LIGA NORTE');
    await userEvent.type(within(dialog).getByLabelText('Year'), '2026');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Create Season' })
    );

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      'A Season with this name and year exists. Change the name or the year.'
    );
    expect(cards()).toHaveLength(1);
  });

  it('closes on Cancel, and creates nothing', async () => {
    render(<SeasonsListScreen />);
    await userEvent.click(screen.getByRole('button', { name: '+ New Season' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cards()).toHaveLength(0);
  });
});

describe('SeasonsListScreen: Rename and Delete (US-13.2, demo point 4)', () => {
  async function openMenu(season: string, item: string): Promise<void> {
    await userEvent.click(
      screen.getByRole('button', { name: `More actions for ${season}` })
    );
    await userEvent.click(screen.getByRole('menuitem', { name: item }));
  }

  it('renames a Season through the same dialog, with the current values', async () => {
    const memory = openTestDatabase([]);
    memory.files.wrappers[SEASON] = serializeSeasonWrapper(seasonWrapper());
    storeSeasonRows(seasonRow());
    render(<SeasonsListScreen />);
    await openMenu('Liga Norte 2026-27', 'Rename...');

    const dialog = screen.getByRole('dialog', { name: 'Rename Season' });
    const name = within(dialog).getByLabelText('Name');
    expect(name).toHaveValue('Liga Norte');
    expect(within(dialog).getByLabelText('Year')).toHaveValue('2026-27');
    await userEvent.clear(name);
    await userEvent.type(name, 'Liga do Norte');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('heading', { name: 'Liga do Norte' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(statusLine()).toBe('Renamed to Liga do Norte 2026-27.');
  });

  it('asks before a delete, names what goes, and keeps the Blueprints', async () => {
    storeSeasonRows(row(1), row(2, { name: 'Copa', year: '1' }));
    render(<SeasonsListScreen />);
    await openMenu('Liga Norte 2026', 'Delete...');

    const confirm = screen.getByRole('dialog', { name: 'Delete Liga Norte 2026?' });
    expect(confirm).toHaveTextContent(
      'This deletes its 3 leagues, its roster of 8 teams, and its 2 playoffs. The team Blueprints stay in the Teams module.'
    );
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));

    expect(cards()).toHaveLength(1);
    expect(
      screen.queryByRole('heading', { name: 'Liga Norte' })
    ).not.toBeInTheDocument();
    expect(statusLine()).toBe('Deleted Liga Norte 2026.');
  });

  it('puts no comma before "and" for two parts (Task 250)', async () => {
    storeSeasonRows(row(1, { teamCount: 0 }));
    render(<SeasonsListScreen />);
    await openMenu('Liga Norte 2026', 'Delete...');
    expect(
      screen.getByRole('dialog', { name: 'Delete Liga Norte 2026?' })
    ).toHaveTextContent(
      'This deletes its 3 leagues and its 2 playoffs. The team Blueprints stay in the Teams module.'
    );
  });

  it('names one part alone (Task 250)', async () => {
    storeSeasonRows(row(1, { teamCount: 0, playoffCount: 0 }));
    render(<SeasonsListScreen />);
    await openMenu('Liga Norte 2026', 'Delete...');
    expect(
      screen.getByRole('dialog', { name: 'Delete Liga Norte 2026?' })
    ).toHaveTextContent(
      'This deletes its 3 leagues. The team Blueprints stay in the Teams module.'
    );
  });

  it('keeps the Season on Cancel', async () => {
    storeSeasonRows(row(1));
    render(<SeasonsListScreen />);
    await openMenu('Liga Norte 2026', 'Delete...');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(cards()).toHaveLength(1);
  });
});

describe('SeasonsListScreen: the search (US-16.5)', () => {
  beforeEach(() => {
    storeSeasonRows(
      row(1),
      row(2, { year: '2025' }),
      row(3, { name: 'Copa Atlântica', year: '4E 201' })
    );
  });

  const names = (): (string | null)[] =>
    cards().map((card) => card.getAttribute('aria-label'));

  it('matches the name or the year, in any case', async () => {
    render(<SeasonsListScreen />);
    await userEvent.type(screen.getByLabelText('Search'), 'COPA');
    expect(names()).toEqual(['Copa Atlântica 4E 201']);
    await userEvent.clear(screen.getByLabelText('Search'));
    await userEvent.type(screen.getByLabelText('Search'), '2025');
    expect(names()).toEqual(['Liga Norte 2025']);
  });

  it('matches the name and the year together (choice 6)', async () => {
    render(<SeasonsListScreen />);
    await userEvent.type(screen.getByLabelText('Search'), 'liga norte 2026');
    expect(names()).toEqual(['Liga Norte 2026']);
  });

  it('shows all Seasons for an empty field', async () => {
    render(<SeasonsListScreen />);
    await userEvent.type(screen.getByLabelText('Search'), 'x');
    await userEvent.clear(screen.getByLabelText('Search'));
    expect(cards()).toHaveLength(3);
  });

  it('says so when no Season matches', async () => {
    render(<SeasonsListScreen />);
    await userEvent.type(screen.getByLabelText('Search'), 'xyz');
    expect(cards()).toHaveLength(0);
    expect(screen.getByText('No Season matches "xyz".')).toBeInTheDocument();
  });
});
