import type { JSX } from 'preact';
import { Button, Input, Select, SwatchPicker } from '@/design-system';
import type TeamFormProps from './types';
import { COLOUR_OPTIONS, TIER_OPTIONS } from './helpers';
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

export function TeamForm({
  saveLabel,
  initial,
  takenSlugs,
  onCancel,
  onSave,
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

      <Input
        label="Slug (auto-generated)"
        defaultValue={startValues.slug}
        readOnly
        ref={slugRef}
      />

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
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>{saveLabel}</Button>
      </div>
    </div>
  );
}
TeamForm.displayName = 'TeamForm';
