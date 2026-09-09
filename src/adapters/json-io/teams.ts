import { TIER_ORDER } from '../../engine/tier-ovr';
import type { Tier } from '../../engine/tier-ovr/types';
import type { TeamCsvRecord } from '../csv/types';

function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIER_ORDER as readonly string[]).includes(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Parses a plain JSON array of team objects — the JSON-format sibling of
 * `adapters/csv`'s `parseTeamsCsv`. Same four fields (`slug`, `name`,
 * `colour`, `tier`), same required-field rules, same reuse of
 * `TeamCsvRecord` as the shared record shape. Not `SavedLeague`'s `teams`
 * array — that is a full league save file (`parseLeague`'s job); this reads
 * a teams-only list, the JSON equivalent of the team CSV file.
 */
export function parseTeamsJson(text: string): TeamCsvRecord[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Team JSON is not valid JSON.');
  }

  if (!Array.isArray(raw)) {
    throw new Error('Team JSON must be an array of team objects.');
  }

  return raw.map((item, index) => {
    const entryNumber = index + 1;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error(`Team JSON entry ${entryNumber} is not an object.`);
    }
    const record = item as Record<string, unknown>;

    const name = record.name;
    if (!isString(name) || name.trim() === '') {
      throw new Error(`Team JSON entry ${entryNumber} is missing a name.`);
    }

    const tier = record.tier;
    if (!isTier(tier)) {
      throw new Error(`Team JSON entry ${entryNumber} has an invalid tier.`);
    }

    return {
      slug: isString(record.slug) ? record.slug : '',
      name,
      colour: isString(record.colour) ? record.colour : '',
      tier,
    };
  });
}
