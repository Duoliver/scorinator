import type { JSX } from 'preact';
import { Popover } from '@/design-system';
import {
  ConditionControl,
  getConditionIcon,
  getConditionName,
} from '@/features/components';
import type ConditionPickerProps from './types';

export type { ConditionPickerProps };

/**
 * The condition of one team in the wizard (US-14.2, Task 223 demo): the
 * icon of its level in a square button, which opens the control below it.
 * A pick sets the level and closes the panel.
 */
export function ConditionPicker({
  teamName,
  level,
  onChange,
}: ConditionPickerProps): JSX.Element {
  const panelLabel = `Condition of ${teamName}`;
  return (
    <Popover
      label={`${panelLabel}: ${getConditionName(level)}`}
      icon={getConditionIcon(level)}
      panelLabel={panelLabel}
    >
      {(close) => (
        <ConditionControl
          label={panelLabel}
          defaultLevel={level}
          onChange={(next) => {
            onChange(next);
            close();
          }}
        />
      )}
    </Popover>
  );
}
ConditionPicker.displayName = 'ConditionPicker';
