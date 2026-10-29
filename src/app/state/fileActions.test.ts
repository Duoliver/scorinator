import { beforeEach, describe, expect, it } from 'vitest';
import { clearFileStatus, setFileStatus } from './fileActions';
import { useFileStore } from './fileStore';

beforeEach(() => {
  useFileStore.setState({ status: null });
});

describe('useFileStore', () => {
  it('starts with no status', () => {
    expect(useFileStore.getInitialState().status).toBeNull();
  });

  it('setFileStatus and clearFileStatus set and remove the status line', () => {
    setFileStatus({ tone: 'error', message: 'Could not save.' });
    expect(useFileStore.getState().status).toEqual({
      tone: 'error',
      message: 'Could not save.',
    });

    clearFileStatus();
    expect(useFileStore.getState().status).toBeNull();
  });
});
