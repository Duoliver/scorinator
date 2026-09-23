import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCurrentLeague, saveLeagueBySlug } from './saveActions';
import * as leagueFile from '@/app/data/leagueFile';
import { useFileStore } from '@/app/state/fileStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useTeamsStore } from '@/app/state/teamsStore';
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

beforeEach(() => {
  vi.restoreAllMocks();
  useLeagueStore.setState({ leagues: [league()] });
  useTeamsStore.setState({ teams: [] });
  useFileStore.setState({ currentLeagueSlug: 'coastal-premier', paths: {}, status: null });
});

describe('saveLeagueBySlug', () => {
  it('saves with no known path, remembers the path it got, and reports it', async () => {
    const save = vi.spyOn(leagueFile, 'saveLeagueFile').mockResolvedValue('/saves/coastal.json');

    await saveLeagueBySlug('coastal-premier');

    expect(save).toHaveBeenCalledWith(league(), [], null);
    expect(useFileStore.getState().paths['coastal-premier']).toBe('/saves/coastal.json');
    expect(useFileStore.getState().currentLeagueSlug).toBe('coastal-premier');
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Saved Coastal Premier to /saves/coastal.json',
    });
  });

  it('passes the remembered path on a later save', async () => {
    useFileStore.setState({ paths: { 'coastal-premier': '/saves/coastal.json' } });
    const save = vi.spyOn(leagueFile, 'saveLeagueFile').mockResolvedValue('/saves/coastal.json');

    await saveLeagueBySlug('coastal-premier');

    expect(save).toHaveBeenCalledWith(league(), [], '/saves/coastal.json');
  });

  it('uses Save as when asked, and keeps the new path', async () => {
    useFileStore.setState({ paths: { 'coastal-premier': '/saves/coastal.json' } });
    const saveAs = vi.spyOn(leagueFile, 'saveLeagueFileAs').mockResolvedValue('/elsewhere.json');

    await saveLeagueBySlug('coastal-premier', { saveAs: true });

    expect(saveAs).toHaveBeenCalledWith(league(), [], '/saves/coastal.json');
    expect(useFileStore.getState().paths['coastal-premier']).toBe('/elsewhere.json');
  });

  it('reports a canceled dialog and keeps the old path', async () => {
    useFileStore.setState({ paths: { 'coastal-premier': '/saves/coastal.json' } });
    vi.spyOn(leagueFile, 'saveLeagueFileAs').mockResolvedValue(null);

    await saveLeagueBySlug('coastal-premier', { saveAs: true });

    expect(useFileStore.getState().paths['coastal-premier']).toBe('/saves/coastal.json');
    expect(useFileStore.getState().status).toEqual({ tone: 'info', message: 'Save canceled.' });
  });

  it('reports a failed save as an error, without throwing', async () => {
    vi.spyOn(leagueFile, 'saveLeagueFile').mockRejectedValue(new Error('Disk is full.'));

    await expect(saveLeagueBySlug('coastal-premier')).resolves.toBeUndefined();

    expect(useFileStore.getState().status).toEqual({ tone: 'error', message: 'Disk is full.' });
  });

  it('reports an unknown league slug as an error', async () => {
    const save = vi.spyOn(leagueFile, 'saveLeagueFile');

    await saveLeagueBySlug('no-such-league');

    expect(save).not.toHaveBeenCalled();
    expect(useFileStore.getState().status?.tone).toBe('error');
  });
});

describe('saveCurrentLeague', () => {
  it('saves the current league', async () => {
    const save = vi.spyOn(leagueFile, 'saveLeagueFile').mockResolvedValue('/saves/coastal.json');

    await saveCurrentLeague();

    expect(save).toHaveBeenCalledOnce();
  });

  it('tells the user to open or create a league when there is no current one', async () => {
    useFileStore.setState({ currentLeagueSlug: null });
    const save = vi.spyOn(leagueFile, 'saveLeagueFile');

    await saveCurrentLeague();

    expect(save).not.toHaveBeenCalled();
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'No league to save. Open or create a league first.',
    });
  });
});
