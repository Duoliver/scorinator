import { pickTrigrams, type TrigramPick } from '@/engine/identity';
import { rollOVR } from '@/engine/tier-ovr';
import type { Rng } from '@/engine/rng';
import type { TeamBlueprint, TeamInstance } from '@/domain';
import { freshRng } from '@/app/random';

/** One Instance for each Blueprint, in the given order, for the team list
 * of the wizard (US-08.1, US-08.2). Each copies the name, colour, slug,
 * and Tier, and gets an OVR rolled from the Tier at the add (Task 81). The
 * location stays on the Blueprint (US-09.3). */
export function newTeamInstances(
  blueprints: readonly TeamBlueprint[],
  rng: Rng = freshRng()
): TeamInstance[] {
  return blueprints.map((blueprint) => ({
    blueprintUuid: blueprint.uuid,
    slug: blueprint.slug,
    name: blueprint.name,
    colour: blueprint.colour,
    tier: blueprint.tier,
    ovr: rollOVR(blueprint.tier, rng),
    trigram: '',
  }));
}

/** What a slug list file adds to the team list (US-08.7). */
export interface SlugListPlan {
  /** The found Blueprints to add, in file order. */
  add: TeamBlueprint[];
  /** The slugs that add nothing: a team of the list, or a second copy. */
  alreadyInList: number;
  /** The slugs with no Blueprint, as typed, once each. */
  notFound: string[];
}

/** Matches the slugs of a slug list file with the Blueprints, with no
 * regard to case. A team of the list is matched by its Blueprint UUID, so a
 * regenerated slug does not add it again. */
export function planSlugListImport(
  slugs: readonly string[],
  blueprints: readonly TeamBlueprint[],
  list: readonly TeamInstance[]
): SlugListPlan {
  const bySlug = new Map(blueprints.map((b) => [b.slug.toLowerCase(), b]));
  const inList = new Set(list.map((team) => team.blueprintUuid));
  const plan: SlugListPlan = { add: [], alreadyInList: 0, notFound: [] };
  const missing = new Set<string>();

  for (const slug of slugs) {
    const found = bySlug.get(slug.toLowerCase());
    if (!found) {
      if (!missing.has(slug.toLowerCase())) plan.notFound.push(slug);
      missing.add(slug.toLowerCase());
    } else if (inList.has(found.uuid)) {
      plan.alreadyInList++;
    } else {
      inList.add(found.uuid);
      plan.add.push(found);
    }
  }
  return plan;
}

/**
 * The trigram that each team of the list gets, by Blueprint UUID (US-09.6).
 * A fixed trigram from the Edit drawer goes first. The other teams pick by
 * Tier, then OVR, then the place in the list: the team added first picks
 * first (Task 121, choice 3). A team picks from the trigrams of its
 * Blueprint, or from its name when it has none or the Blueprint is gone.
 */
export function pickTeamTrigrams(
  list: readonly TeamInstance[],
  blueprints: readonly TeamBlueprint[],
  fixedTrigrams: Readonly<Record<string, string>>
): Map<string, TrigramPick> {
  const trigramsOf = new Map(blueprints.map((b) => [b.uuid, b.trigrams]));
  return pickTrigrams(
    list.map((team, index) => ({
      id: team.blueprintUuid,
      name: team.name,
      tier: team.tier,
      ovr: team.ovr,
      trigrams: trigramsOf.get(team.blueprintUuid) ?? [],
      lot: index,
      fixed: fixedTrigrams[team.blueprintUuid],
    }))
  );
}

export const TOO_FEW_TEAMS = 'The league needs at least 2 teams to start.';

/** Why the team list cannot start a league, or `null` when it can
 * (US-08.6, US-08.8). A round robin needs 2 teams. Two teams cannot share a
 * name, with no regard to case (US-08.4, Task 121 choice 6). */
export function teamListProblem(list: readonly TeamInstance[]): string | null {
  if (list.length < 2) return TOO_FEW_TEAMS;
  const seen = new Map<string, string>();
  for (const team of list) {
    const key = team.name.trim().toLowerCase();
    const first = seen.get(key);
    if (first !== undefined)
      return `Two teams have the name ${first}. Edit one of them.`;
    seen.set(key, team.name.trim());
  }
  return null;
}
