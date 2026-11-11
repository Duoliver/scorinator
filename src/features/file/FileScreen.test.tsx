import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { FileScreen } from './FileScreen';
import * as csvIO from '@/app/data/teamsCsv';
import * as databaseZip from '@/app/data/databaseZip';
import * as exportFile from '@/app/data/exportFile';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { useStatusLineStore } from '@/app/state/statusLineStore';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import type { LeagueWrapper, TeamBlueprint } from '@/domain';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  LEAGUE,
  leagueWrapper,
  openTestDatabase,
  openTestLeague,
  OTHER_LEAGUE,
  SALT_MARSH,
  teamFields,
} from '@/test/databaseRecords';

const THIRD_LEAGUE = '00000000-0000-4000-8000-0000000000b3';
const harborview = blueprint({
  uuid: HARBORVIEW,
  slug: 'harborview-sc',
  name: 'Harborview SC',
});

const state = (): ReturnType<typeof useDatabaseStore.getState> =>
  useDatabaseStore.getState();
const statusMessage = (): string | undefined =>
  useStatusLineStore.getState().status?.message;

function named(wrapper: LeagueWrapper, name: string): LeagueWrapper {
  return { ...wrapper, content: { ...wrapper.content, name } };
}

function setBlueprints(blueprints: TeamBlueprint[]): void {
  useDatabaseStore.setState({ blueprints, savedBlueprints: blueprints });
}

function leagueFile(...leagues: LeagueWrapper[]): void {
  vi.spyOn(exportFile, 'openLeagueImportFile').mockResolvedValue({
    leagues,
    blueprints: [],
  });
}

const click = async (name: string): Promise<void> => {
  await userEvent.click(screen.getByRole('button', { name }));
};

/** The card with this title. Each card has its own buttons. */
const card = (title: string): HTMLElement => screen.getByRole('group', { name: title });

beforeEach(() => {
  vi.restoreAllMocks();
  openTestDatabase([]);
  useStatusLineStore.setState({ status: null });
});

describe('FileScreen: the layout (US-10.2, US-10.4)', () => {
  it('shows the three sections and the page text', () => {
    render(<FileScreen />);
    for (const name of ['Leagues', 'Team Blueprints', 'Database']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    expect(
      screen.getByText(
        "Bulk export/import for leagues, team blueprints, and the whole database. Exporting a single league is on that league's Detail screen."
      )
    ).toBeInTheDocument();
  });

  it('has each card', () => {
    render(<FileScreen />);
    for (const name of [
      'Export all leagues',
      'Import leagues',
      'Export all team blueprints',
      'Import teams',
      'Quick team list (CSV)',
      'Export entire database',
      'Import entire database',
    ]) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    }
  });

  it('has no results export, no league selector, and no league save or load', () => {
    render(<FileScreen />);
    for (const name of ['Export results', 'Save league', 'Load league']) {
      expect(screen.queryByRole('heading', { name })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Import JSON...' })
    ).not.toBeInTheDocument();
  });

  it('describes the quick CSV with Location, and no City', () => {
    render(<FileScreen />);
    expect(
      screen.getByText(
        'ID/slug, Name, Colours, Tier, Location (optional). No provenance — for fast bulk edits, not identity-tracked sharing.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/City/)).not.toBeInTheDocument();
  });

  it('describes the database without the later scopes', () => {
    render(<FileScreen />);
    expect(
      screen.getByText('Everything — team blueprints and leagues, with their teams.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Merges into your local database — never a wholesale replace.')
    ).toBeInTheDocument();
  });

  it('turns each export off when it has nothing to export', () => {
    render(<FileScreen />);
    for (const title of [
      'Export all leagues',
      'Export all team blueprints',
      'Export entire database',
    ]) {
      expect(within(card(title)).getByRole('button')).toBeDisabled();
    }
    expect(screen.getByRole('button', { name: 'Export .csv' })).toBeDisabled();
  });

  it('turns the league and database exports on with a league', () => {
    openTestLeague(leagueWrapper());
    render(<FileScreen />);
    expect(within(card('Export all leagues')).getByRole('button')).toBeEnabled();
    expect(within(card('Export entire database')).getByRole('button')).toBeEnabled();
    expect(
      within(card('Export all team blueprints')).getByRole('button')
    ).toBeDisabled();
  });

  it('turns the team and database exports on with a Blueprint', () => {
    setBlueprints([blueprint()]);
    render(<FileScreen />);
    expect(
      within(card('Export all team blueprints')).getByRole('button')
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Export .csv' })).toBeEnabled();
    expect(within(card('Export entire database')).getByRole('button')).toBeEnabled();
    expect(within(card('Export all leagues')).getByRole('button')).toBeDisabled();
  });
});

describe('FileScreen: the quick CSV (Task 75)', () => {
  const RECORD = {
    slug: 'fc-united',
    name: 'FC United',
    colour: '#E53935',
    tier: 'B' as const,
  };

  it('imports with the confirm and the counts', async () => {
    vi.spyOn(csvIO, 'importTeamsCsv').mockResolvedValue([RECORD]);
    render(<FileScreen />);

    await click('Import .csv…');
    const dialog = await screen.findByRole('dialog', { name: 'Import teams?' });
    expect(dialog).toHaveAccessibleDescription('1 new, 0 updated. Continue?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Import' }));

    expect(
      await screen.findByText('Imported 1 team: 1 new, 0 updated.')
    ).toBeInTheDocument();
    expect(teamFields(state().blueprints)).toEqual([RECORD]);
  });

  it('shows the error and changes nothing when the read fails', async () => {
    vi.spyOn(csvIO, 'importTeamsCsv').mockRejectedValue(new Error('Bad CSV'));
    render(<FileScreen />);
    await click('Import .csv…');
    expect(await screen.findByText('Bad CSV')).toBeInTheDocument();
    expect(state().blueprints).toEqual([]);
  });

  it('changes nothing on Cancel in the confirm', async () => {
    vi.spyOn(csvIO, 'importTeamsCsv').mockResolvedValue([RECORD]);
    render(<FileScreen />);
    await click('Import .csv…');
    const dialog = await screen.findByRole('dialog', { name: 'Import teams?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(state().blueprints).toEqual([]);
  });

  it('exports the Blueprints to CSV', async () => {
    setBlueprints([blueprint()]);
    const write = vi.spyOn(csvIO, 'exportTeamsCsv').mockResolvedValue('/teams.csv');
    render(<FileScreen />);
    await click('Export .csv');
    expect(await screen.findByText('Saved to /teams.csv')).toBeInTheDocument();
    expect(write).toHaveBeenCalledOnce();
  });
});

describe('FileScreen: the bulk exports', () => {
  it('exports all leagues', async () => {
    openTestLeague(leagueWrapper());
    const save = vi.spyOn(exportFile, 'saveLeaguesFile').mockResolvedValue('/l.json');
    render(<FileScreen />);
    await userEvent.click(within(card('Export all leagues')).getByRole('button'));
    expect(await screen.findByText('Saved to /l.json')).toBeInTheDocument();
    expect(save.mock.calls[0][0].map((league) => league.uuid)).toEqual([LEAGUE]);
  });

  it('exports all team blueprints', async () => {
    setBlueprints([blueprint()]);
    const save = vi
      .spyOn(exportFile, 'saveBlueprintsFile')
      .mockResolvedValue('/b.json');
    render(<FileScreen />);
    await userEvent.click(
      within(card('Export all team blueprints')).getByRole('button')
    );
    expect(await screen.findByText('Saved to /b.json')).toBeInTheDocument();
    expect(save).toHaveBeenCalledOnce();
  });

  it('exports the database', async () => {
    setBlueprints([blueprint()]);
    const save = vi
      .spyOn(databaseZip, 'saveDatabaseZipFile')
      .mockResolvedValue('/d.zip');
    render(<FileScreen />);
    await userEvent.click(within(card('Export entire database')).getByRole('button'));
    expect(await screen.findByText('Saved to /d.zip')).toBeInTheDocument();
    expect(save.mock.calls[0][0]).toBeInstanceOf(Uint8Array);
  });

  it('says so when a save dialog is canceled', async () => {
    setBlueprints([blueprint()]);
    vi.spyOn(exportFile, 'saveBlueprintsFile').mockResolvedValue(null);
    render(<FileScreen />);
    await userEvent.click(
      within(card('Export all team blueprints')).getByRole('button')
    );
    expect(await screen.findByText('Export canceled.')).toBeInTheDocument();
  });
});

describe('FileScreen: Import leagues (US-10.3)', () => {
  const importLeagues = async (): Promise<void> => {
    await userEvent.click(within(card('Import leagues')).getByRole('button'));
  };

  it('imports nothing and shows no message when the file dialog is canceled', async () => {
    vi.spyOn(exportFile, 'openLeagueImportFile').mockResolvedValue(null);
    render(<FileScreen />);
    await importLeagues();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useStatusLineStore.getState().status).toBeNull();
  });

  it('skips the picker for a file with one league', async () => {
    leagueFile(leagueWrapper());
    render(<FileScreen />);
    await importLeagues();
    expect(await screen.findByText('1 league imported.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(Object.keys(state().leagues)).toEqual([LEAGUE]);
  });

  it('shows the error of a wrong file, and imports nothing', async () => {
    vi.spyOn(exportFile, 'openLeagueImportFile').mockRejectedValue(
      new Error('This is a team blueprints file. Use "Import teams" for it.')
    );
    render(<FileScreen />);
    await importLeagues();
    expect(
      await screen.findByText(
        'This is a team blueprints file. Use "Import teams" for it.'
      )
    ).toBeInTheDocument();
    expect(state().leagues).toEqual({});
  });

  it('opens the picker for many leagues, all checked, with each UUID', async () => {
    leagueFile(leagueWrapper(), named(leagueWrapper([], OTHER_LEAGUE), 'Inland Cup'));
    render(<FileScreen />);
    await importLeagues();

    const dialog = await screen.findByRole('dialog', { name: 'Import leagues' });
    expect(dialog).toHaveAccessibleDescription(
      'Found 2 in the file. Choose which to import.'
    );
    const boxes = within(dialog).getAllByRole('checkbox');
    expect(boxes).toHaveLength(2);
    for (const box of boxes) expect(box).toBeChecked();
    expect(within(dialog).getByText('Inland Cup')).toBeInTheDocument();
    expect(within(dialog).getByText(OTHER_LEAGUE)).toBeInTheDocument();
  });

  it('imports only the checked rows', async () => {
    leagueFile(leagueWrapper(), named(leagueWrapper([], OTHER_LEAGUE), 'Inland Cup'));
    render(<FileScreen />);
    await importLeagues();

    const dialog = await screen.findByRole('dialog', { name: 'Import leagues' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Inland Cup/ }));
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Import selected' })
    );

    expect(await screen.findByText('1 league imported.')).toBeInTheDocument();
    expect(Object.keys(state().leagues)).toEqual([LEAGUE]);
  });

  it('turns "Import selected" off with no row checked', async () => {
    leagueFile(leagueWrapper(), leagueWrapper([], OTHER_LEAGUE));
    render(<FileScreen />);
    await importLeagues();

    const dialog = await screen.findByRole('dialog', { name: 'Import leagues' });
    for (const box of within(dialog).getAllByRole('checkbox'))
      await userEvent.click(box);
    expect(
      within(dialog).getByRole('button', { name: 'Import selected' })
    ).toBeDisabled();
  });

  it('imports nothing on Cancel in the picker', async () => {
    leagueFile(leagueWrapper(), leagueWrapper([], OTHER_LEAGUE));
    render(<FileScreen />);
    await importLeagues();

    const dialog = await screen.findByRole('dialog', { name: 'Import leagues' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(state().leagues).toEqual({});
    expect(useStatusLineStore.getState().status).toBeNull();
  });

  it('tags a real conflict only, not a row with the same content (choice 2)', async () => {
    const same = openTestLeague(leagueWrapper());
    const other = openTestLeague(leagueWrapper([], OTHER_LEAGUE));
    leagueFile(same, named(other, 'Changed name'));
    render(<FileScreen />);
    await importLeagues();

    const dialog = await screen.findByRole('dialog', { name: 'Import leagues' });
    expect(within(dialog).getAllByText('Conflict')).toHaveLength(1);
    expect(
      within(dialog).getByRole('checkbox', { name: /Changed name.*Conflict/ })
    ).toBeInTheDocument();
  });

  it('shows no conflict dialog when the user unchecks the only conflict', async () => {
    const other = openTestLeague(leagueWrapper([], OTHER_LEAGUE));
    leagueFile(leagueWrapper(), named(other, 'Changed name'));
    render(<FileScreen />);
    await importLeagues();

    const dialog = await screen.findByRole('dialog', { name: 'Import leagues' });
    await userEvent.click(
      within(dialog).getByRole('checkbox', { name: /Changed name/ })
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Import selected' })
    );

    expect(await screen.findByText('1 league imported.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('FileScreen: Resolve conflicts (US-11.2)', () => {
  const openConflicts = async (): Promise<HTMLElement> => {
    render(<FileScreen />);
    await userEvent.click(within(card('Import leagues')).getByRole('button'));
    return screen.findByRole('dialog', { name: 'Resolve conflicts' });
  };
  const group = (dialog: HTMLElement, name: string): HTMLElement =>
    within(dialog).getByRole('radiogroup', { name: `Choice for ${name}` });
  const option = (dialog: HTMLElement, name: string, label: string): HTMLElement =>
    within(group(dialog, name)).getByRole('radio', { name: label });

  it('follows the import of one conflict, with the handoff text and one row', async () => {
    const local = openTestLeague(leagueWrapper());
    leagueFile(named(local, 'Changed name'));

    const dialog = await openConflicts();

    expect(dialog).toHaveAccessibleDescription(
      'These already exist locally by UUID. Skip keeps your local version untouched; Import as new forks the incoming one with a fresh UUID.'
    );
    expect(within(dialog).getByText('League')).toBeInTheDocument();
    expect(within(dialog).getByText('Changed name')).toBeInTheDocument();
    expect(within(dialog).getByText(LEAGUE)).toBeInTheDocument();
    expect(option(dialog, 'Changed name', 'Skip')).toBeChecked();
  });

  it('skips on Confirm when the row stays on Skip', async () => {
    const local = openTestLeague(leagueWrapper());
    leagueFile(named(local, 'Changed name'));

    const dialog = await openConflicts();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    expect(
      await screen.findByText('0 leagues imported. 1 skipped.')
    ).toBeInTheDocument();
    expect(state().leagues[LEAGUE]).toBe(local);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('forks the league on "Import as new"', async () => {
    const local = openTestLeague(leagueWrapper());
    leagueFile(named(local, 'Changed name'));

    const dialog = await openConflicts();
    await userEvent.click(option(dialog, 'Changed name', 'Import as new'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    expect(
      await screen.findByText('0 leagues imported. 1 imported as new.')
    ).toBeInTheDocument();
    expect(state().leagues[LEAGUE]).toBe(local);
    const copy = Object.values(state().leagues).find((w) => w.uuid !== LEAGUE);
    expect(copy?.content.name).toBe('Changed name');
    expect(copy?.content.createdByInstallation).toBe(INSTALLATION);
  });

  it('sets every row with the "all" buttons, and a row can still change', async () => {
    const one = openTestLeague(leagueWrapper());
    const two = openTestLeague(leagueWrapper([], OTHER_LEAGUE));
    leagueFile(named(one, 'First'), named(two, 'Second'));
    render(<FileScreen />);
    await userEvent.click(within(card('Import leagues')).getByRole('button'));
    const picker = await screen.findByRole('dialog', { name: 'Import leagues' });
    await userEvent.click(
      within(picker).getByRole('button', { name: 'Import selected' })
    );
    const dialog = await screen.findByRole('dialog', { name: 'Resolve conflicts' });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Import all as new' })
    );
    expect(option(dialog, 'First', 'Import as new')).toBeChecked();
    expect(option(dialog, 'Second', 'Import as new')).toBeChecked();

    await userEvent.click(option(dialog, 'Second', 'Skip'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    expect(
      await screen.findByText('0 leagues imported. 1 imported as new. 1 skipped.')
    ).toBeInTheDocument();
  });

  it('sets every row back with "Skip all"', async () => {
    const local = openTestLeague(leagueWrapper());
    leagueFile(named(local, 'Changed name'));

    const dialog = await openConflicts();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Import all as new' })
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Skip all' }));

    expect(option(dialog, 'Changed name', 'Skip')).toBeChecked();
  });

  it('changes nothing on Cancel, also for the items with no conflict', async () => {
    const local = openTestLeague(leagueWrapper());
    leagueFile(named(local, 'Changed name'), leagueWrapper([], THIRD_LEAGUE));
    render(<FileScreen />);
    await userEvent.click(within(card('Import leagues')).getByRole('button'));
    const picker = await screen.findByRole('dialog', { name: 'Import leagues' });
    await userEvent.click(
      within(picker).getByRole('button', { name: 'Import selected' })
    );
    const dialog = await screen.findByRole('dialog', { name: 'Resolve conflicts' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(Object.keys(state().leagues)).toEqual([LEAGUE]);
    expect(useStatusLineStore.getState().status).toBeNull();
  });
});

describe('FileScreen: Import teams (US-10.3)', () => {
  it('opens the picker for many Blueprints, and imports the picks', async () => {
    vi.spyOn(exportFile, 'openBlueprintImportFile').mockResolvedValue([
      blueprint(),
      harborview,
    ]);
    render(<FileScreen />);
    await userEvent.click(within(card('Import teams')).getByRole('button'));

    const dialog = await screen.findByRole('dialog', { name: 'Import teams' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Harborview/ }));
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Import selected' })
    );

    expect(await screen.findByText('1 team imported.')).toBeInTheDocument();
    expect(state().blueprints.map((b) => b.uuid)).toEqual([SALT_MARSH]);
  });

  it('shows a team conflict with its type', async () => {
    setBlueprints([blueprint()]);
    vi.spyOn(exportFile, 'openBlueprintImportFile').mockResolvedValue([
      blueprint({ name: 'Other name' }),
    ]);
    render(<FileScreen />);
    await userEvent.click(within(card('Import teams')).getByRole('button'));

    const dialog = await screen.findByRole('dialog', { name: 'Resolve conflicts' });
    expect(within(dialog).getByText('Team')).toBeInTheDocument();
  });
});

describe('FileScreen: Import entire database (US-10.4)', () => {
  function databaseZipOf(blueprints: TeamBlueprint[], leagues: LeagueWrapper[]): void {
    vi.spyOn(databaseZip, 'openDatabaseZipFile').mockResolvedValue(
      databaseZip.packDatabase(
        {
          installationUuid: INSTALLATION,
          blueprints,
          wrappers: leagues.map(summarizeLeague),
        },
        leagues
      )
    );
  }
  const importDatabase = async (): Promise<void> => {
    await userEvent.click(within(card('Import entire database')).getByRole('button'));
  };

  it('has no picker, and merges with the counts', async () => {
    databaseZipOf(
      [blueprint(), harborview],
      [leagueWrapper(), leagueWrapper([], OTHER_LEAGUE)]
    );
    render(<FileScreen />);
    await importDatabase();

    expect(
      await screen.findByText('Teams: 2 imported. Leagues: 2 imported.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(state().blueprints).toHaveLength(2);
    expect(Object.keys(state().leagues).sort()).toEqual([LEAGUE, OTHER_LEAGUE].sort());
  });

  it('shows teams and leagues in one conflict dialog', async () => {
    setBlueprints([blueprint()]);
    const local = openTestLeague(leagueWrapper());
    databaseZipOf([blueprint({ name: 'Other name' })], [named(local, 'Changed name')]);
    render(<FileScreen />);
    await importDatabase();

    const dialog = await screen.findByRole('dialog', { name: 'Resolve conflicts' });
    expect(within(dialog).getByText('Team')).toBeInTheDocument();
    expect(within(dialog).getByText('League')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    expect(
      await screen.findByText(
        'Teams: 0 imported, 1 skipped. Leagues: 0 imported, 1 skipped.'
      )
    ).toBeInTheDocument();
  });

  it('shows the error of a zip that is not a database', async () => {
    vi.spyOn(databaseZip, 'openDatabaseZipFile').mockResolvedValue(new Uint8Array([1]));
    render(<FileScreen />);
    await importDatabase();
    await screen.findByRole('status');
    expect(statusMessage()).toContain('not a Scorinator database');
  });
});
