import { forwardRef } from 'preact/compat';
import { useCallback, useId, useImperativeHandle, useRef, useState } from 'preact/hooks';
import type { TargetedEvent } from 'preact';
import type SelectProps from './types';
import type { SelectOption } from './types';
import type { FieldHandle } from '../../field';
import styles from './Select.module.css';

export type { SelectProps, SelectOption };

export const Select = forwardRef<FieldHandle<string>, SelectProps>(
  ({ label, defaultValue = '', onChange, options, placeholder, id }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const selectEl = useRef<HTMLSelectElement>(null);
    const [value, setInternalValue] = useState(defaultValue);
    const valueRef = useRef(value);
    const listenersRef = useRef(new Set<(value: string) => void>());
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const commitValue = useCallback((next: string, fromUser: boolean): void => {
      valueRef.current = next;
      if (selectEl.current) selectEl.current.value = next;
      setInternalValue(next);
      listenersRef.current.forEach((listener) => listener(next));
      if (fromUser) onChangeRef.current?.(next);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getValue: (): string => valueRef.current,
        setValue: (next: string): void => commitValue(next, false),
        subscribe: (listener: (value: string) => void): (() => void) => {
          listenersRef.current.add(listener);
          return () => listenersRef.current.delete(listener);
        },
        focus: (): void => selectEl.current?.focus(),
      }),
      [commitValue],
    );

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
  },
);
Select.displayName = 'Select';
