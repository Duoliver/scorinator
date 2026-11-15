import type { SeasonWrapper } from '@/domain';
import { seasonLeagueDetailPath } from '@/app/routes';
import { getSeasonLeagueView } from '@/app/state/databaseStore';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import { useBlueprintLocation } from '@/features/components';
import { formatProgressBadge } from '@/features/components/leagueSummary';
import { getResumeContent, type ResumeCard } from './ResumeTab';

/** The cards of the Resume tab (US-13.8, Task 221): one for each league of
 * the Season, in Season order, with the badge of its league card. */
export function useResume(season: SeasonWrapper | undefined): ResumeCard[] {
  const locationOf = useBlueprintLocation();
  if (!season) return [];
  const roster = new Map(season.teams.map((team) => [team.blueprintUuid, team]));
  return season.content.leagues.map((league): ResumeCard => {
    const view = getSeasonLeagueView(season, league);
    const { progress } = summarizeLeague(view);
    const content = getResumeContent(view);
    return {
      uuid: league.uuid,
      name: league.name,
      progress: formatProgressBadge(progress),
      isComplete: progress.kind === 'completed',
      href: seasonLeagueDetailPath(season.uuid, league.uuid),
      rows: content.rows.map((row) => ({
        key: row.key,
        place: row.place,
        name: roster.get(row.teamUuid)?.name ?? '',
        location: locationOf(row.teamUuid),
        label: row.label,
        tone: row.tone,
      })),
      note: content.note,
    };
  });
}
