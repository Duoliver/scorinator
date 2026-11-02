import type { TeamInstance } from '@/domain';

export default interface GroupCardsProps {
  /** The draw, as Blueprint UUIDs: the phase-1 draw of the wizard (Task
   * 130), or the draw of a later Groups phase (Task 181). */
  groups: readonly (readonly string[])[];
  /** The team list, to find the name and colour of each UUID. */
  teams: readonly TeamInstance[];
  /** The Location hint of each team. No hint when not given. */
  locationOf?: (blueprintUuid: string) => string;
  /** Each of these three adds its row menu item. League Detail gives none:
   * the team list of a league is fixed. */
  onEdit?: (blueprintUuid: string) => void;
  onSwitch?: (blueprintUuid: string) => void;
  onRemove?: (blueprintUuid: string) => void;
  onMove: (blueprintUuid: string, groupIndex: number) => void;
  /** Off by default: a move can leave a group of 1, and the wizard shows the
   * fit problem. On: a team in a group of 2 cannot move, for a phase that
   * has started (Task 181 choice 4). */
  keepTwoPerGroup?: boolean;
}
