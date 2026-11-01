import type { JSX, RefObject } from 'preact';
import { Input, Select, SwatchPicker, type FieldHandle } from '@/design-system';
import { slug } from '@/engine/identity';
import { COLOUR_OPTIONS, TEAM_NAME_INVALID, TIER_OPTIONS } from './helpers';
import styles from './TeamForm.module.css';

/** The team fields that the Blueprint form (`TeamForm`) and the wizard
 * Edit drawer share (Task 172). Each form puts them in its own order. */

/** The message of a bad field, under it. Nothing for `null`. */
export function FieldError({
  message,
}: {
  message: string | null;
}): JSX.Element | null {
  if (message === null) return null;
  return (
    <span role="alert" class={styles.error}>
      {message}
    </span>
  );
}

/** The name error, or `null` for a name with a letter or a number: a name
 * must give a slug (Task 11). */
export function checkTeamName(name: string): string | null {
  try {
    slug(name);
    return null;
  } catch {
    return TEAM_NAME_INVALID;
  }
}

interface FieldProps<T> {
  defaultValue: T;
  fieldRef: RefObject<FieldHandle<string>>;
}

/** "Team name", and its error under it. */
export function TeamNameField({
  defaultValue,
  fieldRef,
  error,
  onChange,
}: FieldProps<string | undefined> & {
  error: string | null;
  onChange?: (name: string) => void;
}): JSX.Element {
  return (
    <>
      <Input
        label="Team name"
        defaultValue={defaultValue}
        placeholder="e.g. Salt Marsh United"
        onChange={onChange}
        ref={fieldRef}
      />
      <FieldError message={error} />
    </>
  );
}

/** "Colour", the swatches of the team palette (US-09.7). */
export function TeamColourField({
  defaultValue,
  fieldRef,
}: FieldProps<string>): JSX.Element {
  return (
    <SwatchPicker
      label="Colour"
      options={COLOUR_OPTIONS}
      defaultValue={defaultValue}
      ref={fieldRef}
    />
  );
}

/** "Tier", S to F. */
export function TeamTierField({
  defaultValue,
  fieldRef,
  onChange,
}: FieldProps<string> & { onChange?: (tier: string) => void }): JSX.Element {
  return (
    <Select
      label="Tier"
      defaultValue={defaultValue}
      options={TIER_OPTIONS}
      onChange={onChange}
      ref={fieldRef}
    />
  );
}
