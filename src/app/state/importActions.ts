import {
  isSameContent,
  planImport,
  resolveImport,
  uniqueSlug,
  uuidV4,
  type ImportChoice,
  type ImportCounts,
  type ImportStep,
  type RandomBytes,
} from '@/engine/identity';
import type { LeagueWrapper, Provenance, TeamBlueprint } from '@/domain';
import { cryptoRandomBytes } from '@/app/random';
import { openLeague } from './databaseActions';
import { requireOpenDatabase, useDatabaseStore } from './databaseStore';

/**
 * The import of Blueprints and leagues (US-11.2, US-10.3, Task 144). Each
 * import has two steps: a plan, which sorts each selected entity as new,
 * same, or conflict, and an apply, which takes the choices of the "Resolve
 * conflicts" dialog. The generic rules live in `engine/identity` (choice 1).
 * An import never changes a local entity: it only adds entities.
 */

/** The provenance fields. They do not count in "same content" (US-11.2). */
const PROVENANCE_KEYS: ReadonlySet<keyof Provenance> = new Set([
  'createdByInstallation',
  'lastModifiedByInstallation',
]);

const sameContent = (a: object, b: object): boolean =>
  isSameContent(a, b, PROVENANCE_KEYS);

/** The counts of a league import, with the embedded Blueprints it added. */
export interface LeagueImportCounts extends ImportCounts {
  blueprintsAdded: number;
}

/** Sorts the selected Blueprints of a file. Needs an open database. */
export function planBlueprintImport(
  incoming: readonly TeamBlueprint[]
): ImportStep<TeamBlueprint>[] {
  const state = useDatabaseStore.getState();
  requireOpenDatabase(state);
  const local = new Map(state.blueprints.map((b) => [b.uuid, b]));
  return planImport(incoming, (uuid) => local.get(uuid), sameContent);
}

/**
 * Applies a Blueprint plan. A new Blueprint keeps its UUID and provenance
 * (US-11.1). A Blueprint imported as new gets a fresh UUID and the local
 * installation in both provenance fields. Each added Blueprint gets a free
 * slug by the `-2` rule, also a new one (choice 4). Returns the counts.
 */
export function importBlueprints(
  steps: readonly ImportStep<TeamBlueprint>[],
  choices: ReadonlyMap<string, ImportChoice>,
  randomBytes: RandomBytes = cryptoRandomBytes
): ImportCounts {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const { toAdd, counts } = resolveImport(steps, (uuid) => choices.get(uuid));
  const blueprints = [...state.blueprints];
  for (const { item, asNew } of toAdd) {
    const added = asNew ? forkEntity(item, installationUuid, randomBytes) : item;
    blueprints.push(withFreeSlug(added, blueprints));
  }
  if (toAdd.length > 0) useDatabaseStore.setState({ blueprints });
  return counts;
}

/**
 * Sorts the selected leagues of a file. A known league that is not loaded
 * loads from its file first, so the plan can compare it (choice 3). It stays
 * opened after that, with nothing unsaved. Rejects as `openLeague` does.
 */
export async function planLeagueImport(
  incoming: readonly LeagueWrapper[]
): Promise<ImportStep<LeagueWrapper>[]> {
  const state = useDatabaseStore.getState();
  requireOpenDatabase(state);
  const known = new Set([
    ...state.rows.map((row) => row.uuid),
    ...Object.keys(state.leagues),
  ]);
  const toLoad = new Set(
    incoming.map((wrapper) => wrapper.uuid).filter((uuid) => known.has(uuid))
  );
  await Promise.all([...toLoad].map((uuid) => openLeague(uuid)));
  const { leagues } = useDatabaseStore.getState();
  return planImport(incoming, (uuid) => leagues[uuid], sameContent);
}

/**
 * Applies a league plan. A new league keeps its UUID and provenance. A
 * league imported as new gets a fresh UUID and the local provenance, and
 * keeps its name and its Instances. Each added league is unsaved, so Ctrl+S
 * writes its wrapper file.
 *
 * `embedded` holds the Blueprint snapshots of the file. For each added
 * league, a snapshot that one of its Instances names is added when its UUID
 * is unknown, and the local Blueprint stays when it is known, with no
 * prompt (US-10.3). A skipped or same league adds no Blueprint.
 */
export function importLeagues(
  steps: readonly ImportStep<LeagueWrapper>[],
  choices: ReadonlyMap<string, ImportChoice>,
  embedded: readonly TeamBlueprint[],
  randomBytes: RandomBytes = cryptoRandomBytes
): LeagueImportCounts {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const { toAdd, counts } = resolveImport(steps, (uuid) => choices.get(uuid));

  const leagues = { ...state.leagues };
  const named = new Set<string>();
  for (const { item, asNew } of toAdd) {
    const wrapper = asNew ? forkLeague(item, installationUuid, randomBytes) : item;
    leagues[wrapper.uuid] = wrapper;
    for (const team of wrapper.teams) named.add(team.blueprintUuid);
  }

  const blueprints = [...state.blueprints];
  const local = new Set(blueprints.map((b) => b.uuid));
  for (const snapshot of embedded) {
    if (!named.has(snapshot.uuid) || local.has(snapshot.uuid)) continue;
    blueprints.push(withFreeSlug(snapshot, blueprints));
    local.add(snapshot.uuid);
  }
  const blueprintsAdded = blueprints.length - state.blueprints.length;

  if (toAdd.length > 0) {
    useDatabaseStore.setState(
      blueprintsAdded > 0 ? { leagues, blueprints } : { leagues }
    );
  }
  return { ...counts, blueprintsAdded };
}

/** A copy for "Import as new": a fresh UUID, and the local installation in
 * both provenance fields (US-11.2). */
function forkEntity<T extends Provenance & { uuid: string }>(
  entity: T,
  installationUuid: string,
  randomBytes: RandomBytes
): T {
  return {
    ...entity,
    uuid: uuidV4(randomBytes),
    createdByInstallation: installationUuid,
    lastModifiedByInstallation: installationUuid,
  };
}

/** A league for "Import as new". The wrapper UUID is the league UUID
 * (`PERSISTENCE.md` §2a), so both change. The Instances keep the UUIDs of
 * their Blueprints. The lots change with the UUID (choice 5). */
function forkLeague(
  wrapper: LeagueWrapper,
  installationUuid: string,
  randomBytes: RandomBytes
): LeagueWrapper {
  const content = forkEntity(wrapper.content, installationUuid, randomBytes);
  return { ...wrapper, uuid: content.uuid, content };
}

/** The Blueprint with a slug that no Blueprint in `blueprints` has: its own
 * slug when it is free, or the first free `-2`, `-3` (Task 75). */
function withFreeSlug(
  added: TeamBlueprint,
  blueprints: readonly TeamBlueprint[]
): TeamBlueprint {
  const slug = uniqueSlug(
    added.slug,
    blueprints.map((b) => b.slug)
  );
  return slug === added.slug ? added : { ...added, slug };
}
