import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('renders its title and children', () => {
    render(
      <Drawer title="New team" onClose={vi.fn()}>
        <p>Form content</p>
      </Drawer>
    );
    expect(screen.getByRole('heading', { name: 'New team' })).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('exposes a dialog role, labelled by its title', () => {
    render(
      <Drawer title="New team" onClose={vi.fn()}>
        <p>Form content</p>
      </Drawer>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('New team');
  });

  it('moves focus to the close button on open', () => {
    render(
      <Drawer title="New team" onClose={vi.fn()}>
        <p>Form content</p>
      </Drawer>
    );
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Drawer title="New team" onClose={onClose}>
        <p>Form content</p>
      </Drawer>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Drawer title="New team" onClose={onClose}>
        <p>Form content</p>
      </Drawer>
    );
    // A click that lands on the dialog element itself, not a descendant,
    // is what a real backdrop click looks like — every visible control is
    // a descendant and stops the event there first.
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Drawer title="New team" onClose={onClose}>
        <p>Form content</p>
      </Drawer>
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
