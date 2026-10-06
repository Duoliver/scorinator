import { slug } from '@/engine/identity';

export const LEAGUE_NAME_INVALID =
  'Enter a league name with at least one letter or number.';
export const LEAGUE_NAME_TAKEN = 'A league with this name already exists.';

/** Why a league name cannot be used, or `null` when it can. A league's slug
 * comes from its name (`leagueActions.addLeague`), so the name must give a
 * slug — `slug()` throws for a blank or symbols-only name — and no open
 * league may use that slug already (Task 40). The Details step shows the
 * result next to Next, and `LeagueSetupScreen.handleCreate` checks it again,
 * since the step tabs can reach Review past a disabled Next. */
export function leagueNameProblem(
  name: string,
  takenSlugs: readonly string[]
): string | null {
  let nameSlug: string;
  try {
    nameSlug = slug(name.trim());
  } catch {
    return LEAGUE_NAME_INVALID;
  }
  return takenSlugs.includes(nameSlug) ? LEAGUE_NAME_TAKEN : null;
}
