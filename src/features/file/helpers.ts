import type { SelectOption } from '@/design-system';
import type { LeagueRecord } from '@/features/leagues/types';

export const toLeagueOptions = (leagues: readonly LeagueRecord[]): SelectOption[] =>
  leagues.map((league) => ({ label: league.name, value: league.slug }));

/** The current league when it is open, or else the first league, or else
 * an empty string. */
export const pickDefaultLeagueSlug = (
  leagues: readonly LeagueRecord[],
  currentLeagueSlug: string | null
): string =>
  leagues.some((league) => league.slug === currentLeagueSlug)
    ? (currentLeagueSlug as string)
    : (leagues[0]?.slug ?? '');
