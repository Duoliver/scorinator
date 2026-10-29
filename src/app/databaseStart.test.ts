import { beforeEach, describe, expect, it } from 'vitest';
import { memoryFolder } from '@/test/databaseRecords';
import { openAppDatabase } from './databaseStart';
import { useDatabaseStore } from './state/databaseStore';

beforeEach(() => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
});

describe('openAppDatabase (Task 109)', () => {
  it('opens the database in the folder it finds', async () => {
    const memory = memoryFolder();
    await openAppDatabase(async () => memory.folder);
    expect(useDatabaseStore.getState().status).toEqual({ kind: 'open' });
    expect(useDatabaseStore.getState().folder).toBe(memory.folder);
  });

  it('gives the error status when it cannot find the folder', async () => {
    await openAppDatabase(async () => {
      throw new Error('no app data folder');
    });
    expect(useDatabaseStore.getState().status).toEqual({
      kind: 'error',
      message: 'no app data folder',
    });
  });
});
