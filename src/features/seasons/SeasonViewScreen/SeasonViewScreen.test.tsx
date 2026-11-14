import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { SeasonWrapper, TeamBlueprint } from '@/domain';
import { ROUTES } from '@/app/routes';
import { serializeSeasonWrapper } from '@/app/data/databaseFile';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { createSeason } from '@/app/state/seasonActions';
import { useStatusLineStore } from '@/app/state/statusLineStore';
import {
  blueprint,
  HARBORVIEW,
  openTestDatabase,
  SEASON,
  seasonRow,
  seasonWrapper,
  testUuid,
} from '@/test/databaseRecords';
import { SeasonViewScreen } from './SeasonViewScreen';

const HARBORVIEW_BLUEPRINT = blueprint({
  uuid: HARBORVIEW,
  slug: 'harborview-sc',
  name: 'Harborview SC',
  colour: '#E53935',
  tier: 'C',
  location: '',
});
const WESTBURY = blueprint({
  uuid: testUuid(7),
  slug: 'salt-marsh-united-2',
  name: 'Salt Marsh United',
  tier: 'D',
  location: 'Westbury',
});
const PORTO = blueprint({
  uuid: testUuid(8),
  slug: 'porto-velho',
  name: 'Porto Velho',
  tier: 'S',
  location: 'Porto',
});

/** A database with four Blueprints, and the Season of `seasonWrapper` on
 * disk: Salt Marsh United (B, 74) and Harborview SC (C, 63), in one league,
 * Coastal Premier. The Season is not open yet. */
function openWithSeason(options: { season?: SeasonWrapper; text?: string } = {}): void {
  const memory = openTestDatabase([]);
  const blueprints: TeamBlueprint[] = [
    blueprint(),
    HARBORVIEW_BLUEPRINT,
    WESTBURY,
    PORTO,
  ];
  memory.files.wrappers[SEASON] =
    options.text ?? serializeSeasonWrapper(options.season ?? seasonWrapper());
  useDatabaseStore.setState({
    blueprints,
    savedBlueprints: blueprints,
    seasonRows: [seasonRow()],
    savedSeasonRows: [seasonRow()],
  });
}

const statusLine = (): string | undefined =>
  useStatusLineStore.getState().status?.message;
const rosterRows = (): HTMLElement[] =>
  within(screen.getByRole('table', { name: 'Season roster' }))
    .getAllByRole('row')
    .slice(1);

beforeEach(() => {
  useStatusLineStore.setState({ status: null });
});

describe('SeasonViewScreen: the open (US-13.3, choice 4)', () => {
  it('opens the Season from its file, and shows its header', async () => {
    openWithSeason();
    render(<SeasonViewScreen uuid={SEASON} />);
    expect(screen.getByRole('status')).toHaveTextContent('Opening the Season…');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Liga Norte' })
    ).toBeInTheDocument();
    expect(screen.getByText('2026-27')).toBeInTheDocument();
    expect(screen.getByText('1 league · 2 teams · No playoffs')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Seasons' })).toHaveAttribute(
      'href',
      ROUTES.seasons
    );
  });

  it('says so for an unknown Season', () => {
    openWithSeason();
    render(<SeasonViewScreen uuid={testUuid(99)} />);
    expect(screen.getByText('Season not found.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Seasons' })).toBeInTheDocument();
  });

  it('shows the file error for a Season file that is not valid', async () => {
    openWithSeason({ text: '{' });
    render(<SeasonViewScreen uuid={SEASON} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The Season could not open: A Season file is not valid: the text is not JSON.'
    );
  });

  it('shows a new Season from memory, with no leagues yet (choice 3)', () => {
    openWithSeason();
    const season = createSeason({ name: 'Copa', year: '1' });
    render(<SeasonViewScreen uuid={season.uuid} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Copa' })).toBeInTheDocument();
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Leagues' })).toBeInTheDocument();
    expect(screen.getByText('No leagues yet.')).toBeInTheDocument();
    expect(
      screen.getByText('No teams yet. Add teams from the Teams module.')
    ).toBeInTheDocument();
  });

  it('shows only the Teams tab (choice 2)', async () => {
    openWithSeason();
    render(<SeasonViewScreen uuid={SEASON} />);
    await screen.findByRole('heading', { level: 1, name: 'Liga Norte' });
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Teams']);
  });
});

describe('SeasonViewScreen: the roster (US-13.4, demo point 7, Task 249)', () => {
  it('lists each Season team, with its Location, trigram, Tier and OVR, and leagues', async () => {
    openWithSeason();
    render(<SeasonViewScreen uuid={SEASON} />);
    await screen.findByRole('heading', { level: 1, name: 'Liga Norte' });

    const [salt, harbor] = rosterRows();
    expect(salt).toHaveTextContent('Salt Marsh United');
    expect(salt).toHaveTextContent('Ashfield');
    expect(within(salt).getByLabelText('Tier B, OVR 74')).toBeInTheDocument();
    expect(salt).toHaveTextContent('Coastal Premier');
    expect(harbor).toHaveTextContent('Harborview SC');
    expect(within(harbor).getByLabelText('Tier C, OVR 63')).toBeInTheDocument();
  });

  it('shows a team in no league as resting', async () => {
    const season = seasonWrapper();
    season.content.leagues = [];
    openWithSeason({ season });
    render(<SeasonViewScreen uuid={SEASON} />);
    await screen.findByRole('heading', { level: 1, name: 'Liga Norte' });
    expect(rosterRows()[1]).toHaveTextContent('Rests: in no league');
    expect(rosterRows()[0]).toHaveTextContent('Rests: in no league');
  });
});

describe('SeasonViewScreen: + Add teams (US-13.4, choice 5)', () => {
  async function openPicker(): Promise<HTMLElement> {
    openWithSeason();
    render(<SeasonViewScreen uuid={SEASON} />);
    await screen.findByRole('heading', { level: 1, name: 'Liga Norte' });
    await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
    return screen.getByRole('dialog', { name: 'Add teams' });
  }

  it('offers only the Blueprints that are not in the Season', async () => {
    const dialog = await openPicker();
    expect(within(dialog).queryByText('Harborview SC')).not.toBeInTheDocument();
    expect(within(dialog).getByText('Porto Velho')).toBeInTheDocument();
  });

  it('adds the picked teams to the roster, and says so', async () => {
    const dialog = await openPicker();
    await userEvent.click(within(dialog).getByText('Porto Velho'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add 1 team' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(rosterRows()).toHaveLength(3);
    expect(rosterRows()[2]).toHaveTextContent('Porto Velho');
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
    expect(statusLine()).toBe('Added 1 team to Liga Norte 2026-27.');
  });

  it('shows the new name of a picked team whose name a Season team has', async () => {
    const dialog = await openPicker();
    await userEvent.click(within(dialog).getByText('Salt Marsh United'));
    expect(dialog).toHaveTextContent(
      '"Salt Marsh United" from Westbury joins as "Salt Marsh United (Westbury)".'
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add 1 team' }));
    expect(rosterRows()[2]).toHaveTextContent('Salt Marsh United (Westbury)');
  });
});

describe('SeasonViewScreen: the edit drawer (US-13.4, demo point 10)', () => {
  async function openDrawer(): Promise<HTMLElement> {
    openWithSeason();
    render(<SeasonViewScreen uuid={SEASON} />);
    await screen.findByRole('heading', { level: 1, name: 'Liga Norte' });
    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Salt Marsh United' })
    );
    return screen.getByRole('dialog', { name: 'Edit Season team' });
  }

  it('names the leagues that the change reaches', async () => {
    const drawer = await openDrawer();
    expect(drawer).toHaveTextContent(
      'The change reaches every league of this Season: Coastal Premier.'
    );
    expect(within(drawer).getByLabelText('Slug')).toHaveValue('salt-marsh-united');
  });

  it('saves a new OVR and trigram, and says so', async () => {
    const drawer = await openDrawer();
    const ovr = within(drawer).getByLabelText('OVR (70 to 79)');
    await userEvent.clear(ovr);
    await userEvent.type(ovr, '79');
    const trigram = within(drawer).getByLabelText('Trigram');
    await userEvent.clear(trigram);
    await userEvent.type(trigram, 'sal');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      within(rosterRows()[0]).getByLabelText('Tier B, OVR 79')
    ).toBeInTheDocument();
    expect(rosterRows()[0]).toHaveTextContent('SAL');
    expect(statusLine()).toBe('Saved Salt Marsh United.');
  });

  it('rolls a new OVR on a Tier change', async () => {
    const drawer = await openDrawer();
    await userEvent.selectOptions(within(drawer).getByLabelText('Tier'), 'S');
    const ovr = Number(
      (within(drawer).getByLabelText('OVR (90 to 99)') as HTMLInputElement).value
    );
    expect(ovr).toBeGreaterThanOrEqual(90);
    expect(ovr).toBeLessThanOrEqual(99);
  });

  it('shows each problem next to its field, and saves nothing', async () => {
    const drawer = await openDrawer();
    const name = within(drawer).getByLabelText('Team name');
    await userEvent.clear(name);
    await userEvent.type(name, 'harborview sc');
    const ovr = within(drawer).getByLabelText('OVR (70 to 79)');
    await userEvent.clear(ovr);
    await userEvent.type(ovr, '50');
    const trigram = within(drawer).getByLabelText('Trigram');
    await userEvent.clear(trigram);
    await userEvent.type(trigram, 'HAR');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    const alerts = within(drawer)
      .getAllByRole('alert')
      .map((alert) => alert.textContent);
    expect(alerts).toEqual([
      'Another team of this Season has this name.',
      'Use a whole number from 70 to 79.',
      'Another team of this Season has this trigram.',
    ]);
    expect(
      within(rosterRows()[0]).getByLabelText('Tier B, OVR 74')
    ).toBeInTheDocument();
  });
});

describe('SeasonViewScreen: finish and reopen (US-13.9, demo points 5 and 6)', () => {
  it('finishes the Season after a confirm, and makes it read only', async () => {
    openWithSeason();
    render(<SeasonViewScreen uuid={SEASON} />);
    await screen.findByRole('heading', { level: 1, name: 'Liga Norte' });
    await userEvent.click(screen.getByRole('button', { name: 'Finish Season' }));
    const confirm = screen.getByRole('dialog', { name: 'Finish Liga Norte 2026-27?' });
    await userEvent.click(
      within(confirm).getByRole('button', { name: 'Finish Season' })
    );

    expect(screen.getByText('Finished')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This Season is finished. It is read only. Reopen it to change it.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add teams' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Edit Salt Marsh United' })
    ).toBeDisabled();
    expect(statusLine()).toBe('Finished Liga Norte 2026-27.');
  });

  it('reopens a finished Season with no confirm', async () => {
    openWithSeason();
    render(<SeasonViewScreen uuid={SEASON} />);
    await screen.findByRole('heading', { level: 1, name: 'Liga Norte' });
    await userEvent.click(screen.getByRole('button', { name: 'Finish Season' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Finish Season' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reopen Season' }));

    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add teams' })).toBeEnabled();
    expect(statusLine()).toBe('Reopened Liga Norte 2026-27.');
  });
});
