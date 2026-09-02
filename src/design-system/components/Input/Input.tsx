import { useId } from 'preact/hooks';
import type { JSX } from 'preact';
import styles from './Input.module.css';

export interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email';
  id?: string;
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  id,
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const handleChange = (event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
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
        onInput={handleChange}
      />
    </div>
  );
}
