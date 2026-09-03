import { useId } from 'preact/hooks';
import type { JSX, TargetedEvent } from 'preact';
import type InputProps from './types';
import styles from './Input.module.css';

export type { InputProps };

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  id,
  min,
  max,
  step,
}: InputProps): JSX.Element {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const handleChange = (event: TargetedEvent<HTMLInputElement, Event>): void => {
    onChange(event.currentTarget.value);
  };

  return (
    <div class={styles.field}>
      {label && (
        <label class={styles.label} for={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        class={styles.input}
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onInput={handleChange}
      />
    </div>
  );
}
