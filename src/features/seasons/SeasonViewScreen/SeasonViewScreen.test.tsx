import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { SeasonWrapper, TeamBlueprint } from '@/domain';
import type { TieRules } from '@/engine/tiebreak';
import { ROUTES } from '@/app/routes';
import { serializeSeasonWrapper } from '@/app/data/databaseFile';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { createSeason } from '@/app/state/seasonActions';
import { useStatusLineStore } from '@/app/state/statusLineStore';
import {
  blueprint,
  HARBORVIEW,
  LEAGUE,
  openTestDatabase,
  result,
  SALT_MARSH,
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

  it('shows the Teams, Playoffs, and Resume tabs (Tasks 213, 220, 221)', async () => {
    openWithSeason();
    render(<SeasonViewScreen uuid={SEASON} />);
    await screen.findByRole('heading', { level: 1, name: 'Liga Norte' });
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Teams',
      'Playoffs',
      'Resume',
    ]);
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

describe('SeasonViewScreen: "+ New league" (US-13.5, Task 218 choice 2)', () => {
  it('links to the wizard in the Season', async () => {
    openWithSeason();
    render(<SeasonViewScreen uuid={SEASON} />);

    const link = await screen.findByRole('link', { name: '+ New league' });
    expect(link).toHaveAttribute('href', `/seasons/${SEASON}/leagues/new`);
  });

  it('is disabled for a finished Season (US-13.9)', async () => {
    const finished = seasonWrapper();
    finished.content.finished = true;
    openWithSeason({ season: finished });
    render(<SeasonViewScreen uuid={SEASON} />);

    expect(await screen.findByRole('button', { name: '+ New league' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: '+ New league' })).toBeNull();
  });
});

describe('SeasonViewScreen: the league cards (US-13.3, Task 219 choices 6 and 7)', () => {
  it('shows one card for each Season league, with its link to League Detail', async () => {
    openWithSeason();
    render(<SeasonViewScreen uuid={SEASON} />);

    const section = await screen.findByRole('region', { name: 'Leagues' });
    expect(
      within(section).getByRole('heading', { name: 'Coastal Premier' })
    ).toBeInTheDocument();
    expect(
      within(section).getByRole('link', { name: 'Open standings' })
    ).toHaveAttribute('href', `/seasons/${SEASON}/leagues/${LEAGUE}`);
    expect(within(section).queryByText('No leagues yet.')).toBeNull();
  });
});

describe('SeasonViewScreen: the Playoffs tab (US-13.7, Task 220)', () => {
  const TWO_LEGS: TieRules = {
    format: 'two-legged',
    awayGoals: true,
    playsAet: true,
    method: 'penalties',
    homeAdvantage: true,
  };

  /** A Season with one played two-legged playoff, decided on penalties
   * after extra time, and one open single match. */
  function seasonWithPlayoffs(finished = false): SeasonWrapper {
    const wrapper = seasonWrapper();
    wrapper.content.finished = finished;
    wrapper.content.playoffs = [
      {
        uuid: testUuid(31),
        name: 'Supertaça',
        team1Uuid: SALT_MARSH,
        team2Uuid: HARBORVIEW,
        rules: TWO_LEGS,
        result: {
          matches: [
            {
              part: 'leg1',
              homeId: SALT_MARSH,
              awayId: HARBORVIEW,
              score: { homeGoals: 1, awayGoals: 0 },
            },
            {
              part: 'leg2',
              homeId: HARBORVIEW,
              awayId: SALT_MARSH,
              score: { homeGoals: 1, awayGoals: 0 },
              aet: { homeGoals: 0, awayGoals: 0 },
            },
          ],
          penalties: { homeGoals: 3, awayGoals: 4 },
          winnerId: SALT_MARSH,
          loserId: HARBORVIEW,
          decidedBy: 'penalties',
        },
      },
      {
        uuid: testUuid(32),
        name: 'Taça de Honra',
        team1Uuid: HARBORVIEW,
        team2Uuid: SALT_MARSH,
        rules: {
          ...TWO_LEGS,
          format: 'single-match',
          awayGoals: false,
          homeAdvantage: false,
        },
      },
    ];
    return wrapper;
  }

  async function openPlayoffs(season: SeasonWrapper): Promise<void> {
    openWithSeason({ season });
    render(<SeasonViewScreen uuid={SEASON} />);
    await userEvent.click(await screen.findByRole('tab', { name: 'Playoffs' }));
  }

  const playoffs = (): SeasonWrapper['content']['playoffs'] =>
    useDatabaseStore.getState().seasons[SEASON].content.playoffs;

  it('shows one row for each playoff, with its head, its score, and its status', async () => {
    await openPlayoffs(seasonWithPlayoffs());

    const played = screen.getByRole('article', { name: 'Supertaça' });
    expect(
      within(played).getByText(
        'Two-legged · Away goals rule · Plays AET · Penalties · Home adv. on'
      )
    ).toBeInTheDocument();
    expect(within(played).getByText('1 - 1')).toBeInTheDocument();
    expect(within(played).getByText('1-0, 0-1* · Pens 4-3')).toBeInTheDocument();
    expect(within(played).getAllByText('✓ Played').length).toBeGreaterThan(0);
    expect(within(played).queryByRole('button', { name: 'Play' })).toBeNull();
    expect(screen.getByText('* after extra time')).toBeInTheDocument();
  });

  it('shows the Location of a team in a hint, as the fixtures do (Task 180)', async () => {
    await openPlayoffs(seasonWithPlayoffs());

    const played = screen.getByRole('article', { name: 'Supertaça' });
    await userEvent.hover(within(played).getByText('Salt Marsh United'));

    expect(screen.getByRole('tooltip')).toHaveTextContent('Ashfield');
  });

  it('plays an open playoff, and says who wins', async () => {
    await openPlayoffs(seasonWithPlayoffs());

    const open = screen.getByRole('article', { name: 'Taça de Honra' });
    expect(within(open).getByText('vs')).toBeInTheDocument();
    await userEvent.click(within(open).getByRole('button', { name: 'Play' }));

    expect(playoffs()[1].result).toBeDefined();
    expect(statusLine()).toMatch(/^Played Taça de Honra: .+ wins\.$/);
  });

  it('shows "+ New playoff" on the Playoffs tab, and "+ Add teams" on the Teams tab', async () => {
    await openPlayoffs(seasonWithPlayoffs());

    expect(screen.getByRole('button', { name: '+ New playoff' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Add teams' })).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Teams' }));
    expect(screen.getByRole('button', { name: '+ Add teams' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ New playoff' })).toBeNull();
  });

  it('says so with no playoff', async () => {
    await openPlayoffs(seasonWrapper());

    expect(screen.getByText('No playoffs yet.')).toBeInTheDocument();
  });

  it('creates a playoff from the dialog, with the team picker', async () => {
    await openPlayoffs(seasonWrapper());
    await userEvent.click(screen.getByRole('button', { name: '+ New playoff' }));
    const dialog = screen.getByRole('dialog', { name: 'New playoff' });
    const create = within(dialog).getByRole('button', { name: 'Create playoff' });
    expect(create).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText('Name'), 'Supertaça');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Team 1' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Pick team 1' })).getByRole('button', {
        name: 'Salt Marsh United',
      })
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Team 2' }));
    const picker = screen.getByRole('dialog', { name: 'Pick team 2' });
    const taken = within(picker).getByRole('button', { name: 'Salt Marsh United' });
    expect(taken).toBeDisabled();
    expect(within(taken).getByText('Team 1')).toBeInTheDocument();
    await userEvent.click(
      within(picker).getByRole('button', { name: 'Harborview SC' })
    );
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Two-legged' }));
    await userEvent.click(
      within(dialog).getByRole('switch', { name: 'Away goals rule' })
    );
    await userEvent.click(create);

    expect(playoffs()).toEqual([
      {
        uuid: expect.any(String),
        name: 'Supertaça',
        team1Uuid: SALT_MARSH,
        team2Uuid: HARBORVIEW,
        rules: {
          format: 'two-legged',
          awayGoals: true,
          playsAet: true,
          method: 'penalties',
          homeAdvantage: false,
        },
      },
    ]);
    expect(screen.queryByRole('dialog', { name: 'New playoff' })).toBeNull();
  });

  it('creates a playoff with the level of each slot (US-14.3, Task 229)', async () => {
    await openPlayoffs(seasonWrapper());
    await userEvent.click(screen.getByRole('button', { name: '+ New playoff' }));
    const dialog = screen.getByRole('dialog', { name: 'New playoff' });
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Supertaça');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Team 1' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Pick team 1' })).getByRole('button', {
        name: 'Harborview SC',
      })
    );
    const team1 = within(dialog).getByRole('radiogroup', {
      name: 'Condition of Team 1',
    });
    expect(within(dialog).queryByText('Crisis')).toBeNull();
    await userEvent.click(within(team1).getByRole('radio', { name: 'Level +1' }));
    // A new pick for the slot keeps its level (choice 5).
    await userEvent.click(within(dialog).getByRole('button', { name: 'Team 1' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Pick team 1' })).getByRole('button', {
        name: 'Salt Marsh United',
      })
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Team 2' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Pick team 2' })).getByRole('button', {
        name: 'Harborview SC',
      })
    );
    const team2 = within(dialog).getByRole('radiogroup', {
      name: 'Condition of Team 2',
    });
    await userEvent.click(
      within(team2).getByRole('radio', { name: 'Crisis, level -2' })
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Create playoff' })
    );

    expect(playoffs()[0].conditions).toEqual({ [SALT_MARSH]: 1, [HARBORVIEW]: -2 });
  });

  it('shows the away goals rule for a two-legged tie only', async () => {
    await openPlayoffs(seasonWrapper());
    await userEvent.click(screen.getByRole('button', { name: '+ New playoff' }));
    const dialog = screen.getByRole('dialog', { name: 'New playoff' });

    expect(
      within(dialog).queryByRole('switch', { name: 'Away goals rule' })
    ).toBeNull();
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Two-legged' }));
    expect(
      within(dialog).getByRole('switch', { name: 'Away goals rule' })
    ).toBeInTheDocument();
  });

  it('says so for a taken name, and keeps "Create playoff" off', async () => {
    await openPlayoffs(seasonWithPlayoffs());
    await userEvent.click(screen.getByRole('button', { name: '+ New playoff' }));
    const dialog = screen.getByRole('dialog', { name: 'New playoff' });

    await userEvent.type(within(dialog).getByLabelText('Name'), ' supertaça');

    expect(
      within(dialog).getByText('Another playoff of this Season has this name.')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Create playoff' })
    ).toBeDisabled();
  });

  it('turns off "+ New playoff" and "Play" in a finished Season (US-13.9)', async () => {
    await openPlayoffs(seasonWithPlayoffs(true));

    expect(screen.getByRole('button', { name: '+ New playoff' })).toBeDisabled();
    const open = screen.getByRole('article', { name: 'Taça de Honra' });
    expect(within(open).getByRole('button', { name: 'Play' })).toBeDisabled();
  });
});

describe('SeasonViewScreen: the Resume tab (US-13.8, Task 221)', () => {
  async function openResume(season: SeasonWrapper): Promise<void> {
    openWithSeason({ season });
    render(<SeasonViewScreen uuid={SEASON} />);
    await userEvent.click(await screen.findByRole('tab', { name: 'Resume' }));
  }

  it('shows one card for each league, as a link to its League Detail', async () => {
    await openResume(seasonWrapper());

    const card = screen.getByRole('link', { name: /Coastal Premier/ });
    expect(card).toHaveAttribute('href', `/seasons/${SEASON}/leagues/${LEAGUE}`);
    expect(within(card).getByText('No results yet.')).toBeInTheDocument();
  });

  it('shows the team in first place of a running league', async () => {
    const season = seasonWrapper();
    season.content.leagues[0].phases[0].results = [
      result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW),
    ];
    await openResume(season);

    const card = screen.getByRole('link', { name: /Coastal Premier/ });
    expect(within(card).getByText('Salt Marsh United')).toBeInTheDocument();
    expect(within(card).getByText('First place now')).toBeInTheDocument();
  });

  it('says so for a Season with no league, and has no tab row action', async () => {
    const season = seasonWrapper();
    season.content.leagues = [];
    await openResume(season);

    expect(screen.getAllByText('No leagues yet.').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: '+ New playoff' })).toBeNull();
    expect(screen.queryByRole('button', { name: '+ Add teams' })).toBeNull();
  });
});
