import { beforeEach, describe, expect, it } from 'vitest';
import { clearStatusLine, setStatusLine } from './statusLineActions';
import { useStatusLineStore } from './statusLineStore';

beforeEach(() => {
  useStatusLineStore.setState({ status: null });
});

describe('useStatusLineStore', () => {
  it('starts with no status', () => {
    expect(useStatusLineStore.getInitialState().status).toBeNull();
  });

  it('setStatusLine and clearStatusLine set and remove the status line', () => {
    setStatusLine({ tone: 'error', message: 'Could not save.' });
    expect(useStatusLineStore.getState().status).toEqual({
      tone: 'error',
      message: 'Could not save.',
    });

    clearStatusLine();
    expect(useStatusLineStore.getState().status).toBeNull();
  });
});
