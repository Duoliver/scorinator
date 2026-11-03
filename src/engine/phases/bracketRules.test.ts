import { describe, expect, it } from 'vitest';
import { DEFAULT_BRACKET_RULES, bracketRulesOf } from './index';

describe('bracketRulesOf (Task 139 choice 2)', () => {
  it('gives the story defaults for a plan with no rules', () => {
    expect(bracketRulesOf({ format: 'bracket' })).toEqual(DEFAULT_BRACKET_RULES);
  });

  it('the defaults: single match, away goals off, AET on, penalties, both toggles off', () => {
    expect(DEFAULT_BRACKET_RULES).toEqual({
      format: 'single-match',
      awayGoals: false,
      playsAet: true,
      method: 'penalties',
      singleMatchFinal: false,
      thirdPlace: false,
    });
  });

  it('gives the rules of the plan when it has them', () => {
    const rules = {
      ...DEFAULT_BRACKET_RULES,
      format: 'two-legged' as const,
      thirdPlace: true,
    };
    expect(bracketRulesOf({ format: 'bracket', rules })).toEqual(rules);
  });
});
