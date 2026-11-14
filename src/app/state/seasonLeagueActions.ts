import { uuidV4, type RandomBytes } from '@/engine/identity';
import { isOvrInTier } from '@/engine/tier-ovr';
import type { LeagueWrapper, SeasonWrapper } from '@/domain';
import { cryptoRandomBytes } from '@/app/random';
import {
  requireOpenDatabase,
  requireRunningSeason,
  getSeasonLeagueView,
  useDatabaseStore,
} from './databaseStore';
import { buildLeagueContent, checkTeamList, type CreateLeagueInput } from './newLeague';
import { joinSeasonRoster, type JoiningTeam } from './seasonRoster';

/**
 * Creates a league in an open, running Season, and keeps it in the Season,
 * unsaved (US-13.5, Task 216 choice 5). It is a full MVP2 league, built as
 * `createLeague` builds one. Gives the new league as `findLeagueWrapper`
 * gives it.
 *
 * A Season team plays as the roster has it: the OVR, the name, and the
 * trigram of the input do not count. A team from outside the roster joins
 * it with the OVR and the Tier of the wizard, rolled at the add (Task 215,
 * round 7), and the name and trigram rules of Task 208. A trigram fixed in
 * the wizard stays. The join and the create are one change.
 *
 * Throws a `RangeError`, and changes nothing, for a Season that is not
 * open, a finished Season (US-13.9), a Blueprint UUID twice in the list, a
 * joining OVR outside its Tier, a fixed trigram that a Season team has, and
 * the plan problems of `createLeague`.
 */
export function createSeasonLeague(
  seasonUuid: string,
  input: CreateLeagueInput,
  randomBytes: RandomBytes = cryptoRandomBytes
): LeagueWrapper {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const season = state.seasons[seasonUuid];
  if (!season) throw new RangeError(`No open Season has the UUID ${seasonUuid}.`);
  requireRunningSeason(season);
  checkTeamList(input.teams);

  const inRoster = new Set(season.teams.map((team) => team.blueprintUuid));
  const blueprintOf = new Map(state.blueprints.map((b) => [b.uuid, b]));
  const joining = input.teams
    .filter((team) => !inRoster.has(team.blueprintUuid))
    .map((team): JoiningTeam => {
      if (!isOvrInTier(team.ovr, team.tier)) {
        throw new RangeError(
          `The OVR ${team.ovr} of ${team.name} is not in the range of Tier ${team.tier}.`
        );
      }
      // A Blueprint deleted during the setup still joins (US-09.4).
      const source = blueprintOf.get(team.blueprintUuid);
      return {
        team,
        location: source?.location ?? '',
        trigrams: source?.trigrams ?? [],
        fixedTrigram: input.fixedTrigrams?.[team.blueprintUuid],
      };
    });
  const joined = joinSeasonRoster(seasonUuid, season.teams, joining);
  const teamUuids = input.teams.map((team) => team.blueprintUuid);
  const uuid = uuidV4(randomBytes);
  const league = {
    ...buildLeagueContent(input, teamUuids, uuid, installationUuid),
    teamUuids,
  };

  const changed: SeasonWrapper = {
    ...season,
    teams: joined.length > 0 ? [...season.teams, ...joined] : season.teams,
    content: {
      ...season.content,
      lastModifiedByInstallation: installationUuid,
      leagues: [...season.content.leagues, league],
    },
  };
  useDatabaseStore.setState((now) => ({
    seasons: { ...now.seasons, [seasonUuid]: changed },
  }));
  return getSeasonLeagueView(changed, league);
}
