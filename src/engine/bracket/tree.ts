import { bracketSlotCount, bracketTieId, standardPlacement } from './placement';
import {
  type BracketRound,
  type BracketSlot,
  type BracketTie,
  BracketTieKind,
  type BracketTree,
  TieSideKind,
} from './types';

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
    byNumber.set(i + 1, {
      kind: TieSideKind.TEAM,
      teamId,
      seed: seeds.indexOf(teamId) + 1,
    });
  });
  return byNumber;
}

function makeTie<TeamId>(
  phase: number,
  round: number,
  tie: number,
  kind: BracketTieKind,
  slots: [BracketSlot<TeamId>, BracketSlot<TeamId>]
): BracketTie<TeamId> {
  const id = bracketTieId({
    phase,
    round,
    tie: kind === BracketTieKind.REGULAR ? tie : kind,
  });
  return { id, round, tie, kind, slots };
}

// A bye team goes on with no click (US-04.11). Any other tie sends its
// winner, which Task 137 fills from the results.
function nextSlot<TeamId>(tie: BracketTie<TeamId>): BracketSlot<TeamId> {
  return tie.slots[1].kind === 'bye'
    ? tie.slots[0]
    : { kind: 'winner-of', tieId: tie.id };
}

// The group of a team slot, or undefined for a bye or a team with no group.
function groupOfSlot<TeamId>(
  slot: BracketSlot<TeamId>,
  groupOf: ReadonlyMap<TeamId, number>
): number | undefined {
  return slot.kind === 'team' ? groupOf.get(slot.teamId) : undefined;
}

function isSameGroup<TeamId>(
  a: BracketSlot<TeamId>,
  b: BracketSlot<TeamId>,
  groupOf: ReadonlyMap<TeamId, number>
): boolean {
  const group = groupOfSlot(a, groupOf);
  return group !== undefined && group === groupOfSlot(b, groupOf);
}

const seedOf = <TeamId>(slot: BracketSlot<TeamId>): number =>
  slot.kind === 'team' ? slot.seed : 0;

/**
 * Removes the same-group ties of the first round, after a Groups phase
 * (Task 185). The top team of a tie never moves, so the seed rule of the
 * standard placement holds. The lower team of a same-group tie swaps with
 * the lower team of another tie, the nearest seed number first, then the
 * higher number on a draw. A swap counts only when neither tie then pairs
 * two teams of one group. A bye tie takes no part, and a tie with no valid
 * swap stays. The ties change in place.
 */
function avoidGroupTies<TeamId>(
  ties: BracketTie<TeamId>[],
  groupOf: ReadonlyMap<TeamId, number>
): void {
  const playable = ties.filter((tie) => tie.slots[1].kind === 'team');
  for (const tie of playable) {
    const [top, low] = tie.slots;
    if (!isSameGroup(top, low, groupOf)) continue;
    const candidates = playable
      .filter((other) => other !== tie)
      .sort(
        (a, b) =>
          Math.abs(seedOf(a.slots[1]) - seedOf(low)) -
            Math.abs(seedOf(b.slots[1]) - seedOf(low)) ||
          seedOf(b.slots[1]) - seedOf(a.slots[1])
      );
    const swap = candidates.find(
      (other) =>
        !isSameGroup(top, other.slots[1], groupOf) &&
        !isSameGroup(other.slots[0], low, groupOf)
    );
    if (swap) [tie.slots[1], swap.slots[1]] = [swap.slots[1], low];
  }
}

/**
 * The tree of a bracket phase, before any tie is played (US-04.2, US-04.10,
 * US-04.11). Pass the qualifiers in seed order (`pickQualifiers`, or
 * `drawBracketSeeds` for a first-phase bracket), and the bye teams.
 *
 * The first round follows `standardPlacement`. A bye tie has the team in
 * the first slot and a `bye` in the second, and its team is already in its
 * next-round tie. Each later tie takes the winners of two adjacent ties.
 * The last round has the final. With `thirdPlace` on and 4 qualifiers or
 * more, it also has the third-place tie, before the final (Task 137
 * choices 2 and 3). It takes the losers of the two semi-finals. With 3
 * qualifiers, one semi-final is a bye with no loser, so there is none.
 *
 * With `groupOf`, the group of each team after a Groups phase, the first
 * round has no same-group tie when a swap can avoid it (Task 185).
 *
 * With fewer bye teams than byes, gives the counts and no rounds. Throws a
 * `RangeError` for fewer than 2 qualifiers, a team named twice, more bye
 * teams than byes, or a bye team that is not a qualifier. The inputs do not
 * change.
 */
export function buildBracketTree<TeamId>(
  phase: number,
  seeds: readonly TeamId[],
  byeTeams: readonly TeamId[],
  thirdPlace = false,
  groupOf?: ReadonlyMap<TeamId, number>
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
  const kindOf = (round: number): BracketTieKind =>
    round === roundCount ? BracketTieKind.FINAL : BracketTieKind.REGULAR;
  const byNumber = placeTeams(seeds, byeTeams);
  const placement = standardPlacement(slotCount);
  const firstTies: BracketTie<TeamId>[] = [];
  for (let i = 0; i < slotCount; i += 2) {
    const top = byNumber.get(placement[i]) ?? { kind: TieSideKind.BYE };
    const bottom = byNumber.get(placement[i + 1]) ?? { kind: TieSideKind.BYE };
    firstTies.push(makeTie(phase, 1, i / 2 + 1, kindOf(1), [top, bottom]));
  }

  if (groupOf) avoidGroupTies(firstTies, groupOf);

  const rounds: BracketRound<TeamId>[] = [
    { round: 1, teams: slotCount, ties: firstTies },
  ];
  for (let round = 2; round <= roundCount; round++) {
    const before = rounds[rounds.length - 1].ties;
    const ties: BracketTie<TeamId>[] = [];
    for (let i = 0; i < before.length; i += 2) {
      ties.push(
        makeTie(phase, round, i / 2 + 1, kindOf(round), [
          nextSlot(before[i]),
          nextSlot(before[i + 1]),
        ])
      );
    }
    rounds.push({ round, teams: slotCount / 2 ** (round - 1), ties });
  }
  if (thirdPlace && seeds.length >= 4) {
    const last = rounds[rounds.length - 1];
    const [semi1, semi2] = rounds[rounds.length - 2].ties;
    last.ties.unshift(
      makeTie(phase, last.round, 2, BracketTieKind.THIRD, [
        { kind: 'loser-of', tieId: semi1.id },
        { kind: 'loser-of', tieId: semi2.id },
      ])
    );
  }
  return { status: 'ready', rounds };
}
