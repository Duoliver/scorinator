import type { SeasonSummary, SeasonWrapper } from '@/domain';

/** The manifest row of a Season: the fields of its card on the Seasons
 * list (Task 207 choice 5). The row of an open Season comes from the Season
 * itself, so it never goes stale (Task 210 choice 2). */
export function summarizeSeason(wrapper: SeasonWrapper): SeasonSummary {
  const { content: season } = wrapper;
  return {
    uuid: wrapper.uuid,
    name: season.name,
    year: season.year,
    finished: season.finished,
    leagueCount: season.leagues.length,
    teamCount: wrapper.teams.length,
    playoffCount: season.playoffs.length,
  };
}
