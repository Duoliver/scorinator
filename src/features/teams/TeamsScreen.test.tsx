import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { TeamsScreen } from './TeamsScreen';
import { useTeamsStore } from '@/app/state/teamsStore';

beforeEach(() => {
  useTeamsStore.setState({ teams: [] });
});

describe('TeamsScreen', () => {
  it('renders an empty roster with a team count of 0', () => {
    render(<TeamsScreen />);
    expect(screen.getByText('0 teams')).toBeInTheDocument();
  });

  it('creates a team through the New team drawer and lists it', async () => {
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Salt Marsh United');
    await userEvent.click(screen.getByText('Create team'));

    expect(screen.getByText('Salt Marsh United')).toBeInTheDocument();
    expect(screen.getByText('salt-marsh-united')).toBeInTheDocument();
    expect(screen.getByText('1 teams')).toBeInTheDocument();
  });

  it('closes the drawer without saving on Cancel', async () => {
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Redbrick Athletic');
    await userEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Redbrick Athletic')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Team name')).not.toBeInTheDocument();
  });

  it('edits an existing team in place', async () => {
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Northgate FC');
    await userEvent.click(screen.getByText('Create team'));

    await userEvent.click(screen.getByText('Edit'));
    const nameField = screen.getByLabelText('Team name');
    await userEvent.clear(nameField);
    await userEvent.type(nameField, 'Northgate United');
    await userEvent.click(screen.getByText('Save changes'));

    expect(screen.getByText('1 teams')).toBeInTheDocument();
    expect(screen.getByText('Northgate United')).toBeInTheDocument();
    expect(screen.queryByText('Northgate FC')).not.toBeInTheDocument();
  });

  it('has no import or export buttons — those live on the File screen', () => {
    render(<TeamsScreen />);

    expect(screen.queryByText('Import CSV...')).not.toBeInTheDocument();
    expect(screen.queryByText('Import JSON...')).not.toBeInTheDocument();
    expect(screen.queryByText('Export CSV...')).not.toBeInTheDocument();
    expect(screen.getByText('+ New team')).toBeInTheDocument();
  });

  it('opens the right team when a row other than the first is edited', async () => {
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Team One');
    await userEvent.click(screen.getByText('Create team'));
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Team Two');
    await userEvent.click(screen.getByText('Create team'));

    const editButtons = screen.getAllByText('Edit');
    expect(editButtons).toHaveLength(2);
    await userEvent.click(editButtons[1]);
    expect(screen.getByLabelText('Team name')).toHaveValue('Team Two');
  });
});
