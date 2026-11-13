import type { SeasonSummary } from '@/domain';

/* The texts of a Season that the Seasons list and the Season view share
 * (Task 213). */

/** "No teams", "1 team", "8 teams": a count in words, for the card text. */
export function formatCount(count: number, noun: string): string {
  if (count === 0) return `No ${noun}s`;
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** The meta line of a Season card: "3 leagues · 8 teams · 2 playoffs". */
export function formatSeasonMeta(row: SeasonSummary): string {
  return [
    formatCount(row.leagueCount, 'league'),
    formatCount(row.teamCount, 'team'),
    formatCount(row.playoffCount, 'playoff'),
  ].join(' · ');
}

/** The name and the year of a Season, as one label: "Liga Norte 2026". */
export function formatSeasonLabel(row: Pick<SeasonSummary, 'name' | 'year'>): string {
  return `${row.name} ${row.year}`;
}
