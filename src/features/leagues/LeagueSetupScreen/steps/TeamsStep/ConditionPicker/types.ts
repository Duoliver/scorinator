import type { ConditionLevel } from '@/engine/tier-ovr';

export default interface ConditionPickerProps {
  /** The team name, for the names of the button and the panel. */
  teamName: string;
  level: ConditionLevel;
  onChange: (level: ConditionLevel) => void;
}
