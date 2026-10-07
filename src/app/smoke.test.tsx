import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { AppShell } from './AppShell';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueDraftStore } from '@/app/state/leagueDraftStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';
import { DEFAULT_POINTS_CONFIG } from '@/engine/standings';

/** The end-to-end smoke test `docs/tdd.md` asks for (Task 50): create
 * teams, create a league, scorinate every match, save, start a new session,
 * and load the save. It drives the real screens through `AppShell`, with
 * the real stores, `app/` actions, `app/data`, and adapters. Only the two
 * Tauri plugins are fake: an in-memory disk, and dialogs that return a
 * fixed path. */

const SAVE_PATH = '/saves/coastal-premier.json';

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
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(async () => SAVE_PATH),
  open: vi.fn(async () => SAVE_PATH),
  message: vi.fn(),
}));

function resetSession(): void {
  useTeamsStore.setState({ teams: [] });
  useLeagueStore.setState({ leagues: [] });
  useFileStore.setState({
    currentLeagueSlug: null,
    paths: {},
    savedLeagues: {},
    status: null,
  });
  useLeagueDraftStore.setState({
    details: { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false },
    selectedSlugs: [],
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

describe('smoke: create, scorinate, save, and load a league', () => {
  it('gives back the same league and standings after a save and a load', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<AppShell />);

    // 1. Create two teams on the Teams screen.
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
    await user.click(screen.getByRole('button', { name: 'Next: Teams →' }));
    await user.click(screen.getByRole('button', { name: 'Select all' }));
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
    const leagueBefore = useLeagueStore.getState().leagues[0];
    expect(leagueBefore.results).toHaveLength(2);
    expect(screen.getByText('Unsaved')).toBeInTheDocument();

    // 4. Ctrl+S saves the league to disk.
    pressCtrlS();
    expect(
      await screen.findByText(`Saved Coastal Premier to ${SAVE_PATH}`)
    ).toBeInTheDocument();
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument();
    expect([...disk.keys()]).toEqual([SAVE_PATH]);

    // 5. A new session: empty stores, the app opens on the start screen.
    unmount();
    resetSession();
    openAt('/');
    render(<AppShell />);
    expect(
      screen.getByRole('heading', { name: 'No leagues yet.' })
    ).toBeInTheDocument();

    // 6. Load the save from the empty state.
    await user.click(screen.getByRole('button', { name: 'Load league...' }));
    expect(
      await screen.findByText(`Loaded Coastal Premier from ${SAVE_PATH}`)
    ).toBeInTheDocument();

    expect(useLeagueStore.getState().leagues).toEqual([leagueBefore]);
    expect(useTeamsStore.getState().teams.map((team) => team.name)).toEqual([
      'Salt Marsh United',
      'Harborview SC',
    ]);

    const card = screen
      .getByRole('heading', { name: 'Coastal Premier' })
      .closest('div')!;
    expect(within(card).queryByText('Unsaved')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Open standings' }));
    expect(standingsRows()).toEqual(standingsBefore);
  });
});
