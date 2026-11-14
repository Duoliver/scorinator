import type { PickerItem } from '@/design-system';
import type { TeamInstance } from '@/domain';
import { TeamSwatch } from '@/features/components';
import styles from './PlayoffDialog.module.css';

export const NAME_TAKEN = 'Another playoff of this Season has this name.';

/** One team of the picker: its swatch and its name. A team of the other
 * slot is disabled, with the slot as its status (Task 220 choice 6). */
export function toTeamItem(team: TeamInstance, takenBy?: string): PickerItem {
  return {
    id: team.blueprintUuid,
    label: team.name,
    content: (
      <span class={styles.teamItem}>
        <TeamSwatch colour={team.colour} />
        <span>{team.name}</span>
      </span>
    ),
    disabled: takenBy !== undefined,
    status: takenBy,
  };
}
