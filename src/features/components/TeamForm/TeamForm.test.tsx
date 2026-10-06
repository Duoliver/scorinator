import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { TeamForm } from './TeamForm';
import { DEFAULT_TEAM_COLOUR, TEAM_PALETTE } from '@/design-system';
import type { TeamRecord } from '@/features/components/types';

describe('TeamForm', () => {
  it('renders the given save label and every field', () => {
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Create team')).toBeInTheDocument();
    expect(screen.getByLabelText('Team name')).toBeInTheDocument();
    expect(screen.getByLabelText('Slug (auto-generated)')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Colour' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tier')).toBeInTheDocument();
  });

  it('shows one swatch for each palette colour', () => {
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getAllByRole('radio')).toHaveLength(TEAM_PALETTE.length);
  });

  it('selects the default colour for a new team', () => {
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={vi.fn()} />);
    const defaultName = TEAM_PALETTE.find(
      ({ hex }) => hex === DEFAULT_TEAM_COLOUR
    )?.name;
    expect(screen.getByRole('radio', { name: defaultName })).toBeChecked();
  });

  it('auto-fills the slug as the user types a name', async () => {
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={vi.fn()} />);
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
        saveLabel="Save changes"
        initial={initial}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Team name')).toHaveValue('FC United');
    expect(screen.getByLabelText('Slug (auto-generated)')).toHaveValue('fc-united');
    expect(screen.getByRole('radio', { name: 'Red' })).toBeChecked();
    expect(screen.getByLabelText('Tier')).toHaveValue('B');
  });

  it('calls onSave with the assembled record on Save', async () => {
    const onSave = vi.fn();
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText('Team name'), 'Harborview SC');
    await userEvent.click(screen.getByRole('radio', { name: 'Gold' }));
    await userEvent.selectOptions(screen.getByLabelText('Tier'), 'A');
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).toHaveBeenCalledWith({
      slug: 'harborview-sc',
      name: 'Harborview SC',
      colour: '#F9A825',
      tier: 'A',
    });
  });

  it('saves the default colour when the user picks none', async () => {
    const onSave = vi.fn();
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText('Team name'), 'Harborview SC');
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ colour: DEFAULT_TEAM_COLOUR })
    );
  });

  it('keeps a colour that is not in the palette when the user picks none', async () => {
    const onSave = vi.fn();
    const initial: TeamRecord = {
      slug: 'fc-united',
      name: 'FC United',
      colour: '#123456',
      tier: 'B',
    };
    render(
      <TeamForm
        saveLabel="Save changes"
        initial={initial}
        onCancel={vi.fn()}
        onSave={onSave}
      />
    );
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toBeChecked();
    }
    await userEvent.click(screen.getByText('Save changes'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ colour: '#123456' }));
  });

  it('keeps an empty colour from an import when the user picks none', async () => {
    const onSave = vi.fn();
    const initial: TeamRecord = {
      slug: 'fc-united',
      name: 'FC United',
      colour: '',
      tier: 'B',
    };
    render(
      <TeamForm
        saveLabel="Save changes"
        initial={initial}
        onCancel={vi.fn()}
        onSave={onSave}
      />
    );
    await userEvent.click(screen.getByText('Save changes'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ colour: '' }));
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<TeamForm saveLabel="Create team" onCancel={onCancel} onSave={vi.fn()} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows a validation error and does not save when the name is blank', async () => {
    const onSave = vi.fn();
    render(<TeamForm saveLabel="Create team" onCancel={vi.fn()} onSave={onSave} />);
    await userEvent.click(screen.getByText('Create team'));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/enter a team name/i)).toBeInTheDocument();
  });
});
