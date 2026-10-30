import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTeamImport,
  readTeamsFromCsv,
  readTeamsFromFile,
  readTeamsFromJson,
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

const fcUnited = {
  slug: 'fc-united',
  name: 'FC United',
  colour: '#E53935',
  tier: 'B',
} as const;

const oldTown = {
  slug: 'old-town',
  name: 'Old Town',
  colour: '#000000',
  tier: 'C',
} as const;

describe('team import reads', () => {
  it('gives the records and the counts, and changes nothing', async () => {
    openTestDatabase([oldTown]);
    const renamed = { ...oldTown, name: 'Old Town FC' };
    vi.spyOn(teamsCsv, 'importTeamsCsv').mockResolvedValue([fcUnited, renamed]);

    const preview = await readTeamsFromCsv();

    expect(preview).toEqual({ records: [fcUnited, renamed], added: 1, updated: 1 });
    expect(teamFields(useDatabaseStore.getState().blueprints)).toEqual([oldTown]);
    expect(useFileStore.getState().status).toBeNull();
  });

  it('gives null and no message when the dialog is canceled', async () => {
    vi.spyOn(teamsCsv, 'importTeamsCsv').mockResolvedValue(null);
    expect(await readTeamsFromCsv()).toBeNull();
    expect(useFileStore.getState().status).toBeNull();
  });

  it('gives null and reports the error when the read fails', async () => {
    vi.spyOn(teamsCsv, 'importTeamsCsv').mockRejectedValue(new Error('Bad CSV.'));
    expect(await readTeamsFromCsv()).toBeNull();
    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Bad CSV.',
    });
  });

  it('gives null and says so when the file has no teams (choice 10)', async () => {
    vi.spyOn(teamsCsv, 'importTeamsCsv').mockResolvedValue([]);
    expect(await readTeamsFromCsv()).toBeNull();
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'The file has no teams.',
    });
  });

  it('reads a JSON team list through the JSON import', async () => {
    const importer = vi
      .spyOn(teamsJson, 'importTeamsJson')
      .mockResolvedValue([fcUnited]);
    expect(await readTeamsFromJson()).toEqual({
      records: [fcUnited],
      added: 1,
      updated: 0,
    });
    expect(importer).toHaveBeenCalledOnce();
  });

  it('reads a CSV or JSON team list through the one-dialog import', async () => {
    const importer = vi
      .spyOn(teamsFile, 'importTeamsFile')
      .mockResolvedValue([fcUnited]);
    expect(await readTeamsFromFile()).toEqual({
      records: [fcUnited],
      added: 1,
      updated: 0,
    });
    expect(importer).toHaveBeenCalledOnce();
  });
});

describe('applyTeamImport', () => {
  it('adds the records to the Blueprints and reports the counts', () => {
    openTestDatabase([oldTown]);

    applyTeamImport([fcUnited]);

    expect(useDatabaseStore.getState().blueprints.map((team) => team.slug)).toEqual([
      'old-town',
      'fc-united',
    ]);
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Imported 1 team: 1 new, 0 updated.',
    });
  });

  it('reports an error and does not throw when no database is open', () => {
    useDatabaseStore.setState({ status: { kind: 'closed' } });

    expect(() => applyTeamImport([fcUnited])).not.toThrow();
    expect(useFileStore.getState().status?.tone).toBe('error');
  });
});
