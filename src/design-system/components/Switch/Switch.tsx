import { forwardRef } from 'preact/compat';
import { useCallback, useId, useImperativeHandle, useRef, useState } from 'preact/hooks';
import type { TargetedEvent } from 'preact';
import type SwitchProps from './types';
import type { FieldHandle } from '../../field';
import styles from './Switch.module.css';

export type { SwitchProps };

export const Switch = forwardRef<FieldHandle<boolean>, SwitchProps>(
  ({ label, defaultChecked = false, onChange, id }, ref) => {
    const generatedId = useId();
    const switchId = id ?? generatedId;
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
      <label class={styles.root} for={switchId}>
        <input
          ref={inputEl}
          id={switchId}
          type="checkbox"
          role="switch"
          class={styles.input}
          checked={checked}
          onChange={(event: TargetedEvent<HTMLInputElement, Event>) =>
            commitValue(event.currentTarget.checked, true)
          }
        />
        <span class={styles.track} aria-hidden="true">
          <span class={styles.knob} />
        </span>
        <span class={styles.label}>{label}</span>
      </label>
    );
  },
);
Switch.displayName = 'Switch';
