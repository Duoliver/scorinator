import {
  buildBracketTree,
  type BracketRules,
  type BracketTree,
} from '@/engine/bracket';
import { bracketRulesOf } from '@/engine/phases';
import type { BracketPhase, LeagueWrapper } from '@/domain';

function findBracket(
  wrapper: LeagueWrapper,
  phaseIndex: number
): { phase: BracketPhase; rules: BracketRules } {
  const { phases, plans, homeAdvantage } = wrapper.content;
  const phase = phases[phaseIndex];
  const plan = plans[phaseIndex];
  if (phase?.format !== 'bracket' || plan?.format !== 'bracket') {
    throw new RangeError(
      `Phase ${phaseIndex + 1} of the league is not a started bracket.`
    );
  }
  return { phase, rules: { ...bracketRulesOf(plan), homeAdvantage } };
}

/** The rules of a bracket phase: the plan rules, or the defaults, and the
 * league home advantage (Task 139 choice 2). Throws a `RangeError` for a
 * phase that is not a started bracket. */
export function bracketRulesFor(
  wrapper: LeagueWrapper,
  phaseIndex: number
): BracketRules {
  return findBracket(wrapper, phaseIndex).rules;
}

/** The tree of a bracket phase, made again from its seeds, its bye teams,
 * and the third-place setting (Task 139 choice 1). With too few bye teams,
 * it has the counts and no rounds (US-04.10). Throws a `RangeError` for a
 * phase that is not a started bracket. */
export function bracketTreeOf(
  wrapper: LeagueWrapper,
  phaseIndex: number
): BracketTree<string> {
  const { phase, rules } = findBracket(wrapper, phaseIndex);
  return buildBracketTree(
    phaseIndex + 1,
    phase.seeds,
    phase.byeTeams,
    rules.thirdPlace
  );
}

/** The stored OVR of each team of the league, by Blueprint UUID. */
export function leagueOvrOf(wrapper: LeagueWrapper): (uuid: string) => number {
  return (uuid) => {
    const team = wrapper.teams.find((candidate) => candidate.blueprintUuid === uuid);
    if (!team) throw new RangeError(`The league has no team with the UUID ${uuid}.`);
    return team.ovr;
  };
}

/** True when each tie of a bracket phase has a result: the final, and the
 * third-place tie when there is one (US-04.12). A bracket with missing byes
 * is not complete. */
export function isBracketPhaseComplete(
  wrapper: LeagueWrapper,
  phaseIndex: number
): boolean {
  const tree = bracketTreeOf(wrapper, phaseIndex);
  if (tree.status !== 'ready') return false;
  const { phase } = findBracket(wrapper, phaseIndex);
  return tree.rounds.every((round) =>
    round.ties.every(
      (tie) =>
        tie.slots[1].kind === 'bye' ||
        phase.results.some((result) => result.tieId === tie.id)
    )
  );
}
