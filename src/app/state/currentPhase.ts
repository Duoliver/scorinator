import type { LeagueWrapper, Phase } from '@/domain';

/** The phase a league plays now. In M1 it is the last phase of the league.
 * Task 128 changes this rule, when phases start one by one, so the rule
 * lives in this one place. `undefined` for a league with no phase. */
export function findCurrentPhase(wrapper: LeagueWrapper): Phase | undefined {
  const { phases } = wrapper.content;
  return phases[phases.length - 1];
}
