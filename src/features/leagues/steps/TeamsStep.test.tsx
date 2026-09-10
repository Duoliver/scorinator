import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { TeamsStep } from './TeamsStep';
import { useTeamsStore } from '../../../app/state/teamsStore';

const baseProps = {
  selectedSlugs: [] as string[],
  onToggleTeam: vi.fn(),
  onTeamCreated: vi.fn(),
  onBack: vi.fn(),
  onNext: vi.fn(),
};

beforeEach(() => {
  useTeamsStore.setState({
    teams: [
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      { slug: 'harborview-sc', name: 'Harborview SC', colour: '#1E88E5', tier: 'A' },
    ],
  });
});

describe('TeamsStep', () => {
  it('lists every team from the shared team store', () => {
    render(<TeamsStep {...baseProps} />);
    expect(screen.getByLabelText('FC United')).toBeInTheDocument();
    expect(screen.getByLabelText('Harborview SC')).toBeInTheDocument();
  });

  it('checks a row whose slug is already selected', () => {
    render(<TeamsStep {...baseProps} selectedSlugs={['fc-united']} />);
    expect(screen.getByLabelText('FC United')).toBeChecked();
    expect(screen.getByLabelText('Harborview SC')).not.toBeChecked();
  });

  it('calls onToggleTeam with the clicked team slug', async () => {
    const onToggleTeam = vi.fn();
    render(<TeamsStep {...baseProps} onToggleTeam={onToggleTeam} />);
    await userEvent.click(screen.getByLabelText('FC United'));
    expect(onToggleTeam).toHaveBeenCalledWith('fc-united');
  });

  it('filters the list by the search input', async () => {
    render(<TeamsStep {...baseProps} />);
    await userEvent.type(screen.getByLabelText('Search teams'), 'Harbor');
    expect(screen.queryByLabelText('FC United')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Harborview SC')).toBeInTheDocument();
  });

  it('shows how many teams are selected', () => {
    render(<TeamsStep {...baseProps} selectedSlugs={['fc-united', 'harborview-sc']} />);
    expect(screen.getByText('2 teams selected')).toBeInTheDocument();
  });

  it('creates a team through the inline drawer and reports it via onTeamCreated', async () => {
    const onTeamCreated = vi.fn();
    render(<TeamsStep {...baseProps} onTeamCreated={onTeamCreated} />);
    await userEvent.click(screen.getByText('+ Create new team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Redbrick Athletic');
    await userEvent.click(screen.getByText('Create team'));

    expect(onTeamCreated).toHaveBeenCalledWith('redbrick-athletic');
    expect(screen.getByLabelText('Redbrick Athletic')).toBeInTheDocument();
    expect(useTeamsStore.getState().teams.map((t) => t.slug)).toContain(
      'redbrick-athletic'
    );
  });

  it('disables Next until at least one team is selected', () => {
    render(<TeamsStep {...baseProps} selectedSlugs={[]} />);
    expect(screen.getByText('Next: Review →')).toBeDisabled();
  });
});
