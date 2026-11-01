import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JSX } from 'preact';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { TeamInstance } from '@/domain';
import { TIER_OVR_RANGES } from '@/engine/tier-ovr';
import * as slugListTxt from '@/app/data/slugListTxt';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { useFileStore } from '@/app/state/fileStore';
import { openTestDatabase, testUuid } from '@/test/databaseRecords';
import { useTeamList } from '@/features/leagues/LeagueSetupScreen/useTeamList';
import { TeamsStep } from './TeamsStep';

const summary = {
  name: 'Coastal Premier',
  homeAdvantage: true,
  points: { win: 3, draw: 1, loss: 0 },
  onBack: vi.fn(),
  onNext: vi.fn(),
};

/** The Teams step with the real team list hook of the wizard, so an add
 * shows in the list. `onTeams` sees each new list. */
function Harness({
  initial = [],
  onTeams,
  ...props
}: Partial<typeof summary> & {
  initial?: TeamInstance[];
  onTeams?: (teams: readonly TeamInstance[]) => void;
}): JSX.Element {
  const list = useTeamList(initial);
  onTeams?.(list.teams);
  return (
    <TeamsStep
      {...summary}
      {...props}
      teams={list.teams}
      fixedTrigrams={list.fixedTrigrams}
      onAddTeams={list.addTeams}
      onRemoveTeam={list.removeTeam}
      onSwitchTeam={list.switchTeam}
      onUpdateTeam={list.updateTeam}
    />
  );
}

const ASHFIELD = {
  slug: 'ashfield-rovers',
  name: 'Ashfield Rovers',
  colour: '#E53935',
  tier: 'B' as const,
  location: 'Ashfield',
};
const HARBORVIEW = {
  slug: 'harborview-sc',
  name: 'Harborview SC',
  colour: '#1565C0',
  tier: 'C' as const,
};
const TOWN = {
  slug: 'old-town',
  name: 'Old Town',
  colour: '#000000',
  tier: 'F' as const,
};

let latest: readonly TeamInstance[] = [];
const track = (teams: readonly TeamInstance[]): void => {
  latest = teams;
};

const teamRows = (): HTMLElement[] =>
  within(screen.getByRole('table', { name: 'Teams' }))
    .getAllByRole('row')
    .slice(1);

beforeEach(() => {
  vi.restoreAllMocks();
  latest = [];
  openTestDatabase([ASHFIELD, HARBORVIEW, TOWN]);
  useFileStore.setState({ status: null });
});

describe('TeamsStep, the empty states (US-08.3)', () => {
  it('asks for a first team when no Blueprint exists', () => {
    openTestDatabase([]);
    render(<Harness />);
    expect(
      screen.getByText('No teams yet. Create your first team.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '+ Create new team' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '+ Add teams' })
    ).not.toBeInTheDocument();
  });

  it('adds the first team to the list, with a rolled OVR', async () => {
    openTestDatabase([]);
    render(<Harness onTeams={track} />);
    await userEvent.click(screen.getByRole('button', { name: '+ Create new team' }));
    await userEvent.type(screen.getByLabelText('Team name'), 'Redbrick Athletic');
    await userEvent.click(screen.getByText('Create team'));

    expect(useDatabaseStore.getState().blueprints.map((b) => b.slug)).toEqual([
      'redbrick-athletic',
    ]);
    expect(teamRows()).toHaveLength(1);
    expect(latest[0]).toMatchObject({ slug: 'redbrick-athletic', tier: 'C' });
    expect(latest[0].ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES.C.min);
  });

  it('shows the three ways in when Blueprints exist and the list is empty', () => {
    render(<Harness />);
    expect(screen.getByText('No teams added yet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Add teams from your saved blueprints, or create new ones on the fly.'
      )
    ).toBeInTheDocument();
    for (const name of ['+ Add teams', 'Load them all', 'Import slug list']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole('table', { name: 'Teams' })).not.toBeInTheDocument();
  });
});

describe('TeamsStep, the team list (US-08.1)', () => {
  it('shows each Instance: name, Location, and Tier, with no OVR, and the count', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    const [ashfield] = teamRows();
    expect(ashfield).toHaveTextContent('Ashfield Rovers');
    expect(ashfield).toHaveTextContent('Ashfield');
    expect(ashfield).toHaveTextContent('B');
    expect(screen.queryByRole('columnheader', { name: 'OVR' })).not.toBeInTheDocument();
    expect(screen.getByText('3 teams')).toBeInTheDocument();
  });

  it('removes a team with ✕, and the Blueprint is available again', async () => {
    render(<Harness onTeams={track} />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove Harborview SC' }));

    expect(latest.map((t) => t.name)).toEqual(['Ashfield Rovers', 'Old Town']);
    expect(screen.getByText('2 teams')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load them all' })).toBeEnabled();
  });

  it('disables Next with an empty list', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Next: Review →' })).toBeDisabled();
  });
});

describe('TeamsStep, the add dialog (US-08.1)', () => {
  async function openDialog(): Promise<HTMLElement> {
    await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
    return screen.getByRole('dialog', { name: 'Add teams' });
  }

  it('lists the available Blueprints, and searches the name or the Location', async () => {
    render(<Harness />);
    const dialog = await openDialog();
    expect(dialog).toHaveAccessibleDescription(
      'Pick teams from your saved blueprints.'
    );
    const available = within(dialog).getByRole('region', { name: 'Available' });
    for (const name of ['Ashfield Rovers', 'Harborview SC', 'Old Town']) {
      expect(within(available).getByRole('button', { name })).toBeInTheDocument();
    }
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Search' }),
      'ASHF'
    );
    expect(
      within(available).getByRole('button', { name: 'Ashfield Rovers' })
    ).toBeInTheDocument();
    expect(
      within(available).queryByRole('button', { name: 'Old Town' })
    ).not.toBeInTheDocument();
  });

  it('adds the selected teams in the order of selection, each with a rolled OVR', async () => {
    render(<Harness onTeams={track} />);
    const dialog = await openDialog();
    expect(within(dialog).getByRole('button', { name: 'Add teams' })).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Old Town' }));
    expect(within(dialog).getByRole('button', { name: 'Add 1 team' })).toBeEnabled();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Ashfield Rovers' })
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add 2 teams' }));

    expect(screen.queryByRole('dialog', { name: 'Add teams' })).not.toBeInTheDocument();
    expect(latest.map((t) => t.name)).toEqual(['Old Town', 'Ashfield Rovers']);
    for (const team of latest) {
      expect(team.ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES[team.tier].min);
      expect(team.ovr).toBeLessThanOrEqual(TIER_OVR_RANGES[team.tier].max);
    }
  });

  it('adds nothing on Cancel', async () => {
    render(<Harness onTeams={track} />);
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Old Town' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(latest).toEqual([]);
  });

  it('lists only the Blueprints that are not in the list', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove Old Town' }));
    const dialog = await openDialog();
    const available = within(dialog).getByRole('region', { name: 'Available' });
    expect(
      within(available).getByRole('button', { name: 'Old Town' })
    ).toBeInTheDocument();
    expect(
      within(available).queryByRole('button', { name: 'Harborview SC' })
    ).not.toBeInTheDocument();
  });

  it('creates a team inside the dialog, and selects it', async () => {
    render(<Harness onTeams={track} />);
    const dialog = await openDialog();
    await userEvent.click(
      within(dialog).getByRole('button', { name: '+ Create new team' })
    );
    await userEvent.type(screen.getByLabelText('Team name'), 'Redbrick Athletic');
    await userEvent.click(screen.getByText('Create team'));

    const selected = within(dialog).getByRole('region', { name: 'Selected (1)' });
    expect(selected).toHaveTextContent('Redbrick Athletic');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add 1 team' }));
    expect(latest.map((t) => t.slug)).toEqual(['redbrick-athletic']);
  });
});

describe('TeamsStep, Load them all (US-08.2)', () => {
  it('adds every available Blueprint in the Teams module order, and keeps the list', async () => {
    const kept: TeamInstance = {
      blueprintUuid: testUuid(2),
      slug: 'harborview-sc',
      name: 'Harborview SC',
      colour: '#1565C0',
      tier: 'C',
      ovr: 64,
      trigram: '',
    };
    render(<Harness initial={[kept]} onTeams={track} />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    expect(latest.map((t) => t.name)).toEqual([
      'Harborview SC',
      'Ashfield Rovers',
      'Old Town',
    ]);
    expect(latest[0]).toBe(kept);
  });

  it('is disabled when no Blueprint is available', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    expect(screen.getByRole('button', { name: 'Load them all' })).toBeDisabled();
  });
});

describe('TeamsStep, Import slug list (US-08.7)', () => {
  it('adds the found teams in file order, gives the counts, and lists the slugs not found', async () => {
    vi.spyOn(slugListTxt, 'importSlugListTxt').mockResolvedValue([
      'OLD-TOWN',
      'north-fc',
      'old-town',
      'ashfield-rovers',
      'rivertown',
    ]);
    render(<Harness onTeams={track} />);
    await userEvent.click(screen.getByRole('button', { name: 'Import slug list' }));

    expect(latest.map((t) => t.slug)).toEqual(['old-town', 'ashfield-rovers']);
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: '2 teams added. 1 already in the list.',
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      '2 slugs not found: north-fc, rivertown'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close the notice' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses the singular, and shows no "already" part or notice when it does not apply', async () => {
    vi.spyOn(slugListTxt, 'importSlugListTxt').mockResolvedValue(['old-town']);
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Import slug list' }));
    expect(useFileStore.getState().status?.message).toBe('1 team added.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows one slug not found in the singular', async () => {
    vi.spyOn(slugListTxt, 'importSlugListTxt').mockResolvedValue(['north-fc']);
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Import slug list' }));
    expect(screen.getByRole('alert')).toHaveTextContent('1 slug not found: north-fc');
  });

  it('shows an error and adds nothing for a file with no slug', async () => {
    vi.spyOn(slugListTxt, 'importSlugListTxt').mockResolvedValue([]);
    render(<Harness onTeams={track} />);
    await userEvent.click(screen.getByRole('button', { name: 'Import slug list' }));
    expect(latest).toEqual([]);
    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'The file has no slugs.',
    });
  });

  it('shows the line error of a bad file in the status line', async () => {
    vi.spyOn(slugListTxt, 'importSlugListTxt').mockRejectedValue(
      new Error('Slug list line 2, "north fc", is not a slug.')
    );
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Import slug list' }));
    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Slug list line 2, "north fc", is not a slug.',
    });
  });

  it('changes nothing on Cancel', async () => {
    vi.spyOn(slugListTxt, 'importSlugListTxt').mockResolvedValue(null);
    render(<Harness onTeams={track} />);
    await userEvent.click(screen.getByRole('button', { name: 'Import slug list' }));
    expect(latest).toEqual([]);
    expect(useFileStore.getState().status).toBeNull();
  });
});

describe('TeamsStep, the live trigram pick (US-09.6, Task 121)', () => {
  it('shows the trigram that each team gets, in a Trigram column', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    expect(screen.getByRole('columnheader', { name: 'Trigram' })).toBeInTheDocument();
    expect(
      teamRows().map((row) => within(row).getAllByRole('cell')[1].textContent)
    ).toEqual(['ASH', 'HAR', 'OLD']);
  });

  it('marks a team with the digit fallback, with the hint', async () => {
    openTestDatabase([
      ASHFIELD,
      { slug: 'ashby', name: 'Ashby', colour: '#fff', tier: 'D' },
    ]);
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    const ashby = teamRows()[1];
    expect(within(ashby).getAllByRole('cell')[1]).toHaveTextContent('AS2');
    expect(within(ashby).getByText('⚠')).toHaveAccessibleDescription(
      'No free trigram. Add an alternative to the team.'
    );
    expect(within(teamRows()[0]).queryByText('⚠')).not.toBeInTheDocument();
  });
});

describe('TeamsStep, Switch (US-08.5, Task 121)', () => {
  async function openSwitch(name: string): Promise<HTMLElement> {
    await userEvent.click(screen.getByRole('button', { name: `Switch ${name}` }));
    return screen.getByRole('dialog', { name: 'Switch team' });
  }

  it('lists only the available Blueprints, with the team in the slot', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
    const add = screen.getByRole('dialog', { name: 'Add teams' });
    await userEvent.click(within(add).getByRole('button', { name: 'Harborview SC' }));
    await userEvent.click(within(add).getByRole('button', { name: 'Add 1 team' }));

    const dialog = await openSwitch('Harborview SC');
    expect(dialog).toHaveTextContent(
      'Pick a replacement from Available — this closes the dialog right away.'
    );
    expect(
      within(dialog).getByRole('region', { name: 'Currently in slot' })
    ).toHaveTextContent('Harborview SC');
    const available = within(dialog).getByRole('region', { name: 'Available' });
    expect(
      within(available).queryByRole('button', { name: 'Harborview SC' })
    ).toBeNull();
    expect(
      within(available).getByRole('button', { name: 'Old Town' })
    ).toBeInTheDocument();
  });

  it('replaces the team in its place at once, with a rolled OVR, and closes the dialog', async () => {
    render(<Harness onTeams={track} />);
    await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
    const add = screen.getByRole('dialog', { name: 'Add teams' });
    await userEvent.click(within(add).getByRole('button', { name: 'Ashfield Rovers' }));
    await userEvent.click(within(add).getByRole('button', { name: 'Harborview SC' }));
    await userEvent.click(within(add).getByRole('button', { name: 'Add 2 teams' }));

    const dialog = await openSwitch('Ashfield Rovers');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Old Town' }));

    expect(
      screen.queryByRole('dialog', { name: 'Switch team' })
    ).not.toBeInTheDocument();
    expect(latest.map((t) => t.name)).toEqual(['Old Town', 'Harborview SC']);
    expect(latest[0].ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES.F.min);
    expect(latest[0].ovr).toBeLessThanOrEqual(TIER_OVR_RANGES.F.max);
  });

  it('replaces the team with a new Blueprint made in the dialog', async () => {
    render(<Harness onTeams={track} />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    const dialog = await openSwitch('Harborview SC');
    await userEvent.click(
      within(dialog).getByRole('button', { name: '+ Create new team' })
    );
    await userEvent.type(screen.getByLabelText('Team name'), 'Redbrick Athletic');
    await userEvent.click(screen.getByText('Create team'));

    expect(
      screen.queryByRole('dialog', { name: 'Switch team' })
    ).not.toBeInTheDocument();
    expect(latest.map((t) => t.name)).toEqual([
      'Ashfield Rovers',
      'Redbrick Athletic',
      'Old Town',
    ]);
  });
});

describe('TeamsStep, Edit for this league (US-08.4, Task 172)', () => {
  async function openEdit(name: string): Promise<HTMLElement> {
    await userEvent.click(screen.getByRole('button', { name: `Edit ${name}` }));
    return screen.getByRole('dialog', { name: 'Edit team for this league' });
  }

  it('changes the Instance in the list, and never the Blueprint', async () => {
    render(<Harness onTeams={track} />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    const blueprintsBefore = useDatabaseStore.getState().blueprints;
    await openEdit('Old Town');
    await userEvent.clear(screen.getByLabelText('Team name'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Old Town FC');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      screen.queryByRole('dialog', { name: 'Edit team for this league' })
    ).not.toBeInTheDocument();
    expect(latest.map((t) => t.name)).toEqual([
      'Ashfield Rovers',
      'Harborview SC',
      'Old Town FC',
    ]);
    expect(useDatabaseStore.getState().blueprints).toBe(blueprintsBefore);
  });

  it('runs the trigram pick again with a fixed trigram', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    await openEdit('Ashfield Rovers');
    await userEvent.type(screen.getByLabelText('Trigram (optional)'), 'har');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      teamRows().map((row) =>
        within(row).getAllByRole('cell')[1].textContent?.slice(0, 3)
      )
    ).toEqual(['HAR', 'HA2', 'OLD']);
  });

  it('refuses a name that another team of the list has', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    await openEdit('Old Town');
    await userEvent.clear(screen.getByLabelText('Team name'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Harborview SC');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Another team of this league has this name.'
    );
  });

  it('drops the fixed trigram of a removed team, so a new add takes the pick', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    await openEdit('Ashfield Rovers');
    await userEvent.type(screen.getByLabelText('Trigram (optional)'), 'har');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Ashfield Rovers' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));

    // Ashfield is last now. With "HAR" still fixed, it would show HAR.
    expect(
      teamRows().map((row) => within(row).getAllByRole('cell')[1].textContent)
    ).toEqual(['HAR', 'OLD', 'ASH']);
  });
});

describe('TeamsStep, the start warning (US-08.6, Task 121)', () => {
  it('warns with 1 team, and still allows Next', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
    const add = screen.getByRole('dialog', { name: 'Add teams' });
    await userEvent.click(within(add).getByRole('button', { name: 'Old Town' }));
    await userEvent.click(within(add).getByRole('button', { name: 'Add 1 team' }));

    expect(
      screen.getByText('The league needs at least 2 teams to start.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next: Review →' })).toBeEnabled();
  });

  it('shows no warning with 2 teams', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    expect(
      screen.queryByText('The league needs at least 2 teams to start.')
    ).not.toBeInTheDocument();
  });
});

describe('TeamsStep, the league summary from the Details step', () => {
  it('shows the league name and the settings chips', () => {
    render(<Harness />);
    expect(screen.getByText('Coastal Premier')).toBeInTheDocument();
    expect(screen.getByText('Home adv. on')).toBeInTheDocument();
    expect(screen.getByText('3/1/0 pts')).toBeInTheDocument();
  });

  it('shows the other values when they change', () => {
    render(<Harness homeAdvantage={false} points={{ win: 2, draw: 1, loss: 0 }} />);
    expect(screen.getByText('Home adv. off')).toBeInTheDocument();
    expect(screen.getByText('2/1/0 pts')).toBeInTheDocument();
  });

  it('shows Untitled league for a blank name, as the Review step does', () => {
    render(<Harness name="" />);
    expect(screen.getByText('Untitled league')).toBeInTheDocument();
  });
});
