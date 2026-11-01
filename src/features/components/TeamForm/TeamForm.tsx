import type { JSX } from 'preact';
import { Button, ConfirmDialog, Input, Tooltip } from '@/design-system';
import type TeamFormProps from './types';
import type { SlugRegenerate } from './types';
import { REGENERATE_LABEL, regenerateMessage } from './helpers';
import { FieldError, TeamColourField, TeamNameField, TeamTierField } from './fields';
import { useTeamForm } from './useTeamForm';
import styles from './TeamForm.module.css';

export type { TeamFormProps };

/** The icon button in the slot of an edited team's slug (US-09.5, Task
 * 169). A disabled button stays focusable, so its hint gives the reason. */
function RegenerateButton({ regenerate }: { regenerate: SlugRegenerate }): JSX.Element {
  return (
    <Tooltip content={regenerate.hint}>
      {(describedBy) => (
        <Button
          size="icon"
          fill
          variant="secondary"
          aria-label={REGENERATE_LABEL}
          aria-describedby={describedBy}
          disabled={regenerate.disabled}
          focusableWhenDisabled
          onClick={regenerate.open}
        >
          ↻
        </Button>
      )}
    </Tooltip>
  );
}

/** The confirm of a slug regenerate, with the old and the new slug. */
function RegenerateConfirm({
  regenerate,
}: {
  regenerate: SlugRegenerate;
}): JSX.Element | null {
  if (!regenerate.confirm) return null;
  return (
    <ConfirmDialog
      title="Regenerate slug?"
      message={regenerateMessage(regenerate.confirm.from, regenerate.confirm.to)}
      confirmLabel="Regenerate"
      onConfirm={regenerate.apply}
      onCancel={regenerate.cancel}
    />
  );
}

export function TeamForm({
  saveLabel,
  initial,
  takenSlugs,
  onCancel,
  onSave,
  onDelete,
}: TeamFormProps): JSX.Element {
  const {
    nameRef,
    slugRef,
    colourRef,
    tierRef,
    locationRef,
    trigramsRef,
    startValues,
    errors,
    trigramsPlaceholder,
    regenerate,
    handleNameChange,
    handleSave,
  } = useTeamForm({ initial, takenSlugs, onSave });

  return (
    <div class={styles.form}>
      <TeamNameField
        defaultValue={startValues.name}
        fieldRef={nameRef}
        error={errors.name}
        onChange={handleNameChange}
      />

      <Input
        label="Slug (auto-generated)"
        defaultValue={startValues.slug}
        readOnly
        ref={slugRef}
        trailing={regenerate && <RegenerateButton regenerate={regenerate} />}
      />
      {regenerate && <RegenerateConfirm regenerate={regenerate} />}

      <Input
        label="Location (optional)"
        defaultValue={startValues.location}
        placeholder="e.g. Ashfield"
        ref={locationRef}
      />
      <FieldError message={errors.location} />

      <Input
        label="Trigrams (optional)"
        defaultValue={startValues.trigrams}
        placeholder={trigramsPlaceholder}
        ref={trigramsRef}
      />
      <FieldError message={errors.trigrams} />

      <TeamColourField defaultValue={startValues.colour} fieldRef={colourRef} />

      <TeamTierField defaultValue={startValues.tier} fieldRef={tierRef} />

      <div class={styles.actions}>
        <div class={styles.mainActions}>
          <Button size="sm" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            {saveLabel}
          </Button>
        </div>
        {/* A quiet button in its own row: a delete is rare, and it asks
            first (Task 167 review). */}
        {onDelete && (
          <div>
            <Button size="sm" variant="destructive-outline" onClick={onDelete}>
              Delete team
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
TeamForm.displayName = 'TeamForm';
