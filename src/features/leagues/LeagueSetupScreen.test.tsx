import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { route } from 'preact-router';
import { LeagueSetupScreen } from './LeagueSetupScreen';
import { useTeamsStore } from '@/app/state/teamsStore';
import { useLeagueStore } from '@/app/state/leagueStore';
import { useLeagueDraftStore } from '@/app/state/leagueDraftStore';
import { TIER_OVR_RANGES } from '@/engine/tier-ovr';
import { DEFAULT_POINTS_CONFIG } from '@/engine/standings';

vi.mock('preact-router', () => ({ route: vi.fn() }));

beforeEach(() => {
  vi.mocked(route).mockClear();
  useTeamsStore.setState({
    teams: [
      { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
      { slug: 'harborview-sc', name: 'Harborview SC', colour: '#1E88E5', tier: 'A' },
    ],
  });
  useLeagueStore.setState({ leagues: [] });
  useLeagueDraftStore.setState({
    details: { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false },
    selectedSlugs: [],
    step: 'details',
  });
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
    expect(route).toHaveBeenCalledWith(`/leagues/${league.slug}`);
  });

  it('does not create a league or navigate when the name is symbols-only', async () => {
    render(<LeagueSetupScreen />);

    await userEvent.type(screen.getByLabelText('League name'), '!!!');
    await userEvent.click(screen.getByText('Next: Teams →'));
    await userEvent.click(screen.getByLabelText('FC United'));
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByText('Create league'));

    expect(route).not.toHaveBeenCalled();
    expect(useLeagueStore.getState().leagues).toEqual([]);
    expect(
      screen.getByText('Enter a league name with at least one letter or number.')
    ).toBeInTheDocument();
  });

  it('resets the persisted draft store after creating a league', async () => {
    // The screen itself navigates away on a real create — this store reset
    // is what a later, fresh "New League" visit actually reads from,
    // regardless of whether this component instance stays mounted or not.
    render(<LeagueSetupScreen />);

    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByText('Next: Teams →'));
    await userEvent.click(screen.getByLabelText('FC United'));
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByText('Create league'));

    expect(useLeagueDraftStore.getState().details.name).toBe('');
    expect(useLeagueDraftStore.getState().selectedSlugs).toEqual([]);
  });

  it('does not resurrect stale draft fields if the screen never actually unmounts after create', async () => {
    // A regression test for a real bug: `route()` is mocked here, so this
    // component stays mounted after a create, the same as it would for one
    // render tick in the real app before the router's own pending update
    // and this screen's unmount land in the same batch. The screen must
    // not let its now-stale `latestRef`/`detailsStepRef` write the old
    // field values back over the `reset()` call `handleCreate` already
    // made — an unmount later in the same test would otherwise do exactly
    // that.
    render(<LeagueSetupScreen />);

    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByText('Next: Teams →'));
    await userEvent.click(screen.getByLabelText('FC United'));
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByText('Create league'));

    cleanup();

    expect(useLeagueDraftStore.getState().details.name).toBe('');
    expect(useLeagueDraftStore.getState().selectedSlugs).toEqual([]);
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
