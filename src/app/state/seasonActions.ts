import {
  fixedLot,
  getNameKey,
  normalizeTrigram,
  pickJoinNames,
  pickTrigrams,
  uuidV4,
  type RandomBytes,
} from '@/engine/identity';
import type { Rng } from '@/engine/rng';
import { isOvrInTier } from '@/engine/tier-ovr';
import type { SeasonWrapper, TeamInstance } from '@/domain';
import { parseSeasonWrapper } from '@/app/data/databaseFile';
import { cryptoRandomBytes, freshRng } from '@/app/random';
import { newTeamInstances } from './teamInstances';
import {
  isSeasonNameTaken,
  requireOpenDatabase,
  requireRunningSeason,
  useDatabaseStore,
} from './databaseStore';

/** The name and the year of a Season, as the user types them. */
export interface SeasonNameInput {
  name: string;
  year: string;
}

/** Trims the name and the year, and throws for a blank or a taken pair
 * (US-13.1, Task 210 choice 4). The screens check it first with
 * `isSeasonNameTaken`, so this throw is a guard, not a message. */
function checkSeasonName(input: SeasonNameInput, exceptUuid?: string): SeasonNameInput {
  const name = input.name.trim();
  const year = input.year.trim();
  if (name === '' || year === '')
    throw new RangeError('A Season needs a name and a year.');
  if (isSeasonNameTaken(useDatabaseStore.getState(), name, year, exceptUuid)) {
    throw new RangeError(`A Season named "${name}" with the year "${year}" exists.`);
  }
  return { name, year };
}

/** The open Season, or a `RangeError`: a change needs the Season in memory. */
function requireOpenSeason(uuid: string): SeasonWrapper {
  const season = useDatabaseStore.getState().seasons[uuid];
  if (!season) throw new RangeError(`No open Season has the UUID ${uuid}.`);
  return season;
}

/** Puts a changed Season in the store, stamped with the local installation
 * (Task 210 choice 7). */
function storeChangedSeason(
  season: SeasonWrapper,
  change: Partial<SeasonWrapper['content']>,
  teams: TeamInstance[] = season.teams
): void {
  const { installationUuid } = requireOpenDatabase(useDatabaseStore.getState());
  const changed: SeasonWrapper = {
    ...season,
    teams,
    content: {
      ...season.content,
      ...change,
      lastModifiedByInstallation: installationUuid,
    },
  };
  useDatabaseStore.setState((now) => ({
    seasons: { ...now.seasons, [season.uuid]: changed },
  }));
}

/**
 * Makes a new Season and opens it, unsaved (US-13.1). It has no leagues, no
 * teams, and no playoffs. Its UUID is the UUID of its wrapper
 * (`PERSISTENCE.md` §2a). Throws a `RangeError`, and adds nothing, for a
 * blank or taken name and year.
 */
export function createSeason(
  input: SeasonNameInput,
  randomBytes: RandomBytes = cryptoRandomBytes
): SeasonWrapper {
  const { installationUuid } = requireOpenDatabase(useDatabaseStore.getState());
  const { name, year } = checkSeasonName(input);
  const uuid = uuidV4(randomBytes);
  const season: SeasonWrapper = {
    uuid,
    teams: [],
    content: {
      uuid,
      name,
      year,
      finished: false,
      createdByInstallation: installationUuid,
      lastModifiedByInstallation: installationUuid,
      leagues: [],
      playoffs: [],
    },
  };
  useDatabaseStore.setState((now) => ({ seasons: { ...now.seasons, [uuid]: season } }));
  return season;
}

/** Reads a Season from its file and keeps it open, with a saved snapshot,
 * as `openLeague` does. An open Season comes from memory, with its unsaved
 * changes. Rejects with the message for a missing or bad file. */
export async function openSeason(uuid: string): Promise<SeasonWrapper> {
  const opened = useDatabaseStore.getState().seasons[uuid];
  if (opened) return opened;

  const { folder } = requireOpenDatabase(useDatabaseStore.getState());
  const season = parseSeasonWrapper(await folder.readWrapper(uuid));

  // Another call can open the same Season during the read: keep the first.
  const already = useDatabaseStore.getState().seasons[uuid];
  if (already) return already;
  useDatabaseStore.setState((now) => ({
    seasons: { ...now.seasons, [uuid]: season },
    savedSeasons: { ...now.savedSeasons, [uuid]: season },
  }));
  return season;
}

/** Changes the name, the year, or both (US-13.2). The name is in the Season
 * file too, so the Season opens first. A finished Season takes a rename as
 * well: a name is not a result (Task 210, the user). */
export async function renameSeason(
  uuid: string,
  input: SeasonNameInput
): Promise<void> {
  const season = await openSeason(uuid);
  storeChangedSeason(season, checkSeasonName(input, uuid));
}

/** Takes the Season out of the database, with its leagues, roster, and
 * playoffs (US-13.2). The Blueprints stay. The next save removes its file
 * and its row (Task 210 choice 6). A finished Season can go too. */
export function deleteSeason(uuid: string): void {
  useDatabaseStore.setState((now) => {
    const seasons = { ...now.seasons };
    delete seasons[uuid];
    return {
      seasons,
      seasonRows: now.seasonRows.filter((row) => row.uuid !== uuid),
    };
  });
}

/** Makes an open Season read only (US-13.9). */
export function finishSeason(uuid: string): void {
  const season = requireOpenSeason(uuid);
  requireRunningSeason(season);
  storeChangedSeason(season, { finished: true });
}

/** Makes a finished Season open to changes again (US-13.9). */
export function reopenSeason(uuid: string): void {
  storeChangedSeason(requireOpenSeason(uuid), { finished: false });
}

/**
 * Adds Blueprints to the roster of an open Season (US-13.4). Each new team
 * gets its OVR rolled once, from its Tier: its base OVR for every league of
 * the Season. A team whose name the Season has gets its Location or a
 * number, and each new team picks a free trigram, with the rules of Task
 * 208. The fixed lot of the Season and the team breaks a tie, so a join
 * gives the same names and trigrams again. The roster keeps the join order.
 *
 * A Blueprint that is in the roster already is skipped, so a whole list can
 * go in (Task 211 choice 2). Gives the new teams. Throws a `RangeError`, and
 * adds nothing, for an unknown Blueprint or a finished Season.
 */
export function addSeasonTeams(
  seasonUuid: string,
  blueprintUuids: readonly string[],
  rng: Rng = freshRng()
): TeamInstance[] {
  const season = requireOpenSeason(seasonUuid);
  requireRunningSeason(season);
  const byUuid = new Map(
    useDatabaseStore.getState().blueprints.map((b) => [b.uuid, b])
  );
  const inRoster = new Set(season.teams.map((team) => team.blueprintUuid));
  const joining = [...new Set(blueprintUuids)]
    .filter((uuid) => !inRoster.has(uuid))
    .map((uuid) => {
      const blueprint = byUuid.get(uuid);
      if (!blueprint) throw new RangeError(`No Blueprint has the UUID ${uuid}.`);
      return blueprint;
    });
  if (joining.length === 0) return [];

  const rolled = newTeamInstances(joining, rng);
  const lotOf = (uuid: string): number => fixedLot(seasonUuid, uuid);
  const names = pickJoinNames(
    season.teams.map((team) => team.name),
    rolled.map((team, index) => ({
      id: team.blueprintUuid,
      name: team.name,
      location: joining[index].location,
      ovr: team.ovr,
      lot: lotOf(team.blueprintUuid),
    }))
  );
  const trigrams = pickTrigrams([
    ...season.teams.map((team) => ({
      id: team.blueprintUuid,
      name: team.name,
      tier: team.tier,
      ovr: team.ovr,
      trigrams: [],
      lot: lotOf(team.blueprintUuid),
      fixed: team.trigram,
    })),
    ...rolled.map((team, index) => ({
      id: team.blueprintUuid,
      name: team.name,
      tier: team.tier,
      ovr: team.ovr,
      trigrams: joining[index].trigrams,
      lot: lotOf(team.blueprintUuid),
    })),
  ]);
  const added = rolled.map((team) => ({
    ...team,
    name: names.get(team.blueprintUuid) ?? team.name,
    trigram: trigrams.get(team.blueprintUuid)?.trigram ?? '',
  }));
  storeChangedSeason(season, {}, [...season.teams, ...added]);
  return added;
}

/** The fields of a Season team that the user edits (US-13.4). */
export type SeasonTeamChanges = Partial<
  Pick<TeamInstance, 'name' | 'colour' | 'tier' | 'ovr' | 'trigram'>
>;

/**
 * Edits one Season team of an open Season (US-13.4). Every league of the
 * Season uses this one team, so the change reaches each league. The name and
 * the trigram stay unique in the Season, and the OVR stays in the range of
 * the Tier. The roll on a Tier change happens in the drawer, as in the
 * wizard (Task 211 choice 5). Throws a `RangeError`, and changes nothing, for
 * a change that breaks a rule, or for a finished Season.
 */
export function updateSeasonTeam(
  seasonUuid: string,
  blueprintUuid: string,
  changes: SeasonTeamChanges
): void {
  const season = requireOpenSeason(seasonUuid);
  requireRunningSeason(season);
  const team = season.teams.find(
    (candidate) => candidate.blueprintUuid === blueprintUuid
  );
  if (!team) {
    throw new RangeError(
      `The Season has no team with the Blueprint UUID ${blueprintUuid}.`
    );
  }
  const others = season.teams.filter((candidate) => candidate !== team);
  const changed: TeamInstance = { ...team, ...changes };

  changed.name = changed.name.trim();
  if (changed.name === '') throw new RangeError('A Season team needs a name.');
  if (others.some((other) => getNameKey(other.name) === getNameKey(changed.name))) {
    throw new RangeError(`Another Season team has the name "${changed.name}".`);
  }
  if (!isOvrInTier(changed.ovr, changed.tier)) {
    throw new RangeError(
      `The OVR ${changed.ovr} is not in the range of Tier ${changed.tier}.`
    );
  }
  const trigram = normalizeTrigram(changed.trigram);
  if (trigram === null) {
    throw new RangeError(
      `The trigram "${changed.trigram}" is not 3 letters or digits.`
    );
  }
  if (others.some((other) => other.trigram === trigram)) {
    throw new RangeError(`Another Season team has the trigram "${trigram}".`);
  }
  changed.trigram = trigram;

  storeChangedSeason(
    season,
    {},
    season.teams.map((candidate) => (candidate === team ? changed : candidate))
  );
}
