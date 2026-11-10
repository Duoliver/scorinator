import type { PlanZone, ZonePlan } from '@/engine/phases';

export default interface ZoneDrawerProps {
  /** "Zones", or "Zones · Phase 2" in a league with phase tabs. */
  title: string;
  /** The plan of the phase, with its stored zones. */
  plan: ZonePlan;
  onSave: (zones: PlanZone[]) => void;
  onCancel: () => void;
}
