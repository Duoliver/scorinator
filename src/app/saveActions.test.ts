import { beforeEach, describe, expect, it } from 'vitest';
import { saveDatabaseChanges } from './saveActions';
import { isLeagueUnsaved, useDatabaseStore } from '@/app/state/databaseStore';
import { useFileStore } from '@/app/state/fileStore';
import { createLeague, scorinateMatchday } from '@/app/state/leagueWrapperActions';
import { updateTeamBlueprint } from '@/app/state/teamBlueprintActions';
import {
  LEAGUE,
  OTHER_LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
  testUuid,
} from '@/test/databaseRecords';

const TEAMS = [
  { name: 'FC United', colour: '#E53935' },
  { name: 'FC Rivals', colour: '#1E88E5' },
];

let memory: ReturnType<typeof openTestDatabase>;

beforeEach(() => {
  memory = openTestDatabase([
    { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
    { slug: 'fc-rivals', name: 'FC Rivals', colour: '#1E88E5', tier: 'C' },
  ]);
  openTestLeague(roundRobinLeague(TEAMS));
  openTestLeague(roundRobinLeague(TEAMS, { uuid: OTHER_LEAGUE, name: 'Inland Cup' }));
  useFileStore.setState({ status: null });
});

describe('saveDatabaseChanges (Ctrl+S, Task 161)', () => {
  it('writes each unsaved league, then the manifest, in one save, and says "Saved."', async () => {
    scorinateMatchday(LEAGUE, 1);
    updateTeamBlueprint(testUuid(1), { name: 'FC United Renamed' });

    await expect(saveDatabaseChanges()).resolves.toBe(true);

    expect(memory.saves).toHaveLength(1);
    expect(memory.saves[0]?.wrappers.map((wrapper) => wrapper.uuid)).toEqual([LEAGUE]);
    expect(memory.saves[0]?.manifest).not.toBeNull();
    expect(isLeagueUnsaved(useDatabaseStore.getState(), LEAGUE)).toBe(false);
    expect(useFileStore.getState().status).toEqual({ tone: 'info', message: 'Saved.' });
  });

  it('saves a new league with its manifest row', async () => {
    const created = createLeague({
      name: 'Fresh League',
      homeAdvantage: false,
      points: { win: 3, draw: 1, loss: 0 },
      blueprintUuids: [testUuid(1), testUuid(2)],
    });

    await saveDatabaseChanges();

    expect(Object.keys(memory.files.wrappers)).toEqual([created.uuid]);
    expect(memory.files.manifest).toContain('Fresh League');
  });

  it('writes nothing and says "Nothing to save." when nothing is unsaved', async () => {
    await expect(saveDatabaseChanges()).resolves.toBe(true);

    expect(memory.saves).toEqual([]);
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Nothing to save.',
    });
  });

  it('reports a failed write as an error, keeps the league unsaved, and does not throw', async () => {
    scorinateMatchday(LEAGUE, 1);
    memory.folder.save = async (): Promise<void> => {
      throw new Error('Disk full.');
    };

    await expect(saveDatabaseChanges()).resolves.toBe(false);

    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Disk full.',
    });
    expect(isLeagueUnsaved(useDatabaseStore.getState(), LEAGUE)).toBe(true);
  });

  it('reports a closed database as an error', async () => {
    useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);

    await expect(saveDatabaseChanges()).resolves.toBe(false);

    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'The database is not open.',
    });
  });
});
