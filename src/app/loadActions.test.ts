import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyLoadedLeague,
  importTeamsFromCsv,
  importTeamsFromFile,
  importTeamsFromJson,
  isLeagueOpen,
  openLeagueFile,
} from './loadActions';
import * as leagueFile from '@/app/data/leagueFile';
import * as teamsCsv from '@/app/data/teamsCsv';
import * as teamsFile from '@/app/data/teamsFile';
import * as teamsJson from '@/app/data/teamsJson';
import type { LoadedLeagueFile } from '@/app/data/leagueFile';
import { isLeagueUnsaved, useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';
import type { LeagueRecord } from '@/domain';

const league = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: false,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [{ slug: 'fc-united', ovr: 70 }],
  fixtures: [],
  byes: [],
  results: [],
  ...overrides,
});

const loaded = (): LoadedLeagueFile => ({
  path: '/saves/coastal.json',
  league: league(),
  teams: [{ slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' }],
});

beforeEach(() => {
  vi.restoreAllMocks();
  useLeagueStore.setState({ leagues: [] });
  useTeamsStore.setState({ teams: [] });
  useFileStore.setState({
    currentLeagueSlug: null,
    paths: {},
    savedLeagues: {},
    status: null,
  });
});

describe('openLeagueFile', () => {
  it('returns the loaded file without changing any store', async () => {
    vi.spyOn(leagueFile, 'loadLeagueFile').mockResolvedValue(loaded());

    expect(await openLeagueFile()).toEqual(loaded());
    expect(useLeagueStore.getState().leagues).toEqual([]);
    expect(useFileStore.getState().status).toBeNull();
  });

  it('returns null when the user cancels the dialog', async () => {
    vi.spyOn(leagueFile, 'loadLeagueFile').mockResolvedValue(null);
    expect(await openLeagueFile()).toBeNull();
  });

  it('returns null and reports the error when the file is bad', async () => {
    vi.spyOn(leagueFile, 'loadLeagueFile').mockRejectedValue(new Error('Bad file.'));

    expect(await openLeagueFile()).toBeNull();
    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Bad file.',
    });
  });
});

describe('isLeagueOpen', () => {
  it('is true only for the slug of an open league', () => {
    useLeagueStore.setState({ leagues: [league()] });
    expect(isLeagueOpen('coastal-premier')).toBe(true);
    expect(isLeagueOpen('iron-valley')).toBe(false);
  });
});

describe('applyLoadedLeague', () => {
  it('opens the league, merges its teams, remembers the path, and reports it', () => {
    applyLoadedLeague(loaded());

    expect(useLeagueStore.getState().leagues).toEqual([league()]);
    expect(useTeamsStore.getState().teams).toEqual(loaded().teams);
    expect(useFileStore.getState().paths['coastal-premier']).toBe(
      '/saves/coastal.json'
    );
    expect(useFileStore.getState().currentLeagueSlug).toBe('coastal-premier');
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Loaded Coastal Premier from /saves/coastal.json',
    });
  });
});

describe('team imports', () => {
  const fcUnited = {
    slug: 'fc-united',
    name: 'FC United',
    colour: '#E53935',
    tier: 'B',
  } as const;

  it('merges the imported teams into the roster and reports the count', async () => {
    useTeamsStore.setState({
      teams: [{ slug: 'old-town', name: 'Old Town', colour: '#000000', tier: 'C' }],
    });
    vi.spyOn(teamsCsv, 'importTeamsCsv').mockResolvedValue([fcUnited]);

    await importTeamsFromCsv();

    expect(useTeamsStore.getState().teams.map((team) => team.slug)).toEqual([
      'old-town',
      'fc-united',
    ]);
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Imported 1 team.',
    });
  });

  it('changes nothing when the dialog is canceled', async () => {
    vi.spyOn(teamsCsv, 'importTeamsCsv').mockResolvedValue(null);
    await importTeamsFromCsv();
    expect(useTeamsStore.getState().teams).toEqual([]);
    expect(useFileStore.getState().status).toBeNull();
  });

  it('reports an error and changes nothing when the import fails', async () => {
    vi.spyOn(teamsCsv, 'importTeamsCsv').mockRejectedValue(new Error('Bad CSV.'));
    await importTeamsFromCsv();
    expect(useTeamsStore.getState().teams).toEqual([]);
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
    expect(useTeamsStore.getState().teams).toEqual([fcUnited]);
  });

  it('reads a CSV or JSON team list through the one-dialog import', async () => {
    const importer = vi
      .spyOn(teamsFile, 'importTeamsFile')
      .mockResolvedValue([fcUnited]);
    await importTeamsFromFile();
    expect(importer).toHaveBeenCalledOnce();
    expect(useTeamsStore.getState().teams).toEqual([fcUnited]);
  });
});

describe('applyLoadedLeague unsaved tracking', () => {
  it('marks the loaded league saved', () => {
    const file = loaded();

    applyLoadedLeague(file);

    expect(
      isLeagueUnsaved(
        useLeagueStore.getState().leagues[0],
        useFileStore.getState().savedLeagues
      )
    ).toBe(false);
  });

  it('marks a league unsaved again after it changes, then saved on a reload', () => {
    applyLoadedLeague(loaded());
    const [opened] = useLeagueStore.getState().leagues;
    useLeagueStore.setState({ leagues: [{ ...opened, name: 'Renamed' }] });
    expect(
      isLeagueUnsaved(
        useLeagueStore.getState().leagues[0],
        useFileStore.getState().savedLeagues
      )
    ).toBe(true);

    applyLoadedLeague(loaded());

    expect(
      isLeagueUnsaved(
        useLeagueStore.getState().leagues[0],
        useFileStore.getState().savedLeagues
      )
    ).toBe(false);
  });
});
