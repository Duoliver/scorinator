import { describe, expect, it, vi } from 'vitest';
import { exportResultsTxt } from './resultsTxt';
import type { FileSystem, SaveFileDialog } from '@/persistence/types';
import { HARBORVIEW, leagueWrapper, result, SALT_MARSH } from '@/test/databaseRecords';

function fakeFs(overrides: Partial<FileSystem> = {}): FileSystem {
  return {
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    exists: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

function fakeDialog(overrides: Partial<SaveFileDialog> = {}): SaveFileDialog {
  return {
    pickSavePath: vi.fn(),
    pickOpenPath: vi.fn(),
    ...overrides,
  };
}

const league = leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)]);

describe('exportResultsTxt', () => {
  it('returns null and writes nothing when the user cancels the dialog', async () => {
    const writeTextFile = vi.fn();
    const dialog = fakeDialog({ pickSavePath: vi.fn().mockResolvedValue(null) });

    const path = await exportResultsTxt(league, fakeFs({ writeTextFile }), dialog);

    expect(path).toBeNull();
    expect(writeTextFile).not.toHaveBeenCalled();
  });

  it('writes phase 1 to the chosen path, with the Instance names and not the UUIDs', async () => {
    const writeTextFile = vi.fn();
    const dialog = fakeDialog({
      pickSavePath: vi.fn().mockResolvedValue('/results.txt'),
    });

    const path = await exportResultsTxt(league, fakeFs({ writeTextFile }), dialog);

    expect(path).toBe('/results.txt');
    expect(writeTextFile).toHaveBeenCalled();
    const [, contents] = writeTextFile.mock.calls[0];
    expect(contents).toContain('Coastal Premier');
    expect(contents).toContain('STANDINGS');
    expect(contents).toContain('Salt Marsh United  2 - 1  Harborview SC');
    expect(contents).not.toContain(SALT_MARSH);
  });

  it('opens the save dialog filtered to .txt, named after the league', async () => {
    const pickSavePath = vi.fn().mockResolvedValue(null);

    await exportResultsTxt(league, fakeFs(), fakeDialog({ pickSavePath }));

    expect(pickSavePath).toHaveBeenCalledWith('coastal-premier-results.txt', [
      { name: 'Text file', extensions: ['txt'] },
    ]);
  });
});
