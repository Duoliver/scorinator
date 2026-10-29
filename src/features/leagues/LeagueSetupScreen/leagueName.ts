import { slug } from '@/engine/identity';

export const LEAGUE_NAME_INVALID =
  'Enter a league name with at least one letter or number.';

/** Why a league name cannot be used, or `null` when it can. The name must
 * give a slug, because the export file names come from it (US-10.1), and
 * `slug()` throws for a blank or symbols-only name. Two leagues can share a
 * name: routes use the league UUID (Task 160). The Details step shows the
 * result next to Next, and `useLeagueSetup`'s `handleCreate` checks it again,
 * since the step tabs can reach Review past a disabled Next. */
export function leagueNameProblem(name: string): string | null {
  try {
    slug(name.trim());
  } catch {
    return LEAGUE_NAME_INVALID;
  }
  return null;
}
