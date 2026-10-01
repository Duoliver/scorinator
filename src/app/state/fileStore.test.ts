import { beforeEach, describe, expect, it } from 'vitest';
import { useFileStore } from './fileStore';

beforeEach(() => {
  useFileStore.setState({ currentLeagueSlug: null, paths: {}, status: null });
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
    expect(useFileStore.getState().status).toEqual({ tone: 'error', message: 'Could not save.' });

    useFileStore.getState().clearStatus();
    expect(useFileStore.getState().status).toBeNull();
  });
});
