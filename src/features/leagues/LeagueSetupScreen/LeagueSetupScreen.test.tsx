import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { route } from 'preact-router';
import { LeagueSetupScreen } from './LeagueSetupScreen';
import { useLeagueDraftStore } from '@/app/state/leagueDraftStore';
import { TIER_OVR_RANGES } from '@/engine/tier-ovr';
import { DEFAULT_POINTS_CONFIG } from '@/engine/standings';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { openTestDatabase, testUuid } from '@/test/databaseRecords';

vi.mock('preact-router', () => ({ route: vi.fn() }));

beforeEach(() => {
  vi.mocked(route).mockClear();
  openTestDatabase([
    { slug: 'fc-united', name: 'FC United', colour: '#E53935', tier: 'B' },
    { slug: 'harborview-sc', name: 'Harborview SC', colour: '#1E88E5', tier: 'A' },
  ]);
  useLeagueDraftStore.setState({
    details: { name: '', points: DEFAULT_POINTS_CONFIG, homeAdvantage: false },
    teams: [],
    step: 'details',
  });
});

/** Adds FC United through the "Add teams" dialog of the Teams step. */
async function addFcUnited(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
  const dialog = screen.getByRole('dialog', { name: 'Add teams' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'FC United' }));
  await userEvent.click(within(dialog).getByRole('button', { name: 'Add 1 team' }));
}

describe('LeagueSetupScreen', () => {
  it('walks through Details, Teams, and Review, and creates the league', async () => {
    render(<LeagueSetupScreen />);

    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByLabelText('Home advantage'));
    await userEvent.click(screen.getByText('Next: Teams →'));

    await addFcUnited();
    await userEvent.click(screen.getByText('Next: Review →'));

    expect(screen.getByText('Coastal Premier')).toBeInTheDocument();
    expect(screen.getByText('Home adv. on')).toBeInTheDocument();
    expect(screen.getByText('1 team')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Create league'));

    const [league] = Object.values(useDatabaseStore.getState().leagues);
    expect(league.content.name).toBe('Coastal Premier');
    expect(league.content.homeAdvantage).toBe(true);
    expect(league.teams).toEqual([
      {
        blueprintUuid: testUuid(1),
        slug: 'fc-united',
        name: 'FC United',
        colour: '#E53935',
        tier: 'B',
        ovr: expect.any(Number),
      },
    ]);
    expect(league.teams[0].ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES.B.min);
    expect(league.teams[0].ovr).toBeLessThanOrEqual(TIER_OVR_RANGES.B.max);
    expect(route).toHaveBeenCalledWith(`/leagues/${league.uuid}`);
  });

  it('does not create a league or navigate when the name is symbols-only', async () => {
    render(<LeagueSetupScreen />);

    await userEvent.type(screen.getByLabelText('League name'), '!!!');
    expect(screen.getByText('Next: Teams →')).toBeDisabled();
    // The step tabs still allow a jump past the disabled Next.
    await userEvent.click(screen.getByRole('tab', { name: '2 · Teams' }));
    await addFcUnited();
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByText('Create league'));

    expect(route).not.toHaveBeenCalled();
    expect(useDatabaseStore.getState().leagues).toEqual({});
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
    await addFcUnited();
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByText('Create league'));

    expect(useLeagueDraftStore.getState().details.name).toBe('');
    expect(useLeagueDraftStore.getState().teams).toEqual([]);
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
    await addFcUnited();
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByText('Create league'));

    cleanup();

    expect(useLeagueDraftStore.getState().details.name).toBe('');
    expect(useLeagueDraftStore.getState().teams).toEqual([]);
  });

  it('scrolls the window to the top when Next changes the step', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByText('Next: Teams →'));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
    scrollTo.mockRestore();
  });

  it('moves focus to the new step tab after Next', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByText('Next: Teams →'));
    expect(screen.getByRole('tab', { name: '2 · Teams' })).toHaveFocus();
    // Next on the Teams step stays disabled until a team is selected.
    await addFcUnited();
    await userEvent.click(screen.getByText('Next: Review →'));
    expect(screen.getByRole('tab', { name: '3 · Review' })).toHaveFocus();
  });

  it('moves focus to the new step tab after Back', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByText('Next: Teams →'));
    await addFcUnited();
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('tab', { name: '2 · Teams' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('tab', { name: '1 · Details' })).toHaveFocus();
  });

  it('does not create a league from a blank name reached through the Review tab', async () => {
    render(<LeagueSetupScreen />);

    await userEvent.click(screen.getByRole('tab', { name: '2 · Teams' }));
    await addFcUnited();
    await userEvent.click(screen.getByRole('tab', { name: '3 · Review' }));
    await userEvent.click(screen.getByText('Create league'));

    expect(route).not.toHaveBeenCalled();
    expect(useDatabaseStore.getState().leagues).toEqual({});
    expect(
      screen.getByText('Enter a league name with at least one letter or number.')
    ).toBeInTheDocument();
  });

  it('creates a second league with a name that another league uses (Task 160)', async () => {
    const create = async (): Promise<void> => {
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
      await userEvent.click(screen.getByText('Next: Teams →'));
      await addFcUnited();
      await userEvent.click(screen.getByText('Next: Review →'));
      await userEvent.click(screen.getByText('Create league'));
      cleanup();
    };

    await create();
    await create();

    const leagues = Object.values(useDatabaseStore.getState().leagues);
    expect(leagues.map((league) => league.content.name)).toEqual([
      'Coastal Premier',
      'Coastal Premier',
    ]);
    expect(leagues[0].uuid).not.toBe(leagues[1].uuid);
  });

  it('shows the name and settings from the Details step at the top of the Teams step', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByLabelText('Home advantage'));
    await userEvent.click(screen.getByText('Next: Teams →'));

    expect(screen.getByText('Coastal Premier')).toBeInTheDocument();
    expect(screen.getByText('Home adv. on')).toBeInTheDocument();
    expect(
      screen.getByText(
        `${DEFAULT_POINTS_CONFIG.win}/${DEFAULT_POINTS_CONFIG.draw}/${DEFAULT_POINTS_CONFIG.loss} pts`
      )
    ).toBeInTheDocument();
  });

  it('jumps directly to a step when its stepper button is clicked', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.click(screen.getByText('2 · Teams'));
    expect(screen.getByText('No teams added yet')).toBeInTheDocument();
  });

  it('lets a team created inside the add dialog reach Review', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByText('Next: Teams →'));

    await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
    const dialog = screen.getByRole('dialog', { name: 'Add teams' });
    await userEvent.click(
      within(dialog).getByRole('button', { name: '+ Create new team' })
    );
    await userEvent.type(screen.getByLabelText('Team name'), 'Redbrick Athletic');
    await userEvent.click(screen.getByText('Create team'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add 1 team' }));

    await userEvent.click(screen.getByText('Next: Review →'));
    expect(screen.getByText('Redbrick Athletic')).toBeInTheDocument();
  });

  it('keeps the team list and its OVRs in the draft, and creates the league with them (Task 81)', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByText('Next: Teams →'));
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    cleanup();

    const { teams } = useLeagueDraftStore.getState();
    expect(teams.map((team) => team.name)).toEqual(['FC United', 'Harborview SC']);

    render(<LeagueSetupScreen />);
    expect(screen.getByText('2 teams')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByText('Create league'));

    const [league] = Object.values(useDatabaseStore.getState().leagues);
    expect(league.teams).toEqual(teams);
  });
});
