import { bracketSlotCount, bracketTieId, standardPlacement } from './placement';
import type { BracketRound, BracketSlot, BracketTie, BracketTree } from './types';

/**
 * The default bye teams (US-04.10): the top seeds, one for each bye. 6
 * qualifiers give 8 slots, so seeds 1 and 2 get a bye. Pass the qualifiers
 * in seed order.
 */
export function defaultByeTeams<TeamId>(seeds: readonly TeamId[]): TeamId[] {
  return seeds.slice(0, bracketSlotCount(seeds.length) - seeds.length);
}

function checkTeams<TeamId>(
  seeds: readonly TeamId[],
  byeTeams: readonly TeamId[]
): void {
  if (new Set(seeds).size !== seeds.length) {
    throw new RangeError('A bracket cannot hold the same team twice.');
  }
  if (new Set(byeTeams).size !== byeTeams.length) {
    throw new RangeError('A team cannot get two byes.');
  }
  if (byeTeams.some((team) => !seeds.includes(team))) {
    throw new RangeError('A bye team must be a qualifier of the bracket.');
  }
}

// The team for each placement number. The bye teams take the numbers of
// the top seeds, whose opponents are missing. The other teams take the
// numbers after them. Each group keeps seed order (US-04.10).
function placeTeams<TeamId>(
  seeds: readonly TeamId[],
  byeTeams: readonly TeamId[]
): Map<number, BracketSlot<TeamId>> {
  const isBye = (team: TeamId): boolean => byeTeams.includes(team);
  const ordered = [...seeds.filter(isBye), ...seeds.filter((team) => !isBye(team))];
  const byNumber = new Map<number, BracketSlot<TeamId>>();
  ordered.forEach((teamId, i) => {
    byNumber.set(i + 1, { kind: 'team', teamId, seed: seeds.indexOf(teamId) + 1 });
  });
  return byNumber;
}

function makeTie<TeamId>(
  phase: number,
  round: number,
  tie: number,
  isFinal: boolean,
  slots: [BracketSlot<TeamId>, BracketSlot<TeamId>]
): BracketTie<TeamId> {
  const id = bracketTieId({ phase, round, tie: isFinal ? 'final' : tie });
  return { id, round, tie, slots };
}

// A bye team goes on with no click (US-04.11). Any other tie sends its
// winner, which Task 137 fills from the results.
function nextSlot<TeamId>(tie: BracketTie<TeamId>): BracketSlot<TeamId> {
  return tie.slots[1].kind === 'bye'
    ? tie.slots[0]
    : { kind: 'winner-of', tieId: tie.id };
}

/**
 * The tree of a bracket phase, before any tie is played (US-04.2, US-04.10,
 * US-04.11). Pass the qualifiers in seed order (`pickQualifiers`, or
 * `drawBracketSeeds` for a first-phase bracket), and the bye teams.
 *
 * The first round follows `standardPlacement`. A bye tie has the team in
 * the first slot and a `bye` in the second, and its team is already in its
 * next-round tie. Each later tie takes the winners of two adjacent ties.
 * The last round has one tie, the final. Task 137 adds the third-place tie.
 *
 * With fewer bye teams than byes, gives the counts and no rounds. Throws a
 * `RangeError` for fewer than 2 qualifiers, a team named twice, more bye
 * teams than byes, or a bye team that is not a qualifier. The inputs do not
 * change.
 */
export function buildBracketTree<TeamId>(
  phase: number,
  seeds: readonly TeamId[],
  byeTeams: readonly TeamId[]
): BracketTree<TeamId> {
  const slotCount = bracketSlotCount(seeds.length);
  const byes = slotCount - seeds.length;
  checkTeams(seeds, byeTeams);
  if (byeTeams.length > byes) {
    throw new RangeError(
      `This bracket has ${byes} byes. It got ${byeTeams.length} bye teams.`
    );
  }
  if (byeTeams.length < byes) {
    return { status: 'missing-byes', byes, assigned: byeTeams.length };
  }

  const roundCount = Math.log2(slotCount);
  const byNumber = placeTeams(seeds, byeTeams);
  const placement = standardPlacement(slotCount);
  const firstTies: BracketTie<TeamId>[] = [];
  for (let i = 0; i < slotCount; i += 2) {
    const top = byNumber.get(placement[i]) ?? { kind: 'bye' };
    const bottom = byNumber.get(placement[i + 1]) ?? { kind: 'bye' };
    firstTies.push(makeTie(phase, 1, i / 2 + 1, roundCount === 1, [top, bottom]));
  }

  const rounds: BracketRound<TeamId>[] = [
    { round: 1, teams: slotCount, ties: firstTies },
  ];
  for (let round = 2; round <= roundCount; round++) {
    const before = rounds[rounds.length - 1].ties;
    const ties: BracketTie<TeamId>[] = [];
    for (let i = 0; i < before.length; i += 2) {
      ties.push(
        makeTie(phase, round, i / 2 + 1, round === roundCount, [
          nextSlot(before[i]),
          nextSlot(before[i + 1]),
        ])
      );
    }
    rounds.push({ round, teams: slotCount / 2 ** (round - 1), ties });
  }
  return { status: 'ready', rounds };
}
