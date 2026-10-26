import { forwardRef } from 'preact/compat';
import { useId, useRef } from 'preact/hooks';
import type { TargetedEvent } from 'preact';
import type InputProps from './types';
import type { FieldHandle } from '@/design-system/field';
import { useFieldHandle } from '@/design-system/useFieldHandle';
import styles from './Input.module.css';

export type { InputProps };

export const Input = forwardRef<FieldHandle<string>, InputProps>(
  (
    {
      label,
      defaultValue = '',
      onChange,
      placeholder,
      type = 'text',
      id,
      readOnly,
      min,
      max,
      step,
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const inputEl = useRef<HTMLInputElement>(null);
    const { value, commitValue } = useFieldHandle(ref, {
      defaultValue,
      onChange,
      syncDom: (next) => {
        if (inputEl.current) inputEl.current.value = next;
      },
      focus: () => inputEl.current?.focus(),
    });

    return (
      <div class={styles.field}>
        {label && (
          <label class={styles.label} for={inputId}>
            {label}
          </label>
        )}
        <input
          ref={inputEl}
          id={inputId}
          class={styles.input}
          type={type}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          min={min}
          max={max}
          step={step}
          onInput={(event: TargetedEvent<HTMLInputElement, Event>) =>
            commitValue(event.currentTarget.value, true)
          }
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
