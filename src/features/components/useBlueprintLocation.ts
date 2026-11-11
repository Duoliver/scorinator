import { useMemo } from 'preact/hooks';
import { useDatabaseStore } from '@/app/state/databaseStore';

/** The Location of the Blueprint of an Instance, read from the Blueprint
 * (US-09.3): an Instance does not copy it, so an edit shows in each league
 * at once. `''` for a deleted Blueprint or an empty Location. */
export function useBlueprintLocation(): (blueprintUuid: string) => string {
  const blueprints = useDatabaseStore((state) => state.blueprints);
  return useMemo(() => {
    const byUuid = new Map(blueprints.map((b) => [b.uuid, b.location]));
    return (blueprintUuid: string): string => byUuid.get(blueprintUuid) ?? '';
  }, [blueprints]);
}
