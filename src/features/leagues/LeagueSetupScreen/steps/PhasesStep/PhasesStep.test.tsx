import { describe, expect, it, vi } from 'vitest';
import type { JSX } from 'preact';
import { fireEvent, render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { PhasePlan } from '@/engine/phases';
import { usePhaseList } from '@/features/leagues/LeagueSetupScreen/usePhaseList';
import { PhasesStep } from './PhasesStep';

/** Holds the plan list as the wizard does, and shows it as JSON so a test
 * can read the plans. */
function Harness({
  initial = [{ format: 'round-robin', legs: 'two-way' }],
  onBack = vi.fn(),
  onNext = vi.fn(),
  teamCount = 0,
}: {
  initial?: PhasePlan[];
  teamCount?: number;
  onBack?: () => void;
  onNext?: () => void;
}): JSX.Element {
  const phaseList = usePhaseList(initial);
  return (
    <>
      <PhasesStep
        phaseList={phaseList}
        teamCount={teamCount}
        onBack={onBack}
        onNext={onNext}
      />
      <output data-testid="plans">{JSON.stringify(phaseList.plans)}</output>
    </>
  );
}

const plans = (): PhasePlan[] =>
  JSON.parse(screen.getByTestId('plans').textContent ?? '[]');
const card = (phase: number): HTMLElement =>
  screen.getByRole('region', { name: `Phase ${phase}` });
const addPhase = (): Promise<void> =>
  userEvent.click(screen.getByRole('button', { name: '+ Add phase' }));

const groupsThenBracket: PhasePlan[] = [
  {
    format: 'groups',
    legs: 'two-way',
    grouping: { by: 'size', size: 4 },
    advance: { top: 2, bestOfNext: 0 },
  },
  { format: 'bracket' },
];

describe('PhasesStep', () => {
  it('shows one Round robin phase card, with no advancement (US-01.1)', () => {
    render(<Harness />);
    expect(screen.getAllByRole('region', { name: /^Phase \d+$/ })).toHaveLength(1);
    expect(within(card(1)).getByText('1')).toBeInTheDocument();
    expect(
      within(card(1)).getByRole('heading', { name: 'Round robin' })
    ).toBeInTheDocument();
    expect(within(card(1)).getByLabelText('Format')).toHaveValue('rr2');
    expect(within(card(1)).queryByLabelText('Top')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'A league runs as a sequence of phases. Stats reset to zero between phases. Bracket may only be the final phase.'
      )
    ).toBeInTheDocument();
  });

  it('adds a phase at the end, and gives the phase before it Top 2', async () => {
    render(<Harness />);
    await addPhase();
    expect(screen.getAllByRole('region', { name: /^Phase \d+$/ })).toHaveLength(2);
    expect(within(card(1)).getByLabelText('Top')).toHaveValue(2);
    expect(within(card(1)).getByText('advance to the next phase')).toBeInTheDocument();
    expect(within(card(2)).queryByLabelText('Top')).not.toBeInTheDocument();
  });

  it('turns off remove with one phase, up on the first phase, and down on the last', async () => {
    render(<Harness />);
    expect(
      within(card(1)).getByRole('button', { name: 'Remove phase 1' })
    ).toBeDisabled();
    await addPhase();
    expect(
      within(card(1)).getByRole('button', { name: 'Remove phase 1' })
    ).toBeEnabled();
    expect(
      within(card(1)).getByRole('button', { name: 'Move phase 1 up' })
    ).toBeDisabled();
    expect(
      within(card(1)).getByRole('button', { name: 'Move phase 1 down' })
    ).toBeEnabled();
    expect(
      within(card(2)).getByRole('button', { name: 'Move phase 2 down' })
    ).toBeDisabled();
  });

  it('removes a phase', async () => {
    render(<Harness />);
    await addPhase();
    await userEvent.click(
      within(card(2)).getByRole('button', { name: 'Remove phase 2' })
    );
    expect(screen.getAllByRole('region', { name: /^Phase \d+$/ })).toHaveLength(1);
    expect(plans()).toEqual([{ format: 'round-robin', legs: 'two-way' }]);
  });

  it('shows the Groups fields for a Groups format: Set by, Group size 4, per group, best M', async () => {
    render(<Harness />);
    await addPhase();
    await userEvent.selectOptions(within(card(1)).getByLabelText('Format'), 'grp1');
    expect(
      within(card(1)).getByRole('heading', { name: 'Group Stage' })
    ).toBeInTheDocument();
    expect(
      within(card(1)).getByRole('radiogroup', { name: 'Set by' })
    ).toBeInTheDocument();
    expect(within(card(1)).getByRole('radio', { name: 'Group size' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(within(card(1)).getByLabelText('Group size')).toHaveValue(4);
    expect(within(card(1)).getByText('advance per group')).toBeInTheDocument();
    expect(within(card(1)).getByLabelText('Best of place 3')).toHaveValue(0);
  });

  it('switches Set by to Group count, with count 2', async () => {
    render(<Harness initial={groupsThenBracket} />);
    await userEvent.click(within(card(1)).getByRole('radio', { name: 'Group count' }));
    expect(within(card(1)).getByLabelText('Group count')).toHaveValue(2);
    expect(plans()[0]).toMatchObject({ grouping: { by: 'count', count: 2 } });
  });

  it('writes the typed numbers into the plan, and NaN for a number that is not whole', async () => {
    render(<Harness initial={groupsThenBracket} />);
    const top = within(card(1)).getByLabelText('Top');
    await userEvent.clear(top);
    await userEvent.type(top, '1');
    const best = within(card(1)).getByLabelText('Best of place 2');
    await userEvent.clear(best);
    await userEvent.type(best, '3');
    const size = within(card(1)).getByLabelText('Group size');
    await userEvent.clear(size);
    await userEvent.type(size, 'x');
    expect(plans()[0]).toMatchObject({ advance: { top: 1, bestOfNext: 3 } });
    // JSON writes NaN as null.
    expect(plans()[0]).toMatchObject({ grouping: { by: 'size', size: null } });
  });

  describe('the bracket rule (US-01.3)', () => {
    it('offers Bracket only on the last phase', async () => {
      render(<Harness />);
      await addPhase();
      const options = (phase: number): string[] =>
        within(within(card(phase)).getByLabelText('Format'))
          .getAllByRole('option')
          .map((option) => option.textContent ?? '');
      expect(options(1)).not.toContain('Bracket');
      expect(options(2)).toContain('Bracket');
    });

    it('turns off "+ Add phase" after a bracket, with a hint', () => {
      render(<Harness initial={groupsThenBracket} />);
      expect(screen.getByRole('button', { name: '+ Add phase' })).toBeDisabled();
      expect(screen.getByText('A bracket must be the last phase.')).toBeInTheDocument();
    });

    it('turns off a move that puts the bracket before another phase', () => {
      render(<Harness initial={groupsThenBracket} />);
      expect(
        within(card(1)).getByRole('button', { name: 'Move phase 1 down' })
      ).toBeDisabled();
      expect(
        within(card(2)).getByRole('button', { name: 'Move phase 2 up' })
      ).toBeDisabled();
    });

    it('can leave the bracket as the only phase', async () => {
      render(<Harness initial={groupsThenBracket} />);
      await userEvent.click(
        within(card(1)).getByRole('button', { name: 'Remove phase 1' })
      );
      expect(plans()).toEqual([{ format: 'bracket' }]);
    });
  });

  it('keeps the field values with their phase after a move', async () => {
    render(
      <Harness
        initial={[
          { format: 'round-robin', legs: 'two-way', advance: { top: 2 } },
          {
            format: 'groups',
            legs: 'two-way',
            grouping: { by: 'size', size: 6 },
            advance: { top: 2, bestOfNext: 0 },
          },
          { format: 'round-robin', legs: 'two-way' },
        ]}
      />
    );
    await userEvent.click(
      within(card(2)).getByRole('button', { name: 'Move phase 2 up' })
    );
    expect(within(card(1)).getByLabelText('Group size')).toHaveValue(6);
    expect(within(card(2)).getByLabelText('Format')).toHaveValue('rr2');
  });

  it('calls onBack and onNext', async () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    render(<Harness onBack={onBack} onNext={onNext} />);
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next: Teams →' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  describe('the counts and the warnings (Task 177)', () => {
    it('shows the notes, and no counts before the league has 2 teams', () => {
      render(<Harness initial={groupsThenBracket} teamCount={1} />);
      expect(
        screen.getByText('The counts show when the league has 2 teams.')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "The league's home advantage applies to round-robin and group phases, and to two-legged ties only."
        )
      ).toBeInTheDocument();
      expect(
        within(card(1)).queryByText(/teams go to phase 2/)
      ).not.toBeInTheDocument();
    });

    it('shows the group sizes and the qualifiers of a Groups phase', () => {
      render(<Harness initial={groupsThenBracket} teamCount={18} />);
      expect(within(card(1)).getByText('5 groups: 4, 4, 4, 3, 3')).toBeInTheDocument();
      expect(
        within(card(1)).getByText('5 groups × top 2 = 10 teams go to phase 2')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('The counts show when the league has 2 teams.')
      ).not.toBeInTheDocument();
    });

    it('suggests the best M before a bracket, and applies it on a click (US-01.6)', async () => {
      render(<Harness initial={groupsThenBracket} teamCount={24} />);
      expect(
        within(card(1)).getByText('6 groups × top 2 = 12. Best 4 of place 3 give 16.')
      ).toBeInTheDocument();
      await userEvent.click(
        within(card(1)).getByRole('button', { name: 'Use best 4' })
      );
      expect(plans()[0]).toMatchObject({ advance: { top: 2, bestOfNext: 4 } });
      expect(within(card(1)).getByLabelText('Best of place 3')).toHaveValue(4);
      expect(
        within(card(1)).getByText(
          '6 groups × top 2 + best 4 of place 3 = 16 teams go to phase 2'
        )
      ).toBeInTheDocument();
      expect(
        within(card(1)).queryByRole('button', { name: 'Use best 4' })
      ).not.toBeInTheDocument();
    });

    it('shows a problem under the card of its phase, and updates it on a change', async () => {
      const topThree: PhasePlan[] = [
        {
          format: 'groups',
          legs: 'two-way',
          grouping: { by: 'size', size: 4 },
          advance: { top: 3, bestOfNext: 0 },
        },
        { format: 'bracket' },
      ];
      render(<Harness initial={topThree} teamCount={6} />);
      expect(
        within(card(1)).getByText('Phase 1: Top must be a whole number from 1 to 2.')
      ).toBeInTheDocument();
      const top = within(card(1)).getByLabelText('Top');
      await userEvent.clear(top);
      await userEvent.type(top, '1');
      expect(
        within(card(1)).queryByText('Phase 1: Top must be a whole number from 1 to 2.')
      ).not.toBeInTheDocument();
    });

    it('warns when the league ends with groups (US-01.5)', () => {
      render(
        <Harness
          initial={[
            { format: 'groups', legs: 'two-way', grouping: { by: 'size', size: 4 } },
          ]}
        />
      );
      expect(
        screen.getByText(
          'This league ends with groups. Each group winner is a champion. There is no single league winner.'
        )
      ).toBeInTheDocument();
    });
  });
});

describe('the Bracket card settings (Task 140)', () => {
  const cup: PhasePlan[] = [{ format: 'bracket' }];
  const bracketRules = (): Record<string, unknown> | undefined =>
    (plans()[plans().length - 1] as { rules?: Record<string, unknown> }).rules;
  const radio = (name: string): HTMLElement =>
    within(card(1)).getByRole('radio', { name });

  it('shows AET, the method, and the tie format, with the defaults', () => {
    render(<Harness initial={cup} teamCount={8} />);
    expect(within(card(1)).getByRole('switch', { name: 'Plays AET' })).toBeChecked();
    expect(
      within(card(1)).getByRole('radiogroup', { name: 'Tiebreak method' })
    ).toBeInTheDocument();
    expect(radio('Penalties')).toHaveAttribute('aria-checked', 'true');
    expect(radio('Single match')).toHaveAttribute('aria-checked', 'true');
    expect(
      within(card(1)).getByRole('switch', { name: 'Third-place playoff' })
    ).not.toBeChecked();
  });

  it('shows away goals and the single-match final for two legs only', async () => {
    render(<Harness initial={cup} teamCount={8} />);
    expect(
      within(card(1)).queryByRole('switch', { name: 'Away goals rule' })
    ).toBeNull();
    expect(
      within(card(1)).queryByRole('switch', { name: 'Single-match final' })
    ).toBeNull();
    await userEvent.click(radio('Two-legged'));
    expect(
      within(card(1)).getByRole('switch', { name: 'Away goals rule' })
    ).not.toBeChecked();
    expect(
      within(card(1)).getByRole('switch', { name: 'Single-match final' })
    ).not.toBeChecked();
  });

  it('each change writes the full rules of the plan', async () => {
    render(<Harness initial={cup} teamCount={8} />);
    await userEvent.click(radio('Two-legged'));
    await userEvent.click(
      within(card(1)).getByRole('switch', { name: 'Away goals rule' })
    );
    await userEvent.click(radio('Replay → Coin toss'));
    await userEvent.click(within(card(1)).getByRole('switch', { name: 'Plays AET' }));
    await userEvent.click(
      within(card(1)).getByRole('switch', { name: 'Single-match final' })
    );
    await userEvent.click(
      within(card(1)).getByRole('switch', { name: 'Third-place playoff' })
    );
    expect(bracketRules()).toEqual({
      format: 'two-legged',
      awayGoals: true,
      playsAet: false,
      method: 'replay-coin-toss',
      singleMatchFinal: true,
      thirdPlace: true,
    });
  });

  it('keeps the hidden two-leg values after a switch to Single match and back', async () => {
    render(<Harness initial={cup} teamCount={8} />);
    await userEvent.click(radio('Two-legged'));
    await userEvent.click(
      within(card(1)).getByRole('switch', { name: 'Away goals rule' })
    );
    await userEvent.click(radio('Single match'));
    await userEvent.click(radio('Two-legged'));
    expect(
      within(card(1)).getByRole('switch', { name: 'Away goals rule' })
    ).toBeChecked();
  });

  it('turns the third place off and disables it below 4 qualifiers, with a hint', () => {
    render(<Harness initial={cup} teamCount={3} />);
    const third = within(card(1)).getByRole('switch', { name: 'Third-place playoff' });
    expect(third).toBeDisabled();
    expect(third).not.toBeChecked();
    expect(
      within(card(1)).getByText('Needs 4 qualifiers or more.')
    ).toBeInTheDocument();
  });

  it('enables the third place with no known count', () => {
    render(<Harness initial={cup} teamCount={0} />);
    expect(
      within(card(1)).getByRole('switch', { name: 'Third-place playoff' })
    ).toBeEnabled();
  });

  it('shows the power-of-2 warning on the Bracket card (US-04.9)', () => {
    render(<Harness initial={groupsThenBracket} teamCount={12} />);
    // 3 groups of 4, top 2: 6 qualifiers.
    expect(
      within(card(2)).getByText(
        '6 qualifiers: the bracket has 8 slots, so 2 teams get a bye.'
      )
    ).toBeInTheDocument();
  });

  it('shows no warning for a power of 2', () => {
    render(<Harness initial={groupsThenBracket} teamCount={8} />);
    expect(within(card(2)).queryByText(/qualifiers: the bracket has/)).toBeNull();
  });

  it('a round-robin card shows no bracket settings', () => {
    render(<Harness teamCount={8} />);
    expect(within(card(1)).queryByRole('switch', { name: 'Plays AET' })).toBeNull();
  });
});

describe('PhasesStep: the Zones section (Task 189, US-12.5)', () => {
  const zones = (phase: number): HTMLElement =>
    within(card(phase)).getByRole('region', { name: 'Zones' });
  const zoneRow = (phase: number, name: string): HTMLElement =>
    within(zones(phase)).getByRole('group', { name: `${name} zone` });

  it('shows a Zones section on a round-robin and a Groups card, and none on a Bracket', () => {
    render(<Harness initial={groupsThenBracket} />);
    expect(zones(1)).toBeInTheDocument();
    expect(within(card(2)).queryByRole('region', { name: 'Zones' })).toBeNull();
  });

  it('puts the zones of the section in the plan', async () => {
    render(<Harness />);
    await userEvent.click(
      within(zoneRow(1, 'Red')).getByRole('switch', { name: 'Red' })
    );
    await userEvent.type(within(zoneRow(1, 'Red')).getByLabelText('From'), '3');
    await userEvent.type(within(zoneRow(1, 'Red')).getByLabelText('To'), '4');
    expect(plans()[0]).toMatchObject({
      zones: [{ colour: 'red', places: { from: 3, to: 4 }, label: '' }],
    });
  });

  it('makes yellow automatic when a best M is set, and drops the free yellow zone', async () => {
    render(<Harness initial={groupsThenBracket} teamCount={8} />);
    await userEvent.click(
      within(zoneRow(1, 'Yellow')).getByRole('switch', { name: 'Yellow' })
    );
    await userEvent.type(within(zoneRow(1, 'Yellow')).getByLabelText('From'), '3');
    await userEvent.type(within(zoneRow(1, 'Yellow')).getByLabelText('To'), '3');
    const best = within(card(1)).getByLabelText('Best of place 3');
    await userEvent.clear(best);
    await userEvent.type(best, '2');
    expect(
      within(zoneRow(1, 'Yellow')).getByText('Place 3 · from the advancement')
    ).toBeInTheDocument();
    expect(plans()[0]).toMatchObject({ zones: [] });
  });

  it('shows a zone problem once, in the Zones section', async () => {
    render(<Harness />);
    await userEvent.click(
      within(zoneRow(1, 'Blue')).getByRole('switch', { name: 'Blue' })
    );
    const text =
      'The blue zone needs whole places from 1, with "To" not before "From".';
    expect(screen.getAllByText(text)).toHaveLength(1);
    expect(within(zones(1)).getByText(text)).toBeInTheDocument();
  });
});

describe('PhasesStep: number fields (Task 191)', () => {
  const rrThenBracket: PhasePlan[] = [
    { format: 'round-robin', legs: 'two-way', advance: { top: 2 } },
    { format: 'bracket' },
  ];
  /** What the browser does on the Up arrow of a number field. */
  const pressUp = (field: HTMLElement): void => {
    (field as HTMLInputElement).stepUp();
    fireEvent.input(field);
  };

  it('makes Top a number field from 1 to the team count less 1', () => {
    render(<Harness initial={rrThenBracket} teamCount={8} />);
    const top = within(card(1)).getByLabelText('Top');
    expect(top).toHaveAttribute('type', 'number');
    expect(top).toHaveAttribute('min', '1');
    expect(top).toHaveAttribute('max', '7');
  });

  it('gives Top a lowest value only while the team count is not known', () => {
    render(<Harness initial={rrThenBracket} />);
    const top = within(card(1)).getByLabelText('Top');
    expect(top).toHaveAttribute('min', '1');
    expect(top).not.toHaveAttribute('max');
  });

  it('changes the plan on the Up arrow of Top', () => {
    render(<Harness initial={rrThenBracket} teamCount={8} />);
    pressUp(within(card(1)).getByLabelText('Top'));
    expect(plans()[0]).toMatchObject({ advance: { top: 3 } });
  });

  it('makes the group size and the best M number fields with their ranges', () => {
    render(
      <Harness
        initial={[
          {
            format: 'groups',
            legs: 'two-way',
            grouping: { by: 'size', size: 4 },
            advance: { top: 1, bestOfNext: 0 },
          },
          { format: 'bracket' },
        ]}
        teamCount={10}
      />
    );
    const size = within(card(1)).getByLabelText('Group size');
    expect(size).toHaveAttribute('type', 'number');
    expect(size).toHaveAttribute('min', '2');
    expect(size).toHaveAttribute('max', '10');
    const best = within(card(1)).getByLabelText('Best of place 2');
    expect(best).toHaveAttribute('type', 'number');
    expect(best).toHaveAttribute('min', '0');
    expect(best).toHaveAttribute('max', '2');
    pressUp(best);
    expect(plans()[0]).toMatchObject({ advance: { bestOfNext: 1 } });
  });

  it('still shows the problem of an empty field', async () => {
    render(<Harness initial={rrThenBracket} teamCount={8} />);
    await userEvent.clear(within(card(1)).getByLabelText('Top'));
    expect(
      within(card(1)).getByText('Phase 1: Top must be a whole number from 1 to 7.')
    ).toBeInTheDocument();
  });
});
