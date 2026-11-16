import { useState } from 'preact/hooks';
import type { ConditionLevels, TeamBlueprint, TeamInstance } from '@/domain';
import type { ConditionLevel } from '@/engine/tier-ovr';
import { newTeamInstances } from '@/app/state/teamInstances';
import type { TeamInstanceEdit } from '@/features/leagues/LeagueSetupScreen/steps/TeamsStep/EditTeamDrawer';
import type { TeamList } from './types';

/** Copies the map with no entry for the team. */
function withoutTeam<T>(
  map: Record<string, T>,
  blueprintUuid: string
): Record<string, T> {
  if (!(blueprintUuid in map)) return map;
  const { [blueprintUuid]: _dropped, ...rest } = map;
  return rest;
}

/** The team list of the Teams step, its fixed trigrams, and its condition
 * levels, as local state seeded from the draft. An add makes one Instance
 * for each Blueprint that is not in the list yet, with a rolled OVR (Task
 * 81), at the end of the list. A Switch keeps the place of the team in the
 * list (US-08.5). A removed or switched team loses its fixed trigram and
 * its level (Task 229 choice 2). */
export function useTeamList(
  initialTeams: TeamInstance[],
  initialFixed: Record<string, string> = {},
  initialConditions: ConditionLevels = {}
): TeamList {
  const [teams, setTeams] = useState<TeamInstance[]>(initialTeams);
  const [fixedTrigrams, setFixedTrigrams] = useState(initialFixed);
  const [conditions, setConditions] = useState<ConditionLevels>(initialConditions);

  return {
    teams,
    fixedTrigrams,
    conditions,
    setCondition: (blueprintUuid: string, level: ConditionLevel): void =>
      setConditions((current) => {
        const rest = withoutTeam(current, blueprintUuid);
        return level === 0 ? rest : { ...rest, [blueprintUuid]: level };
      }),
    addConditions: (levels: Readonly<ConditionLevels>): void =>
      setConditions((current) => ({ ...current, ...levels })),
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
      setFixedTrigrams((current) => withoutTeam(current, blueprintUuid));
      setConditions((current) => withoutTeam(current, blueprintUuid));
    },
    updateTeam: (
      blueprintUuid: string,
      { fixedTrigram, ...changes }: TeamInstanceEdit
    ): void => {
      setTeams((current) =>
        current.map((team) =>
          team.blueprintUuid === blueprintUuid ? { ...team, ...changes } : team
        )
      );
      setFixedTrigrams((current) =>
        fixedTrigram === null
          ? withoutTeam(current, blueprintUuid)
          : { ...current, [blueprintUuid]: fixedTrigram }
      );
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
      setFixedTrigrams((current) => withoutTeam(current, blueprintUuid));
      setConditions((current) => withoutTeam(current, blueprintUuid));
    },
  };
}
