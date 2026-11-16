import { uuidV4, type RandomBytes } from '@/engine/identity';
import type { Rng } from '@/engine/rng';
import { playTie, TieFormat, type TieRules, type TieTeam } from '@/engine/tiebreak';
import type { ConditionLevels, Playoff, SeasonWrapper } from '@/domain';
import { cryptoRandomBytes, freshRng } from '@/app/random';
import {
  isPlayoffNameTaken,
  requireOpenDatabase,
  requireRunningOpenSeason,
  useDatabaseStore,
} from './databaseStore';
import { getRealOvr, pickConditions } from './condition';

/** A new playoff as the user sets it (US-13.7): a name, two Season teams, and
 * the rules of the tie. */
export interface PlayoffInput {
  name: string;
  team1Uuid: string;
  team2Uuid: string;
  rules: TieRules;
  /** The condition levels of the dialog, by Blueprint UUID (US-14.3). A
   * team with no entry plays at level 0. */
  conditions?: Readonly<ConditionLevels>;
}

/** Puts the new playoff list in the store, with the Season stamped. */
function storePlayoffs(
  season: SeasonWrapper,
  playoffs: Playoff[],
  installationUuid: string
): void {
  const changed: SeasonWrapper = {
    ...season,
    content: {
      ...season.content,
      lastModifiedByInstallation: installationUuid,
      playoffs,
    },
  };
  useDatabaseStore.setState((now) => ({
    seasons: { ...now.seasons, [season.uuid]: changed },
  }));
}

/**
 * Adds a playoff with no result to an open, running Season (US-13.7). The
 * name is trimmed, and unique in the Season in any case. A single match has
 * no away goals, so its rule is stored as off (Task 217 choice 2).
 *
 * Throws a `RangeError`, and changes nothing, for a blank or taken name,
 * one team twice, a team that is not in the roster, a condition level of a
 * team that is not in the playoff or a value that is not a level, a Season
 * that is not open, and a finished Season. The dialog checks the same rules
 * first, so the throw is a guard.
 */
export function createPlayoff(
  seasonUuid: string,
  input: PlayoffInput,
  randomBytes: RandomBytes = cryptoRandomBytes
): Playoff {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const season = requireRunningOpenSeason(state, seasonUuid);
  const name = input.name.trim();
  if (name === '') throw new RangeError('A playoff needs a name.');
  if (isPlayoffNameTaken(season, name)) {
    throw new RangeError(`The Season has a playoff named "${name}".`);
  }
  if (input.team1Uuid === input.team2Uuid) {
    throw new RangeError('A playoff needs two different teams.');
  }
  const roster = new Set(season.teams.map((team) => team.blueprintUuid));
  for (const uuid of [input.team1Uuid, input.team2Uuid]) {
    if (!roster.has(uuid)) {
      throw new RangeError(`The Season has no team with the Blueprint UUID ${uuid}.`);
    }
  }

  const isSingle = input.rules.format === TieFormat.SINGLE_MATCH;
  const playoff: Playoff = {
    uuid: uuidV4(randomBytes),
    name,
    team1Uuid: input.team1Uuid,
    team2Uuid: input.team2Uuid,
    rules: { ...input.rules, awayGoals: isSingle ? false : input.rules.awayGoals },
    ...pickConditions(
      input.conditions,
      new Set([input.team1Uuid, input.team2Uuid]),
      'The playoff'
    ),
  };
  storePlayoffs(season, [...season.content.playoffs, playoff], installationUuid);
  return playoff;
}

/**
 * Plays a playoff of an open, running Season with `playTie`, and keeps the
 * result (US-13.7). Each team plays with the current base OVR of its Season
 * team, with its level in this playoff (US-14.3).
 *
 * The engine puts its "higher seed" in the home slot of a single match, at
 * a neutral venue, and at home in the second leg. So Team 1 is the higher
 * seed of a single match (Task 217 choice 3, option A), and Team 2 the
 * higher seed of a two-legged tie: Team 1 plays the first leg at home
 * (choice 4).
 *
 * Throws a `RangeError`, and changes nothing, for an unknown playoff, a
 * playoff with a result (choice 6: no re-scorinate, future features §41),
 * a Season that is not open, and a finished Season.
 */
export function playPlayoff(
  seasonUuid: string,
  playoffUuid: string,
  rng: Rng = freshRng()
): void {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const season = requireRunningOpenSeason(state, seasonUuid);
  const playoff = season.content.playoffs.find(
    (candidate) => candidate.uuid === playoffUuid
  );
  if (!playoff) {
    throw new RangeError(`The Season has no playoff with the UUID ${playoffUuid}.`);
  }
  if (playoff.result) {
    throw new RangeError(`The playoff "${playoff.name}" has a result already.`);
  }

  const getTieTeam = (uuid: string): TieTeam<string> => {
    const team = season.teams.find((candidate) => candidate.blueprintUuid === uuid);
    if (!team)
      throw new RangeError(`The Season has no team with the Blueprint UUID ${uuid}.`);
    return { id: uuid, ovr: getRealOvr(team.ovr, playoff.conditions, uuid) };
  };
  const team1 = getTieTeam(playoff.team1Uuid);
  const team2 = getTieTeam(playoff.team2Uuid);
  const [higher, lower] =
    playoff.rules.format === TieFormat.SINGLE_MATCH ? [team1, team2] : [team2, team1];
  const result = playTie(higher, lower, playoff.rules, rng);

  storePlayoffs(
    season,
    season.content.playoffs.map((candidate) =>
      candidate === playoff ? { ...playoff, result } : candidate
    ),
    installationUuid
  );
}
