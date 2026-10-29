import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportResults, exportTeams } from './exportActions';
import * as resultsTxt from '@/app/data/resultsTxt';
import * as teamsCsv from '@/app/data/teamsCsv';
import { useFileStore } from '@/app/state/fileStore';
import type { TeamFields } from '@/domain';
import {
  LEAGUE,
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
