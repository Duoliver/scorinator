import type { JSX } from 'preact';
import { Badge, Button, Modal, SegmentedControl } from '@/design-system';
import { ImportRowLabel } from '../ImportRowLabel';
import { CHOICE_OPTIONS, DESCRIPTION, TYPE_LABELS } from './helpers';
import type ResolveConflictsDialogProps from './types';
import { useResolveConflicts } from './useResolveConflicts';
import styles from './ResolveConflictsDialog.module.css';

export type { ResolveConflictsDialogProps };

/** The "Resolve conflicts" dialog of the handoff File Manager (US-11.2).
 * Each row starts on Skip. */
export function ResolveConflictsDialog({
  rows,
  onConfirm,
  onCancel,
}: ResolveConflictsDialogProps): JSX.Element {
  const { bindChoice, setAllChoices, confirmChoices } = useResolveConflicts({
    rows,
    onConfirm,
  });

  return (
    <Modal
      title="Resolve conflicts"
      description={DESCRIPTION}
      size="md"
      onClose={onCancel}
    >
      <div class={styles.body}>
        <div class={styles.allButtons}>
          <Button variant="secondary" size="sm" onClick={() => setAllChoices('skip')}>
            Skip all
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAllChoices('new')}>
            Import all as new
          </Button>
        </div>
        <ul class={styles.list}>
          {rows.map((row) => (
            <li key={row.uuid} class={styles.row}>
              <div class={styles.identity}>
                <Badge>{TYPE_LABELS[row.type]}</Badge>
                <ImportRowLabel row={row} />
              </div>
              <SegmentedControl
                ref={bindChoice(row.uuid)}
                label={`Choice for ${row.name}`}
                hideLabel
                options={CHOICE_OPTIONS}
                defaultValue="skip"
              />
            </li>
          ))}
        </ul>
        <div class={styles.actions}>
          <Button variant="secondary" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="md" onClick={confirmChoices}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
ResolveConflictsDialog.displayName = 'ResolveConflictsDialog';
