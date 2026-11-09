import { Badge, type ChecklistItem } from '@/design-system';
import type { ImportRow } from '@/app/importFileActions';
import { ImportRowLabel } from './ImportRowLabel';
import styles from './FileImportDialogs.module.css';

/** One picker row: the name, the UUID, and a tag on a real conflict. */
export function getPickerItem(row: ImportRow): ChecklistItem {
  return {
    id: row.uuid,
    label: row.name,
    content: (
      <span class={styles.pickerRow}>
        <ImportRowLabel row={row} />
        {row.conflict && <Badge tone="warning">Conflict</Badge>}
      </span>
    ),
  };
}
