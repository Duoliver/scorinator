import type { JSX } from 'preact';
import {
  Button,
  ConfirmDialog,
  Input,
  Select,
  SwatchPicker,
  Tooltip,
} from '@/design-system';
import type TeamFormProps from './types';
import type { SlugRegenerate } from './types';
import {
  COLOUR_OPTIONS,
  REGENERATE_LABEL,
  TIER_OPTIONS,
  regenerateMessage,
} from './helpers';
import { useTeamForm } from './useTeamForm';
import styles from './TeamForm.module.css';

export type { TeamFormProps };

function FieldError({ message }: { message: string | null }): JSX.Element | null {
  if (message === null) return null;
  return (
    <span role="alert" class={styles.error}>
      {message}
    </span>
  );
}

/** The icon button at the right side of an edited team's slug, and its
 * confirm (US-09.5). A disabled button stays focusable, so its hint gives
 * the reason. */
function RegenerateSlug({ regenerate }: { regenerate: SlugRegenerate }): JSX.Element {
  return (
    <>
      <Tooltip content={regenerate.hint}>
        {(describedBy) => (
          <Button
            size="icon"
            fieldHeight
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
      {regenerate.confirm && (
        <ConfirmDialog
          title="Regenerate slug?"
          message={regenerateMessage(regenerate.confirm.from, regenerate.confirm.to)}
          confirmLabel="Regenerate"
          onConfirm={regenerate.apply}
          onCancel={regenerate.cancel}
        />
      )}
    </>
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
      <Input
        label="Team name"
        defaultValue={startValues.name}
        placeholder="e.g. Salt Marsh United"
        onChange={handleNameChange}
        ref={nameRef}
      />
      <FieldError message={errors.name} />

      <div class={styles.slugRow}>
        <Input
          label="Slug (auto-generated)"
          defaultValue={startValues.slug}
          readOnly
          ref={slugRef}
        />
        {regenerate && <RegenerateSlug regenerate={regenerate} />}
      </div>

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

      <SwatchPicker
        label="Colour"
        options={COLOUR_OPTIONS}
        defaultValue={startValues.colour}
        ref={colourRef}
      />

      <Select
        label="Tier"
        defaultValue={startValues.tier}
        options={TIER_OPTIONS}
        ref={tierRef}
      />

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
