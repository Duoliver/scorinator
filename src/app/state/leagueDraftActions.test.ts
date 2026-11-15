import { beforeEach, describe, expect, it } from 'vitest';
import { SEASON } from '@/test/databaseRecords';
import { resetLeagueDraft, setLeagueDraft } from './leagueDraftActions';
import {
  emptyLeagueDraft,
  getLeagueDraft,
  useLeagueDraftStore,
  type LeagueDraft,
} from './leagueDraftStore';

const named = (name: string): LeagueDraft => ({
  ...emptyLeagueDraft(),
  details: { ...emptyLeagueDraft().details, name },
});

beforeEach(() => {
  useLeagueDraftStore.setState(useLeagueDraftStore.getInitialState(), true);
});

describe('one league draft for each container (Task 218 choice 3)', () => {
  it('keeps a Season draft apart from the standalone draft', () => {
    setLeagueDraft(named('Coastal Premier'));
    setLeagueDraft(named('Taça Norte'), SEASON);

    const state = useLeagueDraftStore.getState();
    expect(getLeagueDraft(state).details.name).toBe('Coastal Premier');
    expect(getLeagueDraft(state, SEASON).details.name).toBe('Taça Norte');
  });

  it('gives an empty draft for a Season with no draft', () => {
    expect(getLeagueDraft(useLeagueDraftStore.getState(), SEASON)).toEqual(
      emptyLeagueDraft()
    );
  });

  it('resets one container only', () => {
    setLeagueDraft(named('Coastal Premier'));
    setLeagueDraft(named('Taça Norte'), SEASON);

    resetLeagueDraft(SEASON);

    const state = useLeagueDraftStore.getState();
    expect(getLeagueDraft(state, SEASON)).toEqual(emptyLeagueDraft());
    expect(getLeagueDraft(state).details.name).toBe('Coastal Premier');
  });
});
