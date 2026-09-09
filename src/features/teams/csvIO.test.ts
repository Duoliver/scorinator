import { describe, expect, it, vi } from 'vitest';
import { importTeamsCsv, exportTeamsCsv } from './csvIO';
import type { FileSystem, SaveFileDialog } from '../../persistence/types';
import type { TeamCsvRecord } from '../../adapters/csv';

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

describe('importTeamsCsv', () => {
  it('returns null when the user cancels the open dialog', async () => {
    const dialog = fakeDialog({ pickOpenPath: vi.fn().mockResolvedValue(null) });
    const result = await importTeamsCsv(fakeFs(), dialog);
    expect(result).toBeNull();
  });

  it('parses the chosen file into team CSV records', async () => {
    const csv = 'Slug,Name,Colour,Tier\nfc-united,FC United,#E53935,B\n';
    const fs = fakeFs({ readTextFile: vi.fn().mockResolvedValue(csv) });
    const dialog = fakeDialog({
      pickOpenPath: vi.fn().mockResolvedValue('/teams.csv'),
    });
    const result = await importTeamsCsv(fs, dialog);
    expect(result).toEqual([
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
    ]);
  });
});

describe('exportTeamsCsv', () => {
  it('returns null when the user cancels the save dialog', async () => {
    const dialog = fakeDialog({ pickSavePath: vi.fn().mockResolvedValue(null) });
    const result = await exportTeamsCsv([], fakeFs(), dialog);
    expect(result).toBeNull();
  });

  it('serializes the given records and writes them to the chosen path', async () => {
    const records: TeamCsvRecord[] = [
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
    ];
    const writeTextFile = vi.fn();
    const fs = fakeFs({
      writeTextFile,
      rename: vi.fn(),
      exists: vi.fn().mockResolvedValue(false),
    });
    const dialog = fakeDialog({
      pickSavePath: vi.fn().mockResolvedValue('/teams.csv'),
    });
    const result = await exportTeamsCsv(records, fs, dialog);
    expect(result).toBe('/teams.csv');
    expect(writeTextFile).toHaveBeenCalled();
    const [, contents] = writeTextFile.mock.calls[0];
    expect(contents).toContain('FC United');
  });
});
