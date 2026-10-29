import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Button } from '@/design-system/components/Button';
import { Checkbox } from '@/design-system/components/Checkbox';
import { Modal } from '@/design-system/components/Modal';
import type ChecklistDialogProps from './types';
import type { ChecklistItem } from './types';
import styles from './ChecklistDialog.module.css';

export type { ChecklistDialogProps, ChecklistItem };

/**
 * The import picker of the handoff File Manager (Task 113, US-10.3): one
 * checkbox row for each item in a `md` `Modal`, all checked at start, then
 * "Cancel" and a confirm. The confirm is disabled with no row checked. The
 * caller mounts the dialog to open it, as `Modal`.
 */
export function ChecklistDialog({
  title,
  description,
  items,
  confirmLabel,
  onConfirm,
  onCancel,
}: ChecklistDialogProps): JSX.Element {
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(new Set());
  const checkedIds = items.map((item) => item.id).filter((id) => !unchecked.has(id));

  const toggle = (id: string, checked: boolean): void => {
    setUnchecked((current) => {
      const next = new Set(current);
      if (checked) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal title={title} description={description} size="md" onClose={onCancel}>
      <div class={styles.body}>
        <ul class={styles.list}>
          {items.map((item) => (
            <li key={item.id} class={styles.row}>
              <Checkbox
                label={item.content ?? item.label}
                defaultChecked
                fullWidth
                onChange={(checked) => toggle(item.id, checked)}
              />
            </li>
          ))}
        </ul>
        <div class={styles.actions}>
          <Button variant="secondary" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="md"
            disabled={checkedIds.length === 0}
            onClick={() => onConfirm(checkedIds)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
ChecklistDialog.displayName = 'ChecklistDialog';
