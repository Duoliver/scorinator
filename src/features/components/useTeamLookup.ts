import { useMemo } from 'preact/hooks';
import { useDatabaseStore } from '@/app/state/databaseStore';
import type { TeamDisplay } from './types';

export type { TeamDisplay };

/** Looks up a team in the Blueprints by slug (Task 109). A league team that
 * no Blueprint has shows its slug and no colour, so a view never breaks on
 * a missing team.
 *
 * The lookup goes through a `Map`, so a view with many rows does not scan
 * the Blueprints once for each row. The function stays the same object until
 * the Blueprints change, so another hook can list it as a dependency. */
export function useTeamLookup(): (slug: string) => TeamDisplay {
  const teams = useDatabaseStore((state) => state.blueprints);
  return useMemo(() => {
    const bySlug = new Map(teams.map((team) => [team.slug, team]));
    return (slug: string): TeamDisplay => {
      const team = bySlug.get(slug);
      return team
        ? { name: team.name, colour: team.colour }
        : { name: slug, colour: '' };
    };
  }, [teams]);
}
