import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { TeamForm } from './TeamForm';
import type { TeamRecord } from '../types';

describe('TeamForm', () => {
  it('renders the given title and save label', () => {
    render(
      <TeamForm
        title="New team"
        saveLabel="Create team"
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText('New team')).toBeInTheDocument();
    expect(screen.getByText('Create team')).toBeInTheDocument();
  });

  it('auto-fills the slug as the user types a name', async () => {
    render(
      <TeamForm
        title="New team"
        saveLabel="Create team"
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );
    await userEvent.type(screen.getByLabelText('Team name'), 'Salt Marsh United');
    expect(screen.getByLabelText('Slug (auto-generated)')).toHaveValue(
      'salt-marsh-united'
    );
  });

  it('pre-fills every field from `initial` when editing', () => {
    const initial: TeamRecord = {
      slug: 'fc-united',
      name: 'FC United',
      colour: '#E53935',
      tier: 'B',
    };
    render(
      <TeamForm
        title="Edit team"
        saveLabel="Save changes"
        initial={initial}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Team name')).toHaveValue('FC United');
    expect(screen.getByLabelText('Slug (auto-generated)')).toHaveValue('fc-united');
    expect(screen.getByLabelText('Colour')).toHaveValue('#E53935');
    expect(screen.getByLabelText('Tier')).toHaveValue('B');
  });

  it('calls onSave with the assembled record on Save', async () => {
    const onSave = vi.fn();
    render(
      <TeamForm
        title="New team"
        saveLabel="Create team"
        onCancel={vi.fn()}
        onSave={onSave}
      />
    );
    await userEvent.type(screen.getByLabelText('Team name'), 'Harborview SC');
    await userEvent.type(screen.getByLabelText('Colour'), '#F9A825');
    await userEvent.selectOptions(screen.getByLabelText('Tier'), 'A');
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).toHaveBeenCalledWith({
      slug: 'harborview-sc',
      name: 'Harborview SC',
      colour: '#F9A825',
      tier: 'A',
    });
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(
      <TeamForm
        title="New team"
        saveLabel="Create team"
        onCancel={onCancel}
        onSave={vi.fn()}
      />
    );
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows a validation error and does not save when the name is blank', async () => {
    const onSave = vi.fn();
    render(
      <TeamForm
        title="New team"
        saveLabel="Create team"
        onCancel={vi.fn()}
        onSave={onSave}
      />
    );
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/enter a team name/i)).toBeInTheDocument();
  });
});
