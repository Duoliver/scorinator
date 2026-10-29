/**
 * Turns a team or league name into a URL/file-safe slug: strip diacritics, lowercase,
 * collapse any run of non-alphanumeric characters into a single hyphen, and
 * trim leading/trailing hyphens. No doc gives a concrete algorithm — see the
 * Task 11 decision log entry for why this shape was chosen.
 *
 * Throws a `RangeError` if the name has no alphanumeric character to slug
 * (e.g. blank, or symbols-only) — the same degenerate-input pattern
 * `engine/round-robin` and `engine/standings` already use, rather than
 * returning a placeholder that could silently collide across teams.
 *
 * Does not check uniqueness across a roster. `uniqueSlug` below does that
 * (Task 103).
 */
const COMBINING_DIACRITICAL_MARKS = /\p{Diacritic}/gu;

export function slug(name: string): string {
  const value = name
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICAL_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (value === '') {
    throw new RangeError(
      `Cannot make a slug from the name "${name}". The name needs at least one letter or number.`
    );
  }

  return value;
}

/**
 * Makes a slug from the name that is not in `taken`: the plain slug when it
 * is free, or else the first free one of `base-2`, `base-3`, and so on
 * (Task 75). A gap counts as free, so with `ashfield` and `ashfield-3` taken
 * the result is `ashfield-2`.
 *
 * For a slug regenerate (US-09.5), the caller leaves the slug of the
 * Blueprint itself out of `taken`, so a Blueprint never clashes with itself.
 *
 * Throws the same `RangeError` as `slug()` for a name with no letter or number.
 */
export function uniqueSlug(name: string, taken: Iterable<string>): string {
  const base = slug(name);
  const takenSlugs = new Set(taken);
  if (!takenSlugs.has(base)) return base;

  let suffix = 2;
  while (takenSlugs.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}
