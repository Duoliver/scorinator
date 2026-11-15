import type { SeasonSummary, SeasonWrapper } from '@/domain';

/* The texts of a Season, so each screen shows a Season the same way (Task
 * 218). */

/** The notice of a finished Season (US-13.9), one text on each screen. */
export const FINISHED_SEASON_NOTICE =
  'This Season is finished. It is read only. Reopen it to change it.';

/** The name and the year of a Season, as one label: "Liga Norte 2026". */
export function formatSeasonLabel(row: Pick<SeasonSummary, 'name' | 'year'>): string {
  return `${row.name} ${row.year}`;
}

/** The names of the leagues of the Season that a team plays in. */
export function findLeagueNames(
  season: SeasonWrapper,
  blueprintUuid: string
): string[] {
  return season.content.leagues
    .filter((league) => league.teamUuids.includes(blueprintUuid))
    .map((league) => league.name);
}
