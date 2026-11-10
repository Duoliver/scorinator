import { useState } from 'preact/hooks';
import { checkZones, type PlanZone, type ZonePlan } from '@/engine/phases';

/** The zones of the drawer while the user edits them, and whether "Save"
 * can run: not while the zones have a problem (Task 189). */
export function useZoneDrawer(
  plan: ZonePlan,
  onSave: (zones: PlanZone[]) => void
): {
  setZones: (zones: PlanZone[]) => void;
  canSave: boolean;
  handleSave: () => void;
} {
  const [zones, setZones] = useState<PlanZone[]>(plan.zones ?? []);
  return {
    setZones,
    canSave: checkZones({ ...plan, zones }).length === 0,
    handleSave: () => onSave(zones),
  };
}
