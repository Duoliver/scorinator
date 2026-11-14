import type { JSX } from 'preact';
import { Button, Input, Modal } from '@/design-system';
import type SeasonDialogProps from './types';
import { useSeasonDialog } from './useSeasonDialog';
import styles from './SeasonDialog.module.css';

export type { SeasonDialogProps };

export function SeasonDialog({
  title,
  description,
  submitLabel,
  initialName,
  initialYear,
  isTaken,
  onSubmit,
  onCancel,
}: SeasonDialogProps): JSX.Element {
  const { setName, setYear, canSubmit, error, handleSubmit } = useSeasonDialog({
    initialName,
    initialYear,
    isTaken,
    onSubmit,
  });

  return (
    <Modal title={title} description={description} size="sm" onClose={onCancel}>
      <form class={styles.form} onSubmit={handleSubmit}>
        <Input label="Name" defaultValue={initialName} onChange={setName} />
        <Input label="Year" defaultValue={initialYear} onChange={setYear} />
        {error && (
          <p class={styles.error} role="alert">
            {error}
          </p>
        )}
        <div class={styles.actions}>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={!canSubmit}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
SeasonDialog.displayName = 'SeasonDialog';
