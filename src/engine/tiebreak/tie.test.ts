import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import {
  applyHomeAdvantage,
  rollElasticity,
  scorinateExtraTime,
  scorinatePeriod,
  type MatchScore,
} from '@/engine/scorination';
import {
  playTie,
  scorinatePenalties,
  type TieMatch,
  type TieResult,
  type TieRules,
  type TieTeam,
} from './index';

const HIGHER: TieTeam<string> = { id: 'high', ovr: 72 };
const LOWER: TieTeam<string> = { id: 'low', ovr: 68 };
const SEEDS = 3000;

function rulesOf(overrides: Partial<TieRules>): TieRules {
  return {
    format: 'single-match',
    awayGoals: false,
    playsAet: true,
    method: 'penalties',
    homeAdvantage: true,
    ...overrides,
  };
}

const ALL_RULES: TieRules[] = (['single-match', 'two-legged'] as const).flatMap(
  (format) =>
    (format === 'two-legged' ? [false, true] : [false]).flatMap((awayGoals) =>
      [true, false].flatMap((playsAet) =>
        (['penalties', 'replay-coin-toss'] as const).map((method) =>
          rulesOf({ format, awayGoals, playsAet, method })
        )
      )
    )
);

function goalsOf(match: TieMatch<string>, id: string, withAet: boolean): number {
  const side = match.homeId === id ? 'homeGoals' : 'awayGoals';
  return match.score[side] + (withAet && match.aet ? match.aet[side] : 0);
}

function isLevel(score: MatchScore): boolean {
  return score.homeGoals === score.awayGoals;
}

// The side of a match that won its part, by home and away goals.
function winnerOf(match: TieMatch<string>, score: MatchScore): string {
  return score.homeGoals > score.awayGoals ? match.homeId : match.awayId;
}

function playAll(rules: TieRules): TieResult<string>[] {
  return Array.from({ length: SEEDS }, (_, seed) =>
    playTie(HIGHER, LOWER, rules, createSeededRng(seed))
  );
}

// The seeds whose tie passes the check, with the tie. A check of one seed
// is weak: small scores often stay the same with different inputs.
function tiesWhere(
  rules: TieRules,
  check: (tie: TieResult<string>) => boolean
): [TieResult<string>, number][] {
  const found: [TieResult<string>, number][] = [];
  for (let seed = 0; seed < SEEDS; seed++) {
    const tie = playTie(HIGHER, LOWER, rules, createSeededRng(seed));
    if (check(tie)) found.push([tie, seed]);
  }
  expect(found.length).toBeGreaterThan(50);
  return found;
}

describe('playTie: the matches', () => {
  it('a single-match tie has one match, leg1, with the higher seed in the home slot', () => {
    for (const tie of playAll(rulesOf({ playsAet: false }))) {
      const [first] = tie.matches;
      expect(first).toMatchObject({ part: 'leg1', homeId: 'high', awayId: 'low' });
      expect(tie.matches.filter((match) => match.part !== 'replay')).toHaveLength(1);
    }
  });

  it('a two-legged tie has leg1 at the lower seed and leg2 at the higher seed (Task 79)', () => {
    for (const tie of playAll(rulesOf({ format: 'two-legged' }))) {
      expect(tie.matches[0]).toMatchObject({
        part: 'leg1',
        homeId: 'low',
        awayId: 'high',
      });
      expect(tie.matches[1]).toMatchObject({
        part: 'leg2',
        homeId: 'high',
        awayId: 'low',
      });
    }
  });

  it('a single match is neutral: no home boost, even with the league home advantage on', () => {
    for (const [tie, seed] of tiesWhere(rulesOf({ homeAdvantage: true }), () => true)) {
      const rng = createSeededRng(seed);
      const elasticity = rollElasticity(rng);
      expect(tie.matches[0].score).toEqual(
        scorinatePeriod(HIGHER.ovr, LOWER.ovr, elasticity, 1, rng)
      );
    }
  });

  it.each([true, false])(
    'each leg of a two-legged tie boosts its home team only when the league has it on: %s',
    (homeAdvantage) => {
      const boost = (ovr: number): number =>
        homeAdvantage ? applyHomeAdvantage(ovr) : ovr;
      const rules = rulesOf({ format: 'two-legged', homeAdvantage });
      for (const [tie, seed] of tiesWhere(rules, () => true)) {
        const rng = createSeededRng(seed);
        const leg1 = scorinatePeriod(
          boost(LOWER.ovr),
          HIGHER.ovr,
          rollElasticity(rng),
          1,
          rng
        );
        const leg2 = scorinatePeriod(
          boost(HIGHER.ovr),
          LOWER.ovr,
          rollElasticity(rng),
          1,
          rng
        );
        expect(tie.matches.slice(0, 2).map((match) => match.score)).toEqual([
          leg1,
          leg2,
        ]);
      }
    }
  );

  it('is deterministic: the same seed gives the same tie', () => {
    for (const rules of ALL_RULES) {
      expect(playTie(HIGHER, LOWER, rules, createSeededRng(5))).toEqual(
        playTie(HIGHER, LOWER, rules, createSeededRng(5))
      );
    }
  });
});

describe('playTie: the winner (US-04.4)', () => {
  it.each(ALL_RULES.map((rules) => [JSON.stringify(rules), rules] as const))(
    'every tie has one winner and one loser, the two teams: %s',
    (_, rules) => {
      for (const tie of playAll(rules)) {
        expect([tie.winnerId, tie.loserId].sort()).toEqual(['high', 'low']);
      }
    }
  );

  it.each(ALL_RULES.map((rules) => [JSON.stringify(rules), rules] as const))(
    'the decision follows the rules and the scores: %s',
    (_, rules) => {
      for (const tie of playAll(rules)) {
        const regular = tie.matches.filter((match) => match.part !== 'replay');
        const replay = tie.matches.find((match) => match.part === 'replay');
        const last = regular[regular.length - 1];
        const total = (id: string, withAet: boolean): number =>
          regular.reduce((sum, match) => sum + goalsOf(match, id, withAet), 0);
        const awayGoalsOf = (id: string): number =>
          regular
            .filter((match) => match.awayId === id)
            .reduce((sum, match) => sum + goalsOf(match, id, false), 0);
        const levelIn90 = total('high', false) === total('low', false);
        const levelOnAway =
          !rules.awayGoals || awayGoalsOf('high') === awayGoalsOf('low');

        // AET only on the last regular match, only with AET on, and only
        // after a tie that is level after the away goals.
        for (const match of regular.slice(0, -1)) expect(match.aet).toBeUndefined();
        expect(last.aet !== undefined).toBe(rules.playsAet && levelIn90 && levelOnAway);
        // The method decides which tiebreak can show.
        if (rules.method === 'penalties') expect(replay).toBeUndefined();
        if (rules.method === 'replay-coin-toss') expect(tie.penalties).toBeUndefined();

        switch (tie.decidedBy) {
          case 'regulation':
            expect(levelIn90).toBe(false);
            expect(total(tie.winnerId, false)).toBeGreaterThan(
              total(tie.loserId, false)
            );
            break;
          case 'away-goals':
            // Only the 90-minute goals count. AET goals never count.
            expect(rules.awayGoals).toBe(true);
            expect(levelIn90).toBe(true);
            expect(awayGoalsOf(tie.winnerId)).toBeGreaterThan(awayGoalsOf(tie.loserId));
            break;
          case 'aet':
            expect(levelIn90 && levelOnAway).toBe(true);
            expect(last.aet && !isLevel(last.aet)).toBe(true);
            expect(winnerOf(last, last.aet!)).toBe(tie.winnerId);
            break;
          case 'penalties':
            expect(levelIn90 && levelOnAway).toBe(true);
            if (last.aet) expect(isLevel(last.aet)).toBe(true);
            expect(tie.penalties && !isLevel(tie.penalties)).toBe(true);
            expect(winnerOf(last, tie.penalties!)).toBe(tie.winnerId);
            break;
          case 'replay': {
            expect(replay).toMatchObject({ homeId: 'high', awayId: 'low' });
            if (last.aet) expect(isLevel(last.aet)).toBe(true);
            expect(replay!.aet !== undefined).toBe(
              rules.playsAet && isLevel(replay!.score)
            );
            const high = goalsOf(replay!, 'high', true);
            const low = goalsOf(replay!, 'low', true);
            expect(high).not.toBe(low);
            expect(high > low ? 'high' : 'low').toBe(tie.winnerId);
            break;
          }
          case 'coin-toss':
            expect(rules.method).toBe('replay-coin-toss');
            expect(goalsOf(replay!, 'high', true)).toBe(goalsOf(replay!, 'low', true));
            expect(replay!.aet !== undefined).toBe(rules.playsAet);
            break;
        }
      }
    }
  );

  it.each([
    [
      rulesOf({ playsAet: true, method: 'penalties' }),
      ['regulation', 'aet', 'penalties'],
    ],
    [rulesOf({ playsAet: false, method: 'penalties' }), ['regulation', 'penalties']],
    [
      rulesOf({ playsAet: true, method: 'replay-coin-toss' }),
      ['regulation', 'aet', 'replay', 'coin-toss'],
    ],
    [
      rulesOf({ playsAet: false, method: 'replay-coin-toss' }),
      ['regulation', 'replay', 'coin-toss'],
    ],
    [
      rulesOf({ format: 'two-legged', awayGoals: true, playsAet: true }),
      ['regulation', 'away-goals', 'aet', 'penalties'],
    ],
  ] as const)('each path of the sequence happens: %j', (rules, decisions) => {
    const seen = new Set(playAll(rules).map((tie) => tie.decidedBy));
    expect([...seen].sort()).toEqual([...decisions].sort());
  });
});

describe('playTie: the tiebreak steps (US-03.1, US-03.2, US-03.3)', () => {
  it('the AET of a two-legged tie follows leg2, with its home boost and its elasticity (Task 80)', () => {
    const rules = rulesOf({
      format: 'two-legged',
      homeAdvantage: true,
      playsAet: true,
    });
    for (const [tie, seed] of tiesWhere(
      rules,
      (played) => played.matches[1].aet !== undefined
    )) {
      const rng = createSeededRng(seed);
      scorinatePeriod(
        applyHomeAdvantage(LOWER.ovr),
        HIGHER.ovr,
        rollElasticity(rng),
        1,
        rng
      );
      const elasticity = rollElasticity(rng);
      scorinatePeriod(applyHomeAdvantage(HIGHER.ovr), LOWER.ovr, elasticity, 1, rng);
      expect(tie.matches[1].aet).toEqual(
        scorinateExtraTime(applyHomeAdvantage(HIGHER.ovr), LOWER.ovr, elasticity, rng)
      );
    }
  });

  it('penalties use the stored OVRs, with no home boost (Task 80)', () => {
    const rules = rulesOf({
      format: 'two-legged',
      homeAdvantage: true,
      playsAet: false,
      method: 'penalties',
    });
    for (const [tie, seed] of tiesWhere(
      rules,
      (played) => played.decidedBy === 'penalties'
    )) {
      const rng = createSeededRng(seed);
      scorinatePeriod(
        applyHomeAdvantage(LOWER.ovr),
        HIGHER.ovr,
        rollElasticity(rng),
        1,
        rng
      );
      scorinatePeriod(
        applyHomeAdvantage(HIGHER.ovr),
        LOWER.ovr,
        rollElasticity(rng),
        1,
        rng
      );
      expect(tie.penalties).toEqual(scorinatePenalties(HIGHER.ovr, LOWER.ovr, rng));
    }
  });

  it('a replay is neutral, with a new elasticity roll, and its AET re-uses that roll', () => {
    const rules = rulesOf({ playsAet: true, method: 'replay-coin-toss' });
    const withReplayAet = (tie: TieResult<string>): boolean =>
      tie.matches.some((match) => match.part === 'replay' && match.aet !== undefined);
    for (const [tie, seed] of tiesWhere(rules, withReplayAet)) {
      const replay = tie.matches[1];
      const rng = createSeededRng(seed);
      const elasticity = rollElasticity(rng);
      scorinatePeriod(HIGHER.ovr, LOWER.ovr, elasticity, 1, rng);
      scorinateExtraTime(HIGHER.ovr, LOWER.ovr, elasticity, rng);
      const replayElasticity = rollElasticity(rng);
      expect(replay.score).toEqual(
        scorinatePeriod(HIGHER.ovr, LOWER.ovr, replayElasticity, 1, rng)
      );
      expect(replay.aet).toEqual(
        scorinateExtraTime(HIGHER.ovr, LOWER.ovr, replayElasticity, rng)
      );
    }
  });

  it('there is never a second replay', () => {
    for (const rules of ALL_RULES) {
      for (const tie of playAll(rules)) {
        expect(
          tie.matches.filter((match) => match.part === 'replay').length
        ).toBeLessThanOrEqual(1);
      }
    }
  });
});
