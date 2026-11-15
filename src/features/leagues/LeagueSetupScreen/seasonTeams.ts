import type { SeasonWrapper, TeamBlueprint, TeamInstance } from '@/domain';
import { joinSeasonRoster } from '@/app/state/seasonRoster';

/** The team list of a wizard in a Season, as the create gives it (Task 218
 * choice 6). A Season team shows the roster values. A joining team shows
 * the name and the trigram of the Task 208 rules. */
export interface SeasonTeamRows {
  season: SeasonWrapper;
  rows: TeamInstance[];
  /** The Blueprint UUIDs of the teams that join the Season at create. */
  joining: ReadonlySet<string>;
}

/** The rows of the team list in a Season. The join preview uses the same
 * rules as `createSeasonLeague`, so the list shows what the create makes.
 * A fixed trigram that the rules reject keeps the list as typed: the create
 * then says why. */
export function getSeasonTeamRows(
  season: SeasonWrapper,
  teams: readonly TeamInstance[],
  blueprints: readonly TeamBlueprint[],
  fixedTrigrams: Readonly<Record<string, string>>
): SeasonTeamRows {
  const roster = new Map(season.teams.map((team) => [team.blueprintUuid, team]));
  const blueprintOf = new Map(blueprints.map((b) => [b.uuid, b]));
  const outside = teams.filter((team) => !roster.has(team.blueprintUuid));
  let joined = new Map<string, TeamInstance>();
  try {
    const preview = joinSeasonRoster(
      season.uuid,
      season.teams,
      outside.map((team) => ({
        team,
        location: blueprintOf.get(team.blueprintUuid)?.location ?? '',
        trigrams: blueprintOf.get(team.blueprintUuid)?.trigrams ?? [],
        fixedTrigram: fixedTrigrams[team.blueprintUuid],
      }))
    );
    joined = new Map(preview.map((team) => [team.blueprintUuid, team]));
  } catch {
    // A clash of fixed trigrams: the rows keep the typed values.
  }
  return {
    season,
    rows: teams.map(
      (team) => roster.get(team.blueprintUuid) ?? joined.get(team.blueprintUuid) ?? team
    ),
    joining: new Set(outside.map((team) => team.blueprintUuid)),
  };
}

/** "Rests", "In 1 league", "In 2 leagues": where a Season team plays now
 * (Task 215 point 6). */
export function formatSeasonTeamStatus(leagueCount: number): string {
  if (leagueCount === 0) return 'Rests';
  return `In ${leagueCount} league${leagueCount === 1 ? '' : 's'}`;
}

export const NOT_IN_SEASON = 'Not in the Season';
export const JOINS_SEASON = 'Joins the Season';

/** The note of the Edit drawer of a joining team (Task 215, round 7). */
export function formatJoinNote(teamName: string, seasonLabel: string): string {
  return `${teamName} joins ${seasonLabel} when you create the league. This OVR and Tier become its Season base.`;
}
