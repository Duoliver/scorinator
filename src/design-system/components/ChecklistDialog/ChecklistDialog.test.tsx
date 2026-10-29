import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { ChecklistDialog } from './ChecklistDialog';

const renderChecklist = (): { onConfirm: () => void; onCancel: () => void } => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ChecklistDialog
      title="Import leagues"
      description="Found 3 in the file. Choose which to import."
      items={[
        { id: 'l1', label: 'Coastal Premier' },
        { id: 'l2', label: 'Inland Cup', content: <span>Inland Cup · Conflict</span> },
        { id: 'l3', label: 'Iron Valley Cup' },
      ]}
      confirmLabel="Import selected"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
  return { onConfirm, onCancel };
};

describe('ChecklistDialog', () => {
  it('is a md modal with the title and the description', () => {
    renderChecklist();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('Import leagues');
    expect(dialog).toHaveAccessibleDescription(
      'Found 3 in the file. Choose which to import.'
    );
    expect(dialog.firstElementChild).toHaveAttribute('data-size', 'md');
  });

  it('shows one checkbox row for each item, all checked at start, with the item content', () => {
    renderChecklist();
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(3);
    boxes.forEach((box) => expect(box).toBeChecked());
    expect(
      screen.getByRole('checkbox', { name: 'Inland Cup · Conflict' })
    ).toBeInTheDocument();
  });

  it('makes the whole row the click target: each row is one label', async () => {
    renderChecklist();
    const rows = screen.getAllByRole('listitem');
    rows.forEach((row) => expect(row.firstElementChild?.tagName).toBe('LABEL'));
    expect(rows[0]?.firstElementChild).toHaveAttribute('data-full-width');

    await userEvent.click(rows[0]!.firstElementChild as HTMLElement);

    expect(screen.getByRole('checkbox', { name: 'Coastal Premier' })).not.toBeChecked();
  });

  it('confirms the checked ids, in list order', async () => {
    const { onConfirm } = renderChecklist();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Coastal Premier' }));
    await userEvent.click(screen.getByRole('button', { name: 'Import selected' }));

    expect(onConfirm).toHaveBeenCalledWith(['l2', 'l3']);
  });

  it('disables the confirm button with no row checked', async () => {
    renderChecklist();
    for (const box of screen.getAllByRole('checkbox')) await userEvent.click(box);

    expect(screen.getByRole('button', { name: 'Import selected' })).toBeDisabled();
  });

  it('cancels from Cancel and Escape, and never confirms', async () => {
    const { onConfirm, onCancel } = renderChecklist();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
