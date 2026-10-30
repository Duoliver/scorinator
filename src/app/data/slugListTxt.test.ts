import { describe, expect, it, vi } from 'vitest';
import { importSlugListTxt } from './slugListTxt';
import type { FileSystem, SaveFileDialog } from '@/persistence/types';

function fakeFs(contents: string): FileSystem {
  return {
    readTextFile: vi.fn().mockResolvedValue(contents),
    writeTextFile: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    exists: vi.fn(),
  };
}

function fakeDialog(path: string | null): SaveFileDialog {
  return { pickSavePath: vi.fn(), pickOpenPath: vi.fn().mockResolvedValue(path) };
}

describe('importSlugListTxt (US-08.7)', () => {
  it('returns null when the user cancels the dialog', async () => {
    expect(await importSlugListTxt(fakeFs(''), fakeDialog(null))).toBeNull();
  });

  it('opens the dialog filtered to .txt files', async () => {
    const dialog = fakeDialog(null);
    await importSlugListTxt(fakeFs(''), dialog);
    expect(dialog.pickOpenPath).toHaveBeenCalledWith([
      { name: 'Slug list', extensions: ['txt'] },
    ]);
  });

  it('gives the slugs of the chosen file', async () => {
    const text = '# Coastal Premier\nash-town\n\nnorthgate-fc\n';
    expect(await importSlugListTxt(fakeFs(text), fakeDialog('/roster.txt'))).toEqual([
      'ash-town',
      'northgate-fc',
    ]);
  });

  it('rejects with the line error of a bad line', async () => {
    await expect(
      importSlugListTxt(fakeFs('ash-town\nnorth fc'), fakeDialog('/roster.txt'))
    ).rejects.toThrow('Slug list line 2, "north fc", is not a slug.');
  });
});
