import { forwardRef } from 'preact/compat';
import { useCallback, useId, useImperativeHandle, useRef, useState } from 'preact/hooks';
import type { TargetedEvent } from 'preact';
import type CheckboxProps from './types';
import type { FieldHandle } from '../../field';
import styles from './Checkbox.module.css';

export type { CheckboxProps };

export const Checkbox = forwardRef<FieldHandle<boolean>, CheckboxProps>(
  ({ label, defaultChecked = false, onChange, id }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const inputEl = useRef<HTMLInputElement>(null);
    const [checked, setInternalChecked] = useState(defaultChecked);
    const checkedRef = useRef(checked);
    const listenersRef = useRef(new Set<(value: boolean) => void>());
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const commitValue = useCallback((next: boolean, fromUser: boolean): void => {
      checkedRef.current = next;
      if (inputEl.current) inputEl.current.checked = next;
      setInternalChecked(next);
      listenersRef.current.forEach((listener) => listener(next));
      if (fromUser) onChangeRef.current?.(next);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getValue: (): boolean => checkedRef.current,
        setValue: (next: boolean): void => commitValue(next, false),
        subscribe: (listener: (value: boolean) => void): (() => void) => {
          listenersRef.current.add(listener);
          return () => listenersRef.current.delete(listener);
        },
        focus: (): void => inputEl.current?.focus(),
      }),
      [commitValue],
    );

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
  },
);
Checkbox.displayName = 'Checkbox';
