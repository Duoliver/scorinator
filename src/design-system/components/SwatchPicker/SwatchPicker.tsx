import { forwardRef } from 'preact/compat';
import {
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'preact/hooks';
import type SwatchPickerProps from './types';
import type { SwatchOption } from './types';
import type { FieldHandle } from '@/design-system/field';
import styles from './SwatchPicker.module.css';

export type { SwatchPickerProps, SwatchOption };

function sameColour(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** A group of colour swatches, one native radio each, so the arrow keys
 * move the selection. The group is a `div` with `role="radiogroup"`, not a
 * `fieldset`: WebKitGTK (Tauri on Linux) adds the `legend` height twice on
 * the first layout of a `fieldset` inside a flex column, and fixes it only
 * on the next layout, for example a hover.
 *
 * A value that matches no option (for example a team colour from an older
 * palette) is kept as is: `getValue()` returns it and no swatch shows as
 * checked, until the user picks one. */
export const SwatchPicker = forwardRef<FieldHandle<string>, SwatchPickerProps>(
  ({ label, options, defaultValue = '', onChange, id }, ref) => {
    const generatedId = useId();
    const groupName = id ?? generatedId;
    const labelId = `${groupName}-label`;
    const groupEl = useRef<HTMLDivElement>(null);
    const [value, setInternalValue] = useState(defaultValue);
    const valueRef = useRef(value);
    const listenersRef = useRef(new Set<(value: string) => void>());
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const radios = (): HTMLInputElement[] =>
      Array.from(groupEl.current?.querySelectorAll('input') ?? []);

    const commitValue = useCallback((next: string, fromUser: boolean): void => {
      valueRef.current = next;
      for (const radio of radios()) radio.checked = sameColour(radio.value, next);
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
        focus: (): void => {
          const all = radios();
          (all.find((radio) => radio.checked) ?? all[0])?.focus();
        },
      }),
      [commitValue]
    );

    return (
      <div
        ref={groupEl}
        role="radiogroup"
        aria-labelledby={labelId}
        class={styles.field}
      >
        <span id={labelId} class={styles.label}>
          {label}
        </span>
        <div class={styles.grid}>
          {options.map((option) => (
            <label key={option.value} class={styles.swatch}>
              <input
                type="radio"
                name={groupName}
                value={option.value}
                aria-label={option.label}
                class={styles.input}
                checked={sameColour(option.value, value)}
                onChange={() => commitValue(option.value, true)}
              />
              <span
                class={styles.chip}
                style={{ background: option.value }}
                aria-hidden="true"
              />
            </label>
          ))}
        </div>
      </div>
    );
  }
);
SwatchPicker.displayName = 'SwatchPicker';
