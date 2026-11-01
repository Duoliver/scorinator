import { isUuidV4 } from '@/engine/identity';
import type { Bye, PhaseFixture } from '@/engine/round-robin';
import type { PointsConfig } from '@/engine/standings';
import { isTier } from '@/engine/tier-ovr';
import {
  DATABASE_FORMAT_VERSION,
  type SavedBlueprint,
  type SavedInstance,
  type SavedLeagueProgress,
  type SavedManifest,
  type SavedPhase,
  type SavedPhaseFormat,
  type SavedPhaseResult,
  type SavedProvenance,
  type SavedWrapper,
  type SavedWrapperLeague,
  type SavedWrapperSummary,
} from './types';

/**
 * The JSON format of the two MVP2 database files (Task 106, Task 76):
 * `manifest.json` and `wrapper-{uuid}.json`. Each parser checks the shape,
 * the `kind`, the format version, and the links inside its own file. It does
 * not check the links between files, for example a manifest row with no
 * wrapper file: the app handles that case when it opens a league (Task 108).
 */

type Fail = (message: string) => never;
type Raw = Record<string, unknown>;

const PHASE_FORMATS: readonly SavedPhaseFormat[] = ['round-robin'];

function failFor(file: string): Fail {
  return (message) => {
    throw new Error(`${file} is not valid: ${message}`);
  };
}

const failManifest: Fail = failFor('manifest.json');
const failWrapper: Fail = failFor('A league file');

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isPhaseFormat(value: unknown): value is SavedPhaseFormat {
  return (PHASE_FORMATS as readonly unknown[]).includes(value);
}

function readList(value: unknown, name: string, fail: Fail): unknown[] {
  if (!Array.isArray(value)) fail(`"${name}" is missing or not a list.`);
  return value;
}

/** Throws for the second item with a key that an earlier item has. */
function checkUnique<T>(
  items: readonly T[],
  key: (item: T) => string,
  describeDuplicate: (index: number, firstIndex: number) => string,
  fail: Fail
): void {
  const seen = new Map<string, number>();
  items.forEach((item, index) => {
    const first = seen.get(key(item));
    if (first !== undefined) fail(describeDuplicate(index, first));
    seen.set(key(item), index);
  });
}

function readFileHeader(text: string, kind: 'manifest' | 'wrapper', fail: Fail): Raw {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    fail('the text is not JSON.');
  }
  if (!isRecord(raw)) fail('the file does not hold a JSON object.');
  if (raw.kind !== kind) {
    fail(`the file is not a ${kind}. Its kind is "${String(raw.kind)}".`);
  }
  const version = raw.formatVersion;
  if (typeof version === 'number' && version > DATABASE_FORMAT_VERSION) {
    fail(
      `a newer version of Scorinator made this file (format version ${version}). This version reads format version ${DATABASE_FORMAT_VERSION}.`
    );
  }
  if (version !== DATABASE_FORMAT_VERSION) {
    fail(
      `the format version is "${String(version)}". This version reads format version ${DATABASE_FORMAT_VERSION}.`
    );
  }
  return raw;
}

function readProvenance(value: Raw, label: string, fail: Fail): SavedProvenance {
  for (const key of ['createdByInstallation', 'lastModifiedByInstallation'] as const) {
    if (!isUuidV4(value[key])) fail(`${label} has no valid "${key}" UUID.`);
  }
  return {
    createdByInstallation: value.createdByInstallation as string,
    lastModifiedByInstallation: value.lastModifiedByInstallation as string,
  };
}

function readPoints(value: unknown, label: string, fail: Fail): PointsConfig {
  if (!isRecord(value)) fail(`${label} has no points section.`);
  const names = { win: 'a win', draw: 'a draw', loss: 'a loss' } as const;
  for (const key of ['win', 'draw', 'loss'] as const) {
    if (!isFiniteNumber(value[key]))
      fail(`${label} has no valid points for ${names[key]}.`);
  }
  return {
    win: value.win as number,
    draw: value.draw as number,
    loss: value.loss as number,
  };
}

// --- Manifest -----------------------------------------------------------

function readBlueprint(value: unknown, index: number): SavedBlueprint {
  const label = `Blueprint ${index + 1}`;
  const fail: Fail = failManifest;
  if (!isRecord(value)) fail(`${label} is not an object.`);
  if (!isUuidV4(value.uuid)) fail(`${label} has no valid UUID.`);
  if (!isNonBlankString(value.slug)) fail(`${label} has no slug.`);
  if (!isNonBlankString(value.name)) fail(`${label} has no name.`);
  if (typeof value.colour !== 'string') fail(`${label} has no colour.`);
  if (!isTier(value.tier)) fail(`${label} has no valid tier.`);

  // A missing location or trigram list reads as empty (US-09.3, US-09.6).
  const location = value.location ?? '';
  if (typeof location !== 'string') fail(`${label} has a location that is not text.`);
  const trigrams = value.trigrams ?? [];
  if (!Array.isArray(trigrams) || !trigrams.every((code) => typeof code === 'string')) {
    fail(`${label} has trigrams that are not a list of text.`);
  }

  return {
    uuid: value.uuid,
    slug: value.slug,
    name: value.name,
    colour: value.colour,
    tier: value.tier,
    location,
    trigrams: [...trigrams],
    ...readProvenance(value, label, fail),
  };
}

function readProgress(
  value: unknown,
  phaseCount: number,
  label: string
): SavedLeagueProgress {
  const fail: Fail = failManifest;
  if (isRecord(value) && value.kind === 'completed') return { kind: 'completed' };
  if (
    !isRecord(value) ||
    value.kind !== 'phase' ||
    !isPositiveInteger(value.phase) ||
    value.phase > phaseCount ||
    !isPositiveInteger(value.matchday) ||
    !isPositiveInteger(value.matchdays) ||
    value.matchday > value.matchdays
  ) {
    fail(`${label} has no valid progress.`);
  }
  return {
    kind: 'phase',
    phase: value.phase,
    matchday: value.matchday,
    matchdays: value.matchdays,
  };
}

function readSummary(value: unknown, index: number): SavedWrapperSummary {
  const label = `league row ${index + 1}`;
  const fail: Fail = failManifest;
  if (!isRecord(value)) fail(`${label} is not an object.`);
  if (!isUuidV4(value.uuid)) fail(`${label} has no valid UUID.`);
  if (value.contentType !== 'league') fail(`${label} has no valid content type.`);
  if (!isNonBlankString(value.name)) fail(`${label} has no name.`);
  if (!isNonNegativeInteger(value.teamCount)) fail(`${label} has no valid team count.`);
  if (typeof value.homeAdvantage !== 'boolean') {
    fail(`${label} has no valid "homeAdvantage" flag.`);
  }
  const formats = readList(value.phaseFormats, 'phaseFormats', fail);
  if (!formats.every(isPhaseFormat))
    fail(`${label} has a phase format that is not known.`);

  return {
    uuid: value.uuid,
    contentType: 'league',
    name: value.name,
    teamCount: value.teamCount,
    homeAdvantage: value.homeAdvantage,
    points: readPoints(value.points, label, fail),
    phaseFormats: [...formats],
    progress: readProgress(value.progress, formats.length, label),
  };
}

export function serializeManifest(manifest: SavedManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/** Parses and checks `manifest.json`. Throws an `Error` that starts with
 * `manifest.json is not valid:` and says what is wrong. */
export function parseManifest(text: string): SavedManifest {
  const fail: Fail = failManifest;
  const raw = readFileHeader(text, 'manifest', fail);
  if (!isUuidV4(raw.installationUuid)) fail('the installation UUID is not a UUID v4.');

  const blueprints = readList(raw.blueprints, 'blueprints', fail).map(readBlueprint);
  checkUnique(
    blueprints,
    (b) => b.uuid,
    (i, first) => `Blueprint ${i + 1} has the same UUID as Blueprint ${first + 1}.`,
    fail
  );
  checkUnique(
    blueprints,
    (b) => b.slug,
    (i, first) => `Blueprint ${i + 1} has the same slug as Blueprint ${first + 1}.`,
    fail
  );

  const wrappers = readList(raw.wrappers, 'wrappers', fail).map(readSummary);
  checkUnique(
    wrappers,
    (w) => w.uuid,
    (i, first) => `league row ${i + 1} has the same UUID as league row ${first + 1}.`,
    fail
  );

  return {
    kind: 'manifest',
    formatVersion: DATABASE_FORMAT_VERSION,
    installationUuid: raw.installationUuid,
    blueprints,
    wrappers,
  };
}

// --- Wrapper ------------------------------------------------------------

function readInstance(value: unknown, index: number): SavedInstance {
  const label = `team ${index + 1}`;
  const fail: Fail = failWrapper;
  if (!isRecord(value)) fail(`${label} is not an object.`);
  if (!isUuidV4(value.blueprintUuid)) fail(`${label} has no valid Blueprint UUID.`);
  if (!isNonBlankString(value.slug)) fail(`${label} has no slug.`);
  if (!isNonBlankString(value.name)) fail(`${label} has no name.`);
  if (typeof value.colour !== 'string') fail(`${label} has no colour.`);
  if (!isTier(value.tier)) fail(`${label} has no valid tier.`);
  if (!isFiniteNumber(value.ovr)) fail(`${label} has no valid OVR.`);
  // A league file made before Task 121 has no trigram: it reads as empty.
  const trigram = value.trigram ?? '';
  if (typeof trigram !== 'string') fail(`${label} has a trigram that is not text.`);

  return {
    blueprintUuid: value.blueprintUuid,
    slug: value.slug,
    name: value.name,
    colour: value.colour,
    tier: value.tier,
    ovr: value.ovr,
    trigram,
  };
}

function readFixture(value: unknown, label: string): PhaseFixture<string> {
  const fail: Fail = failWrapper;
  if (!isRecord(value)) fail(`${label} is not an object.`);
  if (!isNonBlankString(value.id)) fail(`${label} has no id.`);
  if (!isPositiveInteger(value.matchday)) fail(`${label} has no valid matchday.`);
  if (!isNonBlankString(value.home)) fail(`${label} has no home team.`);
  if (!isNonBlankString(value.away)) fail(`${label} has no away team.`);
  return { id: value.id, matchday: value.matchday, home: value.home, away: value.away };
}

function readBye(value: unknown, label: string): Bye<string> {
  const fail: Fail = failWrapper;
  if (!isRecord(value)) fail(`${label} is not an object.`);
  if (!isPositiveInteger(value.matchday)) fail(`${label} has no valid matchday.`);
  if (!isNonBlankString(value.team)) fail(`${label} has no team.`);
  return { matchday: value.matchday, team: value.team };
}

function readResult(value: unknown, label: string): SavedPhaseResult {
  const fail: Fail = failWrapper;
  if (!isRecord(value)) fail(`${label} is not an object.`);
  if (!isNonBlankString(value.fixtureId)) fail(`${label} has no fixture id.`);
  if (!isNonBlankString(value.home)) fail(`${label} has no home team.`);
  if (!isNonBlankString(value.away)) fail(`${label} has no away team.`);
  if (!isNonNegativeInteger(value.homeGoals)) fail(`${label} has no valid home score.`);
  if (!isNonNegativeInteger(value.awayGoals)) fail(`${label} has no valid away score.`);
  return {
    fixtureId: value.fixtureId,
    home: value.home,
    away: value.away,
    homeGoals: value.homeGoals,
    awayGoals: value.awayGoals,
  };
}

/** Reads one phase, and checks its links: each team is in the league, each
 * fixture id is new in the league, and each result names one fixture of its
 * phase, with the same teams, once. */
function readPhase(
  value: unknown,
  index: number,
  teams: ReadonlySet<string>,
  leagueFixtureIds: Set<string>
): SavedPhase {
  const label = `phase ${index + 1}`;
  const fail: Fail = failWrapper;
  if (!isRecord(value)) fail(`${label} is not an object.`);
  if (!isPhaseFormat(value.format)) fail(`${label} has a format that is not known.`);

  const fixtures = readList(value.fixtures, 'fixtures', fail).map((item, i) =>
    readFixture(item, `${label}, fixture ${i + 1}`)
  );
  const byes = readList(value.byes, 'byes', fail).map((item, i) =>
    readBye(item, `${label}, bye ${i + 1}`)
  );
  const results = readList(value.results, 'results', fail).map((item, i) =>
    readResult(item, `${label}, result ${i + 1}`)
  );

  const fixturesById = new Map<string, PhaseFixture<string>>();
  fixtures.forEach((fixture, i) => {
    const fixtureLabel = `${label}, fixture ${i + 1}`;
    if (leagueFixtureIds.has(fixture.id)) {
      fail(`${fixtureLabel} has an id that another fixture uses.`);
    }
    leagueFixtureIds.add(fixture.id);
    fixturesById.set(fixture.id, fixture);
    if (!teams.has(fixture.home) || !teams.has(fixture.away)) {
      fail(`${fixtureLabel} names a team that is not in the league.`);
    }
  });
  byes.forEach((bye, i) => {
    if (!teams.has(bye.team)) {
      fail(`${label}, bye ${i + 1} names a team that is not in the league.`);
    }
  });

  const played = new Set<string>();
  results.forEach((result, i) => {
    const resultLabel = `${label}, result ${i + 1}`;
    const fixture = fixturesById.get(result.fixtureId);
    if (!fixture) fail(`${resultLabel} names no fixture of its phase.`);
    if (fixture.home !== result.home || fixture.away !== result.away) {
      fail(`${resultLabel} has other teams than its fixture.`);
    }
    if (played.has(result.fixtureId)) {
      fail(`${resultLabel} names a fixture that already has a result.`);
    }
    played.add(result.fixtureId);
  });

  return { format: value.format, fixtures, byes, results };
}

function readLeague(value: unknown, teams: ReadonlySet<string>): SavedWrapperLeague {
  const label = 'the league';
  const fail: Fail = failWrapper;
  if (!isRecord(value)) fail('the "content" section is missing or not an object.');
  if (!isUuidV4(value.uuid)) fail(`${label} has no valid UUID.`);
  if (!isNonBlankString(value.name)) fail(`${label} has no name.`);
  if (typeof value.homeAdvantage !== 'boolean') {
    fail(`${label} has no valid "homeAdvantage" flag.`);
  }
  const points = readPoints(value.points, label, fail);
  const provenance = readProvenance(value, label, fail);
  const leagueFixtureIds = new Set<string>();
  const phases = readList(value.phases, 'phases', fail).map((phase, index) =>
    readPhase(phase, index, teams, leagueFixtureIds)
  );

  return {
    uuid: value.uuid,
    name: value.name,
    homeAdvantage: value.homeAdvantage,
    points,
    ...provenance,
    phases,
  };
}

export function serializeWrapper(wrapper: SavedWrapper): string {
  return JSON.stringify(wrapper, null, 2);
}

/** Parses and checks one `wrapper-{uuid}.json`. Throws an `Error` that
 * starts with `A league file is not valid:` and says what is wrong. */
export function parseWrapper(text: string): SavedWrapper {
  const fail: Fail = failWrapper;
  const raw = readFileHeader(text, 'wrapper', fail);
  if (!isUuidV4(raw.uuid)) fail('the file has no valid UUID.');

  const teams = readList(raw.teams, 'teams', fail).map(readInstance);
  checkUnique(
    teams,
    (t) => t.blueprintUuid,
    (i, first) => `team ${i + 1} has the same Blueprint UUID as team ${first + 1}.`,
    fail
  );

  const content = readLeague(raw.content, new Set(teams.map((t) => t.blueprintUuid)));
  if (content.uuid !== raw.uuid) fail('the file UUID is not the league UUID.');

  return {
    kind: 'wrapper',
    formatVersion: DATABASE_FORMAT_VERSION,
    uuid: raw.uuid,
    teams,
    content,
  };
}
