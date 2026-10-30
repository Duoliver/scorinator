import { useState } from 'preact/hooks';
import type { TeamBlueprint, TeamInstance } from '@/domain';
import { newTeamInstances } from '@/app/state/teamInstances';
import type { TeamList } from './types';

/** Copies the map with no entry for the team. */
function withoutFixed(
  fixed: Record<string, string>,
  blueprintUuid: string
): Record<string, string> {
  if (!(blueprintUuid in fixed)) return fixed;
  const { [blueprintUuid]: _dropped, ...rest } = fixed;
  return rest;
}

/** The team list of the Teams step, and its fixed trigrams, as local state
 * seeded from the draft. An add makes one Instance for each Blueprint that
 * is not in the list yet, with a rolled OVR (Task 81), at the end of the
 * list. A Switch keeps the place of the team in the list (US-08.5). */
export function useTeamList(
  initialTeams: TeamInstance[],
  initialFixed: Record<string, string> = {}
): TeamList {
  const [teams, setTeams] = useState<TeamInstance[]>(initialTeams);
  const [fixedTrigrams, setFixedTrigrams] = useState(initialFixed);

  return {
    teams,
    fixedTrigrams,
    addTeams: (blueprints: readonly TeamBlueprint[]) =>
      setTeams((current) => {
        const inList = new Set(current.map((team) => team.blueprintUuid));
        const added = newTeamInstances(blueprints.filter((b) => !inList.has(b.uuid)));
        return added.length === 0 ? current : [...current, ...added];
      }),
    removeTeam: (blueprintUuid: string): void => {
      setTeams((current) =>
        current.filter((team) => team.blueprintUuid !== blueprintUuid)
      );
      setFixedTrigrams((current) => withoutFixed(current, blueprintUuid));
    },
    switchTeam: (blueprintUuid: string, replacement: TeamBlueprint): void => {
      setTeams((current) => {
        if (current.some((team) => team.blueprintUuid === replacement.uuid))
          return current;
        const [added] = newTeamInstances([replacement]);
        return current.map((team) =>
          team.blueprintUuid === blueprintUuid ? added : team
        );
      });
      setFixedTrigrams((current) => withoutFixed(current, blueprintUuid));
    },
  };
}
