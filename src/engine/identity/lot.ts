/**
 * The fixed lot of one team in one league (Task 78 rule 1): the last
 * resort when teams stay level on every football criterion. A lower lot
 * goes first.
 *
 * The lot is a hash of the league id and the team id, not a random draw.
 * So it needs no `Rng` and no stored draw: the same two ids always give the
 * same number, on each render and after a re-scorinate. Another league
 * gives the same two teams a new, unrelated order.
 *
 * The hash is 32-bit FNV-1a over the UTF-16 code units, with the murmur3
 * final mix, so that ids that differ in one character still get unrelated
 * lots. Gives a whole number from 0 to 2^32 - 1.
 */
export function fixedLot(leagueId: string, teamId: string): number {
  const text = `${leagueId}:${teamId}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}
