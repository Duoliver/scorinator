import { describe, expect, it } from 'vitest';
import type { PhasePlan } from '@/engine/phases';
import {
  bestMSuggestion,
  bracketQualifiers,
  bracketWarning,
  endsWithGroups,
  phaseChecks,
  phaseCountLines,
  phaseProblemText,
} from './phaseChecks';

const rr = (top?: number): PhasePlan => ({
  format: 'round-robin',
  legs: 'two-way',
  ...(top === undefined ? {} : { advance: { top } }),
});
const groups = (
  grouping: { by: 'size'; size: number } | { by: 'count'; count: number },
  top?: number,
  bestOfNext = 0
): PhasePlan => ({
  format: 'groups',
  legs: 'two-way',
  grouping,
  ...(top === undefined ? {} : { advance: { top, bestOfNext } }),
});
const bracket: PhasePlan = { format: 'bracket' };

describe('phaseChecks (choice 3)', () => {
  it('gives no counts and only chain problems with fewer than 2 teams', () => {
    expect(phaseChecks([rr(4), rr()], 1)).toEqual({ counts: undefined, problems: [] });
    expect(phaseChecks([bracket, rr()], 0).problems).toEqual([
      { code: 'bracket-not-last', phase: 1 },
    ]);
  });

  it('gives the counts and the fit problems with 2 teams or more', () => {
    const checks = phaseChecks([rr(4), rr()], 4);
    expect(checks.counts).toEqual([{ teams: 4 }, { teams: 4 }]);
    expect(checks.problems).toEqual([
      { code: 'top-out-of-range', phase: 1, top: 4, max: 3 },
    ]);
  });
});

describe('phaseProblemText (choice 2)', () => {
  const plans = [groups({ by: 'size', size: 4 }, 2), rr()];

  it('gives the agreed texts', () => {
    expect(phaseProblemText({ code: 'too-few-teams', phase: 2, teams: 1 }, plans)).toBe(
      'Phase 2 gets 1 team. A phase needs at least 2 teams.'
    );
    expect(phaseProblemText({ code: 'too-few-teams', phase: 1, teams: 0 }, plans)).toBe(
      'Phase 1 gets 0 teams. A phase needs at least 2 teams.'
    );
    expect(phaseProblemText({ code: 'grouping-out-of-range', phase: 1 }, plans)).toBe(
      'Phase 1: the group size must be a whole number of 2 or more.'
    );
    expect(
      phaseProblemText({ code: 'grouping-out-of-range', phase: 1 }, [
        groups({ by: 'count', count: 1 }),
      ])
    ).toBe('Phase 1: the group count must be a whole number of 2 or more.');
    expect(
      phaseProblemText({ code: 'group-too-small', phase: 1, group: 2, teams: 1 }, plans)
    ).toBe('Phase 1: group B has 1 team. A group needs at least 2 teams.');
    expect(
      phaseProblemText({ code: 'top-out-of-range', phase: 1, top: 5, max: 3 }, plans)
    ).toBe('Phase 1: Top must be a whole number from 1 to 3.');
    expect(
      phaseProblemText(
        { code: 'best-m-out-of-range', phase: 1, bestOfNext: 9, max: 5 },
        plans
      )
    ).toBe('Phase 1: Best of place 3 must be a whole number from 0 to 5.');
    expect(
      phaseProblemText({ code: 'best-m-place-missing', phase: 1, place: 3 }, plans)
    ).toBe('Phase 1: the smallest group has no place 3.');
    expect(phaseProblemText({ code: 'bracket-not-last', phase: 1 }, plans)).toBe(
      'Phase 1 is a bracket. A bracket must be the last phase.'
    );
  });

  it('says that no Top fits when the max is below 1', () => {
    expect(
      phaseProblemText({ code: 'top-out-of-range', phase: 1, top: 1, max: 0 }, plans)
    ).toBe('No Top fits phase 1. Each group needs more teams.');
    expect(
      phaseProblemText({ code: 'top-out-of-range', phase: 1, top: 1, max: 0 }, [
        rr(1),
        rr(),
      ])
    ).toBe('No Top fits phase 1. The phase needs more teams.');
  });

  it('gives plain texts for the codes that the wizard does not make', () => {
    expect(phaseProblemText({ code: 'missing-advancement', phase: 1 }, plans)).toBe(
      'Phase 1 has no Top.'
    );
    expect(phaseProblemText({ code: 'advancement-on-last', phase: 2 }, plans)).toBe(
      'Phase 2 is the last phase, but it has a Top.'
    );
    expect(phaseProblemText({ code: 'no-phases' }, plans)).toBe('Add a phase.');
  });
});

describe('phaseCountLines', () => {
  it('gives the sizes and the qualifiers of a Groups phase', () => {
    const plans = [groups({ by: 'size', size: 4 }, 2), bracket];
    const { counts } = phaseChecks(plans, 18);
    expect(phaseCountLines(plans, counts, 0)).toEqual({
      sizes: '5 groups: 4, 4, 4, 3, 3',
      qualifiers: '5 groups × top 2 = 10 teams go to phase 2',
    });
  });

  it('adds the best M to the qualifiers line', () => {
    const plans = [groups({ by: 'count', count: 6 }, 2, 4), bracket];
    const { counts } = phaseChecks(plans, 24);
    expect(phaseCountLines(plans, counts, 0).qualifiers).toBe(
      '6 groups × top 2 + best 4 of place 3 = 16 teams go to phase 2'
    );
  });

  it('gives the qualifiers of a round robin, and one group in the singular', () => {
    const plans = [rr(4), groups({ by: 'size', size: 4 })];
    const { counts } = phaseChecks(plans, 8);
    expect(phaseCountLines(plans, counts, 0)).toEqual({
      qualifiers: 'Top 4 = 4 teams go to phase 2',
    });
    expect(phaseCountLines(plans, counts, 1)).toEqual({ sizes: '1 group: 4' });
  });

  it('gives no lines without counts, or past the end of the counts', () => {
    const plans = [rr(Number.NaN), bracket];
    expect(phaseCountLines(plans, undefined, 0)).toEqual({});
    const { counts } = phaseChecks(plans, 8);
    expect(phaseCountLines(plans, counts, 0)).toEqual({});
    expect(phaseCountLines(plans, counts, 1)).toEqual({});
  });
});

describe('bestMSuggestion (US-01.6)', () => {
  it('suggests the M that makes a power of 2 when the next phase is a bracket', () => {
    const plans = [groups({ by: 'count', count: 6 }, 2), bracket];
    const { counts } = phaseChecks(plans, 24);
    expect(bestMSuggestion(plans, counts, 0)).toEqual({
      m: 4,
      text: '6 groups × top 2 = 12. Best 4 of place 3 give 16.',
    });
  });

  it('gives none when the next phase is not a bracket, the M is already set, or no M fits', () => {
    const notBracket = [groups({ by: 'count', count: 6 }, 2), rr()];
    expect(
      bestMSuggestion(notBracket, phaseChecks(notBracket, 24).counts, 0)
    ).toBeUndefined();
    const alreadySet = [groups({ by: 'count', count: 6 }, 2, 4), bracket];
    expect(
      bestMSuggestion(alreadySet, phaseChecks(alreadySet, 24).counts, 0)
    ).toBeUndefined();
    const powerOfTwo = [groups({ by: 'count', count: 4 }, 2), bracket];
    expect(
      bestMSuggestion(powerOfTwo, phaseChecks(powerOfTwo, 16).counts, 0)
    ).toBeUndefined();
    expect(bestMSuggestion(powerOfTwo, undefined, 0)).toBeUndefined();
  });
});

describe('endsWithGroups (US-01.5)', () => {
  it('is true when the last phase is Groups, also for one phase', () => {
    expect(endsWithGroups([groups({ by: 'size', size: 4 })])).toBe(true);
    expect(endsWithGroups([rr(2), groups({ by: 'size', size: 4 })])).toBe(true);
    expect(endsWithGroups([groups({ by: 'size', size: 4 }, 2), bracket])).toBe(false);
  });
});

describe('the power-of-2 warning (US-04.9, Task 140)', () => {
  it('gives the slots and the byes for a count that is not a power of 2', () => {
    expect(bracketWarning(6)).toBe(
      '6 qualifiers: the bracket has 8 slots, so 2 teams get a bye.'
    );
    expect(bracketWarning(7)).toBe(
      '7 qualifiers: the bracket has 8 slots, so 1 team gets a bye.'
    );
    expect(bracketWarning(3)).toBe(
      '3 qualifiers: the bracket has 4 slots, so 1 team gets a bye.'
    );
  });

  it('gives nothing for a power of 2, or fewer than 2', () => {
    for (const count of [0, 1, 2, 4, 8, 16])
      expect(bracketWarning(count)).toBeUndefined();
  });

  it('bracketQualifiers gives the team count of the bracket phase, when known', () => {
    const plans: PhasePlan[] = [rr(6), { format: 'bracket' }];
    expect(bracketQualifiers(plans, phaseChecks(plans, 10).counts)).toBe(6);
    expect(bracketQualifiers(plans, undefined)).toBeUndefined();
    expect(bracketQualifiers([rr()], phaseChecks([rr()], 10).counts)).toBeUndefined();
    expect(
      bracketQualifiers(
        [{ format: 'bracket' }],
        phaseChecks([{ format: 'bracket' }], 5).counts
      )
    ).toBe(5);
  });
});
