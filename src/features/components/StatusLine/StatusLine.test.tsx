import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import { clearStatusLine, setStatusLine } from '@/app/state/statusLineActions';
import { useStatusLineStore } from '@/app/state/statusLineStore';
import { StatusLine } from './StatusLine';

beforeEach(() => {
  useStatusLineStore.setState({ status: null });
});

describe('StatusLine', () => {
  it('renders nothing while there is no status', () => {
    render(<StatusLine placement="page" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the latest status message, and goes away when it clears', () => {
    render(<StatusLine placement="sidebar" />);

    act(() => setStatusLine({ tone: 'error', message: 'Disk is full.' }));
    expect(screen.getByRole('status')).toHaveTextContent('Disk is full.');

    act(() => clearStatusLine());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
