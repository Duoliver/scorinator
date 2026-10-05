import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCurrentLeague, saveLeagueBySlug } from './saveActions';
import * as leagueFile from '@/app/data/leagueFile';
import { isLeagueUnsaved, useFileStore } from '@/app/state/fileStore';
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
  useFileStore.setState({
    currentLeagueSlug: 'coastal-premier',
    paths: {},
    savedLeagues: {},
    status: null,
  });
});

describe('saveLeagueBySlug', () => {
  it('saves with no known path, remembers the path it got, and reports it', async () => {
    const save = vi
      .spyOn(leagueFile, 'saveLeagueFile')
      .mockResolvedValue('/saves/coastal.json');

    await saveLeagueBySlug('coastal-premier');

    expect(save).toHaveBeenCalledWith(league(), [], null);
    expect(useFileStore.getState().paths['coastal-premier']).toBe(
      '/saves/coastal.json'
    );
    expect(useFileStore.getState().currentLeagueSlug).toBe('coastal-premier');
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Saved Coastal Premier to /saves/coastal.json',
    });
  });

  it('passes the remembered path on a later save', async () => {
    useFileStore.setState({ paths: { 'coastal-premier': '/saves/coastal.json' } });
    const save = vi
      .spyOn(leagueFile, 'saveLeagueFile')
      .mockResolvedValue('/saves/coastal.json');

    await saveLeagueBySlug('coastal-premier');

    expect(save).toHaveBeenCalledWith(league(), [], '/saves/coastal.json');
  });

  it('uses Save as when asked, and keeps the new path', async () => {
    useFileStore.setState({ paths: { 'coastal-premier': '/saves/coastal.json' } });
    const saveAs = vi
      .spyOn(leagueFile, 'saveLeagueFileAs')
      .mockResolvedValue('/elsewhere.json');

    await saveLeagueBySlug('coastal-premier', { saveAs: true });

    expect(saveAs).toHaveBeenCalledWith(league(), [], '/saves/coastal.json');
    expect(useFileStore.getState().paths['coastal-premier']).toBe('/elsewhere.json');
  });

  it('reports a canceled dialog and keeps the old path', async () => {
    useFileStore.setState({ paths: { 'coastal-premier': '/saves/coastal.json' } });
    vi.spyOn(leagueFile, 'saveLeagueFileAs').mockResolvedValue(null);

    await saveLeagueBySlug('coastal-premier', { saveAs: true });

    expect(useFileStore.getState().paths['coastal-premier']).toBe(
      '/saves/coastal.json'
    );
    expect(useFileStore.getState().status).toEqual({
      tone: 'info',
      message: 'Save canceled.',
    });
  });

  it('reports a failed save as an error, without throwing', async () => {
    vi.spyOn(leagueFile, 'saveLeagueFile').mockRejectedValue(
      new Error('Disk is full.')
    );

    await expect(saveLeagueBySlug('coastal-premier')).resolves.toBe(false);

    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Disk is full.',
    });
  });

  describe('result', () => {
    it('is true after a save', async () => {
      vi.spyOn(leagueFile, 'saveLeagueFile').mockResolvedValue('/saves/coastal.json');
      expect(await saveLeagueBySlug('coastal-premier')).toBe(true);
    });

    it('is false after a canceled dialog', async () => {
      vi.spyOn(leagueFile, 'saveLeagueFile').mockResolvedValue(null);
      expect(await saveLeagueBySlug('coastal-premier')).toBe(false);
    });

    it('is false after a failed save', async () => {
      vi.spyOn(leagueFile, 'saveLeagueFile').mockRejectedValue(new Error('Disk is full.'));
      expect(await saveLeagueBySlug('coastal-premier')).toBe(false);
    });

    it('is false for an unknown league slug', async () => {
      expect(await saveLeagueBySlug('no-such-league')).toBe(false);
    });
  });

  describe('unsaved tracking', () => {
    const unsaved = (): boolean =>
      isLeagueUnsaved(
        useLeagueStore.getState().leagues[0],
        useFileStore.getState().savedLeagues
      );

    it('marks the league saved after a successful save', async () => {
      vi.spyOn(leagueFile, 'saveLeagueFile').mockResolvedValue('/saves/coastal.json');
      expect(unsaved()).toBe(true);

      await saveLeagueBySlug('coastal-premier');

      expect(unsaved()).toBe(false);
    });

    it('marks the league saved after a successful Save as', async () => {
      vi.spyOn(leagueFile, 'saveLeagueFileAs').mockResolvedValue('/elsewhere.json');

      await saveLeagueBySlug('coastal-premier', { saveAs: true });

      expect(unsaved()).toBe(false);
    });

    it('keeps the league unsaved when the dialog is canceled', async () => {
      vi.spyOn(leagueFile, 'saveLeagueFile').mockResolvedValue(null);

      await saveLeagueBySlug('coastal-premier');

      expect(unsaved()).toBe(true);
    });

    it('keeps the league unsaved when the save fails', async () => {
      vi.spyOn(leagueFile, 'saveLeagueFile').mockRejectedValue(
        new Error('Disk is full.')
      );

      await saveLeagueBySlug('coastal-premier');

      expect(unsaved()).toBe(true);
    });

    it('keeps the league unsaved when it changes while the save is writing', async () => {
      vi.spyOn(leagueFile, 'saveLeagueFile').mockImplementation(async (written) => {
        useLeagueStore.setState({
          leagues: [
            {
              ...written,
              results: [
                { matchday: 1, home: 'a', away: 'b', homeGoals: 1, awayGoals: 0 },
              ],
            },
          ],
        });
        return '/saves/coastal.json';
      });

      await saveLeagueBySlug('coastal-premier');

      expect(unsaved()).toBe(true);
    });
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
    const save = vi
      .spyOn(leagueFile, 'saveLeagueFile')
      .mockResolvedValue('/saves/coastal.json');

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
