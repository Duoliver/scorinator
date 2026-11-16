import type { ConditionLevel } from '@/engine/tier-ovr';

export default interface ConditionControlProps {
  /** The name of the radio group, such as "Condition of Porto Velho SC". */
  label: string;
  /** The level that is selected on mount. The control owns the value
   * after that, as `SegmentedControl` does. */
  defaultLevel: ConditionLevel;
  onChange?: (level: ConditionLevel) => void;
  /** Hides "Crisis" and "Peak", as below a playoff team field (Task 223). */
  hideEnds?: boolean;
  disabled?: boolean;
}
