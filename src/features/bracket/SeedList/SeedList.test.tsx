import { beforeEach, describe, expect, it } from 'vitest';
import type { JSX } from 'preact';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import type { PhasePlan } from '@/engine/phases';
import type { BracketPhase, TeamInstance } from '@/domain';
import { useDatabaseStore } from '@/app/state/databaseStore';
import {
  createLeague,
  scorinateBracket,
  scorinateMatchday,
  startNextPhase,
} from '@/app/state/leagueWrapperActions';
import { instance, openTestDatabase, testUuid } from '@/test/databaseRecords';
import { SeedList } from './SeedList';

function teamsOf(n: number): TeamInstance[] {
  return Array.from({ length: n }, (_, i) =>
    instance({
      blueprintUuid: testUuid(700 + i),
      slug: `team-${i + 1}`,
      name: `Team ${i + 1}`,
      ovr: 90 - i * 5,
    })
  );
}

// The name of a test team from its UUID: testUuid(700) is Team 1.
const nameOf = (id: string): string => `Team ${parseInt(id.slice(-12), 16) - 699}`;

let uuid = '';
let phaseIndex = 0;

function createCup(n: number, plans: PhasePlan[] = [{ format: 'bracket' }]): void {
  uuid = createLeague({
    name: 'The Cup',
    homeAdvantage: false,
    points: { win: 3, draw: 1, loss: 0 },
    teams: teamsOf(n),
    plans,
  }).uuid;
  phaseIndex = 0;
}

const bracket = (): BracketPhase => {
  const { phases } = useDatabaseStore.getState().leagues[uuid].content;
  const phase = phases[phases.length - 1];
  if (phase.format !== 'bracket') throw new Error('expected a bracket');
  return phase;
};

function FromStore(): JSX.Element | null {
  const league = useDatabaseStore((state) => state.leagues[uuid]);
  return league ? <SeedList league={league} phaseIndex={phaseIndex} /> : null;
}

const star = (teamId: string): HTMLElement =>
  screen.getByRole('button', { name: `Bye for ${nameOf(teamId)}` });

beforeEach(() => {
  openTestDatabase();
});

describe('SeedList (Task 142)', () => {
  it('lists the seeds in order, with no From column for a first-phase bracket', () => {
    createCup(6);
    render(<FromStore />);
    const table = screen.getByRole('table', { name: 'Seed List' });
    expect(within(table).queryByText('From')).toBeNull();
    const { seeds } = bracket();
    for (const id of seeds)
      expect(within(table).getByText(nameOf(id))).toBeInTheDocument();
  });

  it('shows the help text, the count, and the stars of the default byes (US-04.10)', () => {
    createCup(6);
    render(<FromStore />);
    expect(
      screen.getByText(
        'Top seeds get a bye by default. Star any seed to grant it a bye instead — first-round only.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('2 / 2 byes assigned')).toBeInTheDocument();
    const [s1, s2, s3] = bracket().seeds;
    expect(star(s1)).toHaveAttribute('aria-pressed', 'true');
    expect(star(s2)).toHaveAttribute('aria-pressed', 'true');
    expect(star(s3)).toHaveAttribute('aria-pressed', 'false');
    expect(star(s3)).toBeDisabled();
  });

  it('a star click before the first result changes the byes at once', async () => {
    createCup(6);
    render(<FromStore />);
    const [s1, s2, , , s5] = bracket().seeds;
    await userEvent.click(star(s1));
    expect(bracket().byeTeams).toEqual([s2]);
    expect(screen.getByText('1 / 2 byes assigned')).toBeInTheDocument();
    await userEvent.click(star(s5));
    expect(bracket().byeTeams).toEqual([s2, s5]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the no-byes text and disables every star for a power of 2', () => {
    createCup(8);
    render(<FromStore />);
    expect(
      screen.getByText('8 qualifiers fill the bracket exactly — no byes needed.')
    ).toBeInTheDocument();
    for (const id of bracket().seeds) expect(star(id)).toBeDisabled();
  });

  describe('the bye change confirm (US-04.10, choice 5)', () => {
    async function openConfirm(): Promise<string[]> {
      createCup(6);
      scorinateBracket(uuid);
      render(<FromStore />);
      const { seeds } = bracket();
      await userEvent.click(star(seeds[0]));
      return seeds;
    }

    it('opens "Clear bracket results?" after the first result', async () => {
      await openConfirm();
      const dialog = screen.getByRole('dialog', { name: 'Clear bracket results?' });
      expect(
        within(dialog).getByText(
          'This will clear every result of the bracket. Continue?'
        )
      ).toBeInTheDocument();
    });

    it('"Cancel" changes nothing', async () => {
      const seeds = await openConfirm();
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(bracket().byeTeams).toEqual(seeds.slice(0, 2));
      expect(bracket().results).toHaveLength(2);
    });

    it('"Clear & change byes" clears the results and applies the change', async () => {
      const seeds = await openConfirm();
      await userEvent.click(
        screen.getByRole('button', { name: 'Clear & change byes' })
      );
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(bracket().byeTeams).toEqual([seeds[1]]);
      expect(bracket().results).toEqual([]);
    });
  });

  it('a later bracket tags each seed with its place in the phase before (US-07.2)', () => {
    createCup(5, [
      { format: 'round-robin', legs: 'single-duels', advance: { top: 4 } },
      { format: 'bracket' },
    ]);
    for (let matchday = 1; matchday <= 5; matchday++) scorinateMatchday(uuid, matchday);
    startNextPhase(uuid);
    phaseIndex = 1;
    render(<FromStore />);
    const table = screen.getByRole('table', { name: 'Seed List' });
    expect(within(table).getByText('From')).toBeInTheDocument();
    for (const tag of ['1st', '2nd', '3rd', '4th']) {
      expect(within(table).getByText(tag)).toBeInTheDocument();
    }
  });
});
