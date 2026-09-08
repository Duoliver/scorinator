/**
 * Turns a team name into a URL/file-safe slug: strip diacritics, lowercase,
 * collapse any run of non-alphanumeric characters into a single hyphen, and
 * trim leading/trailing hyphens. No doc gives a concrete algorithm — see the
 * Task 11 decision log entry for why this shape was chosen.
 *
 * Throws a `RangeError` if the name has no alphanumeric character to slug
 * (e.g. blank, or symbols-only) — the same degenerate-input pattern
 * `engine/fixtures` and `engine/standings` already use, rather than
 * returning a placeholder that could silently collide across teams.
 *
 * Does not dedupe or check uniqueness across a roster — that is the later
 * identity/provenance system's job (skip/fork conflict resolution), not
 * this function's.
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
    throw new RangeError(`Cannot generate a slug for team name "${name}".`);
  }

  return value;
}
