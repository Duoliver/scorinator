import {
  rulesForTie,
  THIRD_PLACE_NAME,
  type BracketRules,
  type BracketTie,
  type BracketTieResult,
  type TieSide,
} from '@/engine/bracket';
import type { TieMatch } from '@/engine/tiebreak';
import type { PhasePlan } from '@/engine/phases';
import type { TeamDisplay } from '@/features/components';
import { phaseShortName } from '@/features/leagues/leagueSummary';
import type { TieCardModel, TieCardRow } from './types';

/** The grey swatch of a TBD slot, as in the handoff (US-04.7). */
export const TBD_COLOUR = '#B0B0B0';

/** The labels of the score columns (Task 141 choice 3). */
const PART_LABELS: Record<TieMatch<string>['part'], string> = {
  leg1: 'L1',
  leg2: 'L2',
  replay: 'Rep',
};

/** The tiebreak text of the header line (Task 141 choice 7): the US-03.2
 * sequence of a level tie. */
export function describeMethod(rules: BracketRules): string {
  const steps = rules.method === 'penalties' ? ['Penalties'] : ['Replay', 'Coin toss'];
  return (rules.playsAet ? ['AET', ...steps] : steps).join(' → ');
}

/**
 * The header line of the Bracket view (US-04.2, Task 141 choice 8): how
 * the bracket is seeded, the tie format, the tiebreak, and the AET
 * footnote when AET is on.
 */
export function describeBracketHeader(
  plans: readonly PhasePlan[],
  phaseIndex: number,
  rules: BracketRules
): string {
  const before = plans[phaseIndex - 1];
  const parts = [
    before
      ? `Seeded by ${phaseShortName(before)} final standing`
      : 'Seeded by random draw',
  ];
  const twoLegged = rules.format === 'two-legged';
  if (twoLegged) {
    parts.push(
      `All ties two-legged (aggregate, home & away), away goals ${rules.awayGoals ? 'on' : 'off'}`
    );
    if (rules.singleMatchFinal) parts.push('single-match final');
  } else {
    parts.push('All ties single match');
  }
  parts.push(describeMethod(rules));
  if (rules.playsAet) parts.push(`* ${twoLegged ? 'leg score' : 'score'} includes AET`);
  return parts.join(' · ');
}

// The goals of one team in one match, AET goals included.
function goalsIn(match: TieMatch<string>, teamId: string): number {
  const side = match.homeId === teamId ? 'homeGoals' : 'awayGoals';
  return match.score[side] + (match.aet?.[side] ?? 0);
}

// The score cell of one team: its goals, and a "*" for a match with AET.
function scoreCell(match: TieMatch<string>, teamId: string): string {
  const goals = String(goalsIn(match, teamId));
  return match.aet ? `${goals}*` : goals;
}

// The footer of a played tie: the aggregate of two legs, then the tag of
// the decision. The penalties put the top row first (Task 141 choice 6).
function describeFooter(
  result: BracketTieResult<string>,
  topId: string,
  bottomId: string
): string {
  const parts: string[] = [];
  const legs = result.matches.filter((match) => match.part !== 'replay');
  if (legs.length === 2) {
    const total = (id: string): number =>
      legs.reduce((sum, leg) => sum + goalsIn(leg, id), 0);
    parts.push(`Agg ${total(topId)}–${total(bottomId)}`);
  }
  const last = result.matches[result.matches.length - 1];
  const { penalties } = result;
  if (result.decidedBy === 'penalties' && penalties && last) {
    const pens = (id: string): number =>
      last.homeId === id ? penalties.homeGoals : penalties.awayGoals;
    parts.push(`Pens ${pens(topId)}-${pens(bottomId)}`);
  }
  if (result.decidedBy === 'coin-toss') parts.push('Coin toss');
  if (result.decidedBy === 'away-goals') parts.push('Away goals');
  return parts.join(' · ');
}

function buildRow(
  side: TieSide<string>,
  index: number,
  lookup: (uuid: string) => TeamDisplay,
  result: BracketTieResult<string> | undefined,
  columnCount: number
): TieCardRow {
  if (side.kind !== 'team') {
    return {
      key: `${side.kind}-${index}`,
      name: side.kind === 'bye' ? 'BYE' : 'TBD',
      colour: TBD_COLOUR,
      isTbd: side.kind === 'tbd',
      isWinner: false,
      scores: Array.from({ length: columnCount }, () => ''),
    };
  }
  const team = lookup(side.teamId);
  return {
    key: side.teamId,
    name: team.name,
    colour: team.colour,
    isTbd: false,
    isWinner: result?.winnerId === side.teamId,
    scores: result
      ? result.matches.map((match) => scoreCell(match, side.teamId))
      : Array.from({ length: columnCount }, () => ''),
  };
}

/**
 * What one tie card shows (US-04.8): two team rows with a score column for
 * each match, the score header, the footer, and whether "Scorinate" is on.
 * Before the play, the columns follow the tie format of this tie
 * (`rulesForTie`). "Scorinate" is on for a playable tie and for a tie with
 * a result (a re-scorinate), and off for a bye or a TBD team (US-04.5).
 */
export function buildTieCard(
  tie: BracketTie<string>,
  sides: [TieSide<string>, TieSide<string>],
  result: BracketTieResult<string> | undefined,
  rules: BracketRules,
  lookup: (uuid: string) => TeamDisplay,
  playable: boolean
): TieCardModel {
  const isBye = sides[1].kind === 'bye';
  const parts: TieMatch<string>['part'][] = result
    ? result.matches.map((match) => match.part)
    : rulesForTie(tie, rules).format === 'two-legged'
      ? ['leg1', 'leg2']
      : ['leg1'];
  const rows: [TieCardRow, TieCardRow] = [
    buildRow(sides[0], 0, lookup, result, parts.length),
    buildRow(sides[1], 1, lookup, result, parts.length),
  ];
  return {
    id: tie.id,
    title: tie.kind === 'third' ? THIRD_PLACE_NAME : undefined,
    isBye,
    rows,
    columns: parts.length > 1 ? parts.map((part) => PART_LABELS[part]) : [],
    footer: result ? describeFooter(result, rows[0].key, rows[1].key) : 'Not played',
    hasResult: result !== undefined,
    canScorinate: !isBye && (playable || result !== undefined),
  };
}
