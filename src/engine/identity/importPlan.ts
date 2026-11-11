/**
 * The import rules of US-11.2 and US-10.3 (Task 144), generic over an item
 * with a permanent `uuid`. The app gives the compare and makes the copy for
 * "Import as new", so this module knows no Blueprint and no league.
 */

/** The choice for one conflict in the "Resolve conflicts" dialog. */
export const ImportChoice = { SKIP: 'skip', NEW: 'new' } as const;
export type ImportChoice = (typeof ImportChoice)[keyof typeof ImportChoice];

/** What an import does with one incoming item. `new`: its UUID is unknown.
 * `same`: a local item has its UUID and the same content. `conflict`: a
 * local item has its UUID, with other content. */
export type ImportStep<T> =
  | { kind: 'new'; incoming: T }
  | { kind: 'same'; incoming: T }
  | { kind: 'conflict'; incoming: T; local: T };

/** The counts for the import message, for example "2 already up to date." */
export interface ImportCounts {
  imported: number;
  importedAsNew: number;
  skipped: number;
  upToDate: number;
}

/** The items to add, in the file order, and the counts. `asNew` marks a
 * conflict on "Import as new": the app gives it a fresh UUID. */
export interface ImportOutcome<T> {
  toAdd: { item: T; asNew: boolean }[];
  counts: ImportCounts;
}

/** Sorts each incoming item by its UUID and its content. */
export function planImport<T extends { uuid: string }>(
  incoming: readonly T[],
  findLocal: (uuid: string) => T | undefined,
  sameContent: (incoming: T, local: T) => boolean
): ImportStep<T>[] {
  return incoming.map((item) => {
    const local = findLocal(item.uuid);
    if (local === undefined) return { kind: ImportChoice.NEW, incoming: item };
    if (sameContent(item, local)) return { kind: 'same', incoming: item };
    return { kind: 'conflict', incoming: item, local };
  });
}

/**
 * Applies the choices to a plan. A conflict with no choice is skipped,
 * because each dialog row starts on Skip. A local item never changes: the
 * outcome only adds items.
 */
export function resolveImport<T extends { uuid: string }>(
  steps: readonly ImportStep<T>[],
  choiceOf: (uuid: string) => ImportChoice | undefined
): ImportOutcome<T> {
  const outcome: ImportOutcome<T> = {
    toAdd: [],
    counts: { imported: 0, importedAsNew: 0, skipped: 0, upToDate: 0 },
  };
  for (const step of steps) {
    if (step.kind === 'new') {
      outcome.toAdd.push({ item: step.incoming, asNew: false });
      outcome.counts.imported++;
    } else if (step.kind === 'same') {
      outcome.counts.upToDate++;
    } else if (choiceOf(step.incoming.uuid) === ImportChoice.NEW) {
      outcome.toAdd.push({ item: step.incoming, asNew: true });
      outcome.counts.importedAsNew++;
    } else {
      outcome.counts.skipped++;
    }
  }
  return outcome;
}

/**
 * True when the two values are equal, field by field, at any depth, with no
 * regard to the key order. A key in `ignored` does not count, at any depth:
 * the provenance fields (US-11.2, "same content"). A key with the value
 * `undefined` counts as absent, so an in-memory record and its JSON copy can
 * be equal.
 */
export function isSameContent(
  a: unknown,
  b: unknown,
  ignored: ReadonlySet<string>
): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((value, i) => isSameContent(value, b[i], ignored))
    );
  }
  const keysOf = (value: object): string[] =>
    Object.entries(value)
      .filter(([key, field]) => field !== undefined && !ignored.has(key))
      .map(([key]) => key);
  const aKeys = keysOf(a);
  const bKeys = new Set(keysOf(b));
  return (
    aKeys.length === bKeys.size &&
    aKeys.every(
      (key) =>
        bKeys.has(key) &&
        isSameContent(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
          ignored
        )
    )
  );
}
