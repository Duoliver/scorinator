import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { open, save } from '@tauri-apps/plugin-dialog';
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
 * wizard draw, the phase start, the lock, and a later Shuffle. A fourth
 * test runs the M4 flow (Task 143): Groups, then a two-legged bracket with
 * a third place, played to its winner. A fifth test runs the M5 flow
 * (Task 151): each export, a database import into an empty database, a
 * repeated import, and a conflict. A sixth test runs the M6 flow (Task
 * 158): Form, the zones from the wizard and from "Edit zones", the chart
 * with its zones, and the fixtures trigrams. */

const disk = vi.hoisted(() => new Map<string, string>());
const binaryDisk = vi.hoisted(() => new Map<string, Uint8Array>());

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
  // The database `.zip` (Task 146).
  readFile: async (path: string): Promise<Uint8Array> => {
    const contents = binaryDisk.get(path);
    if (contents === undefined) throw new Error(`No file at ${path}`);
    return contents;
  },
  writeFile: async (path: string, contents: Uint8Array): Promise<void> => {
    binaryDisk.set(path, contents);
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
  binaryDisk.clear();
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
    expect(within(phase1()).getByLabelText('Top')).toHaveValue(2);

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

describe('smoke: M4 bracket after groups (Task 143)', () => {
  const CSV_PATH = '/home/eight.csv';
  const CSV = [
    'Slug,Name,Colour,Tier',
    'salt-marsh-united,Salt Marsh United,#E53935,B',
    'harborview-sc,Harborview SC,#1E88E5,A',
    'ironbridge-athletic,Ironbridge Athletic,#2E7D32,C',
    'northgate-rovers,Northgate Rovers,#6A1B9A,B',
    'copper-hills-fc,Copper Hills FC,#F9A825,C',
    'westbrook-wanderers,Westbrook Wanderers,#00838F,A',
    'eastport-city,Eastport City,#5D4037,B',
    'southfield-town,Southfield Town,#C2185B,D',
  ].join('\n');

  it('plays Groups, then a two-legged bracket to its winner, and keeps it in a new session', async () => {
    const user = userEvent.setup();
    disk.set(CSV_PATH, CSV);
    vi.mocked(open).mockResolvedValueOnce(CSV_PATH);
    const { unmount } = render(<AppShell />);
    expect(
      await screen.findByRole('heading', { name: 'No leagues yet.' })
    ).toBeInTheDocument();

    // 1. Import the eight teams.
    await user.click(screen.getByRole('link', { name: 'Teams' }));
    await user.click(screen.getByRole('button', { name: 'Import teams...' }));
    const confirm = await screen.findByRole('dialog', { name: 'Import teams?' });
    await user.click(within(confirm).getByRole('button', { name: 'Import' }));
    expect(screen.getByText('8 teams')).toBeInTheDocument();

    // 2. The Phases step: Groups of 4 (top 2), then a two-legged Bracket
    // with a third-place playoff.
    await user.click(screen.getByRole('link', { name: 'Leagues' }));
    await user.click(screen.getByRole('link', { name: 'Create league' }));
    await user.type(screen.getByLabelText('League name'), 'Knockout Cup');
    await user.click(screen.getByRole('button', { name: 'Next: Phases →' }));
    const phase1 = (): HTMLElement => screen.getByRole('region', { name: 'Phase 1' });
    await user.selectOptions(within(phase1()).getByLabelText('Format'), 'grp2');
    await user.click(screen.getByRole('button', { name: '+ Add phase' }));
    const phase2 = (): HTMLElement => screen.getByRole('region', { name: 'Phase 2' });
    await user.selectOptions(within(phase2()).getByLabelText('Format'), 'bracket');
    await user.click(within(phase2()).getByRole('radio', { name: 'Two-legged' }));
    await user.click(
      within(phase2()).getByRole('switch', { name: 'Third-place playoff' })
    );

    // 3. The Teams step draws two groups of four. Create the league.
    await user.click(screen.getByRole('button', { name: 'Next: Teams →' }));
    await user.click(screen.getByRole('button', { name: 'Load them all' }));
    for (const name of ['Group A', 'Group B']) {
      expect(
        within(screen.getByRole('region', { name })).getAllByRole('listitem')
      ).toHaveLength(4);
    }
    await user.click(screen.getByRole('button', { name: 'Next: Review →' }));
    expect(
      screen.getByText(
        '2 · Bracket · Bracket · Two-legged · away goals off · AET on · Penalties · Third place'
      )
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create league' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Knockout Cup' })
    ).toBeInTheDocument();

    // 4. Play the groups, then start the bracket through the confirm.
    await user.click(screen.getByRole('tab', { name: 'Fixtures' }));
    for (let matchday = 1; matchday <= 6; matchday += 1) {
      await user.click(screen.getByRole('button', { name: 'Scorinate matchday' }));
      if (matchday < 6)
        await user.click(screen.getByRole('button', { name: 'Next matchday' }));
    }
    await user.click(screen.getByRole('button', { name: 'Start phase 2 · Bracket' }));
    const start = screen.getByRole('dialog', { name: 'Start phase 2?' });
    await user.click(within(start).getByRole('button', { name: 'Start phase 2' }));
    expect(
      screen.getByRole('tab', { name: 'Bracket', selected: true })
    ).toBeInTheDocument();
    expect(screen.getByText('Bracket · Semi-finals')).toBeInTheDocument();

    // 5. No semi-final pairs two teams of one group (Task 185).
    const [started] = Object.values(useDatabaseStore.getState().leagues);
    const [groups, bracket] = started.content.phases;
    if (groups.format !== 'groups' || bracket.format !== 'bracket') {
      throw new Error('expected Groups, then a bracket');
    }
    expect(bracket.avoidGroupTies).toBe(true);
    const groupOf = new Map(
      groups.groups.flatMap((members, g) => members.map((team) => [team, g]))
    );
    const semis = screen.getByRole('region', { name: 'Semi-finals' });
    const nameToUuid = new Map(
      started.teams.map((team) => [team.name, team.blueprintUuid])
    );
    for (const card of within(semis).getAllByRole('group')) {
      const [top, bottom] = (card.getAttribute('aria-label') ?? '').split(' v ');
      expect(groupOf.get(nameToUuid.get(top) ?? '')).not.toBe(
        groupOf.get(nameToUuid.get(bottom) ?? '')
      );
      expect(within(card).getByText('L1')).toBeInTheDocument();
    }

    // 6. Two clicks play the semi-finals, then the final and the third place.
    await user.click(screen.getByRole('button', { name: '⚽ Scorinate bracket' }));
    await user.click(screen.getByRole('button', { name: '⚽ Scorinate bracket' }));
    expect(screen.getByRole('button', { name: '⚽ Scorinate bracket' })).toBeDisabled();
    const winnerLine = screen.getByText(/^Winner: /);
    const winnerName = winnerLine.textContent?.replace('Winner: ', '') ?? '';
    expect(nameToUuid.has(winnerName)).toBe(true);
    expect(screen.getByText('Third-place playoff')).toBeInTheDocument();

    // 7. The Seed List tags each seed with its group place.
    await user.click(screen.getByRole('tab', { name: 'Seed List' }));
    const seedList = screen.getByRole('table', { name: 'Seed List' });
    for (const tag of ['A1', 'B1', 'A2', 'B2']) {
      expect(within(seedList).getByText(tag)).toBeInTheDocument();
    }

    // 8. Save, start a new session, and open the league again.
    pressCtrlS();
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    const [leagueBefore] = Object.values(useDatabaseStore.getState().leagues);
    unmount();
    resetSession();
    openAt('/');
    render(<AppShell />);
    expect(
      await screen.findByRole('heading', { name: 'Knockout Cup' })
    ).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Open standings' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Knockout Cup' })
    ).toBeInTheDocument();
    expect(useDatabaseStore.getState().leagues[leagueBefore.uuid]).toEqual(
      leagueBefore
    );
    expect(screen.getByText(`Winner: ${winnerName}`)).toBeInTheDocument();
  });
});

describe('smoke: M5 files, imports, and conflicts (Task 151)', () => {
  const CSV_PATH = '/home/teams.csv';
  const LEAGUE_PATH = '/home/coastal-premier.json';
  const RESULTS_PATH = '/home/coastal-premier-results.txt';
  const SLUGS_PATH = '/home/coastal-premier-ranking.txt';
  const ZIP_PATH = '/home/database.zip';
  const CSV = [
    'Slug,Name,Colour,Tier',
    'salt-marsh-united,Salt Marsh United,#E53935,B',
    'harborview-sc,Harborview SC,#1E88E5,A',
  ].join('\n');

  const statusIs = async (message: string): Promise<void> => {
    await waitFor(() => expect(useFileStore.getState().status?.message).toBe(message));
  };

  it('exports, imports into an empty database, and resolves a conflict', async () => {
    const user = userEvent.setup();
    disk.set(CSV_PATH, CSV);
    vi.mocked(open).mockResolvedValueOnce(CSV_PATH);
    const { unmount } = render(<AppShell />);
    await screen.findByRole('heading', { name: 'No leagues yet.' });

    const openFileScreen = async (): Promise<void> => {
      await user.click(screen.getByRole('link', { name: 'File' }));
    };
    const clickCard = async (title: string): Promise<void> => {
      await user.click(
        within(screen.getByRole('group', { name: title })).getByRole('button')
      );
    };
    const exportFromMenu = async (item: string, path: string): Promise<void> => {
      vi.mocked(save).mockResolvedValueOnce(path);
      await user.click(screen.getByRole('button', { name: /^Export/ }));
      await user.click(await screen.findByRole('menuitem', { name: item }));
      await statusIs(`Saved to ${path}`);
    };

    // 1. Import the teams, create a league, and save.
    await user.click(screen.getByRole('link', { name: 'Teams' }));
    await user.click(screen.getByRole('button', { name: 'Import teams...' }));
    const confirm = await screen.findByRole('dialog', { name: 'Import teams?' });
    await user.click(within(confirm).getByRole('button', { name: 'Import' }));
    await user.click(screen.getByRole('link', { name: 'Leagues' }));
    await user.click(screen.getByRole('link', { name: 'Create league' }));
    await user.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await user.click(screen.getByRole('button', { name: 'Next: Phases →' }));
    await user.click(screen.getByRole('button', { name: 'Next: Teams →' }));
    await user.click(screen.getByRole('button', { name: 'Load them all' }));
    await user.click(screen.getByRole('button', { name: 'Next: Review →' }));
    await user.click(screen.getByRole('button', { name: 'Create league' }));
    await screen.findByRole('heading', { level: 1, name: 'Coastal Premier' });
    pressCtrlS();
    await statusIs('Saved.');
    const [leagueBefore] = Object.values(useDatabaseStore.getState().leagues);

    // 2. The export menu writes the three files.
    await exportFromMenu('Export league (.json)', LEAGUE_PATH);
    await exportFromMenu('Export results (.txt)', RESULTS_PATH);
    await exportFromMenu('Export slug list (.txt)', SLUGS_PATH);
    expect(disk.get(LEAGUE_PATH)).toContain(leagueBefore.uuid);
    expect(disk.get(RESULTS_PATH)).toContain('Coastal Premier');
    const slugLines = disk.get(SLUGS_PATH)!.trimEnd().split('\n');
    expect(slugLines[0]).toMatch(/^# Coastal Premier — final ranking, /);
    expect(slugLines.slice(1).sort()).toEqual(['harborview-sc', 'salt-marsh-united']);

    // 3. The File screen writes the database `.zip`.
    await openFileScreen();
    vi.mocked(save).mockResolvedValueOnce(ZIP_PATH);
    await clickCard('Export entire database');
    await statusIs(`Saved to ${ZIP_PATH}`);
    expect(binaryDisk.get(ZIP_PATH)).toBeInstanceOf(Uint8Array);

    // 4. A new session with an empty database: the `.zip` gives everything back.
    unmount();
    for (const path of [...disk.keys()]) {
      if (path.startsWith('/appdata/')) disk.delete(path);
    }
    resetSession();
    openAt('/');
    const second = render(<AppShell />);
    await screen.findByRole('heading', { name: 'No leagues yet.' });
    await openFileScreen();
    vi.mocked(open).mockResolvedValueOnce(ZIP_PATH);
    await clickCard('Import entire database');
    await statusIs('Teams: 2 imported. Leagues: 1 imported.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useDatabaseStore.getState().leagues[leagueBefore.uuid]).toEqual(
      leagueBefore
    );

    // 5. The same league file again changes nothing, with no dialog.
    vi.mocked(open).mockResolvedValueOnce(LEAGUE_PATH);
    await clickCard('Import leagues');
    await statusIs('0 leagues imported. 1 already up to date.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(Object.keys(useDatabaseStore.getState().leagues)).toEqual([
      leagueBefore.uuid,
    ]);

    // 6. After a result, the file is a conflict. "Import as new" forks it.
    await user.click(screen.getByRole('link', { name: 'Leagues' }));
    await user.click(screen.getByRole('link', { name: 'Open standings' }));
    await user.click(await screen.findByRole('tab', { name: 'Fixtures' }));
    await user.click(screen.getByRole('button', { name: 'Scorinate matchday' }));
    const played = useDatabaseStore.getState().leagues[leagueBefore.uuid];
    expect(played.content.phases[0]?.results).toHaveLength(1);

    await openFileScreen();
    vi.mocked(open).mockResolvedValueOnce(LEAGUE_PATH);
    await clickCard('Import leagues');
    const dialog = await screen.findByRole('dialog', { name: 'Resolve conflicts' });
    await user.click(within(dialog).getByRole('radio', { name: 'Import as new' }));
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    await statusIs('0 leagues imported. 1 imported as new.');
    const { leagues } = useDatabaseStore.getState();
    expect(Object.keys(leagues)).toHaveLength(2);
    expect(leagues[leagueBefore.uuid]).toBe(played);

    // 7. Ctrl+S, then a new session: both leagues are on the dashboard.
    pressCtrlS();
    await statusIs('Saved.');
    second.unmount();
    resetSession();
    openAt('/');
    render(<AppShell />);
    expect(await screen.findByText('2 leagues running')).toBeInTheDocument();
    expect(useDatabaseStore.getState().blueprints).toHaveLength(2);
  });
});

describe('smoke: M6 standings, zones, the chart, and trigrams (Task 158)', () => {
  const CSV_PATH = '/home/six-m6.csv';
  const CSV = [
    'Slug,Name,Colour,Tier,Location,Trigrams',
    'salt-marsh-united,Salt Marsh United,#E53935,B,Saltmarsh,SMU',
    'harborview-sc,Harborview SC,#1E88E5,A,Harborview,HSC',
    'ironbridge-athletic,Ironbridge Athletic,#2E7D32,C,Ironbridge,IRB',
    'northgate-rovers,Northgate Rovers,#6A1B9A,B,Northgate,NGR',
    'copper-hills-fc,Copper Hills FC,#F9A825,C,Copper Hills,CHF',
    'westbrook-wanderers,Westbrook Wanderers,#00838F,A,Westbrook,WBW',
  ].join('\n');

  /** The zone tone of each row of the round-robin table. */
  const tones = (): (string | null)[] =>
    within(screen.getByRole('table', { name: 'Standings' }))
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.getAttribute('data-tone'));
  const legend = (): string[] =>
    within(screen.getByRole('list', { name: 'Zones' }))
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');

  /** Turns on one free zone row of a zone editor, with its places and label. */
  async function addZone(
    user: ReturnType<typeof userEvent.setup>,
    scope: HTMLElement,
    colour: string,
    from: string,
    to: string,
    label: string
  ): Promise<void> {
    const row = within(scope).getByRole('group', { name: `${colour} zone` });
    await user.click(within(row).getByRole('switch', { name: colour }));
    await user.type(within(row).getByLabelText('From'), from);
    await user.type(within(row).getByLabelText('To'), to);
    await user.type(within(row).getByLabelText('Label'), label);
  }

  it('shows Form, zones, the chart, and trigrams, and keeps the zones in a new session', async () => {
    const user = userEvent.setup();
    disk.set(CSV_PATH, CSV);
    vi.mocked(open).mockResolvedValueOnce(CSV_PATH);
    const { unmount } = render(<AppShell />);
    await screen.findByRole('heading', { name: 'No leagues yet.' });

    // 1. Import the six teams. The wizard makes a round robin with a red
    // zone for places 5 to 6.
    await user.click(screen.getByRole('link', { name: 'Teams' }));
    await user.click(screen.getByRole('button', { name: 'Import teams...' }));
    const confirm = await screen.findByRole('dialog', { name: 'Import teams?' });
    await user.click(within(confirm).getByRole('button', { name: 'Import' }));
    await user.click(screen.getByRole('link', { name: 'Leagues' }));
    await user.click(screen.getByRole('link', { name: 'Create league' }));
    await user.type(screen.getByLabelText('League name'), 'Zone League');
    await user.click(screen.getByRole('button', { name: 'Next: Phases →' }));
    const phase1 = screen.getByRole('region', { name: 'Phase 1' });
    await addZone(
      user,
      within(phase1).getByRole('region', { name: 'Zones' }),
      'Red',
      '5',
      '6',
      'Relegation'
    );
    await user.click(screen.getByRole('button', { name: 'Next: Teams →' }));
    await user.click(screen.getByRole('button', { name: 'Load them all' }));
    await user.click(screen.getByRole('button', { name: 'Next: Review →' }));
    await user.click(screen.getByRole('button', { name: 'Create league' }));
    await screen.findByRole('heading', { level: 1, name: 'Zone League' });

    // 2. Two matchdays: two Form dots for each team, the red rows, and
    // the legend.
    await user.click(screen.getByRole('tab', { name: 'Fixtures' }));
    await user.click(screen.getByRole('button', { name: 'Scorinate matchday' }));
    await user.click(screen.getByRole('button', { name: 'Next matchday' }));
    await user.click(screen.getByRole('button', { name: 'Scorinate matchday' }));
    // 5. Each fixtures row has both trigrams.
    expect(document.querySelectorAll('[data-part="trigram"]')).toHaveLength(6);
    await user.click(screen.getByRole('tab', { name: 'Standings' }));
    const rows = within(screen.getByRole('table', { name: 'Standings' }))
      .getAllByRole('row')
      .slice(1);
    for (const row of rows) {
      expect(row.querySelectorAll('[data-outcome]')).toHaveLength(2);
    }
    expect(tones()).toEqual([null, null, null, null, 'red', 'red']);
    expect(legend()).toEqual(['Relegation']);

    // 3. The chart: one line for each team, the red band, the legend.
    await user.click(screen.getByRole('tab', { name: 'Chart' }));
    expect(screen.getByRole('img', { name: 'Position chart' })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-team]')).toHaveLength(6);
    const bands = (): (string | null)[] =>
      [...document.querySelectorAll('[data-part="band"]')].map((band) =>
        band.getAttribute('data-zone')
      );
    expect(bands()).toEqual(['red']);
    expect(legend()).toEqual(['Relegation']);

    // 4. "Edit zones" adds a blue zone for place 1. The league is unsaved.
    pressCtrlS();
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit zones' }));
    const drawer = screen.getByRole('dialog', { name: 'Zones' });
    await addZone(user, drawer, 'Blue', '1', '1', 'Champion');
    await user.click(within(drawer).getByRole('button', { name: 'Save' }));
    expect(bands()).toEqual(['blue', 'red']);
    expect(legend()).toEqual(['Champion', 'Relegation']);
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Standings' }));
    expect(tones()).toEqual(['blue', null, null, null, 'red', 'red']);

    // 6. Save, start a new session, and open the league again.
    pressCtrlS();
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    const [leagueBefore] = Object.values(useDatabaseStore.getState().leagues);
    unmount();
    resetSession();
    openAt('/');
    render(<AppShell />);
    await user.click(await screen.findByRole('link', { name: 'Open standings' }));
    await screen.findByRole('heading', { level: 1, name: 'Zone League' });
    expect(useDatabaseStore.getState().leagues[leagueBefore.uuid]).toEqual(
      leagueBefore
    );
    expect(tones()).toEqual(['blue', null, null, null, 'red', 'red']);
    expect(legend()).toEqual(['Champion', 'Relegation']);
  });
});
