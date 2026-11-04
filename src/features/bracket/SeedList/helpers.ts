import { groupLabel } from '@/engine/round-robin';
import type { StandingsRow } from '@/engine/standings';
import type { TeamDisplay } from '@/features/components';
import type { SeedRow } from './types';

/** The Seed List text of a bracket with byes (US-04.10). */
export const BYE_HELP_TEXT =
  'Top seeds get a bye by default. Star any seed to grant it a bye instead — first-round only.';

/** A place as an English ordinal: 1st, 2nd, 3rd, 4th, 11th, 21st. */
export function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/**
 * The origin tag of each qualifier, from the final tables of the phase
 * before (US-04.2, Task 142 choice 2): "A1" for the winner of Group A,
 * "C3" for place 3 of Group C, and "3rd" after a round robin.
 */
export function seedTagsOf(
  tables: readonly (readonly StandingsRow<string>[])[],
  format: 'round-robin' | 'groups'
): Map<string, string> {
  const tags = new Map<string, string>();
  tables.forEach((table, group) => {
    table.forEach((row, place) => {
      tags.set(
        row.team,
        format === 'groups' ? `${groupLabel(group)}${place + 1}` : ordinal(place + 1)
      );
    });
  });
  return tags;
}

/** The text above the rows, and the bye count when the bracket has byes
 * (US-04.10). */
export function describeByes(
  qualifiers: number,
  byes: number,
  assigned: number
): { text: string; count: string | undefined } {
  if (byes === 0) {
    return {
      text: `${qualifiers} qualifiers fill the bracket exactly — no byes needed.`,
      count: undefined,
    };
  }
  return { text: BYE_HELP_TEXT, count: `${assigned} / ${byes} byes assigned` };
}

/** The rows of the Seed List, in seed order. An empty star is off when
 * every bye is assigned, and every star is off with no byes (US-04.10). */
export function buildSeedRows(
  seeds: readonly string[],
  byeTeams: readonly string[],
  byes: number,
  tags: ReadonlyMap<string, string>,
  lookup: (uuid: string) => TeamDisplay
): SeedRow[] {
  const full = byeTeams.length >= byes;
  return seeds.map((teamId, index) => {
    const hasBye = byeTeams.includes(teamId);
    const team = lookup(teamId);
    return {
      key: teamId,
      seed: index + 1,
      name: team.name,
      colour: team.colour,
      tag: tags.get(teamId) ?? '',
      hasBye,
      starDisabled: byes === 0 || (!hasBye && full),
    };
  });
}

/** The bye teams after a star click: the team gets a bye, or loses it. */
export function toggleBye(byeTeams: readonly string[], teamId: string): string[] {
  return byeTeams.includes(teamId)
    ? byeTeams.filter((team) => team !== teamId)
    : [...byeTeams, teamId];
}
