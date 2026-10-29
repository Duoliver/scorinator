import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  importTeamsFromCsv,
  importTeamsFromFile,
  importTeamsFromJson,
} from './loadActions';
import * as teamsCsv from '@/app/data/teamsCsv';
import * as teamsFile from '@/app/data/teamsFile';
import * as teamsJson from '@/app/data/teamsJson';
import { useFileStore } from '@/app/state/fileStore';
import { openTestDatabase, teamFields } from '@/test/databaseRecords';
import { useDatabaseStore } from '@/app/state/databaseStore';

beforeEach(() => {
  vi.restoreAllMocks();
  openTestDatabase([]);
  useFileStore.setState({ status: null });
});

describe('team imports', () => {
  const fcUnited = {
    slug: 'fc-united',
    name: 'FC United',
    colour: '#E53935',
    tier: 'B',
  } as const;

  it('adds the imported teams to the Blueprints and reports the counts', async () => {
    openTestDatabase([
      { slug: 'old-town', name: 'Old Town', colour: '#000000', tier: 'C' },
    ]);
    vi.spyOn(teamsCsv, 'importTeamsCsv').mockResolvedValue([fcUnited]);

    await importTeamsFromCsv();

    expect(useDatabaseStore.getState().blueprints.map((team) => team.slug)).toEqual([
      'old-town',
      'fc-united',
    ]);
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Imported 1 team: 1 new, 0 updated.',
    });
  });

  it('changes nothing when the dialog is canceled', async () => {
    vi.spyOn(teamsCsv, 'importTeamsCsv').mockResolvedValue(null);
    await importTeamsFromCsv();
    expect(teamFields(useDatabaseStore.getState().blueprints)).toEqual([]);
    expect(useFileStore.getState().status).toBeNull();
  });

  it('reports an error and changes nothing when the import fails', async () => {
    vi.spyOn(teamsCsv, 'importTeamsCsv').mockRejectedValue(new Error('Bad CSV.'));
    await importTeamsFromCsv();
    expect(teamFields(useDatabaseStore.getState().blueprints)).toEqual([]);
    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Bad CSV.',
    });
  });

  it('reads a JSON team list through the JSON import', async () => {
    const importer = vi
      .spyOn(teamsJson, 'importTeamsJson')
      .mockResolvedValue([fcUnited]);
    await importTeamsFromJson();
    expect(importer).toHaveBeenCalledOnce();
    expect(teamFields(useDatabaseStore.getState().blueprints)).toEqual([fcUnited]);
  });

  it('reads a CSV or JSON team list through the one-dialog import', async () => {
    const importer = vi
      .spyOn(teamsFile, 'importTeamsFile')
      .mockResolvedValue([fcUnited]);
    await importTeamsFromFile();
    expect(importer).toHaveBeenCalledOnce();
    expect(teamFields(useDatabaseStore.getState().blueprints)).toEqual([fcUnited]);
  });
});
