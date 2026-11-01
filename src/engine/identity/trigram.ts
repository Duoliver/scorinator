import { TIER_ORDER, type Tier } from '@/engine/tier-ovr';

/**
 * Team trigrams (US-09.6, Task 115): a three-character code for a place
 * where a full name does not fit. A Blueprint has an ordered list of up to
 * `MAX_TRIGRAMS`. A league picks one trigram for each team, unique in the
 * league, with `pickTrigrams`.
 */

/** The most trigrams one Blueprint holds (US-09.6). */
export const MAX_TRIGRAMS = 5;

const TRIGRAM = /^[A-Z0-9]{3}$/;
const COMBINING_DIACRITICAL_MARKS = /\p{Diacritic}/gu;

/** True for exactly 3 characters of A to Z or 0 to 9, in uppercase. */
export function isTrigram(text: string): boolean {
  return TRIGRAM.test(text);
}

/** The typed text as a trigram: trimmed and uppercase. `null` when it is no
 * trigram even then. */
export function normalizeTrigram(text: string): string | null {
  const value = text.trim().toUpperCase();
  return isTrigram(value) ? value : null;
}

/** The trigram of a team with an empty list: the first three letters or
 * digits of the name, in uppercase. A letter with an accent counts as its
 * base letter, as in `slug()`. Each missing place is an `X`, so "FC" gives
 * `FCX`. */
export function trigramFromName(name: string): string {
  const characters = name
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICAL_MARKS, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return characters.slice(0, 3).padEnd(3, 'X');
}

/** What is wrong with a typed trigram list: the first bad trigram, the
 * first duplicate, or a list longer than `MAX_TRIGRAMS`. A screen writes
 * the message (Task 119). */
export type TrigramListProblem =
  | { kind: 'format'; value: string }
  | { kind: 'duplicate'; value: string }
  | { kind: 'too-many'; count: number };

export type TrigramListResult =
  { ok: true; trigrams: string[] } | { ok: false; problem: TrigramListProblem };

/** Reads the text of the drawer "Trigrams" field or of the CSV "Trigrams"
 * column: trigrams split by spaces, in order. An empty text gives an empty
 * list, which means the trigram made from the name. */
export function parseTrigramList(text: string): TrigramListResult {
  const words = text.split(/\s+/).filter((word) => word !== '');
  const trigrams: string[] = [];
  for (const word of words) {
    const trigram = normalizeTrigram(word);
    if (trigram === null)
      return { ok: false, problem: { kind: 'format', value: word } };
    if (trigrams.includes(trigram)) {
      return { ok: false, problem: { kind: 'duplicate', value: trigram } };
    }
    trigrams.push(trigram);
  }
  if (trigrams.length > MAX_TRIGRAMS) {
    return { ok: false, problem: { kind: 'too-many', count: trigrams.length } };
  }
  return { ok: true, trigrams };
}

/** One team of a league pick. `lot` breaks a tie of Tier and OVR: the lower
 * lot picks first. The caller gives it (Task 115, choice 2). `fixed` is a
 * trigram set in the Edit drawer (US-09.6). */
export interface TrigramPickTeam<TeamId> {
  id: TeamId;
  name: string;
  tier: Tier;
  ovr: number;
  trigrams: readonly string[];
  lot: number;
  fixed?: string;
}

/** The trigram of one team. `fallback` is true when the team got a digit in
 * place of a trigram of its own: the wizard shows a hint on that row. */
export interface TrigramPick {
  trigram: string;
  fallback: boolean;
}

/** The trigrams that a team picks from, in its order. */
function ownTrigrams(team: TrigramPickTeam<unknown>): readonly string[] {
  return team.trigrams.length > 0 ? team.trigrams : [trigramFromName(team.name)];
}

/** The digit fallback, in order: each own trigram with its last character
 * changed to 2 to 9 (US-09.6), then the first trigram with its last two
 * characters changed to 10 to 99 (Task 115, choice 3). */
function* fallbackTrigrams(own: readonly string[]): Generator<string> {
  for (const trigram of own) {
    for (let digit = 2; digit <= 9; digit++) yield `${trigram.slice(0, 2)}${digit}`;
  }
  for (let number = 10; number <= 99; number++) yield `${own[0].slice(0, 1)}${number}`;
}

/**
 * Picks one trigram for each team, unique in the league (US-09.6). A fixed
 * trigram is taken first. Then the teams pick by higher Tier, then higher
 * OVR, then lower lot. Each team takes the first free trigram of its list,
 * or the trigram made from its name when the list is empty. With none
 * free, it takes the first free digit fallback.
 *
 * A pure function: the same teams give the same picks. With different
 * lots, the input order makes no difference. Two teams with the same Tier,
 * OVR, and lot pick in input order.
 * Throws a `RangeError` for a fixed trigram with a bad format, for two
 * teams with the same fixed trigram, and for a team with no free fallback.
 */
export function pickTrigrams<TeamId>(
  teams: readonly TrigramPickTeam<TeamId>[]
): Map<TeamId, TrigramPick> {
  const picks = new Map<TeamId, TrigramPick>();
  const taken = new Set<string>();

  for (const team of teams) {
    if (team.fixed === undefined) continue;
    const fixed = normalizeTrigram(team.fixed);
    if (fixed === null) {
      throw new RangeError(
        `The fixed trigram "${team.fixed}" is not 3 letters or digits.`
      );
    }
    if (taken.has(fixed)) {
      throw new RangeError(`Two teams have the fixed trigram "${fixed}".`);
    }
    taken.add(fixed);
    picks.set(team.id, { trigram: fixed, fallback: false });
  }

  const order = teams
    .filter((team) => team.fixed === undefined)
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) ||
        b.ovr - a.ovr ||
        a.lot - b.lot
    );

  for (const team of order) {
    const own = ownTrigrams(team);
    const free = own.find((trigram) => !taken.has(trigram));
    let pick: TrigramPick | undefined = free
      ? { trigram: free, fallback: false }
      : undefined;
    if (!pick) {
      for (const trigram of fallbackTrigrams(own)) {
        if (!taken.has(trigram)) {
          pick = { trigram, fallback: true };
          break;
        }
      }
    }
    if (!pick) {
      throw new RangeError(`No free trigram is left for the team "${team.name}".`);
    }
    taken.add(pick.trigram);
    picks.set(team.id, pick);
  }

  return picks;
}
