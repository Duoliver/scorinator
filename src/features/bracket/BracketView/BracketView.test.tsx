import { beforeEach, describe, expect, it } from 'vitest';
import type { JSX } from 'preact';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { PhasePlan } from '@/engine/phases';
import type { BracketPhase, TeamInstance } from '@/domain';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { createLeague, scorinateBracket } from '@/app/state/leagueWrapperActions';
import { instance, openTestDatabase, testUuid } from '@/test/databaseRecords';
import { BracketView } from './BracketView';

function teamsOf(n: number): TeamInstance[] {
  return Array.from({ length: n }, (_, i) =>
    instance({
      blueprintUuid: testUuid(600 + i),
      slug: `team-${i + 1}`,
      name: `Team ${i + 1}`,
      colour: '#123456',
    })
  );
}

let uuid = '';

function createCup(n: number, plans: PhasePlan[] = [{ format: 'bracket' }]): void {
  uuid = createLeague({
    name: 'The Cup',
    homeAdvantage: false,
    points: { win: 3, draw: 1, loss: 0 },
    teams: teamsOf(n),
    plans,
  }).uuid;
}

const bracket = (): BracketPhase => {
  const [phase] = useDatabaseStore.getState().leagues[uuid].content.phases;
  if (phase.format !== 'bracket') throw new Error('expected a bracket');
  return phase;
};
// The name of a test team from its UUID: testUuid(600) is Team 1.
const nameOf = (id: string): string => `Team ${parseInt(id.slice(-12), 16) - 599}`;

/** Renders the view from the store, as League Detail does, so a click
 * shows its result. */
function FromStore(): JSX.Element | null {
  const league = useDatabaseStore((state) => state.leagues[uuid]);
  return league ? <BracketView league={league} phaseIndex={0} /> : null;
}

const column = (name: string): HTMLElement => screen.getByRole('region', { name });
const scorinateAll = (): Promise<void> =>
  userEvent.click(screen.getByRole('button', { name: '⚽ Scorinate bracket' }));

beforeEach(() => {
  openTestDatabase();
});

describe('BracketView (Task 141)', () => {
  it('shows the header line and one named column for each round', () => {
    createCup(6);
    render(<FromStore />);
    expect(
      screen.getByText(
        'Seeded by random draw · All ties single match · AET → Penalties · * score includes AET'
      )
    ).toBeInTheDocument();
    for (const name of ['Quarter-finals', 'Semi-finals', 'Final']) {
      expect(column(name)).toBeInTheDocument();
    }
  });

  it('shows a bye card with its team and a disabled Scorinate (US-04.11)', () => {
    createCup(6);
    render(<FromStore />);
    const byes = within(column('Quarter-finals')).getAllByText(
      'BYE — advances automatically'
    );
    expect(byes).toHaveLength(2);
    const [seed1] = bracket().seeds;
    const card = screen.getByRole('group', { name: `${nameOf(seed1)} v BYE` });
    expect(within(card).getByRole('button', { name: /Scorinate/ })).toBeDisabled();
  });

  it('shows the bye team in its semi-final, and TBD for the slot that waits (US-04.7)', () => {
    createCup(6);
    render(<FromStore />);
    const [seed1] = bracket().seeds;
    const semi = screen.getByRole('group', { name: `${nameOf(seed1)} v TBD` });
    expect(within(semi).getByText('TBD')).toBeInTheDocument();
    expect(within(semi).getByRole('button', { name: /Scorinate/ })).toBeDisabled();
  });

  it('"Scorinate bracket" plays one round for each click, then shows the winner', async () => {
    createCup(6);
    render(<FromStore />);
    await scorinateAll();
    expect(bracket().results).toHaveLength(2);
    await scorinateAll();
    await scorinateAll();
    const winner = bracket().results.find(
      (result) => result.tieId === 'p1.r3.final'
    )?.winnerId;
    expect(screen.getByText(`Winner: ${nameOf(winner ?? '')}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '⚽ Scorinate bracket' })).toBeDisabled();
  });

  it('plays one tie from its card', async () => {
    createCup(4);
    render(<FromStore />);
    const [s1, , , s4] = bracket().seeds;
    const card = screen.getByRole('group', { name: `${nameOf(s1)} v ${nameOf(s4)}` });
    await userEvent.click(within(card).getByRole('button', { name: /Scorinate/ }));
    expect(bracket().results.map((result) => result.tieId)).toEqual(['p1.r1.t1']);
  });

  it('a re-scorinate with no later result plays again with no confirm', async () => {
    createCup(4);
    scorinateBracket(uuid);
    render(<FromStore />);
    const [s1, , , s4] = bracket().seeds;
    const card = screen.getByRole('group', { name: `${nameOf(s1)} v ${nameOf(s4)}` });
    await userEvent.click(within(card).getByRole('button', { name: /Scorinate/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(bracket().results).toHaveLength(2);
  });

  describe('the re-scorinate confirm (US-04.6)', () => {
    async function openConfirm(): Promise<void> {
      createCup(4);
      scorinateBracket(uuid);
      scorinateBracket(uuid);
      render(<FromStore />);
      const [s1, , , s4] = bracket().seeds;
      const card = screen.getByRole('group', { name: `${nameOf(s1)} v ${nameOf(s4)}` });
      await userEvent.click(within(card).getByRole('button', { name: /Scorinate/ }));
    }

    it('opens "Clear later rounds?" when a later tie has a result', async () => {
      await openConfirm();
      const dialog = screen.getByRole('dialog', { name: 'Clear later rounds?' });
      expect(
        within(dialog).getByText('This will clear results for later rounds. Continue?')
      ).toBeInTheDocument();
    });

    it('"Cancel" changes nothing', async () => {
      await openConfirm();
      const before = bracket().results;
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(bracket().results).toBe(before);
    });

    it('"Clear & scorinate" clears the final and plays the tie again', async () => {
      await openConfirm();
      await userEvent.click(screen.getByRole('button', { name: 'Clear & scorinate' }));
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(
        bracket()
          .results.map((result) => result.tieId)
          .sort()
      ).toEqual(['p1.r1.t1', 'p1.r1.t2']);
    });
  });

  it('shows a two-legged card with the leg header and the aggregate', () => {
    createCup(4, [
      {
        format: 'bracket',
        rules: {
          format: 'two-legged',
          awayGoals: false,
          playsAet: true,
          method: 'penalties',
          singleMatchFinal: false,
          thirdPlace: true,
        },
      },
    ]);
    scorinateBracket(uuid);
    render(<FromStore />);
    const [s1, , , s4] = bracket().seeds;
    const card = screen.getByRole('group', { name: `${nameOf(s1)} v ${nameOf(s4)}` });
    expect(within(card).getByText('L1')).toBeInTheDocument();
    expect(within(card).getByText('L2')).toBeInTheDocument();
    expect(within(card).getByText(/^Agg \d+–\d+/)).toBeInTheDocument();
    expect(
      within(column('Final')).getByText('Third-place playoff')
    ).toBeInTheDocument();
  });

  describe('the title in the score header row (Task 187)', () => {
    const rules = {
      awayGoals: false,
      playsAet: true,
      method: 'penalties',
      singleMatchFinal: false,
      thirdPlace: true,
    } as const;

    it('shows the title of a two-legged card beside "L1", in one row', () => {
      createCup(4, [{ format: 'bracket', rules: { ...rules, format: 'two-legged' } }]);
      render(<FromStore />);
      const title = within(column('Final')).getByText('Third-place playoff');
      const header = title.parentElement as HTMLElement;
      // The parent is the header row, not the whole card.
      expect(header).not.toHaveAttribute('role', 'group');
      expect(within(header).getByText('L1')).toBeInTheDocument();
      expect(within(header).getByText('L2')).toBeInTheDocument();
    });

    it('keeps the title row of a single-match card', () => {
      createCup(4, [
        { format: 'bracket', rules: { ...rules, format: 'single-match' } },
      ]);
      render(<FromStore />);
      const title = within(column('Final')).getByText('Third-place playoff');
      expect(title.tagName).toBe('P');
    });
  });

  it('shows the missing byes, with both Scorinate buttons off (US-04.10)', () => {
    createCup(6);
    useDatabaseStore.setState((state) => {
      const league = state.leagues[uuid];
      const phase = { ...bracket(), byeTeams: [bracket().seeds[0]] };
      return {
        leagues: {
          ...state.leagues,
          [uuid]: { ...league, content: { ...league.content, phases: [phase] } },
        },
      };
    });
    render(<FromStore />);
    expect(
      screen.getByText('Assign 1 / 2 byes to play the first round.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '⚽ Scorinate bracket' })).toBeDisabled();
  });
});
