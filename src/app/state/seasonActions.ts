import { uuidV4, type RandomBytes } from '@/engine/identity';
import type { SeasonWrapper } from '@/domain';
import { parseSeasonWrapper } from '@/app/data/databaseFile';
import { cryptoRandomBytes } from '@/app/random';
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
  change: Partial<SeasonWrapper['content']>
): void {
  const { installationUuid } = requireOpenDatabase(useDatabaseStore.getState());
  const changed: SeasonWrapper = {
    ...season,
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
