import type { SeasonSummary } from '@/domain';
import { formatCount, formatSeasonLabel } from '@/features/seasons/seasonText';

/** The subtitle of the list: "4 Seasons · 1 finished", or "No Seasons". */
export function formatSeasonSubtitle(rows: readonly SeasonSummary[]): string {
  if (rows.length === 0) return 'No Seasons';
  const finished = rows.filter((row) => row.finished).length;
  return `${rows.length} Season${rows.length === 1 ? '' : 's'} · ${finished} finished`;
}

/** True when the search text is a part of the name, of the year, or of the
 * name and the year together, in any case (US-16.5, Task 212 choice 6). An
 * empty search matches each Season. */
export function isSeasonMatch(row: SeasonSummary, search: string): boolean {
  const text = search.trim().toLowerCase();
  if (text === '') return true;
  return [row.name, row.year, formatSeasonLabel(row)].some((value) =>
    value.toLowerCase().includes(text)
  );
}

/** "a", "a and b", or "a, b, and c": a list in words. Two parts take no
 * comma (Task 250). */
function joinWithAnd(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('');
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

/** The text of the delete confirm: what goes with the Season, and what
 * stays (US-13.2). A part with a count of 0 does not show. */
export function formatDeleteMessage(row: SeasonSummary): string {
  const parts = [
    row.leagueCount > 0 ? `its ${formatCount(row.leagueCount, 'league')}` : null,
    row.teamCount > 0 ? `its roster of ${formatCount(row.teamCount, 'team')}` : null,
    row.playoffCount > 0 ? `its ${formatCount(row.playoffCount, 'playoff')}` : null,
  ].filter((part): part is string => part !== null);
  const goes = parts.length === 0 ? 'the Season' : joinWithAnd(parts);
  return `This deletes ${goes}. The team Blueprints stay in the Teams module.`;
}

export const SEASON_TAKEN =
  'A Season with this name and year exists. Change the name or the year.';
