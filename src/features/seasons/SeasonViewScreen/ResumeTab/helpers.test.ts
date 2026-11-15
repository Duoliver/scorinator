import { beforeEach, describe, expect, it } from 'vitest';
import type { LeagueWrapper } from '@/domain';
import { DEFAULT_BRACKET_RULES, type PhasePlan } from '@/engine/phases';
import { useDatabaseStore } from '@/app/state/databaseStore';
import {
  createLeague,
  scorinateBracket,
  scorinateMatchday,
} from '@/app/state/leagueWrapperActions';
import {
  groupsLeague,
  LEAGUE,
  openTestDatabase,
  openTestLeague,
  roundRobinLeague,
} from '@/test/databaseRecords';
import { getResumeContent } from './helpers';

const TEAMS = [
  { name: 'Alpha', colour: '#111111' },
  { name: 'Bravo', colour: '#222222' },
  { name: 'Charlie', colour: '#333333' },
  { name: 'Delta', colour: '#444444' },
];
const league = (uuid = LEAGUE): LeagueWrapper =>
  useDatabaseStore.getState().leagues[uuid];

/** A four-team round robin, with a red "Relegation" zone at place 4. */
function openRoundRobin(): void {
  const wrapper = roundRobinLeague(TEAMS);
  wrapper.content.plans = [
    {
      format: 'round-robin',
      legs: 'two-way',
      zones: [{ colour: 'red', label: 'Relegation', places: { from: 4, to: 4 } }],
    },
  ];
  openTestLeague(wrapper);
}

/** A cup of the four teams, with one bracket phase. Gives its UUID. */
function createBracket(plan: PhasePlan): string {
  return createLeague({
    name: 'Cup',
    homeAdvantage: false,
    points: { win: 3, draw: 1, loss: 0 },
    teams: useDatabaseStore.getState().blueprints.map((b, index) => ({
      blueprintUuid: b.uuid,
      slug: b.slug,
      name: b.name,
      colour: b.colour,
      tier: b.tier,
      ovr: 70 + index,
      trigram: '',
    })),
    plans: [plan],
  }).uuid;
}

beforeEach(() => {
  openTestDatabase(
    TEAMS.map((team, index) => ({ ...team, slug: `team-${index + 1}`, tier: 'B' }))
  );
});

describe('getResumeContent (US-13.8, Task 221)', () => {
  it('says "No results yet." before the first result (choice 5)', () => {
    openRoundRobin();

    expect(getResumeContent(league())).toEqual({ rows: [], note: 'No results yet.' });
  });

  it('shows the first place now and the zone teams of a running round robin', () => {
    openRoundRobin();
    scorinateMatchday(LEAGUE, 1);

    const { rows, note } = getResumeContent(league());

    expect(note).toBeUndefined();
    expect(rows.map((row) => [row.place, row.label, row.tone])).toEqual([
      ['1', 'First place now', 'winner'],
      ['4', 'Relegation', 'red'],
    ]);
  });

  it('shows the champion of a complete round robin', () => {
    openRoundRobin();
    for (let matchday = 1; matchday <= 6; matchday += 1)
      scorinateMatchday(LEAGUE, matchday);

    const [first] = getResumeContent(league()).rows;

    expect(first).toMatchObject({ place: '1', label: 'Champion', tone: 'winner' });
  });

  it('shows the first place of each group of a Groups phase (choice 3)', () => {
    openTestLeague(
      groupsLeague(TEAMS, [
        [1, 2],
        [3, 4],
      ])
    );
    scorinateMatchday(LEAGUE, 1);

    const { rows } = getResumeContent(league());

    expect(rows.map((row) => [row.place, row.label, row.tone])).toEqual([
      ['1', 'First in Group A', undefined],
      ['1', 'First in Group B', undefined],
    ]);
  });

  it('says "No winner yet" for a running bracket (choice 4)', () => {
    const uuid = createBracket({ format: 'bracket' });

    expect(getResumeContent(league(uuid))).toEqual({
      rows: [],
      note: 'No winner yet.',
    });
  });

  it('shows places 1 to 4 of a complete bracket with a third-place playoff', () => {
    const uuid = createBracket({
      format: 'bracket',
      rules: { ...DEFAULT_BRACKET_RULES, thirdPlace: true },
    });
    scorinateBracket(uuid);
    scorinateBracket(uuid);

    const { rows } = getResumeContent(league(uuid));

    expect(rows.map((row) => [row.place, row.label, row.tone])).toEqual([
      ['1', 'Champion', 'winner'],
      ['2', 'Runner-up', undefined],
      ['3', 'Third place', undefined],
      ['4', 'Fourth place', undefined],
    ]);
  });
});
