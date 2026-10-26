import type { JSX } from 'preact';
import { Button, Input, Select, SwatchPicker } from '@/design-system';
import type TeamFormProps from './types';
import { COLOUR_OPTIONS, TIER_OPTIONS } from './helpers';
import { useTeamForm } from './useTeamForm';
import styles from './TeamForm.module.css';

export type { TeamFormProps };

export function TeamForm({
  saveLabel,
  initial,
  onCancel,
  onSave,
}: TeamFormProps): JSX.Element {
  const {
    nameRef,
    slugRef,
    colourRef,
    tierRef,
    startValues,
    error,
    handleNameChange,
    handleSave,
  } = useTeamForm({ initial, onSave });

  return (
    <div class={styles.form}>
      <Input
        label="Team name"
        defaultValue={startValues.name}
        placeholder="e.g. Salt Marsh United"
        onChange={handleNameChange}
        ref={nameRef}
      />
      {error && (
        <span role="alert" class={styles.error}>
          {error}
        </span>
      )}

      <Input
        label="Slug (auto-generated)"
        defaultValue={startValues.slug}
        readOnly
        ref={slugRef}
      />

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
