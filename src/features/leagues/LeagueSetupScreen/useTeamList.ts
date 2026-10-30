import { useState } from 'preact/hooks';
import type { TeamBlueprint, TeamInstance } from '@/domain';
import { newTeamInstances } from '@/app/state/teamInstances';
import type { TeamList } from './types';

/** The team list of the Teams step, as local state seeded from the draft.
 * An add makes one Instance for each Blueprint that is not in the list yet,
 * with a rolled OVR (Task 81), at the end of the list. */
export function useTeamList(initialTeams: TeamInstance[]): TeamList {
  const [teams, setTeams] = useState<TeamInstance[]>(initialTeams);

  return {
    teams,
    addTeams: (blueprints: readonly TeamBlueprint[]) =>
      setTeams((current) => {
        const inList = new Set(current.map((team) => team.blueprintUuid));
        const added = newTeamInstances(blueprints.filter((b) => !inList.has(b.uuid)));
        return added.length === 0 ? current : [...current, ...added];
      }),
    removeTeam: (blueprintUuid: string) =>
      setTeams((current) =>
        current.filter((team) => team.blueprintUuid !== blueprintUuid)
      ),
  };
}
