import { describe, expect, it, vi } from 'vitest';
import type { FileSystem, SaveFileDialog } from '@/persistence/types';
import { openDatabaseZipFile, saveDatabaseZipFile } from './databaseZip';

const BYTES = new Uint8Array([1, 2, 3]);
const ZIP_FILTER = [{ name: 'Database file', extensions: ['zip'] }];

const fakeFs = (): FileSystem => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  readBinaryFile: vi.fn().mockResolvedValue(BYTES),
  writeBinaryFile: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn(),
  remove: vi.fn(),
  exists: vi.fn(),
});
const fakeDialog = (path: string | null): SaveFileDialog => ({
  pickSavePath: vi.fn().mockResolvedValue(path),
  pickOpenPath: vi.fn().mockResolvedValue(path),
});

describe('the database zip file dialogs (Task 149)', () => {
  it('writes the bytes under the default name with the date (US-10.4)', async () => {
    const fs = fakeFs();
    const dialog = fakeDialog('/d.zip');
    const path = await saveDatabaseZipFile(BYTES, new Date(2026, 9, 28), fs, dialog);
    expect(path).toBe('/d.zip');
    expect(dialog.pickSavePath).toHaveBeenCalledWith(
      'scorinator-database-2026-10-28.zip',
      ZIP_FILTER
    );
    expect(fs.writeBinaryFile).toHaveBeenCalledWith('/d.zip', BYTES);
  });

  it('writes nothing when the save dialog is canceled', async () => {
    const fs = fakeFs();
    expect(
      await saveDatabaseZipFile(BYTES, new Date(), fs, fakeDialog(null))
    ).toBeNull();
    expect(fs.writeBinaryFile).not.toHaveBeenCalled();
  });

  it('reads the bytes of the picked file', async () => {
    const dialog = fakeDialog('/d.zip');
    expect(await openDatabaseZipFile(fakeFs(), dialog)).toBe(BYTES);
    expect(dialog.pickOpenPath).toHaveBeenCalledWith(ZIP_FILTER);
  });

  it('gives null when the open dialog is canceled', async () => {
    expect(await openDatabaseZipFile(fakeFs(), fakeDialog(null))).toBeNull();
  });
});
