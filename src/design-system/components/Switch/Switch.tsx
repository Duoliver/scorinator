import { useId } from 'preact/hooks';
import type { JSX, TargetedEvent } from 'preact';
import type SwitchProps from './types';
import styles from './Switch.module.css';

export type { SwitchProps };

export function Switch({ label, checked, onChange, id }: SwitchProps): JSX.Element {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  const handleChange = (event: TargetedEvent<HTMLInputElement, Event>): void => {
    onChange(event.currentTarget.checked);
  };

  return (
    <label class={styles.root} for={switchId}>
      <input
        id={switchId}
        type="checkbox"
        role="switch"
        class={styles.input}
        checked={checked}
        onChange={handleChange}
      />
      <span class={styles.track} aria-hidden="true">
        <span class={styles.knob} />
      </span>
      <span class={styles.label}>{label}</span>
    </label>
  );
}
