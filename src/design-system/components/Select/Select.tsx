import { forwardRef } from 'preact/compat';
import { useId, useRef } from 'preact/hooks';
import type { TargetedEvent } from 'preact';
import type SelectProps from './types';
import type { SelectOption } from './types';
import type { FieldHandle } from '@/design-system/field';
import { useFieldHandle } from '@/design-system/useFieldHandle';
import styles from './Select.module.css';

export type { SelectProps, SelectOption };

export const Select = forwardRef<FieldHandle<string>, SelectProps>(
  ({ label, defaultValue = '', onChange, options, placeholder, id }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const selectEl = useRef<HTMLSelectElement>(null);
    const { value, commitValue } = useFieldHandle(ref, {
      defaultValue,
      onChange,
      syncDom: (next) => {
        if (selectEl.current) selectEl.current.value = next;
      },
      focus: () => selectEl.current?.focus(),
    });

    return (
      <div class={styles.field}>
        {label && (
          <label class={styles.label} for={selectId}>
            {label}
          </label>
        )}
        <div class={styles.wrapper}>
          <select
            ref={selectEl}
            id={selectId}
            class={styles.select}
            value={value}
            onChange={(event: TargetedEvent<HTMLSelectElement, Event>) =>
              commitValue(event.currentTarget.value, true)
            }
          >
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
);
Select.displayName = 'Select';
