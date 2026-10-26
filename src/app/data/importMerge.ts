import { slug } from '@/engine/identity';
import type { TeamRecord } from '@/domain';
import type { TeamListRecord } from '@/persistence/types';

/** A team-list parser leaves a blank Slug as `''`, so the app fills it in
 * from the name here. Every team in the roster then has a slug. */
export function teamListRecordToTeamRecord(record: TeamListRecord): TeamRecord {
  return {
    slug: record.slug === '' ? slug(record.name) : record.slug,
    name: record.name,
    colour: record.colour,
    tier: record.tier,
  };
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
