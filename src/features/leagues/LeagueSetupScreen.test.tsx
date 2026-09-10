import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { LeagueSetupScreen } from './LeagueSetupScreen';
import { useTeamsStore } from '../../app/state/teamsStore';
import { useLeagueStore } from '../../app/state/leagueStore';
import { TIER_OVR_RANGES } from '../../engine/tier-ovr';

beforeEach(() => {
  useTeamsStore.setState({
    teams: [
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      { slug: 'harborview-sc', name: 'Harborview SC', colour: '#1E88E5', tier: 'A' },
    ],
  });
  useLeagueStore.setState({ leagues: [] });
});

describe('LeagueSetupScreen', () => {
  it('walks through Details, Teams, and Review, and creates the league', async () => {
    render(<LeagueSetupScreen />);

    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByLabelText('Home advantage'));
    await userEvent.click(screen.getByText('Next: Teams →'));

    await userEvent.click(screen.getByLabelText('FC United'));
    await userEvent.click(screen.getByText('Next: Review →'));

    expect(screen.getByText('Coastal Premier')).toBeInTheDocument();
    expect(screen.getByText('Home adv. on')).toBeInTheDocument();
    expect(screen.getByText('1 teams')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Create league'));

    const [league] = useLeagueStore.getState().leagues;
    expect(league.name).toBe('Coastal Premier');
    expect(league.homeAdvantage).toBe(true);
    expect(league.teams).toEqual([{ slug: 'fc-united', ovr: expect.any(Number) }]);
    expect(league.teams[0].ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES.B.min);
    expect(league.teams[0].ovr).toBeLessThanOrEqual(TIER_OVR_RANGES.B.max);
    expect(
      screen.getByText('League "Coastal Premier" created with 1 teams.')
    ).toBeInTheDocument();
  });

  it('resets to the Details step after creating a league', async () => {
    render(<LeagueSetupScreen />);

    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByText('Next: Teams →'));
    await userEvent.click(screen.getByLabelText('FC United'));
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByText('Create league'));

    expect(screen.getByLabelText('League name')).toHaveValue('');
  });

  it('jumps directly to a step when its stepper button is clicked', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.click(screen.getByText('2 · Teams'));
    expect(screen.getByLabelText('Search teams')).toBeInTheDocument();
  });

  it('lets a team created inline in the Teams step reach Review pre-selected', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByText('Next: Teams →'));

    await userEvent.click(screen.getByText('+ Create new team'));
    await userEvent.type(screen.getByLabelText('Team name'), 'Redbrick Athletic');
    await userEvent.click(screen.getByText('Create team'));

    expect(screen.getByLabelText('Redbrick Athletic')).toBeChecked();
    await userEvent.click(screen.getByText('Next: Review →'));
    expect(screen.getByText('Redbrick Athletic')).toBeInTheDocument();
  });
});
