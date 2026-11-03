import { forwardRef } from 'preact/compat';
import { useId, useRef } from 'preact/hooks';
import type { Ref, TargetedKeyboardEvent, VNode } from 'preact';
import type SegmentedControlProps from './types';
import type { SegmentedOption } from './types';
import type { FieldHandle } from '@/design-system/field';
import { useFieldHandle } from '@/design-system/useFieldHandle';
import styles from './SegmentedControl.module.css';

export type { SegmentedControlProps, SegmentedOption };

// The index each key moves to, from the index of the checked option. The
// arrows wrap at the ends, as the WAI-ARIA radio group pattern says.
function moveIndex(key: string, current: number, count: number): number | undefined {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}

function SegmentedControlBase<T extends string>(
  {
    label,
    options,
    defaultValue,
    onChange,
    hideLabel,
    disabled,
  }: SegmentedControlProps<T>,
  ref: Ref<FieldHandle<T>>
): VNode {
  const labelId = useId();
  const buttons = useRef(new Map<T, HTMLButtonElement>());
  const { value, commitValue } = useFieldHandle(ref, {
    defaultValue,
    onChange,
    focus: (current) => buttons.current.get(current)?.focus(),
  });

  const select = (next: T): void => {
    if (next !== value) commitValue(next, true);
  };

  const onKeyDown = (event: TargetedKeyboardEvent<HTMLDivElement>): void => {
    const current = options.findIndex((option) => option.value === value);
    const next = moveIndex(event.key, current, options.length);
    if (next === undefined) return;
    event.preventDefault();
    select(options[next].value);
    buttons.current.get(options[next].value)?.focus();
  };

  return (
    <div class={styles.root}>
      {!hideLabel && (
        <span id={labelId} class={styles.label}>
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-labelledby={hideLabel ? undefined : labelId}
        aria-label={hideLabel ? label : undefined}
        class={styles.group}
        onKeyDown={onKeyDown}
      >
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <button
              key={option.value}
              ref={(el) => {
                if (el) buttons.current.set(option.value, el);
                else buttons.current.delete(option.value);
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              disabled={disabled}
              class={`${styles.option} ${checked ? styles.optionChecked : ''}`}
              onClick={() => select(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A row of joined buttons with one selected (Task 138): a radio group with
 * one Tab stop, where the arrow keys move and select. `FieldHandle<T>` gives
 * the selected value, as for `Select` and `Tabs`. */
export const SegmentedControl = forwardRef(SegmentedControlBase) as unknown as (<
  T extends string,
>(
  props: SegmentedControlProps<T> & { ref?: Ref<FieldHandle<T>> }
) => VNode) & { displayName?: string };
SegmentedControl.displayName = 'SegmentedControl';
