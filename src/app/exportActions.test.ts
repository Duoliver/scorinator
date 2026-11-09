import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exportAllBlueprints,
  exportAllLeagues,
  exportDatabase,
  exportResults,
  exportTeams,
} from './exportActions';
import * as exportFile from '@/app/data/exportFile';
import * as databaseZip from '@/app/data/databaseZip';
import * as resultsTxt from '@/app/data/resultsTxt';
import * as teamsCsv from '@/app/data/teamsCsv';
import { useFileStore } from '@/app/state/fileStore';
import type { TeamFields } from '@/domain';
import { serializeLeagueWrapper } from '@/app/data/databaseFile';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import { useDatabaseStore } from '@/app/state/databaseStore';
import {
  LEAGUE,
  OTHER_LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
  teamFields,
} from '@/test/databaseRecords';

const team: TeamFields = {
  slug: 'fc-united',
  name: 'FC United',
  colour: '#E53935',
  tier: 'B',
  location: '',
  trigrams: [],
};

beforeEach(() => {
  vi.restoreAllMocks();
  openTestDatabase([team]);
  useFileStore.setState({ status: null });
});

describe('exportTeams', () => {
  it('exports the roster as CSV records and reports the path', async () => {
    const write = vi.spyOn(teamsCsv, 'exportTeamsCsv').mockResolvedValue('/teams.csv');

    await exportTeams();

    expect(teamFields(write.mock.calls[0][0])).toEqual([
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
    ]);
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Saved to /teams.csv',
    });
  });

  it('reports a canceled dialog', async () => {
    vi.spyOn(teamsCsv, 'exportTeamsCsv').mockResolvedValue(null);

    await exportTeams();

    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Export canceled.',
    });
  });

  it('reports an error and does not throw', async () => {
    vi.spyOn(teamsCsv, 'exportTeamsCsv').mockRejectedValue(new Error('Disk is full.'));

    await exportTeams();

    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Disk is full.',
    });
  });

  it('reports a thrown string, as the Tauri plugins throw', async () => {
    vi.spyOn(teamsCsv, 'exportTeamsCsv').mockRejectedValue('Permission denied.');

    await exportTeams();

    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Permission denied.',
    });
  });
});

describe('exportResults', () => {
  const coastal = (): ReturnType<typeof roundRobinLeague> =>
    openTestLeague(roundRobinLeague([{ name: 'FC United', colour: '#E53935' }]));

  it('exports the league and reports the path', async () => {
    const league = coastal();
    const write = vi.spyOn(resultsTxt, 'exportResultsTxt').mockResolvedValue('/r.txt');

    await exportResults(LEAGUE);

    expect(write.mock.calls[0][0]).toBe(league);
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Exported Coastal Premier results to /r.txt',
    });
  });

  it('reports an unknown league and writes nothing', async () => {
    const write = vi.spyOn(resultsTxt, 'exportResultsTxt');

    await exportResults('no-such-league');

    expect(write).not.toHaveBeenCalled();
    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Cannot export: the league was not found.',
    });
  });

  it('reports a canceled dialog', async () => {
    coastal();
    vi.spyOn(resultsTxt, 'exportResultsTxt').mockResolvedValue(null);

    await exportResults(LEAGUE);

    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Export canceled.',
    });
  });

  it('reports an error and does not throw', async () => {
    coastal();
    vi.spyOn(resultsTxt, 'exportResultsTxt').mockRejectedValue(new Error('No access.'));

    await exportResults(LEAGUE);

    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'No access.',
    });
  });
});

describe('the bulk exports (Task 149)', () => {
  const TEAMS = [{ name: 'FC United', colour: '#E53935' }];

  /** One loaded league, and one that is only on disk, with its manifest row. */
  function openTwoLeagues(): void {
    const memory = openTestDatabase([team]);
    openTestLeague(roundRobinLeague(TEAMS));
    const other = roundRobinLeague(TEAMS, { uuid: OTHER_LEAGUE, name: 'Inland Cup' });
    memory.files.wrappers[OTHER_LEAGUE] = serializeLeagueWrapper(other);
    const rows = [...useDatabaseStore.getState().rows, summarizeLeague(other)];
    useDatabaseStore.setState({ rows, savedRows: rows });
  }

  it('exports every league, also one that is not loaded, and keeps it closed', async () => {
    openTwoLeagues();
    const save = vi.spyOn(exportFile, 'saveLeaguesFile').mockResolvedValue('/l.json');

    await exportAllLeagues();

    expect(save.mock.calls[0][0].map((league) => league.uuid)).toEqual([
      LEAGUE,
      OTHER_LEAGUE,
    ]);
    expect(useDatabaseStore.getState().leagues[OTHER_LEAGUE]).toBeUndefined();
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Saved to /l.json',
    });
  });

  it('exports every Blueprint', async () => {
    const save = vi
      .spyOn(exportFile, 'saveBlueprintsFile')
      .mockResolvedValue('/b.json');
    await exportAllBlueprints();
    expect(teamFields(save.mock.calls[0][0])).toHaveLength(1);
    expect(useFileStore.getState().status?.message).toBe('Saved to /b.json');
  });

  it('exports the database as a zip', async () => {
    openTwoLeagues();
    const save = vi
      .spyOn(databaseZip, 'saveDatabaseZipFile')
      .mockResolvedValue('/d.zip');
    await exportDatabase();
    expect(save.mock.calls[0][0]).toBeInstanceOf(Uint8Array);
    expect(useFileStore.getState().status?.message).toBe('Saved to /d.zip');
  });

  it('reports a canceled dialog', async () => {
    vi.spyOn(exportFile, 'saveBlueprintsFile').mockResolvedValue(null);
    await exportAllBlueprints();
    expect(useFileStore.getState().status?.message).toBe('Export canceled.');
  });

  it('reports an error, and does not throw', async () => {
    vi.spyOn(databaseZip, 'saveDatabaseZipFile').mockRejectedValue(
      new Error('Disk full')
    );
    await exportDatabase();
    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Disk full',
    });
  });
});
