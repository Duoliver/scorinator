import { useMemo } from 'preact/hooks';
import type { TeamInstance } from '@/domain';
import type { TeamDisplay } from './types';
import { useBlueprintLocation } from './useBlueprintLocation';

export type { TeamDisplay };

/** Looks up a team of one league by its Blueprint UUID, in the league
 * Instances (US-09.2, Task 161). A Blueprint edit does not change them. A
 * UUID that no Instance has shows the UUID and no colour, so a view never
 * breaks on a missing team.
 *
 * The lookup goes through a `Map`, so a view with many rows does not scan
 * the Instances once for each row. The function stays the same object until
 * the Instances or the Blueprints change, so another hook can list it as a
 * dependency. The Location comes from the Blueprint (US-09.3, Task 157). */
export function useTeamLookup(
  teams: readonly TeamInstance[]
): (blueprintUuid: string) => TeamDisplay {
  const locationOf = useBlueprintLocation();
  return useMemo(() => {
    const byUuid = new Map(teams.map((team) => [team.blueprintUuid, team]));
    return (blueprintUuid: string): TeamDisplay => {
      const team = byUuid.get(blueprintUuid);
      return team
        ? {
            name: team.name,
            colour: team.colour,
            trigram: team.trigram,
            location: locationOf(blueprintUuid),
          }
        : { name: blueprintUuid, colour: '', trigram: '', location: '' };
    };
  }, [teams, locationOf]);
}
