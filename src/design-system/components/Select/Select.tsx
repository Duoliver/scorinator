import { useId } from 'preact/hooks';
import type { JSX, TargetedEvent } from 'preact';
import type SelectProps from './types';
import type { SelectOption } from './types';
import styles from './Select.module.css';

export type { SelectProps, SelectOption };

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  id,
}: SelectProps): JSX.Element {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const handleChange = (event: TargetedEvent<HTMLSelectElement, Event>): void => {
    onChange(event.currentTarget.value);
  };

  return (
    <div class={styles.field}>
      {label && (
        <label class={styles.label} for={selectId}>
          {label}
        </label>
      )}
      <div class={styles.wrapper}>
        <select id={selectId} class={styles.select} value={value} onChange={handleChange}>
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span class={styles.arrow} aria-hidden="true">
          ▾
        </span>
      </div>
    </div>
  );
}
