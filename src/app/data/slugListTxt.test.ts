import { describe, expect, it, vi } from 'vitest';
import { importSlugListTxt } from './slugListTxt';
import type { FileSystem, SaveFileDialog } from '@/persistence/types';

function fakeFs(contents: string): FileSystem {
  return {
    readTextFile: vi.fn().mockResolvedValue(contents),
    writeTextFile: vi.fn(),
    readBinaryFile: vi.fn(),
    writeBinaryFile: vi.fn(),
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

  it('gives the slugs and levels of the chosen file, and the bad levels', async () => {
    const text = '# Coastal Premier\nash-town +1\n\nnorthgate-fc\nriver-fc 7\n';
    expect(await importSlugListTxt(fakeFs(text), fakeDialog('/roster.txt'))).toEqual({
      entries: [
        { slug: 'ash-town', level: 1 },
        { slug: 'northgate-fc', level: 0 },
        { slug: 'river-fc', level: 0 },
      ],
      badLevels: [{ line: 5, text: 'river-fc 7' }],
    });
  });

  it('rejects with the line error of a bad line', async () => {
    await expect(
      importSlugListTxt(fakeFs('ash-town\nnorth fc +1'), fakeDialog('/roster.txt'))
    ).rejects.toThrow('Slug list line 2, "north fc +1", is not a slug.');
  });
});
