import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

const renderConfirm = (
  overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}
): { onConfirm: () => void; onCancel: () => void } => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      title="Clear later rounds?"
      message="This will clear results for later rounds. Continue?"
      confirmLabel="Clear & scorinate"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />
  );
  return { onConfirm, onCancel };
};

describe('ConfirmDialog', () => {
  it('shows the title, the message, Cancel, and the confirm label', () => {
    renderConfirm();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('Clear later rounds?');
    expect(dialog).toHaveAccessibleDescription(
      'This will clear results for later rounds. Continue?'
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Clear & scorinate' })
    ).toBeInTheDocument();
  });

  it('is a sm modal with no close button', () => {
    renderConfirm();
    expect(screen.getByRole('dialog').firstElementChild).toHaveAttribute(
      'data-size',
      'sm'
    );
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('starts with focus on Cancel', () => {
    renderConfirm();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('calls onConfirm from the confirm button, and not onCancel', async () => {
    const { onConfirm, onCancel } = renderConfirm();
    await userEvent.click(screen.getByRole('button', { name: 'Clear & scorinate' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel from Cancel, Escape, and a backdrop click, never onConfirm', async () => {
    const { onConfirm, onCancel } = renderConfirm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('dialog'));

    expect(onCancel).toHaveBeenCalledTimes(3);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('gives the confirm button the primary look by default, and the destructive look on request', () => {
    const { unmount } = render(
      <ConfirmDialog
        title="Start phase 2?"
        message="Phase 1 locks, and its results can no longer change."
        confirmLabel="Start phase 2"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const primary = screen.getByRole('button', { name: 'Start phase 2' }).className;
    unmount();

    renderConfirm({ tone: 'destructive' });
    const destructive = screen.getByRole('button', {
      name: 'Clear & scorinate',
    }).className;

    expect(primary).toMatch(/primary/);
    expect(destructive).toMatch(/destructive/);
  });
});
