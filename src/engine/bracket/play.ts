import type { Rng } from '@/engine/rng';
import { playTie, type TieRules } from '@/engine/tiebreak';
import type {
  BracketRound,
  BracketRules,
  BracketSlot,
  BracketTie,
  BracketTieResult,
  TieSide,
} from './types';

type Rounds<TeamId> = readonly BracketRound<TeamId>[];
type Results<TeamId> = readonly BracketTieResult<TeamId>[];

function listTies<TeamId>(rounds: Rounds<TeamId>): BracketTie<TeamId>[] {
  return rounds.flatMap((round) => round.ties);
}

function findTie<TeamId>(rounds: Rounds<TeamId>, tieId: string): BracketTie<TeamId> {
  const tie = listTies(rounds).find((candidate) => candidate.id === tieId);
  if (!tie) throw new RangeError(`The bracket has no tie "${tieId}".`);
  return tie;
}

function findResult<TeamId>(
  results: Results<TeamId>,
  tieId: string
): BracketTieResult<TeamId> | undefined {
  return results.find((result) => result.tieId === tieId);
}

function isByeTie<TeamId>(tie: BracketTie<TeamId>): boolean {
  return tie.slots[1].kind === 'bye';
}

// A team keeps its first-round seed in each later round (Task 79).
function findSeed<TeamId>(rounds: Rounds<TeamId>, teamId: TeamId): number {
  for (const slot of rounds[0].ties.flatMap((tie) => tie.slots)) {
    if (slot.kind === 'team' && slot.teamId === teamId) return slot.seed;
  }
  throw new RangeError('The result names a team that is not in the bracket.');
}

function readSlot<TeamId>(
  rounds: Rounds<TeamId>,
  results: Results<TeamId>,
  slot: BracketSlot<TeamId>
): TieSide<TeamId> {
  if (slot.kind === 'team' || slot.kind === 'bye') return slot;
  const result = findResult(results, slot.tieId);
  if (!result) return { kind: 'tbd' };
  const teamId = slot.kind === 'winner-of' ? result.winnerId : result.loserId;
  return { kind: 'team', teamId, seed: findSeed(rounds, teamId) };
}

/**
 * The two sides of a tie, given the results (US-04.7): a known team with its
 * first-round seed, a bye, or TBD while the tie it waits for has no result.
 *
 * Throws a `RangeError` for a tie id that is not in the tree.
 */
export function findTieTeams<TeamId>(
  rounds: Rounds<TeamId>,
  results: Results<TeamId>,
  tieId: string
): [TieSide<TeamId>, TieSide<TeamId>] {
  const [top, bottom] = findTie(rounds, tieId).slots;
  return [readSlot(rounds, results, top), readSlot(rounds, results, bottom)];
}

function isPlayable<TeamId>(
  rounds: Rounds<TeamId>,
  results: Results<TeamId>,
  tie: BracketTie<TeamId>
): boolean {
  if (isByeTie(tie) || findResult(results, tie.id)) return false;
  return findTieTeams(rounds, results, tie.id).every((side) => side.kind === 'team');
}

/**
 * The ids of the playable ties, in tree order (US-04.5): both teams known,
 * not a bye, and no result. In the last round, the third-place tie comes
 * before the final (Task 137 choice 2).
 */
export function findPlayableTies<TeamId>(
  rounds: Rounds<TeamId>,
  results: Results<TeamId>
): string[] {
  return listTies(rounds)
    .filter((tie) => isPlayable(rounds, results, tie))
    .map((tie) => tie.id);
}

/**
 * The ids of every later tie that takes a team from the tie, as its winner
 * or its loser, and their own dependents, in tree order (US-04.6).
 */
export function findDependentTies<TeamId>(
  rounds: Rounds<TeamId>,
  tieId: string
): string[] {
  const dependents = new Set<string>();
  const sources = new Set([tieId]);
  for (const tie of listTies(rounds).sort((a, b) => a.round - b.round)) {
    const takesFrom = tie.slots.some(
      (slot) =>
        (slot.kind === 'winner-of' || slot.kind === 'loser-of') &&
        sources.has(slot.tieId)
    );
    if (takesFrom) {
      dependents.add(tie.id);
      sources.add(tie.id);
    }
  }
  return listTies(rounds)
    .filter((tie) => dependents.has(tie.id))
    .map((tie) => tie.id);
}

/** Says if a dependent tie has a result, so the screen opens the confirm
 * before a re-scorinate (US-04.6). */
export function hasDependentResults<TeamId>(
  rounds: Rounds<TeamId>,
  results: Results<TeamId>,
  tieId: string
): boolean {
  return findDependentTies(rounds, tieId).some((id) => findResult(results, id));
}

/** The rules of one tie. With the single-match final on, the final and the
 * third-place tie are one neutral match, with no away goals (US-04.13). The
 * tie card reads it for its score columns (Task 141). */
export function rulesForTie<TeamId>(
  tie: BracketTie<TeamId>,
  rules: BracketRules
): TieRules {
  const { format, awayGoals, playsAet, method, homeAdvantage } = rules;
  if (tie.kind !== 'regular' && rules.singleMatchFinal) {
    return {
      format: 'single-match',
      awayGoals: false,
      playsAet,
      method,
      homeAdvantage,
    };
  }
  return { format, awayGoals, playsAet, method, homeAdvantage };
}

/**
 * Plays one tie with `playTie` (US-04.5), and gives the new results list.
 * The higher seed of the two teams plays as the higher seed. For a
 * re-scorinate, the dependent ties lose their whole result first (US-04.7),
 * then the new result replaces the old one. The other results stay. The
 * input list does not change.
 *
 * Throws a `RangeError` for a bye tie, a tie with a TBD team, or a tie id
 * that is not in the tree.
 */
export function playBracketTie<TeamId>(
  rounds: Rounds<TeamId>,
  results: Results<TeamId>,
  tieId: string,
  rules: BracketRules,
  ovrOf: (teamId: TeamId) => number,
  rng: Rng
): BracketTieResult<TeamId>[] {
  const tie = findTie(rounds, tieId);
  if (isByeTie(tie))
    throw new RangeError(`The tie "${tieId}" is a bye. It has no match.`);
  const sides = findTieTeams(rounds, results, tieId);
  const teams = sides.flatMap((side) => (side.kind === 'team' ? [side] : []));
  if (teams.length !== 2) {
    throw new RangeError(`The tie "${tieId}" has a TBD team. It cannot play yet.`);
  }
  const [higher, lower] = teams.sort((a, b) => a.seed - b.seed);
  const played = playTie(
    { id: higher.teamId, ovr: ovrOf(higher.teamId) },
    { id: lower.teamId, ovr: ovrOf(lower.teamId) },
    rulesForTie(tie, rules),
    rng
  );
  const cleared = new Set([tieId, ...findDependentTies(rounds, tieId)]);
  return [
    ...results.filter((result) => !cleared.has(result.tieId)),
    { tieId, ...played },
  ];
}

/**
 * Plays every playable tie, in tree order, and only those (US-04.5). A tie
 * that becomes playable from this call waits for the next call, so one
 * call plays one round when the user plays round by round.
 */
export function playBracketRound<TeamId>(
  rounds: Rounds<TeamId>,
  results: Results<TeamId>,
  rules: BracketRules,
  ovrOf: (teamId: TeamId) => number,
  rng: Rng
): BracketTieResult<TeamId>[] {
  let next = results.slice();
  for (const tieId of findPlayableTies(rounds, results)) {
    next = playBracketTie(rounds, next, tieId, rules, ovrOf, rng);
  }
  return next;
}

/**
 * The earliest round with a tie that has no result (US-04.14), for the
 * badge and the header. A bye tie never counts. Gives `undefined` when the
 * phase is complete.
 */
export function findCurrentRound<TeamId>(
  rounds: Rounds<TeamId>,
  results: Results<TeamId>
): number | undefined {
  const open = rounds.find((round) =>
    round.ties.some((tie) => !isByeTie(tie) && !findResult(results, tie.id))
  );
  return open?.round;
}

/** Says if the phase is complete: the final, and the third-place tie when
 * there is one, have a result (US-04.12). */
export function isBracketComplete<TeamId>(
  rounds: Rounds<TeamId>,
  results: Results<TeamId>
): boolean {
  return findCurrentRound(rounds, results) === undefined;
}

/** The winner of the final, when the phase is complete (US-04.14). */
export function findBracketWinner<TeamId>(
  rounds: Rounds<TeamId>,
  results: Results<TeamId>
): TeamId | undefined {
  if (!isBracketComplete(rounds, results)) return undefined;
  const final = listTies(rounds).find((tie) => tie.kind === 'final');
  return final && findResult(results, final.id)?.winnerId;
}
