import { beforeEach, describe, expect, it } from 'vitest';
import { isLeagueUnsaved, useFileStore } from './fileStore';
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
  useFileStore.setState({
    currentLeagueSlug: null,
    paths: {},
    savedLeagues: {},
    status: null,
  });
});

describe('useFileStore', () => {
  it('starts with no current league, no saved paths, and no status', () => {
    const state = useFileStore.getState();
    expect(state.currentLeagueSlug).toBeNull();
    expect(state.paths).toEqual({});
    expect(state.status).toBeNull();
  });

  it('setCurrent remembers the current league slug', () => {
    useFileStore.getState().setCurrent('coastal-premier');
    expect(useFileStore.getState().currentLeagueSlug).toBe('coastal-premier');
  });

  it('setPath keeps one saved path per league, without touching the others', () => {
    useFileStore.getState().setPath('coastal-premier', '/saves/coastal.json');
    useFileStore.getState().setPath('inland-cup', '/saves/inland.json');
    useFileStore.getState().setPath('coastal-premier', '/saves/coastal-v2.json');

    expect(useFileStore.getState().paths).toEqual({
      'coastal-premier': '/saves/coastal-v2.json',
      'inland-cup': '/saves/inland.json',
    });
  });

  it('setStatus and clearStatus set and remove the status line', () => {
    useFileStore.getState().setStatus({ tone: 'error', message: 'Could not save.' });
    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Could not save.',
    });

    useFileStore.getState().clearStatus();
    expect(useFileStore.getState().status).toBeNull();
  });

  it('markSaved keeps the saved league per slug, without touching the others', () => {
    const coastal = league();
    const inland = league({ slug: 'inland-cup' });
    useFileStore.getState().markSaved(coastal);
    useFileStore.getState().markSaved(inland);

    expect(useFileStore.getState().savedLeagues).toEqual({
      'coastal-premier': coastal,
      'inland-cup': inland,
    });
  });
});

describe('isLeagueUnsaved', () => {
  it('is true for a league with no saved copy', () => {
    expect(isLeagueUnsaved(league(), {})).toBe(true);
  });

  it('is false for the very same object that was saved', () => {
    const saved = league();
    expect(isLeagueUnsaved(saved, { [saved.slug]: saved })).toBe(false);
  });

  it('is true for a different object, even one with equal content', () => {
    const saved = league();
    expect(isLeagueUnsaved({ ...saved }, { [saved.slug]: saved })).toBe(true);
  });

  it('is true when only another league was saved', () => {
    const other = league({ slug: 'inland-cup' });
    expect(isLeagueUnsaved(league(), { [other.slug]: other })).toBe(true);
  });
});
