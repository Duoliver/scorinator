import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { route } from 'preact-router';
import { LeagueSetupScreen } from './LeagueSetupScreen';
import { useLeagueDraftStore } from '@/app/state/leagueDraftStore';
import { TIER_OVR_RANGES } from '@/engine/tier-ovr';
import { DEFAULT_POINTS_CONFIG } from '@/engine/standings';
import { useDatabaseStore } from '@/app/state/databaseStore';
import {
  instance,
  openTestDatabase,
  scheduled,
  testUuid,
} from '@/test/databaseRecords';

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
    fixedTrigrams: {},
    plans: [{ format: 'round-robin', legs: 'two-way' }],
    groups: null,
    step: 'details',
  });
});

/** Adds FC United, then Harborview SC, through the "Add teams" dialog of
 * the Teams step. A league needs 2 teams to start (US-08.8). */
async function addTwoTeams(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
  const dialog = screen.getByRole('dialog', { name: 'Add teams' });
  await userEvent.click(within(dialog).getByRole('button', { name: 'FC United' }));
  await userEvent.click(within(dialog).getByRole('button', { name: 'Harborview SC' }));
  await userEvent.click(within(dialog).getByRole('button', { name: 'Add 2 teams' }));
}

/** Details → Phases → Teams, with the default single phase. */
async function goToTeamsStep(): Promise<void> {
  await userEvent.click(screen.getByText('Next: Phases →'));
  await userEvent.click(screen.getByText('Next: Teams →'));
}

describe('LeagueSetupScreen', () => {
  it('walks through Details, Phases, Teams, and Review, and creates the league', async () => {
    render(<LeagueSetupScreen />);

    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await userEvent.click(screen.getByLabelText('Home advantage'));
    await goToTeamsStep();

    await addTwoTeams();
    await userEvent.click(screen.getByText('Next: Review →'));

    expect(screen.getByText('Coastal Premier')).toBeInTheDocument();
    expect(screen.getByText('Home adv. on')).toBeInTheDocument();
    expect(screen.getByText('2 teams')).toBeInTheDocument();

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
        trigram: 'FCU',
      },
      expect.objectContaining({ slug: 'harborview-sc', trigram: 'HAR' }),
    ]);
    expect(league.teams[0].ovr).toBeGreaterThanOrEqual(TIER_OVR_RANGES.B.min);
    expect(league.teams[0].ovr).toBeLessThanOrEqual(TIER_OVR_RANGES.B.max);
    expect(route).toHaveBeenCalledWith(`/leagues/${league.uuid}`);
  });

  it('turns Create league off for a symbols-only name, with the reason (Task 179)', async () => {
    render(<LeagueSetupScreen />);

    await userEvent.type(screen.getByLabelText('League name'), '!!!');
    expect(screen.getByText('Next: Phases →')).toBeDisabled();
    // The step tabs still allow a jump past the disabled Next.
    await userEvent.click(screen.getByRole('tab', { name: '3 · Teams' }));
    await addTwoTeams();
    await userEvent.click(screen.getByText('Next: Review →'));

    expect(screen.getByText('Create league')).toBeDisabled();
    expect(
      screen.getByText('Enter a league name with at least one letter or number.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByText('Create league'));
    expect(route).not.toHaveBeenCalled();
    expect(useDatabaseStore.getState().leagues).toEqual({});
  });

  it('resets the persisted draft store after creating a league', async () => {
    // The screen itself navigates away on a real create — this store reset
    // is what a later, fresh "New League" visit actually reads from,
    // regardless of whether this component instance stays mounted or not.
    render(<LeagueSetupScreen />);

    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await goToTeamsStep();
    await addTwoTeams();
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
    await goToTeamsStep();
    await addTwoTeams();
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
    await goToTeamsStep();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
    scrollTo.mockRestore();
  });

  it('moves focus to the new step tab after Next', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await goToTeamsStep();
    expect(screen.getByRole('tab', { name: '3 · Teams' })).toHaveFocus();
    // Next on the Teams step stays disabled until a team is selected.
    await addTwoTeams();
    await userEvent.click(screen.getByText('Next: Review →'));
    expect(screen.getByRole('tab', { name: '4 · Review' })).toHaveFocus();
  });

  it('moves focus to the new step tab after Back', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await goToTeamsStep();
    await addTwoTeams();
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('tab', { name: '3 · Teams' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('tab', { name: '2 · Phases' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('tab', { name: '1 · Details' })).toHaveFocus();
  });

  it('turns Create league off for a blank name reached through the Review tab (Task 179)', async () => {
    render(<LeagueSetupScreen />);

    await userEvent.click(screen.getByRole('tab', { name: '3 · Teams' }));
    await addTwoTeams();
    await userEvent.click(screen.getByRole('tab', { name: '4 · Review' }));

    expect(screen.getByText('Create league')).toBeDisabled();
    expect(
      screen.getByText('Enter a league name with at least one letter or number.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByText('Create league'));
    expect(route).not.toHaveBeenCalled();
    expect(useDatabaseStore.getState().leagues).toEqual({});
  });

  it('gives the name reason before the team list reason (Task 179)', async () => {
    render(<LeagueSetupScreen />);

    await userEvent.click(screen.getByRole('tab', { name: '4 · Review' }));

    expect(screen.getByText('Create league')).toBeDisabled();
    expect(
      screen.getByText('Enter a league name with at least one letter or number.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('The league needs at least 2 teams to start.')
    ).not.toBeInTheDocument();
  });

  it('creates a second league with a name that another league uses (Task 160)', async () => {
    const create = async (): Promise<void> => {
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
      await goToTeamsStep();
      await addTwoTeams();
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
    await goToTeamsStep();

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
    await userEvent.click(screen.getByText('3 · Teams'));
    expect(screen.getByText('No teams added yet')).toBeInTheDocument();
  });

  it('lets a team created inside the add dialog reach Review', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await goToTeamsStep();

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
    await goToTeamsStep();
    await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    cleanup();

    const { teams } = useLeagueDraftStore.getState();
    expect(teams.map((team) => team.name)).toEqual(['FC United', 'Harborview SC']);

    render(<LeagueSetupScreen />);
    expect(screen.getByText('2 teams')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByText('Create league'));

    const [league] = Object.values(useDatabaseStore.getState().leagues);
    expect(league.teams).toEqual(
      teams.map((team, i) => ({ ...team, trigram: ['FCU', 'HAR'][i] }))
    );
  });

  it('disables "Create league" with 1 team, and shows the reason (US-08.8)', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await goToTeamsStep();
    await userEvent.click(screen.getByRole('button', { name: '+ Add teams' }));
    const dialog = screen.getByRole('dialog', { name: 'Add teams' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'FC United' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add 1 team' }));
    await userEvent.click(screen.getByText('Next: Review →'));

    expect(screen.getByRole('button', { name: 'Create league' })).toBeDisabled();
    expect(
      screen.getAllByText('The league needs at least 2 teams to start.').length
    ).toBeGreaterThan(0);
  });

  it('stores a trigram fixed in the Edit drawer, and the edits, in the league (Task 172)', async () => {
    render(<LeagueSetupScreen />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
    await goToTeamsStep();
    await addTwoTeams();
    await userEvent.click(screen.getByRole('button', { name: 'Edit FC United' }));
    await userEvent.clear(screen.getByLabelText('Team name'));
    await userEvent.type(screen.getByLabelText('Team name'), 'United of the Coast');
    await userEvent.type(screen.getByLabelText('Trigram (optional)'), 'uoc');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.click(screen.getByText('Next: Review →'));
    await userEvent.click(screen.getByText('Create league'));

    const [league] = Object.values(useDatabaseStore.getState().leagues);
    expect(league.teams[0]).toMatchObject({
      name: 'United of the Coast',
      trigram: 'UOC',
    });
    expect(useDatabaseStore.getState().blueprints[0].name).toBe('FC United');
  });

  describe('the Phases step (Task 129)', () => {
    it('comes after Details, with one Round robin (two-way) phase', async () => {
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
      await userEvent.click(screen.getByText('Next: Phases →'));
      expect(screen.getByRole('tab', { name: '2 · Phases' })).toHaveFocus();
      expect(screen.getByRole('region', { name: 'Phase 1' })).toBeInTheDocument();
      expect(screen.getByLabelText('Format')).toHaveValue('rr2');
    });

    it('creates the league with the plans of the Phases step', async () => {
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
      await userEvent.click(screen.getByText('Next: Phases →'));
      await userEvent.selectOptions(screen.getByLabelText('Format'), 'rr1');
      await userEvent.click(screen.getByText('Next: Teams →'));
      await addTwoTeams();
      await userEvent.click(screen.getByText('Next: Review →'));

      expect(
        screen.getByText('1 · Round robin · Round robin (single duels)')
      ).toBeInTheDocument();
      await userEvent.click(screen.getByText('Create league'));

      const [league] = Object.values(useDatabaseStore.getState().leagues);
      expect(league.content.plans).toEqual([
        { format: 'round-robin', legs: 'single-duels' },
      ]);
      expect(scheduled(league.content.phases[0]).fixtures).toHaveLength(1);
    });

    it('creates the league with the zones of the Phases step (Task 189)', async () => {
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
      await userEvent.click(screen.getByText('Next: Phases →'));
      const red = screen.getByRole('group', { name: 'Red zone' });
      await userEvent.click(within(red).getByRole('switch', { name: 'Red' }));
      await userEvent.type(within(red).getByLabelText('From'), '2');
      await userEvent.type(within(red).getByLabelText('To'), '2');
      await userEvent.click(screen.getByText('Next: Teams →'));
      await addTwoTeams();
      await userEvent.click(screen.getByText('Next: Review →'));
      await userEvent.click(screen.getByText('Create league'));

      const [league] = Object.values(useDatabaseStore.getState().leagues);
      expect(league.content.plans).toEqual([
        {
          format: 'round-robin',
          legs: 'two-way',
          zones: [{ colour: 'red', places: { from: 2, to: 2 }, label: '' }],
        },
      ]);
    });

    it('turns "Create league" off for a zone problem, with its text (Task 189)', async () => {
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
      await userEvent.click(screen.getByText('Next: Phases →'));
      const blue = screen.getByRole('group', { name: 'Blue zone' });
      await userEvent.click(within(blue).getByRole('switch', { name: 'Blue' }));
      await userEvent.click(screen.getByText('Next: Teams →'));
      await addTwoTeams();
      await userEvent.click(screen.getByText('Next: Review →'));

      expect(screen.getByRole('button', { name: 'Create league' })).toBeDisabled();
      expect(
        screen.getAllByText(
          'Phase 1: the blue zone needs whole places from 1, with "To" not before "From".'
        ).length
      ).toBeGreaterThan(0);
    });

    it('lists each phase on the Review step, and the format chip joins the short names', async () => {
      useLeagueDraftStore.setState({
        plans: [
          {
            format: 'groups',
            legs: 'two-way',
            grouping: { by: 'size', size: 4 },
            advance: { top: 2, bestOfNext: 0 },
          },
          { format: 'round-robin', legs: 'two-way' },
        ],
      });
      render(<LeagueSetupScreen />);
      await userEvent.click(screen.getByRole('tab', { name: '4 · Review' }));
      expect(
        screen.getByText(
          '1 · Group Stage · Groups round robin (two-way) · size 4 · Top 2 advance per group'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('2 · Round robin · Round robin (two-way)')
      ).toBeInTheDocument();
      expect(screen.getByText('Group Stage → Round robin')).toBeInTheDocument();
    });

    it('creates a league with a bracket phase 1, with its draw (Task 141)', async () => {
      useLeagueDraftStore.setState({ plans: [{ format: 'bracket' }] });
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Cup');
      await goToTeamsStep();
      await addTwoTeams();
      await userEvent.click(screen.getByText('Next: Review →'));
      expect(screen.getByRole('button', { name: 'Create league' })).toBeEnabled();
      await userEvent.click(screen.getByText('Create league'));

      const [league] = Object.values(useDatabaseStore.getState().leagues);
      const [phase] = league.content.phases;
      expect(phase.format).toBe('bracket');
      expect(phase.format === 'bracket' && phase.seeds).toHaveLength(2);
    });

    it('shows the power-of-2 warning on the Teams step, and the bracket in Review (Task 140)', async () => {
      const teams = ['a1', 'a2', 'a3'].map((slug, i) =>
        instance({ blueprintUuid: testUuid(500 + i), slug, name: `Team ${slug}` })
      );
      useLeagueDraftStore.setState({
        teams,
        plans: [
          {
            format: 'bracket',
            rules: {
              format: 'two-legged',
              awayGoals: true,
              playsAet: false,
              method: 'penalties',
              singleMatchFinal: true,
              thirdPlace: true,
            },
          },
        ],
      });
      render(<LeagueSetupScreen />);
      await userEvent.click(screen.getByRole('tab', { name: '3 · Teams' }));
      expect(
        screen.getByText('3 qualifiers: the bracket has 4 slots, so 1 team gets a bye.')
      ).toBeInTheDocument();
      await userEvent.click(screen.getByRole('tab', { name: '4 · Review' }));
      // 3 qualifiers: no third-place tie, so no "Third place".
      expect(
        screen.getByText(
          '1 · Bracket · Bracket · Two-legged · away goals on · AET off · Penalties · Single-match final'
        )
      ).toBeInTheDocument();
    });

    it('keeps the plans in the draft across a remount', async () => {
      const { unmount } = render(<LeagueSetupScreen />);
      await userEvent.click(screen.getByRole('tab', { name: '2 · Phases' }));
      await userEvent.click(screen.getByRole('button', { name: '+ Add phase' }));
      unmount();
      expect(useLeagueDraftStore.getState().plans).toHaveLength(2);
      render(<LeagueSetupScreen />);
      expect(screen.getAllByRole('region', { name: /^Phase \d+$/ })).toHaveLength(2);
    });
  });

  describe('the phase problems on Review (Task 177)', () => {
    it('keeps "Create league" off with the first problem, and lists every problem', async () => {
      useLeagueDraftStore.setState({
        plans: [
          { format: 'round-robin', legs: 'two-way', advance: { top: 2 } },
          { format: 'round-robin', legs: 'two-way' },
        ],
      });
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
      await goToTeamsStep();
      await addTwoTeams();
      await userEvent.click(screen.getByText('Next: Review →'));

      const text = 'Phase 1: Top must be a whole number from 1 to 1.';
      expect(screen.getByRole('button', { name: 'Create league' })).toBeDisabled();
      expect(
        within(screen.getByRole('list', { name: 'Phase problems' })).getByText(text)
      ).toBeInTheDocument();
      expect(screen.getAllByText(text)).toHaveLength(2);
    });

    it('shows the groups-last warning, and lets the league start', async () => {
      useLeagueDraftStore.setState({
        plans: [
          { format: 'groups', legs: 'two-way', grouping: { by: 'size', size: 4 } },
        ],
      });
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Coastal Premier');
      await goToTeamsStep();
      await addTwoTeams();
      await userEvent.click(screen.getByText('Next: Review →'));

      expect(
        screen.getByText(
          'This league ends with groups. Each group winner is a champion. There is no single league winner.'
        )
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create league' })).toBeEnabled();
    });
  });

  describe('the Teams step with a phase-1 draw (Task 130)', () => {
    const FOUR = [
      { slug: 'alpha', name: 'Alpha', colour: '#E53935', tier: 'B' as const },
      { slug: 'bravo', name: 'Bravo', colour: '#1E88E5', tier: 'A' as const },
      { slug: 'charlie', name: 'Charlie', colour: '#43A047', tier: 'C' as const },
      { slug: 'delta', name: 'Delta', colour: '#000000', tier: 'D' as const },
    ];
    const groupsThenRoundRobin = [
      {
        format: 'groups' as const,
        legs: 'single-duels' as const,
        grouping: { by: 'count' as const, count: 2 },
        advance: { top: 1, bestOfNext: 0 },
      },
      { format: 'round-robin' as const, legs: 'two-way' as const },
    ];

    async function toTeamsWithAll(): Promise<void> {
      openTestDatabase(FOUR);
      useLeagueDraftStore.setState({ plans: groupsThenRoundRobin });
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Group Cup');
      await goToTeamsStep();
      await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
    }

    const cardTeams = (name: string): string[] =>
      within(screen.getByRole('region', { name }))
        .getAllByRole('listitem')
        .map((row) => row.textContent ?? '');

    it('puts each added team into the smallest group', async () => {
      await toTeamsWithAll();
      expect(cardTeams('Group A')).toHaveLength(2);
      expect(cardTeams('Group B')).toHaveLength(2);
      expect(
        screen.getByText('Top 1 of each group advance to the Round robin.')
      ).toBeInTheDocument();
    });

    it('creates the league with the draw of the Teams step', async () => {
      await toTeamsWithAll();
      const namesIn = (card: string): string[] =>
        FOUR.map((team) => team.name)
          .filter((name) => cardTeams(card).some((row) => row.includes(name)))
          .sort();
      const drawn = [namesIn('Group A'), namesIn('Group B')];
      await userEvent.click(screen.getByText('Next: Review →'));
      await userEvent.click(screen.getByText('Create league'));

      const [league] = Object.values(useDatabaseStore.getState().leagues);
      const nameOf = new Map(
        league.teams.map((team) => [team.blueprintUuid, team.name])
      );
      const [phase] = league.content.phases;
      if (phase.format !== 'groups') throw new Error('expected a Groups phase');
      expect(
        phase.groups.map((group) => group.map((uuid) => nameOf.get(uuid)).sort())
      ).toEqual(drawn);
    });

    it('moves a team with the row menu, and the fit problem keeps Create off', async () => {
      await toTeamsWithAll();
      const [first] = cardTeams('Group A');
      const name = FOUR.find((team) => first.includes(team.name))?.name ?? '';
      await userEvent.click(
        screen.getByRole('button', { name: `Options for ${name}` })
      );
      await userEvent.click(screen.getByRole('menuitem', { name: 'Move to Group B' }));
      expect(cardTeams('Group A')).toHaveLength(1);
      expect(cardTeams('Group B')).toHaveLength(3);

      await userEvent.click(screen.getByText('Next: Review →'));
      const text = 'Phase 1: group A has 1 team. A group needs at least 2 teams.';
      expect(
        within(screen.getByRole('list', { name: 'Phase problems' })).getByText(text)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create league' })).toBeDisabled();
    });

    it('draws when phase 1 becomes Groups, and drops the draw when it stops', async () => {
      openTestDatabase(FOUR);
      render(<LeagueSetupScreen />);
      await userEvent.type(screen.getByLabelText('League name'), 'Group Cup');
      await goToTeamsStep();
      await userEvent.click(screen.getByRole('button', { name: 'Load them all' }));
      expect(screen.getByRole('table', { name: 'Teams' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: '2 · Phases' }));
      await userEvent.selectOptions(screen.getByLabelText('Format'), 'grp2');
      await userEvent.click(screen.getByRole('tab', { name: '3 · Teams' }));
      expect(screen.queryByRole('table', { name: 'Teams' })).not.toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Group A' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: '2 · Phases' }));
      await userEvent.selectOptions(screen.getByLabelText('Format'), 'rr2');
      await userEvent.click(screen.getByRole('tab', { name: '3 · Teams' }));
      expect(screen.getByRole('table', { name: 'Teams' })).toBeInTheDocument();
    });

    it('keeps the draw in the draft across a remount', async () => {
      await toTeamsWithAll();
      cleanup();
      expect(useLeagueDraftStore.getState().groups?.flat()).toHaveLength(4);
      render(<LeagueSetupScreen />);
      expect(cardTeams('Group A')).toHaveLength(2);
    });

    it('shuffles the draw, and keeps every team', async () => {
      await toTeamsWithAll();
      await userEvent.click(screen.getByRole('button', { name: '⟲ Shuffle groups' }));
      expect([...cardTeams('Group A'), ...cardTeams('Group B')]).toHaveLength(4);
    });
  });
});
