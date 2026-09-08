import { TIER_ORDER } from '../../engine/tier-ovr';
import type { Tier } from '../../engine/tier-ovr/types';
import type { Fixture, Bye } from '../../engine/fixtures/types';
import {
  SAVE_FORMAT_VERSION,
  type SavedLeague,
  type SavedLeagueConfig,
  type SavedTeam,
  type SavedResult,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIER_ORDER as readonly string[]).includes(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function fail(message: string): never {
  throw new Error(`Save file is invalid: ${message}`);
}

function parseLeagueConfig(value: unknown): SavedLeagueConfig {
  if (!isRecord(value)) fail('the "league" section is missing or not an object.');
  if (!isNonBlankString(value.name)) fail('the league is missing a name.');
  if (!isBoolean(value.homeAdvantage)) fail('the league\'s "homeAdvantage" flag is missing.');

  const points = value.points;
  if (!isRecord(points)) fail('the league is missing a "points" section.');
  if (!isFiniteNumber(points.win)) fail('the league\'s points config is missing "win".');
  if (!isFiniteNumber(points.draw)) fail('the league\'s points config is missing "draw".');
  if (!isFiniteNumber(points.loss)) fail('the league\'s points config is missing "loss".');

  return {
    name: value.name,
    homeAdvantage: value.homeAdvantage,
    points: { win: points.win, draw: points.draw, loss: points.loss },
  };
}

function parseTeam(value: unknown, index: number): SavedTeam {
  if (!isRecord(value)) fail(`team ${index + 1} is not an object.`);
  if (!isNonBlankString(value.slug)) fail(`team ${index + 1} is missing a slug.`);
  if (!isNonBlankString(value.name)) fail(`team ${index + 1} is missing a name.`);
  if (!isString(value.colour)) fail(`team ${index + 1} is missing a colour.`);
  if (!isTier(value.tier)) fail(`team ${index + 1} has an invalid tier.`);
  if (!isFiniteNumber(value.ovr)) fail(`team ${index + 1} is missing its rolled OVR.`);

  return {
    slug: value.slug,
    name: value.name,
    colour: value.colour,
    tier: value.tier,
    ovr: value.ovr,
  };
}

function parseFixture(value: unknown, index: number): Fixture<string> {
  if (!isRecord(value)) fail(`fixture ${index + 1} is not an object.`);
  if (!isPositiveInteger(value.matchday)) fail(`fixture ${index + 1} has an invalid matchday.`);
  if (!isNonBlankString(value.home)) fail(`fixture ${index + 1} is missing a home team.`);
  if (!isNonBlankString(value.away)) fail(`fixture ${index + 1} is missing an away team.`);

  return { matchday: value.matchday, home: value.home, away: value.away };
}

function parseBye(value: unknown, index: number): Bye<string> {
  if (!isRecord(value)) fail(`bye ${index + 1} is not an object.`);
  if (!isPositiveInteger(value.matchday)) fail(`bye ${index + 1} has an invalid matchday.`);
  if (!isNonBlankString(value.team)) fail(`bye ${index + 1} is missing a team.`);

  return { matchday: value.matchday, team: value.team };
}

function parseResult(value: unknown, index: number): SavedResult {
  if (!isRecord(value)) fail(`result ${index + 1} is not an object.`);
  if (!isPositiveInteger(value.matchday)) fail(`result ${index + 1} has an invalid matchday.`);
  if (!isNonBlankString(value.home)) fail(`result ${index + 1} is missing a home team.`);
  if (!isNonBlankString(value.away)) fail(`result ${index + 1} is missing an away team.`);
  if (!isNonNegativeInteger(value.homeGoals))
    fail(`result ${index + 1} has an invalid home score.`);
  if (!isNonNegativeInteger(value.awayGoals))
    fail(`result ${index + 1} has an invalid away score.`);

  return {
    matchday: value.matchday,
    home: value.home,
    away: value.away,
    homeGoals: value.homeGoals,
    awayGoals: value.awayGoals,
  };
}

function parseArray<T>(
  value: unknown,
  fieldName: string,
  parseItem: (item: unknown, index: number) => T
): T[] {
  if (!Array.isArray(value)) fail(`"${fieldName}" is missing or not a list.`);
  return value.map(parseItem);
}

/** Serializes a league save file to pretty-printed JSON, so a saved file
 * stays human-diffable. */
export function serializeLeague(data: SavedLeague): string {
  return JSON.stringify(data, null, 2);
}

/** Parses and validates a league save file. Throws a descriptive `Error` on
 * malformed JSON or on any missing/invalid required field. Does not check
 * cross-references between teams, fixtures, and results (e.g. a result
 * naming a team outside the roster) — `engine/standings`'s
 * `calculateStandings` already throws for that once the loaded data runs
 * through it, so the check is not duplicated here. */
export function parseLeague(text: string): SavedLeague {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Save file is not valid JSON.');
  }

  if (!isRecord(raw)) fail('the file does not contain a JSON object.');
  if (raw.formatVersion !== SAVE_FORMAT_VERSION) {
    fail(
      `unsupported save format version "${String(raw.formatVersion)}" (expected ${SAVE_FORMAT_VERSION}).`
    );
  }

  return {
    formatVersion: SAVE_FORMAT_VERSION,
    league: parseLeagueConfig(raw.league),
    teams: parseArray(raw.teams, 'teams', parseTeam),
    fixtures: parseArray(raw.fixtures, 'fixtures', parseFixture),
    byes: parseArray(raw.byes, 'byes', parseBye),
    results: parseArray(raw.results, 'results', parseResult),
  };
}
