import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_BRACKET_RULES, type PhasePlan } from '@/engine/phases';
import type { BracketPhase, LeagueWrapper, TeamInstance } from '@/domain';
import { serializeManifestRecord } from '@/app/data/databaseFile';
import {
  blueprint,
  INSTALLATION,
  instance,
  memoryFolder,
  testUuid,
} from '@/test/databaseRecords';
import { bracketRulesFor, bracketTreeOf, isBracketPhaseComplete } from './bracket';
import { openDatabase } from './databaseActions';
import { useDatabaseStore } from './databaseStore';
import {
  createLeague,
  scorinateBracket,
  scorinateBracketTie,
  scorinateFixture,
  scorinateMatchday,
  setBracketByes,
  startNextPhase,
} from './leagueWrapperActions';
import { canStartNextPhase, phaseStandings } from './phases';
import { summarizeLeague } from './summarizeLeague';

const OTHER_INSTALLATION = '00000000-0000-4000-8000-0000000000ff';

function teamsOf(n: number): TeamInstance[] {
  return Array.from({ length: n }, (_, i) =>
    instance({
      blueprintUuid: testUuid(200 + i),
      slug: `team-${i + 1}`,
      name: `Team ${i + 1}`,
      ovr: 90 - i,
    })
  );
}

async function open(): Promise<void> {
  const manifest = serializeManifestRecord({
    installationUuid: INSTALLATION,
    blueprints: [blueprint()],
    wrappers: [],
  });
  await openDatabase(memoryFolder({ manifest }).folder);
}

const wrapperOf = (uuid: string): LeagueWrapper =>
  useDatabaseStore.getState().leagues[uuid];

function bracketOf(uuid: string): BracketPhase {
  const { phases } = wrapperOf(uuid).content;
  const phase = phases[phases.length - 1];
  if (phase.format !== 'bracket') throw new Error('expected a bracket phase');
  return phase;
}

const cup = (rules?: PhasePlan & { format: 'bracket' }): PhasePlan[] => [
  rules ?? { format: 'bracket' },
];

function createCup(
  n: number,
  plans: PhasePlan[] = cup(),
  homeAdvantage = false
): string {
  return createLeague({
    name: 'The Cup',
    homeAdvantage,
    points: { win: 3, draw: 1, loss: 0 },
    teams: teamsOf(n),
    plans,
  }).uuid;
}

// Marks the league as made by another installation, so a stamp shows.
function madeElsewhere(uuid: string): void {
  const wrapper = wrapperOf(uuid);
  useDatabaseStore.setState((now) => ({
    leagues: {
      ...now.leagues,
      [uuid]: {
        ...wrapper,
        content: { ...wrapper.content, lastModifiedByInstallation: OTHER_INSTALLATION },
      },
    },
  }));
}

beforeEach(async () => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
  await open();
});

describe('the bracket phase start (US-04.2, Task 139 choice 4)', () => {
  it('a bracket as phase 1 stores a random draw of the teams, with the default byes', () => {
    const uuid = createCup(6);
    const phase = bracketOf(uuid);
    const teams = teamsOf(6).map((team) => team.blueprintUuid);
    expect([...phase.seeds].sort()).toEqual([...teams].sort());
    expect(phase.byeTeams).toEqual(phase.seeds.slice(0, 2));
    expect(phase.results).toEqual([]);
  });

  it('a bracket after a round robin takes the qualifiers in seed order', () => {
    const plans: PhasePlan[] = [
      { format: 'round-robin', legs: 'single-duels', advance: { top: 4 } },
      { format: 'bracket' },
    ];
    const uuid = createCup(5, plans);
    for (let matchday = 1; matchday <= 5; matchday++) scorinateMatchday(uuid, matchday);
    const [table] = phaseStandings(wrapperOf(uuid), 0);
    expect(canStartNextPhase(wrapperOf(uuid))).toBe(true);
    startNextPhase(uuid);
    const phase = bracketOf(uuid);
    expect(phase.seeds).toEqual(table.slice(0, 4).map((row) => row.team));
    expect(phase.byeTeams).toEqual([]);
    expect(canStartNextPhase(wrapperOf(uuid))).toBe(false);
  });

  it('a bracket has no standings tables', () => {
    expect(phaseStandings(wrapperOf(createCup(4)), 0)).toEqual([]);
  });
});

describe('the selectors', () => {
  it('bracketRulesFor gives the defaults and the league home advantage', () => {
    const uuid = createCup(4, cup(), true);
    expect(bracketRulesFor(wrapperOf(uuid), 0)).toEqual({
      ...DEFAULT_BRACKET_RULES,
      homeAdvantage: true,
    });
  });

  it('bracketRulesFor gives the rules of the plan when it has them', () => {
    const rules = {
      ...DEFAULT_BRACKET_RULES,
      format: 'two-legged' as const,
      thirdPlace: true,
    };
    const uuid = createCup(4, cup({ format: 'bracket', rules }));
    expect(bracketRulesFor(wrapperOf(uuid), 0)).toEqual({
      ...rules,
      homeAdvantage: false,
    });
  });

  it('bracketTreeOf builds the tree with the third-place tie of the plan', () => {
    const rules = { ...DEFAULT_BRACKET_RULES, thirdPlace: true };
    const uuid = createCup(4, cup({ format: 'bracket', rules }));
    const tree = bracketTreeOf(wrapperOf(uuid), 0);
    if (tree.status !== 'ready') throw new Error('expected a ready tree');
    expect(tree.rounds[1].ties.map((tie) => tie.id)).toEqual([
      'p1.r2.third',
      'p1.r2.final',
    ]);
  });

  it('bracketTreeOf throws a RangeError for a phase that is not a bracket', () => {
    const uuid = createCup(4, [{ format: 'round-robin', legs: 'two-way' }]);
    expect(() => bracketTreeOf(wrapperOf(uuid), 0)).toThrow(RangeError);
  });
});

describe('scorinateBracketTie (US-04.5, US-04.6)', () => {
  it('plays one tie, stores its result, and stamps the league', () => {
    const uuid = createCup(4);
    madeElsewhere(uuid);
    scorinateBracketTie(uuid, 'p1.r1.t1');
    const [result] = bracketOf(uuid).results;
    expect(result.tieId).toBe('p1.r1.t1');
    expect([result.winnerId, result.loserId].sort()).toEqual(
      [bracketOf(uuid).seeds[0], bracketOf(uuid).seeds[3]].sort()
    );
    expect(wrapperOf(uuid).content.lastModifiedByInstallation).toBe(INSTALLATION);
  });

  it('a re-scorinate clears the dependent ties, not the others', () => {
    const uuid = createCup(4);
    scorinateBracket(uuid);
    scorinateBracket(uuid);
    expect(
      bracketOf(uuid)
        .results.map((r) => r.tieId)
        .sort()
    ).toEqual(['p1.r1.t1', 'p1.r1.t2', 'p1.r2.final']);
    scorinateBracketTie(uuid, 'p1.r1.t2');
    expect(
      bracketOf(uuid)
        .results.map((r) => r.tieId)
        .sort()
    ).toEqual(['p1.r1.t1', 'p1.r1.t2']);
  });

  it('throws a RangeError for a bye tie, a TBD tie, and on a round robin', () => {
    const uuid = createCup(6);
    expect(() => scorinateBracketTie(uuid, 'p1.r1.t1')).toThrow(RangeError);
    expect(() => scorinateBracketTie(uuid, 'p1.r3.final')).toThrow(RangeError);
    const league = createCup(4, [{ format: 'round-robin', legs: 'two-way' }]);
    expect(() => scorinateBracketTie(league, 'p1.r1.t1')).toThrow(RangeError);
  });

  it('a fixture action on a bracket throws a RangeError', () => {
    const uuid = createCup(4);
    expect(() => scorinateFixture(uuid, 'p1.g1.md1.m1')).toThrow(RangeError);
    expect(() => scorinateMatchday(uuid, 1)).toThrow(RangeError);
  });
});

describe('scorinateBracket (US-04.5)', () => {
  it('plays every playable tie, one round for each call, until complete', () => {
    const uuid = createCup(6);
    scorinateBracket(uuid);
    expect(
      bracketOf(uuid)
        .results.map((r) => r.tieId)
        .sort()
    ).toEqual(['p1.r1.t2', 'p1.r1.t4']);
    scorinateBracket(uuid);
    scorinateBracket(uuid);
    expect(isBracketPhaseComplete(wrapperOf(uuid), 0)).toBe(true);
  });

  it('changes nothing with no playable tie: no stamp', () => {
    const uuid = createCup(2);
    scorinateBracket(uuid);
    madeElsewhere(uuid);
    const before = wrapperOf(uuid);
    scorinateBracket(uuid);
    expect(wrapperOf(uuid)).toBe(before);
  });
});

describe('setBracketByes (US-04.10)', () => {
  it('stores the new bye teams before the first result', () => {
    const uuid = createCup(6);
    const { seeds } = bracketOf(uuid);
    setBracketByes(uuid, [seeds[4], seeds[2]]);
    expect(bracketOf(uuid).byeTeams).toEqual([seeds[4], seeds[2]]);
  });

  it('clears every result of the phase after the first result', () => {
    const uuid = createCup(6);
    scorinateBracket(uuid);
    const { seeds } = bracketOf(uuid);
    setBracketByes(uuid, [seeds[4], seeds[2]]);
    expect(bracketOf(uuid).results).toEqual([]);
  });

  it('allows too few bye teams: the tree waits, and the play throws', () => {
    const uuid = createCup(6);
    setBracketByes(uuid, [bracketOf(uuid).seeds[0]]);
    expect(bracketTreeOf(wrapperOf(uuid), 0)).toEqual({
      status: 'missing-byes',
      byes: 2,
      assigned: 1,
    });
    expect(() => scorinateBracket(uuid)).toThrow(RangeError);
    expect(isBracketPhaseComplete(wrapperOf(uuid), 0)).toBe(false);
  });

  it('the same bye teams change nothing, and keep the results', () => {
    const uuid = createCup(6);
    scorinateBracket(uuid);
    const before = wrapperOf(uuid);
    setBracketByes(uuid, [...bracketOf(uuid).byeTeams].reverse());
    expect(wrapperOf(uuid)).toBe(before);
  });

  it('throws a RangeError for a bye team that is not a seed, or too many', () => {
    const uuid = createCup(6);
    const { seeds } = bracketOf(uuid);
    expect(() => setBracketByes(uuid, [seeds[0], testUuid(999)])).toThrow(RangeError);
    expect(() => setBracketByes(uuid, seeds.slice(0, 3))).toThrow(RangeError);
    expect(bracketOf(uuid).byeTeams).toEqual(seeds.slice(0, 2));
  });
});

describe('the bracket progress (Task 139 choice 6)', () => {
  it('gives the slot count of the current round, then completed', () => {
    const uuid = createCup(6);
    expect(summarizeLeague(wrapperOf(uuid)).progress).toEqual({
      kind: 'bracket',
      phase: 1,
      round: 8,
    });
    scorinateBracket(uuid);
    expect(summarizeLeague(wrapperOf(uuid)).progress).toMatchObject({ round: 4 });
    scorinateBracket(uuid);
    expect(summarizeLeague(wrapperOf(uuid)).progress).toMatchObject({ round: 2 });
    scorinateBracket(uuid);
    expect(summarizeLeague(wrapperOf(uuid)).progress).toEqual({ kind: 'completed' });
  });

  it('gives the first round while byes are missing', () => {
    const uuid = createCup(6);
    setBracketByes(uuid, []);
    expect(summarizeLeague(wrapperOf(uuid)).progress).toEqual({
      kind: 'bracket',
      phase: 1,
      round: 8,
    });
  });

  it('gives the bracket phases a plain summary, with no rules', () => {
    const rules = { ...DEFAULT_BRACKET_RULES, thirdPlace: true };
    const uuid = createCup(4, cup({ format: 'bracket', rules }));
    expect(summarizeLeague(wrapperOf(uuid)).phases).toEqual([{ format: 'bracket' }]);
  });
});
