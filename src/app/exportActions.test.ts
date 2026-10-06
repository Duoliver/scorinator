import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportResultsBySlug, exportTeams } from './exportActions';
import * as resultsTxt from '@/app/data/resultsTxt';
import * as teamsCsv from '@/app/data/teamsCsv';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';
import type { TeamRecord } from '@/features/components';
import type { LeagueRecord } from '@/features/leagues/types';

const league = (overrides: Partial<LeagueRecord> = {}): LeagueRecord => ({
  slug: 'coastal-premier',
  name: 'Coastal Premier',
  homeAdvantage: false,
  points: { win: 3, draw: 1, loss: 0 },
  teams: [],
  fixtures: [],
  byes: [],
  results: [],
  ...overrides,
});

const team: TeamRecord = {
  slug: 'fc-united',
  name: 'FC United',
  colour: '#E53935',
  tier: 'B',
};

beforeEach(() => {
  vi.restoreAllMocks();
  useLeagueStore.setState({ leagues: [league()] });
  useTeamsStore.setState({ teams: [team] });
  useFileStore.setState({
    currentLeagueSlug: 'coastal-premier',
    paths: {},
    savedLeagues: {},
    status: null,
  });
});

describe('exportTeams', () => {
  it('exports the roster as CSV records and reports the path', async () => {
    const write = vi.spyOn(teamsCsv, 'exportTeamsCsv').mockResolvedValue('/teams.csv');

    await exportTeams();

    expect(write).toHaveBeenCalledWith([
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
});

describe('exportResultsBySlug', () => {
  it('exports the league with the roster and reports the path', async () => {
    const write = vi.spyOn(resultsTxt, 'exportResultsTxt').mockResolvedValue('/r.txt');

    await exportResultsBySlug('coastal-premier');

    expect(write).toHaveBeenCalledWith(league(), [team]);
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Exported Coastal Premier results to /r.txt',
    });
  });

  it('reports an unknown slug and writes nothing', async () => {
    const write = vi.spyOn(resultsTxt, 'exportResultsTxt');

    await exportResultsBySlug('no-such-league');

    expect(write).not.toHaveBeenCalled();
    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Cannot export: league "no-such-league" was not found.',
    });
  });

  it('reports a canceled dialog', async () => {
    vi.spyOn(resultsTxt, 'exportResultsTxt').mockResolvedValue(null);

    await exportResultsBySlug('coastal-premier');

    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Export canceled.',
    });
  });

  it('reports an error and does not throw', async () => {
    vi.spyOn(resultsTxt, 'exportResultsTxt').mockRejectedValue(new Error('No access.'));

    await exportResultsBySlug('coastal-premier');

    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'No access.',
    });
  });
});
