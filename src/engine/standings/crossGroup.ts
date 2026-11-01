import type { LotOf, StandingsRow } from './types';

/**
 * Orders rows from different groups as one list (Task 78 rule 3): points,
 * then goal difference, then goals for, each per match played, then the
 * fixed lot (lower first), then the input order. Pass the rows in group
 * order, so that the group order is the last fallback.
 *
 * The rates are per match played, so groups of different sizes compare
 * fairly (US-01.6). With equal match counts, the order is the same as with
 * the totals. A team with 0 matches counts as 0. Two equal fractions, for
 * example 8 in 4 and 6 in 3, give the same floating-point number, so they
 * stay level.
 *
 * The input does not change.
 */
export function orderAcrossGroups<TeamId>(
  rows: readonly StandingsRow<TeamId>[],
  lotOf?: LotOf<TeamId>
): StandingsRow<TeamId>[] {
  // Array.prototype.sort is stable, so equal rows keep the input order.
  return [...rows].sort(
    (a, b) =>
      perMatch(b, 'points') - perMatch(a, 'points') ||
      perMatch(b, 'goalDifference') - perMatch(a, 'goalDifference') ||
      perMatch(b, 'goalsFor') - perMatch(a, 'goalsFor') ||
      (lotOf ? compareNumbers(lotOf(a.team), lotOf(b.team)) : 0)
  );
}

/**
 * The best `m` rows of one place across the group tables (US-01.6), for
 * example the 4 best third-placed teams. Takes the row at `place` (1
 * upward, the `sortOrder`) of each table, orders them with
 * `orderAcrossGroups`, and gives the first `m`. Pass the tables in group
 * order.
 *
 * Throws a `RangeError` when `place` is not a whole number of 1 or more,
 * when a table has fewer rows than `place`, or when `m` is not a whole
 * number from 0 to the table count.
 */
export function pickBestOfPlace<TeamId>(
  tables: readonly (readonly StandingsRow<TeamId>[])[],
  place: number,
  m: number,
  lotOf?: LotOf<TeamId>
): StandingsRow<TeamId>[] {
  if (!Number.isInteger(place) || place < 1) {
    throw new RangeError(
      `pickBestOfPlace needs a whole place of 1 or more. It got ${place}.`
    );
  }
  if (!Number.isInteger(m) || m < 0 || m > tables.length) {
    throw new RangeError(
      `pickBestOfPlace needs a whole m from 0 to ${tables.length}, the table count. It got ${m}.`
    );
  }
  const rowsAtPlace = tables.map((table, i) => {
    const row = table[place - 1];
    if (!row) {
      throw new RangeError(
        `pickBestOfPlace got table ${i + 1} with ${table.length} rows. Place ${place} needs ${place} rows or more.`
      );
    }
    return row;
  });
  return orderAcrossGroups(rowsAtPlace, lotOf).slice(0, m);
}

function perMatch<TeamId>(
  row: StandingsRow<TeamId>,
  field: 'points' | 'goalDifference' | 'goalsFor'
): number {
  return row.played === 0 ? 0 : row[field] / row.played;
}

function compareNumbers(a: number, b: number): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
