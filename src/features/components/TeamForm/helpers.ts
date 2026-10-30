import { TEAM_PALETTE, type SelectOption, type SwatchOption } from '@/design-system';
import {
  MAX_LOCATION_LENGTH,
  MAX_TRIGRAMS,
  trigramFromName,
  uniqueSlug,
  type TrigramListProblem,
} from '@/engine/identity';
import { TIER_ORDER, type Tier } from '@/engine/tier-ovr';

export const TIER_OPTIONS: SelectOption[] = TIER_ORDER.map((tier) => ({
  label: tier,
  value: tier,
}));

export const COLOUR_OPTIONS: SwatchOption[] = TEAM_PALETTE.map(({ name, hex }) => ({
  label: name,
  value: hex,
}));

export const DEFAULT_TIER: Tier = 'C';

export const TEAM_NAME_INVALID =
  'Enter a team name with at least one letter or number.';

export const REGENERATE_HINT = 'Regenerate slug from name';
export const REGENERATE_LABEL = 'Regenerate slug from the team name';
export const SLUG_MATCHES_NAME = 'The slug already matches the name.';

/** The text of the regenerate confirm (US-09.5). */
export function regenerateMessage(from: string, to: string): string {
  return `The slug changes from ${from} to ${to}. CSV files and slug lists with the old slug no longer find this team.`;
}

export const LOCATION_TOO_LONG = `Use ${MAX_LOCATION_LENGTH} characters at most.`;

/** The placeholder of an empty Trigrams field for a name with no letter or
 * number yet. */
export const TRIGRAMS_EXAMPLE = 'e.g. ASH AFC';

/** The slug a new team gets, with the `-2` rule (Task 75), or an empty
 * string while the name gives none. `uniqueSlug()` throws for a blank or
 * symbols-only name, and the preview must not throw on a keystroke. */
export function getSlugPreview(name: string, takenSlugs: readonly string[]): string {
  try {
    return uniqueSlug(name, takenSlugs);
  } catch {
    return '';
  }
}

/** The placeholder of an empty Trigrams field: the trigram that a league
 * uses for this name (US-09.6). */
export function getTrigramsPlaceholder(name: string): string {
  return /[\p{L}\p{N}]/u.test(name) ? trigramFromName(name) : TRIGRAMS_EXAMPLE;
}

/** The drawer message for a bad Trigrams field (Task 119, choice 6). */
export function trigramProblemMessage(problem: TrigramListProblem): string {
  switch (problem.kind) {
    case 'format':
      return `"${problem.value}" is not a trigram. Use 3 letters or digits.`;
    case 'duplicate':
      return `"${problem.value}" is in the list twice.`;
    case 'too-many':
      return `Use ${MAX_TRIGRAMS} trigrams at most.`;
  }
}
