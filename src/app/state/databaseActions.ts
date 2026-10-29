import { uuidV4, type RandomBytes } from '@/engine/identity';
import type { LeagueWrapper, Manifest } from '@/domain';
import type { DatabaseFolder } from '@/persistence/types';
import {
  parseLeagueWrapper,
  parseManifestRecord,
  serializeLeagueWrapper,
  serializeManifestRecord,
} from '@/app/data/databaseFile';
import { getErrorMessage } from '@/app/getErrorMessage';
import { cryptoRandomBytes } from '@/app/random';
import {
  currentRows,
  isManifestUnsaved,
  requireOpenDatabase,
  unsavedLeagues,
  useDatabaseStore,
} from './databaseStore';

/**
 * Opens the database folder at start (Task 76 a). With no manifest yet, the
 * first start, it makes the installation UUID and an empty manifest, and
 * saves the manifest at once, so the UUID never changes (US-11.1). A folder
 * or manifest that cannot be read gives the `error` status with the message,
 * and loads nothing. It never throws.
 */
export async function openDatabase(
  folder: DatabaseFolder,
  randomBytes: RandomBytes = cryptoRandomBytes
): Promise<void> {
  try {
    const text = await folder.readManifest();
    let manifest: Manifest;
    if (text === null) {
      manifest = {
        installationUuid: uuidV4(randomBytes),
        blueprints: [],
        wrappers: [],
      };
      await folder.save([], serializeManifestRecord(manifest));
    } else {
      manifest = parseManifestRecord(text);
    }
    useDatabaseStore.setState({
      status: { kind: 'open' },
      folder,
      installationUuid: manifest.installationUuid,
      blueprints: manifest.blueprints,
      rows: manifest.wrappers,
      leagues: {},
      savedBlueprints: manifest.blueprints,
      savedRows: manifest.wrappers,
      savedLeagues: {},
    });
  } catch (error) {
    useDatabaseStore.setState({
      ...useDatabaseStore.getInitialState(),
      status: { kind: 'error', message: getErrorMessage(error) },
    });
  }
}

/**
 * Gives one league, read from its file the first time and from memory after
 * that, with its unsaved changes (`PERSISTENCE.md` §2b). Its row comes from
 * the league from now on, so a row that is one save behind makes the
 * manifest unsaved (Task 76 edge case). Rejects with the message for a
 * missing or bad file.
 */
export async function openLeague(uuid: string): Promise<LeagueWrapper> {
  const opened = useDatabaseStore.getState().leagues[uuid];
  if (opened) return opened;

  const { folder } = requireOpenDatabase(useDatabaseStore.getState());
  const wrapper = parseLeagueWrapper(await folder.readWrapper(uuid));

  // Another call can open the same league during the read: keep the first.
  const already = useDatabaseStore.getState().leagues[uuid];
  if (already) return already;
  useDatabaseStore.setState((state) => ({
    leagues: { ...state.leagues, [uuid]: wrapper },
    savedLeagues: { ...state.savedLeagues, [uuid]: wrapper },
  }));
  return wrapper;
}

/**
 * Save and Ctrl+S (Task 76 b): writes each unsaved league, then the
 * manifest when it is unsaved, in one `folder.save` call, manifest last.
 * With nothing unsaved it writes nothing. After the write, the snapshots
 * point at the objects it wrote, so a change made during the write stays
 * unsaved. A failed write rejects and changes no snapshot.
 */
export async function saveDatabase(): Promise<void> {
  const state = useDatabaseStore.getState();
  const { folder, installationUuid } = requireOpenDatabase(state);

  const leagues = unsavedLeagues(state);
  const manifestUnsaved = isManifestUnsaved(state);
  if (leagues.length === 0 && !manifestUnsaved) return;

  const rows = currentRows(state);
  const manifest = !manifestUnsaved
    ? null
    : serializeManifestRecord({
        installationUuid,
        blueprints: state.blueprints,
        wrappers: rows,
      });
  await folder.save(
    leagues.map((wrapper) => ({
      uuid: wrapper.uuid,
      contents: serializeLeagueWrapper(wrapper),
    })),
    manifest
  );

  useDatabaseStore.setState((now) => ({
    savedLeagues: {
      ...now.savedLeagues,
      ...Object.fromEntries(leagues.map((wrapper) => [wrapper.uuid, wrapper])),
    },
    ...(manifest === null
      ? {}
      : { rows, savedRows: rows, savedBlueprints: state.blueprints }),
  }));
}
