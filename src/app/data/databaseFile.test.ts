import { describe, expect, it } from 'vitest';
import {
  buildBracketTree,
  playBracketRound,
  type BracketTieResult,
} from '@/engine/bracket';
import { createSeededRng } from '@/engine/rng';
import type { LeagueWrapper, Manifest } from '@/domain';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  instance,
  leagueWrapper,
  result,
  SALT_MARSH,
  testUuid,
} from '@/test/databaseRecords';
import {
  parseLeagueWrapper,
  parseManifestRecord,
  serializeLeagueWrapper,
  serializeManifestRecord,
} from './databaseFile';

const manifest = (): Manifest => ({
  installationUuid: INSTALLATION,
  blueprints: [
    blueprint(),
    blueprint({ uuid: HARBORVIEW, slug: 'harborview-sc', location: '' }),
  ],
  wrappers: [
    {
      uuid: leagueWrapper().uuid,
      contentType: 'league',
      name: 'Coastal Premier',
      teamCount: 2,
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      phases: [{ format: 'round-robin', legs: 'two-way' }],
      progress: { kind: 'phase', phase: 1, matchday: 2, matchdays: 2 },
    },
  ],
});

describe('the manifest map (Task 108)', () => {
  it('gives the same manifest after a round trip', () => {
    expect(parseManifestRecord(serializeManifestRecord(manifest()))).toEqual(
      manifest()
    );
  });

  it('writes the MVP2 file format, with its kind and version', () => {
    const file = JSON.parse(serializeManifestRecord(manifest()));
    expect(file.kind).toBe('manifest');
    expect(file.formatVersion).toBe(4);
  });

  it('gives the parser error for a bad file', () => {
    expect(() => parseManifestRecord('{}')).toThrow('manifest.json is not valid:');
  });
});

describe('the wrapper map (Task 108)', () => {
  it('gives the same wrapper after a round trip, with its results', () => {
    const wrapper = leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)]);
    expect(parseLeagueWrapper(serializeLeagueWrapper(wrapper))).toEqual(wrapper);
  });

  it('writes the MVP2 file format, with its kind and version', () => {
    const file = JSON.parse(serializeLeagueWrapper(leagueWrapper()));
    expect(file.kind).toBe('wrapper');
    expect(file.formatVersion).toBe(4);
  });

  it('gives the parser error for a bad file', () => {
    expect(() => parseLeagueWrapper('[]')).toThrow('A league file is not valid:');
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a test edits the raw JSON freely, to make a bad file
type RawFile = any;

describe('the bracket files (Task 139)', () => {
  const RULES = {
    format: 'two-legged' as const,
    awayGoals: true,
    playsAet: true,
    method: 'replay-coin-toss' as const,
    singleMatchFinal: true,
    thirdPlace: true,
  };

  // A 6-team cup with every round played, so the results hold legs, AET,
  // replays, penalties, and coin tosses over the seeds.
  function playedCup(): LeagueWrapper {
    const base = leagueWrapper();
    const teams = Array.from({ length: 6 }, (_, i) =>
      instance({
        blueprintUuid: testUuid(300 + i),
        slug: `t${i}`,
        name: `T${i}`,
        ovr: 80 - i,
      })
    );
    const seeds = teams.map((team) => team.blueprintUuid);
    const byeTeams = seeds.slice(0, 2);
    const tree = buildBracketTree(1, seeds, byeTeams, true);
    if (tree.status !== 'ready') throw new Error('expected a ready tree');
    const ovrOf = (id: string): number =>
      teams.find((t) => t.blueprintUuid === id)?.ovr ?? 0;
    const rng = createSeededRng(139);
    let results: BracketTieResult<string>[] = [];
    for (let call = 0; call < 4; call++) {
      results = playBracketRound(
        tree.rounds,
        results,
        { ...RULES, homeAdvantage: true },
        ovrOf,
        rng
      );
    }
    return {
      ...base,
      teams,
      content: {
        ...base.content,
        plans: [{ format: 'bracket', rules: RULES }],
        phases: [{ format: 'bracket', seeds, byeTeams, results }],
      },
    };
  }

  // The saved text of the cup, changed by `change` on the raw JSON.
  function cupText(change: (raw: RawFile) => void = () => {}): string {
    const raw = JSON.parse(serializeLeagueWrapper(playedCup()));
    change(raw);
    return JSON.stringify(raw);
  }

  it('gives the same league after a round trip of a played bracket', () => {
    const wrapper = playedCup();
    expect(parseLeagueWrapper(serializeLeagueWrapper(wrapper))).toEqual(wrapper);
  });

  it('reads a bracket plan with no rules: the defaults have no third-place tie', () => {
    const parsed = parseLeagueWrapper(
      cupText((raw) => {
        delete raw.content.plans[0].rules;
        const [phase] = raw.content.phases;
        phase.results = phase.results.filter(
          (result: { tieId: string }) => result.tieId !== 'p1.r3.third'
        );
      })
    );
    expect(parsed.content.plans).toEqual([{ format: 'bracket' }]);
  });

  it('rejects a third-place result when the plan has no third-place tie', () => {
    expect(() =>
      parseLeagueWrapper(cupText((raw) => delete raw.content.plans[0].rules))
    ).toThrow('names no tie of its bracket.');
  });

  it.each([
    [
      'a seed that is not in the league',
      (raw: RawFile): unknown => (raw.content.phases[0].seeds[0] = testUuid(999)),
      'phase 1 has a seed that is not in the league.',
    ],
    [
      'a seed twice',
      (raw: RawFile): unknown =>
        (raw.content.phases[0].seeds[1] = raw.content.phases[0].seeds[0]),
      'phase 1, seed 2 is a seed twice.',
    ],
    [
      'a bye team that is not a seed',
      (raw: RawFile): unknown => (raw.content.phases[0].byeTeams[0] = testUuid(999)),
      'phase 1 has a bye team that is not a seed.',
    ],
    [
      'more bye teams than byes',
      (raw: RawFile): unknown =>
        raw.content.phases[0].byeTeams.push(raw.content.phases[0].seeds[2]),
      'phase 1 has more bye teams than its bracket has byes.',
    ],
    [
      'a result for an unknown tie',
      (raw: RawFile): unknown => (raw.content.phases[0].results[0].tieId = 'p1.r9.t1'),
      'phase 1, result 1 names no tie of its bracket.',
    ],
    [
      'a result for a bye tie',
      (raw: RawFile): unknown => (raw.content.phases[0].results[0].tieId = 'p1.r1.t1'),
      'phase 1, result 1 names no tie of its bracket.',
    ],
    [
      'a tie with two results',
      (raw: RawFile): unknown =>
        raw.content.phases[0].results.push(raw.content.phases[0].results[0]),
      'names a tie that already has a result.',
    ],
    [
      'a winner that is not a seed',
      (raw: RawFile): unknown =>
        (raw.content.phases[0].results[0].winnerId = testUuid(999)),
      'phase 1, result 1 names a winner or a loser that is not a seed of the bracket.',
    ],
    [
      'a bad decision',
      (raw: RawFile): unknown => (raw.content.phases[0].results[0].decidedBy = 'luck'),
      'phase 1, result 1 has no valid decision.',
    ],
    [
      'a bad match score',
      (raw: RawFile): unknown =>
        (raw.content.phases[0].results[0].matches[0].score.homeGoals = -1),
      'phase 1, result 1, match 1 has no valid score.',
    ],
    [
      'bad bracket rules',
      (raw: RawFile): unknown => (raw.content.plans[0].rules.method = 'dice'),
      'plan 1 has no valid bracket rules.',
    ],
  ])('rejects %s', (_, change, message) => {
    expect(() => parseLeagueWrapper(cupText(change))).toThrow(message);
  });

  it('rejects a bracket phase in a version-3 file', () => {
    expect(() => parseLeagueWrapper(cupText((raw) => (raw.formatVersion = 3)))).toThrow(
      'phase 1 has a format that is not known.'
    );
  });

  it('reads and writes the bracket progress of a manifest row', () => {
    const withBracket: Manifest = {
      ...manifest(),
      wrappers: manifest().wrappers.map((row) => ({
        ...row,
        phases: [{ format: 'bracket' }],
        progress: { kind: 'bracket', phase: 1, round: 8 },
      })),
    };
    expect(parseManifestRecord(serializeManifestRecord(withBracket))).toEqual(
      withBracket
    );
  });

  it.each([6, 1, 0])('rejects a bracket progress round of %i', (round) => {
    const raw = JSON.parse(serializeManifestRecord(manifest()));
    raw.wrappers[0].progress = { kind: 'bracket', phase: 1, round };
    expect(() => parseManifestRecord(JSON.stringify(raw))).toThrow(
      'has no valid progress.'
    );
  });
});
