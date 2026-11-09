import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileSystem, SaveFileDialog } from '@/persistence/types';
import {
  HARBORVIEW,
  leagueWrapper,
  openTestDatabase,
  result,
  SALT_MARSH,
} from '@/test/databaseRecords';
import { exportSlugListTxt } from './slugListTxt';

function fakeFs(writeTextFile = vi.fn()): FileSystem {
  return {
    readTextFile: vi.fn(),
    writeTextFile,
    readBinaryFile: vi.fn(),
    writeBinaryFile: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    exists: vi.fn().mockResolvedValue(false),
  };
}

const dialogTo = (path: string | null): SaveFileDialog => ({
  pickSavePath: vi.fn().mockResolvedValue(path),
  pickOpenPath: vi.fn(),
});

// Salt Marsh wins matchday 1 2-1, and Harborview wins matchday 2 3-0. Both
// have 3 points, and Harborview leads on goal difference (+2 to -2).
const played = leagueWrapper([
  result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW),
  {
    fixtureId: 'p1.g1.md2.m1',
    home: HARBORVIEW,
    away: SALT_MARSH,
    homeGoals: 3,
    awayGoals: 0,
  },
]);

beforeEach(() => {
  openTestDatabase();
});

describe('exportSlugListTxt (US-10.5, Task 148)', () => {
  it('writes the comment line and the Instance slugs in the final ranking', async () => {
    const writeTextFile = vi.fn();
    const path = await exportSlugListTxt(
      played,
      new Date(2026, 9, 28, 23, 30),
      fakeFs(writeTextFile),
      dialogTo('/ranking.txt')
    );
    expect(path).toBe('/ranking.txt');
    expect(writeTextFile.mock.calls[0][1]).toBe(
      '# Coastal Premier — final ranking, 2026-10-28\nharborview-sc\nsalt-marsh-united\n'
    );
  });

  it('opens the save dialog filtered to .txt, named <league slug>-ranking.txt (choice 4)', async () => {
    const dialog = dialogTo(null);
    const writeTextFile = vi.fn();
    expect(
      await exportSlugListTxt(played, new Date(), fakeFs(writeTextFile), dialog)
    ).toBeNull();
    expect(dialog.pickSavePath).toHaveBeenCalledWith('coastal-premier-ranking.txt', [
      { name: 'Text file', extensions: ['txt'] },
    ]);
    expect(writeTextFile).not.toHaveBeenCalled();
  });

  it('includes the slug of a team whose Blueprint was deleted (US-09.4)', async () => {
    // The open test database has no Blueprint at all: both are deleted.
    const writeTextFile = vi.fn();
    await exportSlugListTxt(
      played,
      new Date(),
      fakeFs(writeTextFile),
      dialogTo('/r.txt')
    );
    expect(writeTextFile.mock.calls[0][1]).toContain('salt-marsh-united');
  });
});
