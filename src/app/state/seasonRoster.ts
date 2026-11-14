import { fixedLot, pickJoinNames, pickTrigrams } from '@/engine/identity';
import type { TeamInstance } from '@/domain';

/** A team that joins a Season roster: its Instance with the OVR it rolled,
 * the Location and the trigrams of its Blueprint, and a trigram the user
 * fixed, if any. */
export interface JoiningTeam {
  team: TeamInstance;
  location: string;
  trigrams: readonly string[];
  fixedTrigram?: string;
}

/**
 * The joining teams as Season teams, with the rules of Task 208. The roster
 * teams keep their names and trigrams. A joining team whose name the Season
 * has gets its Location or a number, and each joining team picks a free
 * trigram. The fixed lot of the Season and the team breaks a tie, so a join
 * gives the same names and trigrams again.
 *
 * Throws the `pickTrigrams` `RangeError` for a fixed trigram with a bad
 * format, or one that another team has.
 */
export function joinSeasonRoster(
  seasonUuid: string,
  roster: readonly TeamInstance[],
  joining: readonly JoiningTeam[]
): TeamInstance[] {
  const lotOf = (uuid: string): number => fixedLot(seasonUuid, uuid);
  const names = pickJoinNames(
    roster.map((team) => team.name),
    joining.map(({ team, location }) => ({
      id: team.blueprintUuid,
      name: team.name,
      location,
      ovr: team.ovr,
      lot: lotOf(team.blueprintUuid),
    }))
  );
  const trigrams = pickTrigrams([
    ...roster.map((team) => ({
      id: team.blueprintUuid,
      name: team.name,
      tier: team.tier,
      ovr: team.ovr,
      trigrams: [],
      lot: lotOf(team.blueprintUuid),
      fixed: team.trigram,
    })),
    ...joining.map(({ team, trigrams: own, fixedTrigram }) => ({
      id: team.blueprintUuid,
      name: team.name,
      tier: team.tier,
      ovr: team.ovr,
      trigrams: [...own],
      lot: lotOf(team.blueprintUuid),
      fixed: fixedTrigram,
    })),
  ]);
  return joining.map(({ team }) => ({
    ...team,
    name: names.get(team.blueprintUuid) ?? team.name,
    trigram: trigrams.get(team.blueprintUuid)?.trigram ?? '',
  }));
}
