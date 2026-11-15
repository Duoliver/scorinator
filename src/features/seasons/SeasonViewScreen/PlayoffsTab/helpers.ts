import {
  TieDecision,
  TieFormat,
  TieMatchPart,
  type TieMatch,
  type TieResult,
  type TieRules,
} from '@/engine/tiebreak';
import {
  FORMAT_LABELS,
  METHOD_LABELS,
} from '@/features/seasons/SeasonViewScreen/tieLabels';

/** The score of a played playoff, Team 1 first (Task 215 point 3). */
export interface PlayoffScore {
  /** The total of the legs. A replay is not part of it. */
  team1Goals: number;
  team2Goals: number;
  /** Each match in play order, "*" after extra time, then the decision, as
   * "1-0, 0-1* · Pens 4-3". Empty for a single match decided in 90 minutes. */
  detail: string;
  winnerId: string;
}

function goalsIn(match: TieMatch<string>, teamId: string): number {
  const side = match.homeId === teamId ? 'homeGoals' : 'awayGoals';
  return match.score[side] + (match.aet?.[side] ?? 0);
}

/** The tag of the decision. Penalties put Team 1 first. */
function findDecisionTag(
  result: TieResult<string>,
  team1: string,
  team2: string
): string | undefined {
  const last = result.matches[result.matches.length - 1];
  const { penalties } = result;
  if (result.decidedBy === TieDecision.PENALTIES && penalties && last) {
    const pens = (id: string): number =>
      last.homeId === id ? penalties.homeGoals : penalties.awayGoals;
    return `Pens ${pens(team1)}-${pens(team2)}`;
  }
  if (result.decidedBy === TieDecision.COIN_TOSS) return 'Coin toss';
  if (result.decidedBy === TieDecision.AWAY_GOALS) return 'Away goals';
  return undefined;
}

/**
 * The score of a played playoff, with the rules of the bracket .txt export
 * (`adapters/txt/resultsTxt.ts`), Team 1 first. The screen cannot import an
 * adapter, so the rules are here too (Task 220 choice 3).
 */
export function getPlayoffScore(
  result: TieResult<string>,
  team1: string,
  team2: string
): PlayoffScore {
  const legs = result.matches.filter((match) => match.part !== TieMatchPart.REPLAY);
  const total = (id: string): number =>
    legs.reduce((sum, leg) => sum + goalsIn(leg, id), 0);
  const scores = result.matches.map((match) => {
    const cell = `${goalsIn(match, team1)}-${goalsIn(match, team2)}`;
    return match.aet ? `${cell}*` : cell;
  });
  // One match with no extra time: the total already says it all.
  const showScores =
    scores.length > 1 || result.matches.some((match) => match.aet !== undefined);
  const tag = findDecisionTag(result, team1, team2);
  return {
    team1Goals: total(team1),
    team2Goals: total(team2),
    detail: [...(showScores ? [scores.join(', ')] : []), ...(tag ? [tag] : [])].join(
      ' · '
    ),
    winnerId: result.winnerId,
  };
}

/** True when a match of the result went to extra time, so the list needs
 * its "*" key (Task 220 choice 9). */
export function hasAetMatch(result: TieResult<string> | undefined): boolean {
  return result?.matches.some((match) => match.aet !== undefined) ?? false;
}

/** The rules of a playoff for its head: "Two-legged · Away goals rule ·
 * Plays AET · Penalties · Home adv. on" (Task 215 point 2). The labels are
 * those of the dialog. */
export function formatPlayoffRules(rules: TieRules): string {
  return [
    FORMAT_LABELS[rules.format],
    ...(rules.format === TieFormat.TWO_LEGGED && rules.awayGoals
      ? ['Away goals rule']
      : []),
    ...(rules.playsAet ? ['Plays AET'] : []),
    METHOD_LABELS[rules.method],
    `Home adv. ${rules.homeAdvantage ? 'on' : 'off'}`,
  ].join(' · ');
}

/** The status of a played playoff: a status, not an action (Task 215
 * round 3). */
export const PLAYED = '✓ Played';
