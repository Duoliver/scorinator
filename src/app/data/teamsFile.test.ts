import { describe, expect, it, vi } from 'vitest';
import { importTeamsFile } from './teamsFile';
import type { FileSystem, SaveFileDialog } from '@/persistence/types';

function fakeFs(overrides: Partial<FileSystem> = {}): FileSystem {
  return {
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    exists: vi.fn(),
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

const FC_UNITED = {
  slug: 'fc-united',
  name: 'FC United',
  colour: '#E53935',
  tier: 'B',
};

describe('importTeamsFile', () => {
  it('returns null when the user cancels the open dialog', async () => {
    const dialog = fakeDialog({ pickOpenPath: vi.fn().mockResolvedValue(null) });
    expect(await importTeamsFile(fakeFs(), dialog)).toBeNull();
  });

  it('opens one dialog that accepts both .csv and .json', async () => {
    const pickOpenPath = vi.fn().mockResolvedValue(null);
    await importTeamsFile(fakeFs(), fakeDialog({ pickOpenPath }));
    expect(pickOpenPath).toHaveBeenCalledWith([
      { name: 'Team list', extensions: ['csv', 'json'] },
    ]);
  });

  it('reads a .csv file as team CSV', async () => {
    const fs = fakeFs({
      readTextFile: vi
        .fn()
        .mockResolvedValue('Slug,Name,Colour,Tier\nfc-united,FC United,#E53935,B\n'),
    });
    const dialog = fakeDialog({
      pickOpenPath: vi.fn().mockResolvedValue('/teams.csv'),
    });
    expect(await importTeamsFile(fs, dialog)).toEqual([FC_UNITED]);
  });

  it('reads a .json file as a team list, whatever the extension case', async () => {
    const fs = fakeFs({
      readTextFile: vi.fn().mockResolvedValue(JSON.stringify([FC_UNITED])),
    });
    const dialog = fakeDialog({
      pickOpenPath: vi.fn().mockResolvedValue('/Teams.JSON'),
    });
    expect(await importTeamsFile(fs, dialog)).toEqual([FC_UNITED]);
  });

  it('rejects a file that is neither .csv nor .json, without reading it', async () => {
    const readTextFile = vi.fn();
    const dialog = fakeDialog({
      pickOpenPath: vi.fn().mockResolvedValue('/teams.txt'),
    });
    await expect(importTeamsFile(fakeFs({ readTextFile }), dialog)).rejects.toThrow(
      'Cannot load "/teams.txt": pick a .csv or .json team list.'
    );
    expect(readTextFile).not.toHaveBeenCalled();
  });
});
