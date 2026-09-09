import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { TeamsScreen } from './TeamsScreen';
import * as csvIO from './csvIO';
import * as jsonIO from './jsonIO';

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

  it('imports teams from CSV and merges them into the roster', async () => {
    vi.spyOn(csvIO, 'importTeamsCsv').mockResolvedValue([
      { slug: '', name: 'FC United', colour: '#E53935', tier: 'B' },
    ]);
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('Import CSV...'));

    expect(await screen.findByText('FC United')).toBeInTheDocument();
    expect(screen.getByText('fc-united')).toBeInTheDocument();
    expect(screen.getByText('Imported 1 team.')).toBeInTheDocument();
  });

  it('shows an error and does not change the roster when the CSV import fails', async () => {
    vi.spyOn(csvIO, 'importTeamsCsv').mockRejectedValue(
      new Error('Team CSV is missing required column "Tier".')
    );
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('Import CSV...'));

    expect(await screen.findByText(/missing required column/)).toBeInTheDocument();
    expect(screen.getByText('0 teams')).toBeInTheDocument();
  });

  it('imports teams from JSON and merges them into the roster', async () => {
    vi.spyOn(jsonIO, 'importTeamsJson').mockResolvedValue([
      { slug: '', name: 'FC United', colour: '#E53935', tier: 'B' },
    ]);
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('Import JSON...'));

    expect(await screen.findByText('FC United')).toBeInTheDocument();
    expect(screen.getByText('fc-united')).toBeInTheDocument();
    expect(screen.getByText('Imported 1 team.')).toBeInTheDocument();
  });

  it('shows an error and does not change the roster when the JSON import fails', async () => {
    vi.spyOn(jsonIO, 'importTeamsJson').mockRejectedValue(
      new Error('Team JSON entry 1 has an invalid tier.')
    );
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('Import JSON...'));

    expect(await screen.findByText(/invalid tier/)).toBeInTheDocument();
    expect(screen.getByText('0 teams')).toBeInTheDocument();
  });

  it('exports the current roster to CSV', async () => {
    const exportSpy = vi.spyOn(csvIO, 'exportTeamsCsv').mockResolvedValue('/teams.csv');
    render(<TeamsScreen />);
    await userEvent.click(screen.getByText('+ New team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Ashfield Town');
    await userEvent.click(screen.getByText('Create team'));

    await userEvent.click(screen.getByText('Export CSV...'));

    expect(exportSpy).toHaveBeenCalledWith([
      { slug: 'ashfield-town', name: 'Ashfield Town', colour: '', tier: 'C' },
    ]);
    expect(await screen.findByText('Saved to /teams.csv')).toBeInTheDocument();
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
