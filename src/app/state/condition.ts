import {
  applyCondition,
  isConditionLevel,
  type ConditionLevel,
} from '@/engine/tier-ovr';
import type { ConditionLevels } from '@/domain';

/** The level of a team (US-14.1). A team with no entry, or a league or
 * playoff with no map, is at level 0 (Task 225 choice 2). */
export function getTeamCondition(
  conditions: Readonly<ConditionLevels> | undefined,
  blueprintUuid: string
): ConditionLevel {
  return conditions?.[blueprintUuid] ?? 0;
}

/** The OVR that a match uses: the stored OVR with the level of the team
 * (US-14.1). A screen never shows it (US-14.2). */
export function getRealOvr(
  ovr: number,
  conditions: Readonly<ConditionLevels> | undefined,
  blueprintUuid: string
): number {
  return applyCondition(ovr, getTeamCondition(conditions, blueprintUuid));
}

/** Throws a `RangeError` for a value that is not a condition level. */
export function checkConditionLevel(level: unknown): asserts level is ConditionLevel {
  if (!isConditionLevel(level)) {
    throw new RangeError(`The condition level must be -2 to 2. It got ${level}.`);
  }
}

/**
 * The levels of a new league or playoff, as a field to spread in it
 * (Task 226 choice 5). A level 0 is dropped, and no field stays when every
 * level is 0, as the files keep them (Task 225 choice 4). `owner` starts
 * the error text: "The team list" or "The playoff".
 *
 * Throws a `RangeError` for a team that is not in `teams`, and for a value
 * that is not a level.
 */
export function pickConditions(
  conditions: Readonly<ConditionLevels> | undefined,
  teams: ReadonlySet<string>,
  owner: 'The team list' | 'The playoff'
): { conditions?: ConditionLevels } {
  const kept: ConditionLevels = {};
  for (const [team, level] of Object.entries(conditions ?? {})) {
    if (!teams.has(team)) {
      throw new RangeError(`${owner} has no team with the UUID ${team}.`);
    }
    checkConditionLevel(level);
    if (level !== 0) kept[team] = level;
  }
  return Object.keys(kept).length > 0 ? { conditions: kept } : {};
}

/** A copy of `owner` with the new level of one team. A level 0 removes the
 * entry, and the field goes with its last entry. */
export function replaceTeamCondition<T extends { conditions?: ConditionLevels }>(
  owner: T,
  blueprintUuid: string,
  level: ConditionLevel
): T {
  const { conditions, ...rest } = owner;
  const others = Object.entries(conditions ?? {}).filter(
    ([team]) => team !== blueprintUuid
  );
  const next = level === 0 ? others : [...others, [blueprintUuid, level]];
  return (
    next.length > 0 ? { ...rest, conditions: Object.fromEntries(next) } : rest
  ) as T;
}
