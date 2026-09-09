import { describe, expect, it, vi } from 'vitest';
import { importTeamsJson } from './jsonIO';
import type { FileSystem, SaveFileDialog } from '../../persistence/types';

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

describe('importTeamsJson', () => {
  it('returns null when the user cancels the open dialog', async () => {
    const dialog = fakeDialog({ pickOpenPath: vi.fn().mockResolvedValue(null) });
    const result = await importTeamsJson(fakeFs(), dialog);
    expect(result).toBeNull();
  });

  it('opens the dialog filtered to .json, not .csv', async () => {
    const pickOpenPath = vi.fn().mockResolvedValue(null);
    await importTeamsJson(fakeFs(), fakeDialog({ pickOpenPath }));
    expect(pickOpenPath).toHaveBeenCalledWith([
      { name: 'Team JSON', extensions: ['json'] },
    ]);
  });

  it('parses the chosen file into team records', async () => {
    const json = JSON.stringify([
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
    ]);
    const fs = fakeFs({ readTextFile: vi.fn().mockResolvedValue(json) });
    const dialog = fakeDialog({
      pickOpenPath: vi.fn().mockResolvedValue('/teams.json'),
    });
    const result = await importTeamsJson(fs, dialog);
    expect(result).toEqual([
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
    ]);
  });
});
