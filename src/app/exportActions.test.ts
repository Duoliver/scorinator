import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exportAllBlueprints,
  exportAllLeagues,
  exportDatabase,
  exportLeague,
  exportResults,
  exportSlugList,
  exportTeams,
} from './exportActions';
import * as exportFile from '@/app/data/exportFile';
import * as databaseZip from '@/app/data/databaseZip';
import * as resultsTxt from '@/app/data/resultsTxt';
import * as slugListTxt from '@/app/data/slugListTxt';
import * as teamsCsv from '@/app/data/teamsCsv';
import { useStatusLineStore } from '@/app/state/statusLineStore';
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
  useStatusLineStore.setState({ status: null });
});

describe('exportTeams', () => {
  it('exports the roster as CSV records and reports the path', async () => {
    const write = vi.spyOn(teamsCsv, 'exportTeamsCsv').mockResolvedValue('/teams.csv');

    await exportTeams();

    expect(teamFields(write.mock.calls[0][0])).toEqual([
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
    ]);
    expect(useStatusLineStore.getState().status).toEqual({
      tone: 'info',
      message: 'Saved to /teams.csv',
    });
  });

  it('reports a canceled dialog', async () => {
    vi.spyOn(teamsCsv, 'exportTeamsCsv').mockResolvedValue(null);

    await exportTeams();

    expect(useStatusLineStore.getState().status).toEqual({
      tone: 'info',
      message: 'Export canceled.',
    });
  });

  it('reports an error and does not throw', async () => {
    vi.spyOn(teamsCsv, 'exportTeamsCsv').mockRejectedValue(new Error('Disk is full.'));

    await exportTeams();

    expect(useStatusLineStore.getState().status).toEqual({
      tone: 'error',
      message: 'Disk is full.',
    });
  });

  it('reports a thrown string, as the Tauri plugins throw', async () => {
    vi.spyOn(teamsCsv, 'exportTeamsCsv').mockRejectedValue('Permission denied.');

    await exportTeams();

    expect(useStatusLineStore.getState().status).toEqual({
      tone: 'error',
      message: 'Permission denied.',
    });
  });
});

describe('the exports of one league (Task 150)', () => {
  const coastal = (): ReturnType<typeof roundRobinLeague> =>
    openTestLeague(roundRobinLeague([{ name: 'FC United', colour: '#E53935' }]));

  it('exports the league file with the Blueprints of the store', async () => {
    const league = coastal();
    const save = vi.spyOn(exportFile, 'saveLeagueFile').mockResolvedValue('/c.json');

    await exportLeague(league);

    expect(save.mock.calls[0][0]).toBe(league);
    expect(save.mock.calls[0][1]).toBe(useDatabaseStore.getState().blueprints);
    expect(useStatusLineStore.getState().status).toEqual({
      tone: 'info',
      message: 'Saved to /c.json',
    });
  });

  it('exports the results text', async () => {
    const league = coastal();
    const write = vi.spyOn(resultsTxt, 'exportResultsTxt').mockResolvedValue('/r.txt');

    await exportResults(league);

    expect(write.mock.calls[0][0]).toBe(league);
    expect(useStatusLineStore.getState().status?.message).toBe('Saved to /r.txt');
  });

  it('exports the slug list', async () => {
    const league = coastal();
    const write = vi
      .spyOn(slugListTxt, 'exportSlugListTxt')
      .mockResolvedValue('/s.txt');

    await exportSlugList(league);

    expect(write.mock.calls[0][0]).toBe(league);
    expect(useStatusLineStore.getState().status?.message).toBe('Saved to /s.txt');
  });

  it('reports a canceled dialog', async () => {
    vi.spyOn(resultsTxt, 'exportResultsTxt').mockResolvedValue(null);
    await exportResults(coastal());
    expect(useStatusLineStore.getState().status?.message).toBe('Export canceled.');
  });

  it('reports an error, and does not throw', async () => {
    vi.spyOn(slugListTxt, 'exportSlugListTxt').mockRejectedValue(
      new Error('Disk full')
    );
    await exportSlugList(coastal());
    expect(useStatusLineStore.getState().status).toEqual({
      tone: 'error',
      message: 'Disk full',
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
    expect(useStatusLineStore.getState().status).toEqual({
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
    expect(useStatusLineStore.getState().status?.message).toBe('Saved to /b.json');
  });

  it('exports the database as a zip', async () => {
    openTwoLeagues();
    const save = vi
      .spyOn(databaseZip, 'saveDatabaseZipFile')
      .mockResolvedValue('/d.zip');
    await exportDatabase();
    expect(save.mock.calls[0][0]).toBeInstanceOf(Uint8Array);
    expect(useStatusLineStore.getState().status?.message).toBe('Saved to /d.zip');
  });

  it('reports a canceled dialog', async () => {
    vi.spyOn(exportFile, 'saveBlueprintsFile').mockResolvedValue(null);
    await exportAllBlueprints();
    expect(useStatusLineStore.getState().status?.message).toBe('Export canceled.');
  });

  it('reports an error, and does not throw', async () => {
    vi.spyOn(databaseZip, 'saveDatabaseZipFile').mockRejectedValue(
      new Error('Disk full')
    );
    await exportDatabase();
    expect(useStatusLineStore.getState().status).toEqual({
      tone: 'error',
      message: 'Disk full',
    });
  });
});
