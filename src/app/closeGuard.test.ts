import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  allowWindowClose,
  describeUnsavedLeagues,
  installCloseGuard,
} from './closeGuard';
import type {
  CloseRequest,
  UnsavedChoice,
  WindowCloseAdapter,
} from '@/adapters/tauri-window';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import type { LeagueRecord } from '@/features/leagues/types';

const league = (slug: string, name = slug): LeagueRecord => ({
  slug,
  name,
  homeAdvantage: false,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [],
  fixtures: [],
  byes: [],
  results: [],
});

const coastal = league('coastal-premier', 'Coastal Premier');
const inland = league('inland-cup', 'Inland Cup');

const adapterAnswering = (choice: UnsavedChoice): WindowCloseAdapter => ({
  listenForCloseRequest: vi.fn(),
  askUnsavedChoice: vi.fn().mockResolvedValue(choice),
});

beforeEach(() => {
  useLeagueStore.setState({ leagues: [coastal, inland] });
  useFileStore.setState({
    currentLeagueSlug: null,
    paths: {},
    savedLeagues: {},
    status: null,
  });
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
  it('allows the close with no prompt when every league is saved', async () => {
    useFileStore.getState().markSaved(coastal);
    useFileStore.getState().markSaved(inland);
    const adapter = adapterAnswering('cancel');

    expect(await allowWindowClose(adapter, vi.fn())).toBe(true);
    expect(adapter.askUnsavedChoice).not.toHaveBeenCalled();
  });

  it('allows the close with no prompt when there are no leagues', async () => {
    useLeagueStore.setState({ leagues: [] });
    const adapter = adapterAnswering('cancel');

    expect(await allowWindowClose(adapter, vi.fn())).toBe(true);
    expect(adapter.askUnsavedChoice).not.toHaveBeenCalled();
  });

  it('names only the unsaved leagues in the prompt', async () => {
    useFileStore.getState().markSaved(coastal);
    const adapter = adapterAnswering('cancel');

    await allowWindowClose(adapter, vi.fn());

    expect(adapter.askUnsavedChoice).toHaveBeenCalledWith(
      describeUnsavedLeagues(['Inland Cup'])
    );
  });

  it('saves each unsaved league in turn on Save, then allows the close', async () => {
    useFileStore.getState().markSaved(coastal);
    const save = vi.fn().mockResolvedValue(true);

    expect(await allowWindowClose(adapterAnswering('save'), save)).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith('inland-cup');
  });

  it('saves leagues one after the other, not at the same time', async () => {
    const order: string[] = [];
    const save = vi.fn(async (slug: string) => {
      order.push(`start ${slug}`);
      await Promise.resolve();
      order.push(`end ${slug}`);
      return true;
    });

    await allowWindowClose(adapterAnswering('save'), save);

    expect(order).toEqual([
      'start coastal-premier',
      'end coastal-premier',
      'start inland-cup',
      'end inland-cup',
    ]);
  });

  it('blocks the close, and stops saving, when one save fails or is canceled', async () => {
    const save = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);

    expect(await allowWindowClose(adapterAnswering('save'), save)).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("allows the close and saves nothing on Don't save", async () => {
    const save = vi.fn();

    expect(await allowWindowClose(adapterAnswering('discard'), save)).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it('blocks the close and saves nothing on Cancel', async () => {
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
