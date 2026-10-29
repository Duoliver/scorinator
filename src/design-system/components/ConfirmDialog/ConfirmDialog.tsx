import type { JSX } from 'preact';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import type ConfirmDialogProps from './types';
import type { ConfirmTone } from './types';
import styles from './ConfirmDialog.module.css';

export type { ConfirmDialogProps, ConfirmTone };

/**
 * The confirm pattern (Task 112): a `sm` `Modal` with a title, a message,
 * "Cancel", and a confirm button, as the handoff bracket confirm. The
 * caller mounts it while the question is open, the same as `Drawer`.
 *
 * "Cancel" comes first, so the first-control rule of `Modal` gives it the
 * focus: Enter on open cancels, and never confirms by mistake.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps): JSX.Element {
  return (
    <Modal title={title} description={message} size="sm" onClose={onCancel}>
      <div class={styles.actions}>
        <Button variant="secondary" size="md" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={tone} size="md" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
ConfirmDialog.displayName = 'ConfirmDialog';
