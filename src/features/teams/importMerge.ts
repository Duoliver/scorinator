import { slug } from '../../engine/identity';
import type { TeamCsvRecord } from '../../adapters/csv';
import type { TeamRecord } from '../components';

/** `parseTeamsCsv` leaves a blank Slug column as `''` — this fills it in
 * from the Name, the wiring Task 11's decision log deferred to this task. */
export function csvRecordToTeamRecord(record: TeamCsvRecord): TeamRecord {
  return {
    slug: record.slug === '' ? slug(record.name) : record.slug,
    name: record.name,
    colour: record.colour,
    tier: record.tier,
  };
}

export function teamRecordToCsvRecord(record: TeamRecord): TeamCsvRecord {
  return { ...record };
}

/** Upserts `imported` into `current` by slug: a matching slug overwrites
 * that team in place, a new slug appends. Does not mutate `current`. */
export function mergeImportedTeams(
  current: readonly TeamRecord[],
  imported: readonly TeamRecord[]
): TeamRecord[] {
  const bySlug = new Map(current.map((team) => [team.slug, team]));
  for (const team of imported) {
    bySlug.set(team.slug, team);
  }
  return Array.from(bySlug.values());
}
