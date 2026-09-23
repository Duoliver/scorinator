import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { TeamFormDrawer } from './TeamFormDrawer';
import type { TeamRecord } from '@/features/components/types';

describe('TeamFormDrawer', () => {
  it('titles and labels itself for creating a team by default', () => {
    render(<TeamFormDrawer onCancel={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'New team' })).toBeInTheDocument();
    expect(screen.getByText('Create team')).toBeInTheDocument();
  });

  it('titles and labels itself for editing a team when isEdit is set', () => {
    const initial: TeamRecord = {
      slug: 'fc-united',
      name: 'FC United',
      colour: '#E53935',
      tier: 'B',
    };
    render(
      <TeamFormDrawer isEdit initial={initial} onCancel={vi.fn()} onSave={vi.fn()} />
    );
    expect(screen.getByRole('heading', { name: 'Edit team' })).toBeInTheDocument();
    expect(screen.getByText('Save changes')).toBeInTheDocument();
    expect(screen.getByLabelText('Team name')).toHaveValue('FC United');
  });

  it('calls onCancel when the drawer is closed', async () => {
    const onCancel = vi.fn();
    render(<TeamFormDrawer onCancel={onCancel} onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onSave with the assembled record from the form', async () => {
    const onSave = vi.fn();
    render(<TeamFormDrawer onCancel={vi.fn()} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText('Team name'), 'Harborview SC');
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'harborview-sc', name: 'Harborview SC' })
    );
  });
});
