import type { SegmentedOption } from '@/design-system';
import type { ConditionLevel } from '@/engine/tier-ovr';

/** The name of each level, for a screen reader and the mouse tooltip
 * (US-14.1). The two ends carry the words of the control ends. */
const CONDITION_NAMES: Readonly<Record<ConditionLevel, string>> = {
  [-2]: 'Crisis, level -2',
  [-1]: 'Level -1',
  0: 'Level 0',
  1: 'Level +1',
  2: 'Peak, level +2',
};

/** The icon of each level: Unicode characters, not an icon library
 * (US-14.1). */
const CONDITION_ICONS: Readonly<Record<ConditionLevel, string>> = {
  [-2]: '↓',
  [-1]: '↘',
  0: '–',
  1: '↗',
  2: '↑',
};

/** The name of a level, such as "Level +1". */
export function getConditionName(level: ConditionLevel): string {
  return CONDITION_NAMES[level];
}

/** The icon of a level, such as "↗". */
export function getConditionIcon(level: ConditionLevel): string {
  return CONDITION_ICONS[level];
}

/** The five options of the control, from the crisis to the peak. */
export const CONDITION_OPTIONS: readonly SegmentedOption<ConditionLevel>[] = (
  [-2, -1, 0, 1, 2] as const
).map((value) => ({
  value,
  label: CONDITION_ICONS[value],
  ariaLabel: CONDITION_NAMES[value],
}));
