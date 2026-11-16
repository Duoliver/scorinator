import type { JSX } from 'preact';
import { SegmentedControl } from '@/design-system';
import type { ConditionLevel } from '@/engine/tier-ovr';
import type ConditionControlProps from './types';
import { CONDITION_OPTIONS } from './helpers';

export type { ConditionControlProps };

/**
 * The condition control of US-14.1: the five level icons in a row, with
 * "Crisis" and "Peak" at the ends, as in the Task 223 demo. One control for
 * every place that sets a level (Task 227 choice 5).
 */
export function ConditionControl({
  label,
  defaultLevel,
  onChange,
  hideEnds = false,
  disabled = false,
}: ConditionControlProps): JSX.Element {
  return (
    <SegmentedControl<ConditionLevel>
      label={label}
      hideLabel
      options={[...CONDITION_OPTIONS]}
      defaultValue={defaultLevel}
      onChange={onChange}
      iconOptions
      startLabel={hideEnds ? undefined : 'Crisis'}
      endLabel={hideEnds ? undefined : 'Peak'}
      disabled={disabled}
    />
  );
}
ConditionControl.displayName = 'ConditionControl';
