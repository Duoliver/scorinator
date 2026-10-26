import { useMemo } from 'preact/hooks';
import { useTeamsStore } from '@/app/state/teamsStore';
import type { TeamDisplay } from './types';

export type { TeamDisplay };

/** Looks up a team in the shared roster by slug. A league team that is no
 * longer in the roster shows its slug and no colour, so a view never breaks
 * on a missing team.
 *
 * The lookup goes through a `Map`, so a view with many rows does not scan
 * the roster once for each row. The function stays the same object until
 * the roster changes, so another hook can list it as a dependency. */
export function useTeamLookup(): (slug: string) => TeamDisplay {
  const teams = useTeamsStore((state) => state.teams);
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
