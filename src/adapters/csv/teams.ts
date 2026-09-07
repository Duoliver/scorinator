import { TIER_ORDER } from '../../engine/tier-ovr';
import type { Tier } from '../../engine/tier-ovr/types';
import { parseCsv, stringifyCsv } from './csv';
import type { TeamCsvRecord } from './types';

const COLUMN_KEYS = ['slug', 'name', 'colour', 'tier'] as const;
type ColumnKey = (typeof COLUMN_KEYS)[number];

const HEADER_LABELS: Record<ColumnKey, string> = {
  slug: 'Slug',
  name: 'Name',
  colour: 'Colour',
  tier: 'Tier',
};

const REQUIRED_COLUMNS: readonly ColumnKey[] = ['name', 'tier'];

function isTier(value: string): value is Tier {
  return (TIER_ORDER as readonly string[]).includes(value);
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

export function parseTeamsCsv(text: string): TeamCsvRecord[] {
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

    return {
      slug: cell('slug'),
      name,
      colour: cell('colour'),
      tier: tierValue,
    };
  });
}

export function serializeTeamsCsv(records: readonly TeamCsvRecord[]): string {
  const headerRow = COLUMN_KEYS.map((key) => HEADER_LABELS[key]);
  const dataRows = records.map((record) => COLUMN_KEYS.map((key) => record[key]));
  return stringifyCsv([headerRow, ...dataRows]);
}
