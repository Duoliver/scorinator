import { describe, expect, it } from 'vitest';
import { DEFAULT_BRACKET_RULES, type PhasePlan, type PlanZone } from '@/engine/phases';
import {
  DEFAULT_PHASE_PLANS,
  addPhase,
  canAddPhase,
  canMovePhase,
  describePhasePlan,
  formatKeyOf,
  movePhase,
  parseWholeNumber,
  removePhase,
  setBestOfNext,
  setBracketRules,
  setGroupBy,
  setGroupNumber,
  setPhaseFormat,
  setPhaseZones,
  setTop,
} from './phasePlans';

const rr2: PhasePlan = { format: 'round-robin', legs: 'two-way' };
const groups = (top?: number): PhasePlan => ({
  format: 'groups',
  legs: 'two-way',
  grouping: { by: 'size', size: 4 },
  ...(top === undefined ? {} : { advance: { top, bestOfNext: 0 } }),
});
const bracket: PhasePlan = { format: 'bracket' };

describe('the default plans (US-01.1)', () => {
  it('is one two-way round robin with no advancement', () => {
    expect(DEFAULT_PHASE_PLANS).toEqual([rr2]);
  });
});

describe('addPhase (choice 5)', () => {
  it('adds a two-way round robin at the end, and gives the phase before it Top 2', () => {
    expect(addPhase([rr2])).toEqual([{ ...rr2, advance: { top: 2 } }, rr2]);
    expect(addPhase([groups()])).toEqual([groups(2), rr2]);
  });

  it('keeps the advancement that a phase already has', () => {
    const plans = addPhase(addPhase([rr2]));
    expect(plans[0]).toEqual({ ...rr2, advance: { top: 2 } });
    expect(plans[1]).toEqual({ ...rr2, advance: { top: 2 } });
  });

  it('cannot add after a bracket (US-01.3)', () => {
    expect(canAddPhase([groups(2), bracket])).toBe(false);
    expect(canAddPhase([rr2])).toBe(true);
  });
});

describe('removePhase', () => {
  it('drops the advancement of the phase that becomes the last', () => {
    expect(removePhase([groups(2), rr2], 1)).toEqual([groups()]);
  });

  it('can leave a bracket as the only phase', () => {
    expect(removePhase([groups(2), bracket], 0)).toEqual([bracket]);
  });
});

describe('movePhase and canMovePhase', () => {
  it('swaps two phases, and fixes the advancement of the new last phase', () => {
    expect(movePhase([groups(2), rr2], 0, 1)).toEqual([
      { ...rr2, advance: { top: 2 } },
      groups(),
    ]);
  });

  it('cannot move past the ends', () => {
    expect(canMovePhase([groups(2), rr2], 0, -1)).toBe(false);
    expect(canMovePhase([groups(2), rr2], 1, 1)).toBe(false);
    expect(canMovePhase([groups(2), rr2], 0, 1)).toBe(true);
  });

  it('cannot put a bracket before another phase (US-01.3)', () => {
    expect(canMovePhase([groups(2), bracket], 1, -1)).toBe(false);
    expect(canMovePhase([groups(2), bracket], 0, 1)).toBe(false);
  });
});

describe('setPhaseFormat', () => {
  it('gives a Groups phase size 4, and keeps the top N', () => {
    const plans = setPhaseFormat([{ ...rr2, advance: { top: 3 } }, rr2], 0, 'grp1');
    expect(plans[0]).toEqual({
      format: 'groups',
      legs: 'single-duels',
      grouping: { by: 'size', size: 4 },
      advance: { top: 3, bestOfNext: 0 },
    });
  });

  it('gives a round robin from Groups the same top N, with no best M', () => {
    const plans = setPhaseFormat([groups(2), rr2], 0, 'rr1');
    expect(plans[0]).toEqual({
      format: 'round-robin',
      legs: 'single-duels',
      advance: { top: 2 },
    });
  });

  it('gives a bracket no advancement', () => {
    expect(setPhaseFormat([rr2], 0, 'bracket')).toEqual([bracket]);
  });

  it('keeps the group setting when only the legs change', () => {
    const plans = setGroupNumber([groups()], 0, 6);
    expect(setPhaseFormat(plans, 0, 'grp1')[0]).toMatchObject({
      grouping: { by: 'size', size: 6 },
    });
  });
});

describe('the field edits', () => {
  it('sets the group number in the current mode', () => {
    expect(setGroupNumber([groups()], 0, 5)[0]).toMatchObject({
      grouping: { by: 'size', size: 5 },
    });
  });

  it('switches Set by, with the default number of the mode: size 4, count 2', () => {
    const byCount = setGroupBy([groups()], 0, 'count');
    expect(byCount[0]).toMatchObject({ grouping: { by: 'count', count: 2 } });
    expect(setGroupBy(byCount, 0, 'size')[0]).toMatchObject({
      grouping: { by: 'size', size: 4 },
    });
  });

  it('sets the top N and the best M', () => {
    const plans = setBestOfNext(setTop([groups(2), rr2], 0, 1), 0, 2);
    expect(plans[0]).toMatchObject({ advance: { top: 1, bestOfNext: 2 } });
    expect(setTop([{ ...rr2, advance: { top: 2 } }, rr2], 0, 5)[0]).toEqual({
      ...rr2,
      advance: { top: 5 },
    });
  });
});

describe('parseWholeNumber (choice 4)', () => {
  it('reads a whole number, and gives NaN for anything else', () => {
    expect(parseWholeNumber('12')).toBe(12);
    expect(parseWholeNumber(' 3 ')).toBe(3);
    for (const text of ['', '2.5', '-1', 'x', '1e2']) {
      expect(parseWholeNumber(text)).toBeNaN();
    }
  });
});

describe('the format keys and the text', () => {
  it('maps each plan to its format key', () => {
    expect(formatKeyOf(rr2)).toBe('rr2');
    expect(formatKeyOf({ format: 'round-robin', legs: 'single-duels' })).toBe('rr1');
    expect(formatKeyOf(groups())).toBe('grp2');
    expect(formatKeyOf(bracket)).toBe('bracket');
  });

  it('describes a phase for the Review step', () => {
    expect(describePhasePlan(groups(2))).toBe(
      'Groups round robin (two-way) · size 4 · Top 2 advance per group'
    );
    expect(
      describePhasePlan({
        format: 'groups',
        legs: 'single-duels',
        grouping: { by: 'count', count: 6 },
        advance: { top: 2, bestOfNext: 4 },
      })
    ).toBe(
      'Groups round robin (single duels) · 6 groups · Top 2 advance per group · best 4 of place 3'
    );
    expect(describePhasePlan({ ...rr2, advance: { top: 4 } })).toBe(
      'Round robin (two-way) · Top 4 advance'
    );
    expect(describePhasePlan(bracket)).toBe(
      'Bracket · Single match · AET on · Penalties'
    );
  });
});

describe('the bracket settings (Task 140)', () => {
  const plans: PhasePlan[] = [rr2, { format: 'bracket' }];

  it('a change writes the full rules: the defaults plus the change (choice 2)', () => {
    const [, bracket] = setBracketRules(plans, 1, { format: 'two-legged' });
    expect(bracket).toEqual({
      format: 'bracket',
      rules: { ...DEFAULT_BRACKET_RULES, format: 'two-legged' },
    });
  });

  it('a later change keeps the earlier one', () => {
    const once = setBracketRules(plans, 1, { format: 'two-legged' });
    const [, bracket] = setBracketRules(once, 1, { awayGoals: true });
    expect(bracket).toEqual({
      format: 'bracket',
      rules: { ...DEFAULT_BRACKET_RULES, format: 'two-legged', awayGoals: true },
    });
  });

  it('a switch to Single match keeps the hidden values (choice 3)', () => {
    const two = setBracketRules(plans, 1, { format: 'two-legged', awayGoals: true });
    const [, bracket] = setBracketRules(two, 1, { format: 'single-match' });
    expect(bracket.format === 'bracket' && bracket.rules?.awayGoals).toBe(true);
  });

  it('changes nothing for a round-robin or Groups plan', () => {
    expect(setBracketRules(plans, 0, { playsAet: false })).toEqual(plans);
  });

  it('does not change its input', () => {
    const input = structuredClone(plans);
    setBracketRules(input, 1, { thirdPlace: true });
    expect(input).toEqual(plans);
  });
});

describe('describePhasePlan for a bracket (Task 140 choice 6)', () => {
  const bracket = (rules: Partial<typeof DEFAULT_BRACKET_RULES> = {}): PhasePlan => ({
    format: 'bracket',
    rules: { ...DEFAULT_BRACKET_RULES, ...rules },
  });

  it('a plan with no rules shows the defaults', () => {
    expect(describePhasePlan({ format: 'bracket' })).toBe(
      'Bracket · Single match · AET on · Penalties'
    );
  });

  it('single match: no away goals and no single-match final, even when set', () => {
    expect(
      describePhasePlan(
        bracket({
          playsAet: false,
          method: 'replay-coin-toss',
          awayGoals: true,
          singleMatchFinal: true,
        })
      )
    ).toBe('Bracket · Single match · AET off · Replay→Coin toss');
  });

  it('two legs: away goals, then the single-match final', () => {
    expect(
      describePhasePlan(bracket({ format: 'two-legged', singleMatchFinal: true }))
    ).toBe(
      'Bracket · Two-legged · away goals off · AET on · Penalties · Single-match final'
    );
    expect(describePhasePlan(bracket({ format: 'two-legged', awayGoals: true }))).toBe(
      'Bracket · Two-legged · away goals on · AET on · Penalties'
    );
  });

  it('adds the third place when it is on, and the bracket can have one', () => {
    expect(describePhasePlan(bracket({ thirdPlace: true }))).toBe(
      'Bracket · Single match · AET on · Penalties · Third place'
    );
    expect(describePhasePlan(bracket({ thirdPlace: true }), 4)).toBe(
      'Bracket · Single match · AET on · Penalties · Third place'
    );
    expect(describePhasePlan(bracket({ thirdPlace: true }), 3)).toBe(
      'Bracket · Single match · AET on · Penalties'
    );
  });
});

describe('the zones of a plan (Task 189, US-12.5)', () => {
  const RED = { colour: 'red' as const, places: { from: 4, to: 4 }, label: 'Out' };
  const FREE_GREEN = {
    colour: 'green' as const,
    places: { from: 1, to: 1 },
    label: '',
  };
  /** A Groups phase 1 with top 2 and no best M, with these zones. */
  const zonedGroups = (zones: PlanZone[]): PhasePlan => ({
    format: 'groups',
    legs: 'two-way',
    grouping: { by: 'size', size: 4 },
    advance: { top: 2, bestOfNext: 0 },
    zones,
  });
  const zonesOf = (plan: PhasePlan | undefined): unknown =>
    plan && plan.format !== 'bracket' ? plan.zones : undefined;

  it('sets the zones of one phase', () => {
    expect(zonesOf(setPhaseZones([rr2], 0, [RED])[0])).toEqual([RED]);
  });

  it('keeps blue and red on a format change, and a Bracket drops all zones (choice 4)', () => {
    const plans: PhasePlan[] = [zonedGroups([RED]), rr2];
    expect(zonesOf(setPhaseFormat(plans, 0, 'rr1')[0])).toEqual([RED]);
    const last: PhasePlan[] = [groups(2), { ...rr2, zones: [RED] }];
    expect(setPhaseFormat(last, 1, 'bracket')[1]).toEqual(bracket);
  });

  it('drops a free green zone when a move makes its phase not the last', () => {
    const plans: PhasePlan[] = [groups(2), { ...rr2, zones: [FREE_GREEN, RED] }];
    const moved = movePhase(plans, 1, -1);
    expect(zonesOf(moved[0])).toEqual([RED]);
  });

  it('drops the automatic label when a removal makes the phase the last', () => {
    const plans: PhasePlan[] = [
      zonedGroups([{ colour: 'green', label: 'Knockout' }]),
      rr2,
    ];
    expect(zonesOf(removePhase(plans, 1)[0])).toEqual([]);
  });

  it('drops a free yellow zone when a best M makes yellow automatic', () => {
    const yellow = { colour: 'yellow' as const, places: { from: 3, to: 3 }, label: '' };
    const plans: PhasePlan[] = [zonedGroups([yellow]), rr2];
    expect(zonesOf(setBestOfNext(plans, 0, 1)[0])).toEqual([]);
    expect(zonesOf(setBestOfNext(plans, 0, 0)[0])).toEqual([yellow]);
  });
});
