import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { TeamsStep } from './TeamsStep';
import { useTeamsStore } from '@/app/state/teamsStore';

const baseProps = {
  name: 'Coastal Premier',
  homeAdvantage: true,
  points: { win: 3, draw: 1, loss: 0 },
  selectedSlugs: [] as string[],
  onToggleTeam: vi.fn(),
  onSelectAll: vi.fn(),
  onClearSelection: vi.fn(),
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

  it('calls onSelectAll with every visible slug when Select all is clicked', async () => {
    const onSelectAll = vi.fn();
    render(<TeamsStep {...baseProps} onSelectAll={onSelectAll} />);
    await userEvent.click(screen.getByText('Select all'));
    expect(onSelectAll).toHaveBeenCalledWith(['fc-united', 'harborview-sc']);
  });

  it('checks every visible row when Select all is clicked', async () => {
    render(<TeamsStep {...baseProps} />);
    await userEvent.click(screen.getByText('Select all'));
    expect(screen.getByLabelText('FC United')).toBeChecked();
    expect(screen.getByLabelText('Harborview SC')).toBeChecked();
  });

  it('only selects the filtered slugs when a search is active', async () => {
    const onSelectAll = vi.fn();
    render(<TeamsStep {...baseProps} onSelectAll={onSelectAll} />);
    await userEvent.type(screen.getByLabelText('Search teams'), 'Harbor');
    await userEvent.click(screen.getByText('Select all'));
    expect(onSelectAll).toHaveBeenCalledWith(['harborview-sc']);
  });

  it('shows Clear selection once every visible team is selected, and clears them on click', async () => {
    const onClearSelection = vi.fn();
    render(
      <TeamsStep
        {...baseProps}
        selectedSlugs={['fc-united', 'harborview-sc']}
        onClearSelection={onClearSelection}
      />
    );
    expect(screen.getByText('Clear selection')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Clear selection'));

    expect(onClearSelection).toHaveBeenCalledWith(['fc-united', 'harborview-sc']);
    expect(screen.getByLabelText('FC United')).not.toBeChecked();
    expect(screen.getByLabelText('Harborview SC')).not.toBeChecked();
  });

  it('disables Select all when the search matches no team', async () => {
    render(<TeamsStep {...baseProps} />);
    await userEvent.type(screen.getByLabelText('Search teams'), 'nonexistent');
    expect(screen.getByText('Select all')).toBeDisabled();
  });
  describe('league summary from the Details step', () => {
    it('shows the league name and the settings chips', () => {
      render(<TeamsStep {...baseProps} />);
      expect(screen.getByText('Coastal Premier')).toBeInTheDocument();
      expect(screen.getByText('Home adv. on')).toBeInTheDocument();
      expect(screen.getByText('3/1/0 pts')).toBeInTheDocument();
    });

    it('shows the other values when they change', () => {
      render(
        <TeamsStep
          {...baseProps}
          homeAdvantage={false}
          points={{ win: 2, draw: 1, loss: 0 }}
        />
      );
      expect(screen.getByText('Home adv. off')).toBeInTheDocument();
      expect(screen.getByText('2/1/0 pts')).toBeInTheDocument();
    });

    it('shows Untitled league for a blank name, as the Review step does', () => {
      render(<TeamsStep {...baseProps} name="" />);
      expect(screen.getByText('Untitled league')).toBeInTheDocument();
    });
  });
});
