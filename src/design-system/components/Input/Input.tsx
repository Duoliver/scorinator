import { forwardRef } from 'preact/compat';
import { useCallback, useId, useImperativeHandle, useRef, useState } from 'preact/hooks';
import type { TargetedEvent } from 'preact';
import type InputProps from './types';
import type { FieldHandle } from '../../field';
import styles from './Input.module.css';

export type { InputProps };

export const Input = forwardRef<FieldHandle<string>, InputProps>(
  ({ label, defaultValue = '', onChange, placeholder, type = 'text', id, min, max, step }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const inputEl = useRef<HTMLInputElement>(null);
    const [value, setInternalValue] = useState(defaultValue);
    const valueRef = useRef(value);
    const listenersRef = useRef(new Set<(value: string) => void>());
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const commitValue = useCallback((next: string, fromUser: boolean): void => {
      valueRef.current = next;
      // Preact's setState is batched/async — write the DOM synchronously too so
      // setValue() is immediately reflected, not just on the next render flush.
      if (inputEl.current) inputEl.current.value = next;
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
        focus: (): void => inputEl.current?.focus(),
      }),
      [commitValue],
    );

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
          min={min}
          max={max}
          step={step}
          onInput={(event: TargetedEvent<HTMLInputElement, Event>) =>
            commitValue(event.currentTarget.value, true)
          }
        />
      </div>
    );
  },
);
Input.displayName = 'Input';
