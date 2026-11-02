import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { open } from '@tauri-apps/plugin-dialog';
import { AppShell } from './AppShell';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueDraftStore } from '@/app/state/leagueDraftStore';
import { DEFAULT_POINTS_CONFIG } from '@/engine/standings';
import { useDatabaseStore } from '@/app/state/databaseStore';

/** The end-to-end smoke test `docs/tdd.md` asks for (Task 50): create
 * teams, create a league, scorinate every match, save, start a new session,
 * and open the league again. Since Task 161 the teams and the league go to
 * the database folder with Ctrl+S, and come back from it in the new
 * session. It drives the real screens through `AppShell`, with the real
 * stores, `app/` actions, `app/data`, and adapters. Only the Tauri modules
 * are fake: an in-memory disk, dialogs that pick no file unless a test
 * sets one, and a fixed app data folder. A second test runs the M2 flow
 * (Task 122): a team CSV import, the wizard add dialog, and an edit for one
 * league. A third test runs the M3 flow (Task 133): a Groups phase from the
 * wizard draw, the phase start, the lock, and a later Shuffle. */

const disk = vi.hoisted(() => new Map<string, string>());

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: async (path: string): Promise<string> => {
    const contents = disk.get(path);
    if (contents === undefined) throw new Error(`No file at ${path}`);
    return contents;
  },
  writeTextFile: async (path: string, contents: string): Promise<void> => {
    disk.set(path, contents);
  },
  rename: async (from: string, to: string): Promise<void> => {
    const contents = disk.get(from);
    if (contents === undefined) throw new Error(`No file at ${from}`);
    disk.delete(from);
    disk.set(to, contents);
  },
  remove: async (path: string): Promise<void> => {
    disk.delete(path);
  },
  exists: async (path: string): Promise<boolean> => disk.has(path),
  // The in-memory disk has no folders: a path is just a key.
  mkdir: async (): Promise<void> => {},
}));

// The database folder (Task 109): `database/` in the app data folder.
vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: async (): Promise<string> => '/appdata',
  join: async (...parts: string[]): Promise<string> => parts.join('/'),
}));

const MANIFEST_PATH = '/appdata/database/manifest.json';

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(async () => null),
  open: vi.fn(async () => null),
  message: vi.fn(),
}));

/** A new session: every store empty, and the database closed, so the app
 * opens it from the disk again. */
function resetSession(): void {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
  useFileStore.setState({ status: null });
  useLeagueDraftStore.setState({
    details: { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false },
    teams: [],
    fixedTrigrams: {},
    step: 'details',
  });
}

/** Sets the start url. `route()` from `preact-router` does nothing while no
 * `Router` is mounted, so this writes the history entry directly. */
function openAt(path: string): void {
  window.history.replaceState(null, '', path);
}

function pressCtrlS(): void {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
    );
  });
}

/** The text of each standings row, without the header row. */
function standingsRows(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent ?? '');
}

beforeEach(() => {
  disk.clear();
  resetSession();
  openAt('/');
});

describe('smoke: create, scorinate, save, and open a league again', () => {
  it('gives back the same league and standings in a new session', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<AppShell />);

    // 1. The app opens the database: the first start writes the manifest.
    // Then create two teams on the Teams screen.
    expect(
      await screen.findByRole('heading', { name: 'No leagues yet.' })
    ).toBeInTheDocument();
    expect([...disk.keys()]).toEqual([MANIFEST_PATH]);
    await user.click(screen.getByRole('link', { name: 'Teams' }));
    for (const name of ['Salt Marsh United', 'Harborview SC']) {
      await user.click(screen.getByRole('button', { name: '+ New team' }));
      await user.type(screen.getByLabelText('Team name'), name);
      await user.click(screen.getByRole('button', { name: 'Create team' }));
    }
    expect(screen.getByText('2 teams')).toBeInTheDocument();

    // 2. Create a league with both teams.
    await user.click(screen.getByRole('link', { name: 'Leagues' }));
    await user.click(screen.getByRole('link', { name: 'Create league' }));
    await user.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await user.click(screen.getByRole('button', { name: 'Next: Phases →' }));
    await user.click(screen.getByRole('button', { name: 'Next: Teams →' }));
    await user.click(screen.getByRole('button', { name: 'Load them all' }));
    await user.click(screen.getByRole('button', { name: 'Next: Review →' }));
    await user.click(screen.getByRole('button', { name: 'Create league' }));
    expect(
      await screen.findByRole('heading', { name: 'Coastal Premier' })
    ).toBeInTheDocument();

    // 3. Scorinate both matchdays: two teams give one match on each.
    await user.click(screen.getByRole('tab', { name: 'Fixtures' }));
    expect(screen.getByText('Matchday 1 / 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Scorinate matchday' }));
    await user.click(screen.getByRole('button', { name: 'Next matchday' }));
    await user.click(screen.getByRole('button', { name: 'Scorinate matchday' }));
    expect(screen.getByText('League completed')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Standings' }));
    const standingsBefore = standingsRows();
    expect(standingsBefore).toHaveLength(2);
    const [leagueBefore] = Object.values(useDatabaseStore.getState().leagues);
    expect(leagueBefore.content.phases[0]?.results).toHaveLength(2);
    expect(screen.getByText('Unsaved')).toBeInTheDocument();

    // 4. Ctrl+S saves the league file, then the manifest, in the database.
    pressCtrlS();
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
    const wrapperPath = `/appdata/database/wrapper-${leagueBefore.uuid}.json`;
    expect([...disk.keys()].sort()).toEqual([MANIFEST_PATH, wrapperPath].sort());

    // 5. A new session: empty stores, the app opens on the start screen. The
    // dashboard card comes from the manifest, with no league file read.
    unmount();
    resetSession();
    openAt('/');
    render(<AppShell />);
    expect(
      await screen.findByRole('heading', { name: 'Coastal Premier' })
    ).toBeInTheDocument();
    expect(useDatabaseStore.getState().leagues).toEqual({});
    expect(useDatabaseStore.getState().blueprints.map((team) => team.name)).toEqual([
      'Salt Marsh United',
      'Harborview SC',
    ]);
    const card = screen
      .getByRole('heading', { name: 'Coastal Premier' })
      .closest('div')!;
    expect(within(card).queryByText('Unsaved')).not.toBeInTheDocument();

    // 6. Open the league: League Detail reads its file from the database.
    await user.click(screen.getByRole('link', { name: 'Open standings' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Coastal Premier' })
    ).toBeInTheDocument();
    expect(useDatabaseStore.getState().leagues[leagueBefore.uuid]).toEqual(
      leagueBefore
    );
    expect(standingsRows()).toEqual(standingsBefore);
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
  });
});

describe('smoke: M2 teams and team selection (Task 122)', () => {
  /** A team CSV with the two M2 columns (Task 117): Location and Trigrams. */
  const CSV_PATH = '/home/teams.csv';
  const CSV = [
    'Slug,Name,Colour,Tier,Location,Trigrams',
    'salt-marsh-united,Salt Marsh United,#E53935,B,Saltmarsh,SMU SAL',
    'harborview-sc,Harborview SC,#1E88E5,A,Harborview,HSC',
  ].join('\n');

  it('keeps the imported Blueprints and the edited Instances in a new session', async () => {
    const user = userEvent.setup();
    disk.set(CSV_PATH, CSV);
    vi.mocked(open).mockResolvedValueOnce(CSV_PATH);
    const { unmount } = render(<AppShell />);
    expect(
      await screen.findByRole('heading', { name: 'No leagues yet.' })
    ).toBeInTheDocument();

    // 1. Import the CSV on the Teams screen, through the confirm (Task 168).
    await user.click(screen.getByRole('link', { name: 'Teams' }));
    await user.click(screen.getByRole('button', { name: 'Import teams...' }));
    const confirm = await screen.findByRole('dialog', { name: 'Import teams?' });
    expect(confirm).toHaveAccessibleDescription('2 new, 0 updated. Continue?');
    await user.click(within(confirm).getByRole('button', { name: 'Import' }));
    expect(screen.getByText('2 teams')).toBeInTheDocument();
    expect(screen.getByText('Saltmarsh')).toBeInTheDocument();

    // 2. In the wizard, add both teams with the add dialog (Task 120).
    await user.click(screen.getByRole('link', { name: 'Leagues' }));
    await user.click(screen.getByRole('link', { name: 'Create league' }));
    await user.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await user.click(screen.getByRole('button', { name: 'Next: Phases →' }));
    await user.click(screen.getByRole('button', { name: 'Next: Teams →' }));
    await user.click(screen.getByRole('button', { name: '+ Add teams' }));
    const picker = screen.getByRole('dialog', { name: 'Add teams' });
    await user.click(within(picker).getByRole('button', { name: 'Salt Marsh United' }));
    await user.click(within(picker).getByRole('button', { name: 'Harborview SC' }));
    await user.click(within(picker).getByRole('button', { name: 'Add 2 teams' }));

    // 3. Edit one team for this league: its OVR and a fixed trigram (Task 172).
    await user.click(screen.getByRole('button', { name: 'Edit Salt Marsh United' }));
    const ovr = screen.getByLabelText('OVR (70 to 79)');
    await user.clear(ovr);
    await user.type(ovr, '77');
    await user.type(screen.getByLabelText('Trigram (optional)'), 'sal');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // 4. Create the league and save the database.
    await user.click(screen.getByRole('button', { name: 'Next: Review →' }));
    await user.click(screen.getByRole('button', { name: 'Create league' }));
    expect(
      await screen.findByRole('heading', { name: 'Coastal Premier' })
    ).toBeInTheDocument();
    const [leagueBefore] = Object.values(useDatabaseStore.getState().leagues);
    pressCtrlS();
    expect(await screen.findByText('Saved.')).toBeInTheDocument();

    // 5. A new session: the Blueprints come back from the manifest, and the
    // league Instances from the league file.
    unmount();
    resetSession();
    openAt('/');
    render(<AppShell />);
    expect(
      await screen.findByRole('heading', { name: 'Coastal Premier' })
    ).toBeInTheDocument();
    expect(
      useDatabaseStore.getState().blueprints.map(({ slug, location, trigrams }) => ({
        slug,
        location,
        trigrams,
      }))
    ).toEqual([
      { slug: 'salt-marsh-united', location: 'Saltmarsh', trigrams: ['SMU', 'SAL'] },
      { slug: 'harborview-sc', location: 'Harborview', trigrams: ['HSC'] },
    ]);

    await user.click(screen.getByRole('link', { name: 'Open standings' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Coastal Premier' })
    ).toBeInTheDocument();
    const league = useDatabaseStore.getState().leagues[leagueBefore.uuid];
    expect(league).toEqual(leagueBefore);
    expect(
      league.teams.map(({ slug, ovr, trigram }) => ({ slug, ovr, trigram }))
    ).toEqual([
      { slug: 'salt-marsh-united', ovr: 77, trigram: 'SAL' },
      { slug: 'harborview-sc', ovr: expect.any(Number), trigram: 'HSC' },
    ]);
  });
});

describe('smoke: M3 phases, groups, and the phase start (Task 133)', () => {
  const CSV_PATH = '/home/six.csv';
  const CSV = [
    'Slug,Name,Colour,Tier',
    'salt-marsh-united,Salt Marsh United,#E53935,B',
    'harborview-sc,Harborview SC,#1E88E5,A',
    'ironbridge-athletic,Ironbridge Athletic,#2E7D32,C',
    'northgate-rovers,Northgate Rovers,#6A1B9A,B',
    'copper-hills-fc,Copper Hills FC,#F9A825,C',
    'westbrook-wanderers,Westbrook Wanderers,#00838F,A',
  ].join('\n');

  it('plays a Groups phase, starts a later Groups phase, and keeps both in a new session', async () => {
    const user = userEvent.setup();
    disk.set(CSV_PATH, CSV);
    vi.mocked(open).mockResolvedValueOnce(CSV_PATH);
    const { unmount } = render(<AppShell />);
    expect(
      await screen.findByRole('heading', { name: 'No leagues yet.' })
    ).toBeInTheDocument();

    // 1. Import the six teams.
    await user.click(screen.getByRole('link', { name: 'Teams' }));
    await user.click(screen.getByRole('button', { name: 'Import teams...' }));
    const confirm = await screen.findByRole('dialog', { name: 'Import teams?' });
    await user.click(within(confirm).getByRole('button', { name: 'Import' }));
    expect(screen.getByText('6 teams')).toBeInTheDocument();

    // 2. The Phases step: Groups (top 2), then Groups by count (2 groups).
    await user.click(screen.getByRole('link', { name: 'Leagues' }));
    await user.click(screen.getByRole('link', { name: 'Create league' }));
    await user.type(screen.getByLabelText('League name'), 'Group Cup');
    await user.click(screen.getByRole('button', { name: 'Next: Phases →' }));
    const phase1 = (): HTMLElement => screen.getByRole('region', { name: 'Phase 1' });
    await user.selectOptions(within(phase1()).getByLabelText('Format'), 'grp2');
    await user.click(screen.getByRole('button', { name: '+ Add phase' }));
    const phase2 = screen.getByRole('region', { name: 'Phase 2' });
    await user.selectOptions(within(phase2).getByLabelText('Format'), 'grp2');
    await user.selectOptions(within(phase2).getByLabelText('Set by'), 'count');
    expect(within(phase1()).getByLabelText('Top')).toHaveValue('2');

    // 3. The Teams step draws the teams into two cards of three.
    await user.click(screen.getByRole('button', { name: 'Next: Teams →' }));
    await user.click(screen.getByRole('button', { name: 'Load them all' }));
    for (const name of ['Group A', 'Group B']) {
      expect(
        within(screen.getByRole('region', { name })).getAllByRole('listitem')
      ).toHaveLength(3);
    }
    await user.click(screen.getByRole('button', { name: 'Next: Review →' }));
    await user.click(screen.getByRole('button', { name: 'Create league' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Group Cup' })
    ).toBeInTheDocument();
    expect(screen.getByText('Group Stage · MD 1/6')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Group A' })).toBeInTheDocument();

    // 4. Play phase 1 to the end, then start phase 2 through the confirm.
    await user.click(screen.getByRole('tab', { name: 'Fixtures' }));
    for (let matchday = 1; matchday <= 6; matchday += 1) {
      await user.click(screen.getByRole('button', { name: 'Scorinate matchday' }));
      if (matchday < 6)
        await user.click(screen.getByRole('button', { name: 'Next matchday' }));
    }
    expect(screen.getByText('Phase complete')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Start phase 2 · Group Stage' })
    );
    const start = screen.getByRole('dialog', { name: 'Start phase 2?' });
    await user.click(within(start).getByRole('button', { name: 'Start phase 2' }));
    expect(screen.getByRole('tab', { name: '2 · Group Stage' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // 5. The phase-2 draw can change until its first result. Phase 1 locks.
    const [league] = Object.values(useDatabaseStore.getState().leagues);
    const drawBefore = league.content.phases[1];
    expect(drawBefore?.format === 'groups' && drawBefore.groups.flat()).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: '⟲ Shuffle groups' }));
    const [shuffled] = Object.values(useDatabaseStore.getState().leagues);
    expect(shuffled.content.phases[1]).not.toBe(drawBefore);
    await user.click(screen.getByRole('tab', { name: '1 · Group Stage' }));
    await user.click(screen.getByRole('tab', { name: 'Fixtures' }));
    expect(
      screen.getByText('Phase 2 started. This phase is locked.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scorinate matchday' })).toBeDisabled();

    // 6. Save, start a new session, and open the league again.
    pressCtrlS();
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    const [leagueBefore] = Object.values(useDatabaseStore.getState().leagues);
    unmount();
    resetSession();
    openAt('/');
    render(<AppShell />);
    expect(
      await screen.findByRole('heading', { name: 'Group Cup' })
    ).toBeInTheDocument();
    expect(screen.getByText('MD 1/2')).toBeInTheDocument();
    expect(
      screen.getByText('Group Stage → Group Stage · 6 teams · Home adv. off')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Open standings' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Group Cup' })
    ).toBeInTheDocument();
    expect(useDatabaseStore.getState().leagues[leagueBefore.uuid]).toEqual(
      leagueBefore
    );
    expect(screen.getByRole('tab', { name: '2 · Group Stage' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('Group Stage · MD 1/2')).toBeInTheDocument();
  });
});
