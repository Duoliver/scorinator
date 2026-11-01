import type { TeamInstance } from '@/domain';

export default interface GroupCardsProps {
  /** The phase-1 draw, as Blueprint UUIDs (Task 130). */
  groups: readonly (readonly string[])[];
  /** The team list, to find the name and colour of each UUID. */
  teams: readonly TeamInstance[];
  locationOf: (blueprintUuid: string) => string;
  onEdit: (blueprintUuid: string) => void;
  onSwitch: (blueprintUuid: string) => void;
  onRemove: (blueprintUuid: string) => void;
  onMove: (blueprintUuid: string, groupIndex: number) => void;
}
