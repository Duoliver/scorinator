import {
  isSlug,
  MAX_LOCATION_LENGTH,
  MAX_TRIGRAMS,
  parseTrigramList,
  type TrigramListProblem,
} from '@/engine/identity';
import { isTier } from '@/engine/tier-ovr';
import { parseCsv, stringifyCsv } from './csv';
import type { TeamListRecord } from '@/persistence/types';

const COLUMN_KEYS = ['slug', 'name', 'colour', 'tier', 'location', 'trigrams'] as const;
type ColumnKey = (typeof COLUMN_KEYS)[number];

const HEADER_LABELS: Record<ColumnKey, string> = {
  slug: 'Slug',
  name: 'Name',
  colour: 'Colour',
  tier: 'Tier',
  location: 'Location',
  trigrams: 'Trigrams',
};

const REQUIRED_COLUMNS: readonly ColumnKey[] = ['name', 'tier'];

function trigramProblemMessage(rowNumber: number, problem: TrigramListProblem): string {
  const row = `Team CSV row ${rowNumber}`;
  switch (problem.kind) {
    case 'format':
      return `${row} has an invalid trigram "${problem.value}".`;
    case 'duplicate':
      return `${row} has the trigram "${problem.value}" twice.`;
    case 'too-many':
      return `${row} has ${problem.count} trigrams. The limit is ${MAX_TRIGRAMS}.`;
  }
}

function findColumnIndexes(
  headerRow: readonly string[]
): Partial<Record<ColumnKey, number>> {
  const indexes: Partial<Record<ColumnKey, number>> = {};
  for (const key of COLUMN_KEYS) {
    const label = HEADER_LABELS[key].toLowerCase();
    const index = headerRow.findIndex((cell) => cell.trim().toLowerCase() === label);
    if (index !== -1) {
      indexes[key] = index;
    }
  }
  return indexes;
}

export function parseTeamsCsv(text: string): TeamListRecord[] {
  const rows = parseCsv(text).filter((row) => row.some((cell) => cell.trim() !== ''));
  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const columnIndexes = findColumnIndexes(headerRow);

  for (const required of REQUIRED_COLUMNS) {
    if (columnIndexes[required] === undefined) {
      throw new Error(
        `Team CSV is missing required column "${HEADER_LABELS[required]}".`
      );
    }
  }

  return dataRows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 2; // account for the header row, 1-indexed
    const cell = (key: ColumnKey): string => {
      const index = columnIndexes[key];
      return index === undefined ? '' : (row[index] ?? '').trim();
    };

    const name = cell('name');
    if (name === '') {
      throw new Error(`Team CSV row ${rowNumber} is missing a Name.`);
    }

    const tierValue = cell('tier');
    if (tierValue === '') {
      throw new Error(`Team CSV row ${rowNumber} is missing a Tier.`);
    }
    if (!isTier(tierValue)) {
      throw new Error(`Team CSV row ${rowNumber} has an invalid Tier "${tierValue}".`);
    }

    // A slug from the file must match a `slug()` result, so a slug list can
    // find the team (Task 173). Empty means "make one from the name".
    const slug = cell('slug');
    if (slug !== '' && !isSlug(slug)) {
      throw new Error(
        `Team CSV row ${rowNumber} has an invalid Slug "${slug}". Use only letters, digits, and hyphens.`
      );
    }

    const record: TeamListRecord = {
      slug: slug.toLowerCase(),
      name,
      colour: cell('colour'),
      tier: tierValue,
    };

    // A missing optional column gives no field, so an update keeps the
    // Blueprint's own value (US-09.3, US-09.6).
    if (columnIndexes.location !== undefined) {
      const location = cell('location');
      if (location.length > MAX_LOCATION_LENGTH) {
        throw new Error(
          `Team CSV row ${rowNumber} has a Location over ${MAX_LOCATION_LENGTH} characters.`
        );
      }
      record.location = location;
    }
    if (columnIndexes.trigrams !== undefined) {
      const parsed = parseTrigramList(cell('trigrams'));
      if (!parsed.ok) throw new Error(trigramProblemMessage(rowNumber, parsed.problem));
      record.trigrams = parsed.trigrams;
    }
    return record;
  });
}

function cellText(record: TeamListRecord, key: ColumnKey): string {
  if (key === 'trigrams') return (record.trigrams ?? []).join(' ');
  return record[key] ?? '';
}

export function serializeTeamsCsv(records: readonly TeamListRecord[]): string {
  const headerRow = COLUMN_KEYS.map((key) => HEADER_LABELS[key]);
  const dataRows = records.map((record) =>
    COLUMN_KEYS.map((key) => cellText(record, key))
  );
  return stringifyCsv([headerRow, ...dataRows]);
}
