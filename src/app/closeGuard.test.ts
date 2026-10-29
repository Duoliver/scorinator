import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  allowWindowClose,
  describeUnsavedLeagues,
  installCloseGuard,
  UNSAVED_TEAMS_NAME,
} from './closeGuard';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { scorinateMatchday } from '@/app/state/leagueWrapperActions';
import { updateTeamBlueprint } from '@/app/state/teamBlueprintActions';
import {
  LEAGUE,
  OTHER_LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
  testUuid,
} from '@/test/databaseRecords';
import type {
  CloseRequest,
  UnsavedChoice,
  WindowCloseAdapter,
} from '@/adapters/tauri-window';
import { useFileStore } from '@/app/state/fileStore';

const TEAMS = [
  { name: 'FC United', colour: '#E53935' },
  { name: 'FC Rivals', colour: '#1E88E5' },
];

const adapterAnswering = (choice: UnsavedChoice): WindowCloseAdapter => ({
  listenForCloseRequest: vi.fn(),
  askUnsavedChoice: vi.fn().mockResolvedValue(choice),
});

/** Changes a league, so it has unsaved changes. */
const changeLeague = (uuid: string): void => scorinateMatchday(uuid, 1);

/** Changes the Blueprint of `openTestDatabase`, so the teams are unsaved. */
const editTeams = (): void =>
  updateTeamBlueprint(testUuid(1), { name: 'FC United Renamed' });

beforeEach(() => {
  openTestDatabase([
    { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
  ]);
  openTestLeague(roundRobinLeague(TEAMS));
  openTestLeague(roundRobinLeague(TEAMS, { uuid: OTHER_LEAGUE, name: 'Inland Cup' }));
  useFileStore.setState({ status: null });
});

describe('describeUnsavedLeagues', () => {
  it('names one league and asks to save it', () => {
    expect(describeUnsavedLeagues(['Coastal Premier'])).toBe(
      '"Coastal Premier" has unsaved changes. Save it before you close?'
    );
  });

  it('lists several leagues', () => {
    expect(describeUnsavedLeagues(['A', 'B'])).toBe(
      'These leagues have unsaved changes: "A", "B". Save them before you close?'
    );
  });

  it('lists five leagues, then counts the rest', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    expect(describeUnsavedLeagues(names)).toBe(
      'These leagues have unsaved changes: "A", "B", "C", "D", "E", and 2 more. Save them before you close?'
    );
  });
});

describe('allowWindowClose', () => {
  it('allows the close with no prompt when nothing is unsaved', async () => {
    const adapter = adapterAnswering('cancel');
    const save = vi.fn();

    expect(await allowWindowClose(adapter, save)).toBe(true);
    expect(adapter.askUnsavedChoice).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('names only the unsaved leagues in the prompt', async () => {
    changeLeague(OTHER_LEAGUE);
    const adapter = adapterAnswering('cancel');

    await allowWindowClose(adapter, vi.fn());

    expect(adapter.askUnsavedChoice).toHaveBeenCalledWith(
      describeUnsavedLeagues(['Inland Cup'])
    );
  });

  it('names a new league that the database does not hold yet', async () => {
    useDatabaseStore.setState((state) => ({
      leagues: {
        ...state.leagues,
        new: roundRobinLeague(TEAMS, { uuid: 'new', name: 'Fresh League' }),
      },
    }));
    const adapter = adapterAnswering('cancel');

    await allowWindowClose(adapter, vi.fn());

    expect(adapter.askUnsavedChoice).toHaveBeenCalledWith(
      describeUnsavedLeagues(['Fresh League'])
    );
  });

  it('asks when only the Blueprints are unsaved, and names them Teams', async () => {
    editTeams();
    const adapter = adapterAnswering('cancel');

    await expect(allowWindowClose(adapter, vi.fn())).resolves.toBe(false);
    expect(adapter.askUnsavedChoice).toHaveBeenCalledWith(
      `"${UNSAVED_TEAMS_NAME}" has unsaved changes. Save it before you close?`
    );
  });

  it('lists Teams first, before the unsaved leagues', async () => {
    editTeams();
    changeLeague(LEAGUE);
    changeLeague(OTHER_LEAGUE);
    const adapter = adapterAnswering('cancel');

    await allowWindowClose(adapter, vi.fn());

    expect(adapter.askUnsavedChoice).toHaveBeenCalledWith(
      'These leagues have unsaved changes: "Teams", "Coastal Premier", "Inland Cup". Save them before you close?'
    );
  });

  it('saves the whole database once on Save, then allows the close', async () => {
    editTeams();
    changeLeague(LEAGUE);
    const save = vi.fn().mockResolvedValue(true);

    expect(await allowWindowClose(adapterAnswering('save'), save)).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('writes every unsaved league and the manifest with the default save', async () => {
    const memory = openTestDatabase([
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
    ]);
    openTestLeague(roundRobinLeague(TEAMS));
    editTeams();
    changeLeague(LEAGUE);

    expect(await allowWindowClose(adapterAnswering('save'))).toBe(true);
    expect(memory.saves).toHaveLength(1);
    expect(memory.saves[0]?.wrappers.map((wrapper) => wrapper.uuid)).toEqual([LEAGUE]);
    expect(memory.saves[0]?.manifest).not.toBeNull();
  });

  it('blocks the close when the save fails', async () => {
    changeLeague(LEAGUE);

    expect(
      await allowWindowClose(adapterAnswering('save'), vi.fn().mockResolvedValue(false))
    ).toBe(false);
  });

  it("allows the close and saves nothing on Don't save", async () => {
    changeLeague(LEAGUE);
    const save = vi.fn();

    expect(await allowWindowClose(adapterAnswering('discard'), save)).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it('blocks the close and saves nothing on Cancel', async () => {
    changeLeague(LEAGUE);
    const save = vi.fn();

    expect(await allowWindowClose(adapterAnswering('cancel'), save)).toBe(false);
    expect(save).not.toHaveBeenCalled();
  });
});

describe('installCloseGuard', () => {
  const setup = (
    choice: UnsavedChoice
  ): {
    adapter: WindowCloseAdapter;
    unlisten: () => void;
    getHandler: () => (request: CloseRequest) => Promise<void>;
  } => {
    const unlisten = vi.fn();
    let handler: ((request: CloseRequest) => Promise<void>) | undefined;
    const adapter: WindowCloseAdapter = {
      listenForCloseRequest: vi.fn(async (next): Promise<() => void> => {
        handler = next;
        return unlisten;
      }),
      askUnsavedChoice: vi.fn().mockResolvedValue(choice),
    };
    return { adapter, unlisten, getHandler: () => handler! };
  };

  beforeEach(() => {
    changeLeague(LEAGUE);
  });

  it('prevents the close when the user cancels', async () => {
    const { adapter, getHandler } = setup('cancel');
    installCloseGuard(adapter);
    await vi.waitFor(() => expect(adapter.listenForCloseRequest).toHaveBeenCalled());
    const request = { preventDefault: vi.fn() };

    await getHandler()(request);

    expect(request.preventDefault).toHaveBeenCalledOnce();
  });

  it("lets the close go ahead on Don't save", async () => {
    const { adapter, getHandler } = setup('discard');
    installCloseGuard(adapter);
    await vi.waitFor(() => expect(adapter.listenForCloseRequest).toHaveBeenCalled());
    const request = { preventDefault: vi.fn() };

    await getHandler()(request);

    expect(request.preventDefault).not.toHaveBeenCalled();
  });

  it('stops listening when the cleanup runs', async () => {
    const { adapter, unlisten } = setup('cancel');
    const remove = installCloseGuard(adapter);
    await vi.waitFor(() => expect(adapter.listenForCloseRequest).toHaveBeenCalled());
    await Promise.resolve();

    remove();

    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('stops listening even when the cleanup runs before the listener is ready', async () => {
    const unlisten = vi.fn();
    const adapter: WindowCloseAdapter = {
      listenForCloseRequest: vi.fn(() => Promise.resolve(unlisten)),
      askUnsavedChoice: vi.fn(),
    };

    installCloseGuard(adapter)();
    await vi.waitFor(() => expect(unlisten).toHaveBeenCalledOnce());
  });

  it('reports a listener error on the status line instead of throwing', async () => {
    const adapter: WindowCloseAdapter = {
      listenForCloseRequest: vi.fn().mockRejectedValue(new Error('No window.')),
      askUnsavedChoice: vi.fn(),
    };

    installCloseGuard(adapter);

    await vi.waitFor(() =>
      expect(useFileStore.getState().status).toEqual({
        tone: 'error',
        message: 'Could not watch for a window close: No window.',
      })
    );
  });
});
