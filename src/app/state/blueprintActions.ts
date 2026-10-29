import { uniqueSlug, uuidV4, type RandomBytes } from '@/engine/identity';
import type { TeamBlueprint } from '@/domain';
import type { TeamListRecord } from '@/persistence/types';
import { cryptoRandomBytes } from '@/app/random';
import { requireOpenDatabase, useDatabaseStore } from './databaseStore';

/** What the user gives to create a Blueprint (US-09.1). The slug, the UUID,
 * and the provenance come from the action. */
export interface BlueprintInput {
  name: string;
  colour: string;
  tier: TeamBlueprint['tier'];
  location?: string;
  trigrams?: string[];
}

/** The fields an edit can change. The slug stays fixed after create
 * (US-09.5): Task 119 adds the regenerate button. */
export type BlueprintChanges = Partial<
  Pick<TeamBlueprint, 'name' | 'colour' | 'tier' | 'location' | 'trigrams'>
>;

const CHANGEABLE = ['name', 'colour', 'tier', 'location', 'trigrams'] as const;

function sameValue(a: unknown, b: unknown): boolean {
  return Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((item, i) => item === b[i])
    : a === b;
}

/** The Blueprint with the changes, stamped with the local installation. The
 * same object when no field changes, so a save with no real change leaves
 * nothing unsaved (Task 108). */
function applyChanges(
  blueprint: TeamBlueprint,
  changes: BlueprintChanges,
  installationUuid: string
): TeamBlueprint {
  const changed = CHANGEABLE.some(
    (field) =>
      changes[field] !== undefined && !sameValue(changes[field], blueprint[field])
  );
  if (!changed) return blueprint;
  return {
    ...blueprint,
    ...changes,
    trigrams: [...(changes.trigrams ?? blueprint.trigrams)],
    lastModifiedByInstallation: installationUuid,
  };
}

function newBlueprint(
  input: BlueprintInput,
  slug: string,
  installationUuid: string,
  randomBytes: RandomBytes
): TeamBlueprint {
  return {
    uuid: uuidV4(randomBytes),
    slug,
    name: input.name,
    colour: input.colour,
    tier: input.tier,
    location: input.location ?? '',
    trigrams: [...(input.trigrams ?? [])],
    createdByInstallation: installationUuid,
    lastModifiedByInstallation: installationUuid,
  };
}

/** Creates a Blueprint with a new UUID (US-11.1) and a unique slug from the
 * name, with the `-2` rule (Task 75). Throws the `slug()` `RangeError` for a
 * name with no letter or number, and adds nothing. */
export function addBlueprint(
  input: BlueprintInput,
  randomBytes: RandomBytes = cryptoRandomBytes
): TeamBlueprint {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const slug = uniqueSlug(
    input.name,
    state.blueprints.map((blueprint) => blueprint.slug)
  );
  const blueprint = newBlueprint(input, slug, installationUuid, randomBytes);
  useDatabaseStore.setState({ blueprints: [...state.blueprints, blueprint] });
  return blueprint;
}

/** Edits a Blueprint. The slug and the UUID stay the same (US-09.5). No
 * league Instance changes (US-09.2). Throws a `RangeError` for an unknown
 * UUID. */
export function updateBlueprint(uuid: string, changes: BlueprintChanges): void {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const index = state.blueprints.findIndex((blueprint) => blueprint.uuid === uuid);
  if (index === -1) throw new RangeError(`No Blueprint has the UUID ${uuid}.`);

  const updated = applyChanges(state.blueprints[index], changes, installationUuid);
  if (updated === state.blueprints[index]) return;
  const blueprints = [...state.blueprints];
  blueprints[index] = updated;
  useDatabaseStore.setState({ blueprints });
}

/** The records of one file, one for each slug: a later record with the same
 * slug takes the place of the earlier one, as MVP1 `mergeImportedTeams`
 * does. A blank slug is never a match. */
function lastRecordForEachSlug(records: readonly TeamListRecord[]): TeamListRecord[] {
  const deduped: TeamListRecord[] = [];
  const positions = new Map<string, number>();
  for (const record of records) {
    const position = record.slug === '' ? undefined : positions.get(record.slug);
    if (position === undefined) {
      if (record.slug !== '') positions.set(record.slug, deduped.length);
      deduped.push(record);
    } else {
      deduped[position] = record;
    }
  }
  return deduped;
}

/**
 * Imports a team list (CSV or JSON) into the Blueprints, by the Task 75
 * rule. A record whose slug matches a Blueprint updates its name, colour,
 * and tier, and keeps its location and trigrams. A record with a new slug
 * makes a Blueprint with a new UUID. A blank slug gets a unique slug from
 * the name. Returns the counts, for the confirm of Task 119.
 */
export function importBlueprints(
  records: readonly TeamListRecord[],
  randomBytes: RandomBytes = cryptoRandomBytes
): { added: number; updated: number } {
  const state = useDatabaseStore.getState();
  const { installationUuid } = requireOpenDatabase(state);
  const blueprints = [...state.blueprints];
  const deduped = lastRecordForEachSlug(records);
  // A slug made for a blank record must not take a slug of the file.
  const taken = new Set([
    ...blueprints.map((blueprint) => blueprint.slug),
    ...deduped.map((record) => record.slug).filter((slug) => slug !== ''),
  ]);
  let added = 0;
  let updated = 0;

  for (const record of deduped) {
    const index =
      record.slug === '' ? -1 : blueprints.findIndex((b) => b.slug === record.slug);
    if (index === -1) {
      const slug = record.slug === '' ? uniqueSlug(record.name, taken) : record.slug;
      taken.add(slug);
      blueprints.push(newBlueprint(record, slug, installationUuid, randomBytes));
      added++;
    } else {
      const { name, colour, tier } = record;
      blueprints[index] = applyChanges(
        blueprints[index],
        { name, colour, tier },
        installationUuid
      );
      updated++;
    }
  }

  const changed = blueprints.some((blueprint, i) => blueprint !== state.blueprints[i]);
  if (changed) useDatabaseStore.setState({ blueprints });
  return { added, updated };
}
