import { useId } from 'preact/hooks';
import type { JSX, TargetedEvent } from 'preact';
import type CheckboxProps from './types';
import styles from './Checkbox.module.css';

export type { CheckboxProps };

export function Checkbox({ label, checked, onChange, id }: CheckboxProps): JSX.Element {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  const handleChange = (event: TargetedEvent<HTMLInputElement, Event>): void => {
    onChange(event.currentTarget.checked);
  };

  return (
    <label class={styles.root} for={checkboxId}>
      <input
        id={checkboxId}
        type="checkbox"
        class={styles.input}
        checked={checked}
        onChange={handleChange}
      />
      <span class={styles.box} aria-hidden="true" />
      <span class={styles.label}>{label}</span>
    </label>
  );
}
