import { useEffect, useState } from 'preact/hooks';
import { type PhasePlan, PhaseFormat } from '@/engine/phases';
import { createSeededRng, type Rng } from '@/engine/rng';
import { drawGroups, moveToGroup } from '@/engine/round-robin';
import type { TeamBlueprint } from '@/domain';
import { freshSeed } from '@/app/random';
import {
  groupsAfterAdd,
  groupsAfterRemove,
  groupsAfterSwitch,
  groupsForPlan,
} from './phaseOneGroups';
import type { TeamList } from './types';

const freshRng = (): Rng => createSeededRng(freshSeed());

/** What `usePhaseOneGroups` gives: the draw, the team actions that also
 * change it, Shuffle, and the move. */
export interface PhaseOneGroups {
  groups: string[][] | null;
  addTeams: TeamList['addTeams'];
  removeTeam: TeamList['removeTeam'];
  switchTeam: TeamList['switchTeam'];
  shuffleGroups: () => void;
  moveTeam: (blueprintUuid: string, groupIndex: number) => void;
}

/**
 * The phase-1 draw of the wizard (Task 130 choice 1), as local state seeded
 * from the draft. Each team action of `teamList` also changes the draw:
 * an add goes into the smallest group, a remove leaves its group, and a
 * Switch keeps the place. A change of the phase-1 plan draws, resizes, or
 * drops the draw (`groupsForPlan`).
 */
export function usePhaseOneGroups(
  teamList: TeamList,
  plans: readonly PhasePlan[],
  initialGroups: string[][] | null
): PhaseOneGroups {
  const [groups, setGroups] = useState<string[][] | null>(initialGroups);
  const plan = plans[0];
  const uuids = teamList.teams.map((team) => team.blueprintUuid);
  // Only the format and the group setting of phase 1 change the draw.
  const planKey =
    plan?.format === PhaseFormat.GROUPS ? JSON.stringify(plan.grouping) : 'none';

  useEffect(() => {
    setGroups((current) => groupsForPlan(current, plan, uuids, freshRng()));
    // The draw follows `planKey` only. The team actions keep it in step
    // with the team list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey]);

  return {
    groups,
    addTeams: (blueprints: readonly TeamBlueprint[]): void => {
      teamList.addTeams(blueprints);
      if (plan?.format !== PhaseFormat.GROUPS) return;
      setGroups((current) => {
        if (!current) return current;
        const drawn = new Set(current.flat());
        const added = blueprints.map((b) => b.uuid).filter((uuid) => !drawn.has(uuid));
        return groupsAfterAdd(current, plan, added, freshRng());
      });
    },
    removeTeam: (blueprintUuid: string): void => {
      teamList.removeTeam(blueprintUuid);
      if (plan?.format !== PhaseFormat.GROUPS) return;
      setGroups((current) =>
        current?.flat().includes(blueprintUuid)
          ? groupsAfterRemove(current, plan, blueprintUuid, freshRng())
          : current
      );
    },
    switchTeam: (blueprintUuid: string, replacement: TeamBlueprint): void => {
      teamList.switchTeam(blueprintUuid, replacement);
      setGroups((current) =>
        current?.flat().includes(blueprintUuid)
          ? groupsAfterSwitch(current, blueprintUuid, replacement.uuid)
          : current
      );
    },
    shuffleGroups: (): void =>
      setGroups((current) =>
        current ? drawGroups(current.flat(), current.length, freshRng()) : current
      ),
    moveTeam: (blueprintUuid: string, groupIndex: number): void =>
      setGroups((current) =>
        current ? moveToGroup(current, blueprintUuid, groupIndex) : current
      ),
  };
}
