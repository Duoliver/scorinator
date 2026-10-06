import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import { clearFileStatus, setFileStatus } from '@/app/state/fileActions';
import { useFileStore } from '@/app/state/fileStore';
import { StatusLine } from './StatusLine';

beforeEach(() => {
  useFileStore.setState({ status: null });
});

describe('StatusLine', () => {
  it('renders nothing while there is no status', () => {
    render(<StatusLine placement="page" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the latest status message, and goes away when it clears', () => {
    render(<StatusLine placement="sidebar" />);

    act(() => setFileStatus({ tone: 'error', message: 'Disk is full.' }));
    expect(screen.getByRole('status')).toHaveTextContent('Disk is full.');

    act(() => clearFileStatus());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
