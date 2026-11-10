import type { BracketPlanRules } from '@/engine/bracket';
import type { BracketPlan } from './types';
import { TieFormat, TiebreakMethod } from '@/engine/tiebreak';

/** The bracket settings of a plan with none: the defaults of the stories.
 * Single match (US-04.1), away goals off (US-04.3), AET on (US-03.1),
 * penalties (US-03.2), single-match final off (US-04.13), third place off
 * (US-04.12). */
export const DEFAULT_BRACKET_RULES: Readonly<BracketPlanRules> = {
  format: TieFormat.SINGLE_MATCH,
  awayGoals: false,
  playsAet: true,
  method: TiebreakMethod.PENALTIES,
  singleMatchFinal: false,
  thirdPlace: false,
};

/** The bracket settings of a plan: its own `rules`, or the defaults. */
export function bracketRulesOf(plan: BracketPlan): BracketPlanRules {
  return { ...(plan.rules ?? DEFAULT_BRACKET_RULES) };
}
