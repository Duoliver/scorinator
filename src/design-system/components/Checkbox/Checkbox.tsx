import { forwardRef } from 'preact/compat';
import { useId, useRef } from 'preact/hooks';
import type { TargetedEvent } from 'preact';
import type CheckboxProps from './types';
import type { FieldHandle } from '@/design-system/field';
import { useFieldHandle } from '@/design-system/useFieldHandle';
import styles from './Checkbox.module.css';

export type { CheckboxProps };

export const Checkbox = forwardRef<FieldHandle<boolean>, CheckboxProps>(
  ({ label, defaultChecked = false, onChange, id }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const inputEl = useRef<HTMLInputElement>(null);
    const { value: checked, commitValue } = useFieldHandle(ref, {
      defaultValue: defaultChecked,
      onChange,
      syncDom: (next) => {
        if (inputEl.current) inputEl.current.checked = next;
      },
      focus: () => inputEl.current?.focus(),
    });

    return (
      <label class={styles.root} for={checkboxId}>
        <input
          ref={inputEl}
          id={checkboxId}
          type="checkbox"
          class={styles.input}
          checked={checked}
          onChange={(event: TargetedEvent<HTMLInputElement, Event>) =>
            commitValue(event.currentTarget.checked, true)
          }
        />
        <span class={styles.box} aria-hidden="true" />
        <span class={styles.label}>{label}</span>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
