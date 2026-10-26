import { forwardRef } from 'preact/compat';
import { useId, useRef } from 'preact/hooks';
import type { TargetedEvent } from 'preact';
import type SwitchProps from './types';
import type { FieldHandle } from '@/design-system/field';
import { useFieldHandle } from '@/design-system/useFieldHandle';
import styles from './Switch.module.css';

export type { SwitchProps };

export const Switch = forwardRef<FieldHandle<boolean>, SwitchProps>(
  ({ label, defaultChecked = false, onChange, id }, ref) => {
    const generatedId = useId();
    const switchId = id ?? generatedId;
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
  }
);
Switch.displayName = 'Switch';
