import type { PickerItem } from '@/design-system';
import type { TeamInstance } from '@/domain';
import { TieFormat, TiebreakMethod } from '@/engine/tiebreak';
import { TeamSwatch } from '@/features/components';
import {
  FORMAT_LABELS,
  METHOD_LABELS,
} from '@/features/seasons/SeasonViewScreen/tieLabels';
import styles from './PlayoffDialog.module.css';

export const NAME_TAKEN = 'Another playoff of this Season has this name.';

/** One team of the picker: its swatch and its name. A team of the other
 * slot is disabled, with the slot as its status (Task 220 choice 6). */
export function getTeamItem(team: TeamInstance, takenBy?: string): PickerItem {
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

/** The options of "Tie format", with the labels of the rows. */
export const FORMAT_OPTIONS = [TieFormat.SINGLE_MATCH, TieFormat.TWO_LEGGED].map(
  (value) => ({
    value,
    label: FORMAT_LABELS[value],
  })
);

/** The options of "Tiebreak method". */
export const METHOD_OPTIONS = [
  TiebreakMethod.PENALTIES,
  TiebreakMethod.REPLAY_COIN_TOSS,
].map((value) => ({ value, label: METHOD_LABELS[value] }));
