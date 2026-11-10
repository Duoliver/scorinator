import {
  bracketSlotCount,
  buildBracketTree,
  type BracketPlanRules,
} from '@/engine/bracket';
import { isUuidV4 } from '@/engine/identity';
import {
  bracketRulesOf,
  checkPhaseChain,
  checkZones,
  ZONE_LABEL_MAX,
  type GroupBye,
  type Legs,
  type PhaseChainProblem,
  type PlanZone,
  type ZoneColour,
  type ZoneProblem,
} from '@/engine/phases';
import type { Bye, GroupSetting, PhaseFixture } from '@/engine/round-robin';
import type { PointsConfig } from '@/engine/standings';
import { isTier } from '@/engine/tier-ovr';
import {
  DATABASE_FORMAT_VERSION,
  OLDEST_DATABASE_FORMAT_VERSION,
  type SavedBlueprint,
  type SavedFileKind,
  type SavedLeagueEntry,
  type SavedBracketPhase,
  type SavedInstance,
  type SavedLeagueProgress,
  type SavedManifest,
  type SavedPhase,
  type SavedPhaseFormat,
  type SavedPhasePlan,
  type SavedPhaseResult,
  type SavedPhaseSummary,
  type SavedProvenance,
  type SavedTieResult,
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

export type Fail = (message: string) => never;
export type Raw = Record<string, unknown>;

const PHASE_FORMATS: readonly SavedPhaseFormat[] = ['round-robin', 'groups'];
const LEGS: readonly Legs[] = ['two-way', 'single-duels'];

/** The format version of the file being read: 2 or 3 (Task 176). A version-2
 * file gets the defaults of version 3. */
export type Version = 2 | 3 | 4;

const READ_VERSIONS = `This version reads format versions ${OLDEST_DATABASE_FORMAT_VERSION} to ${DATABASE_FORMAT_VERSION}.`;

export function failFor(file: string): Fail {
  return (message) => {
    throw new Error(`${file} is not valid: ${message}`);
  };
}

const failManifest: Fail = failFor('manifest.json');
const failWrapper: Fail = failFor('A league file');

export function isRecord(value: unknown): value is Raw {
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

function isLegs(value: unknown): value is Legs {
  return (LEGS as readonly unknown[]).includes(value);
}

export function readList(value: unknown, name: string, fail: Fail): unknown[] {
  if (!Array.isArray(value)) fail(`"${name}" is missing or not a list.`);
  return value;
}

/** Throws for the second item with a key that an earlier item has. */
export function checkUnique<T>(
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

/** The name of each file kind in an error text. */
const KIND_NAMES: Record<SavedFileKind, string> = {
  manifest: 'manifest',
  wrapper: 'wrapper',
  leagues: 'league file',
  blueprints: 'team blueprints file',
};

export function readFileHeader(
  text: string,
  kind: SavedFileKind,
  fail: Fail
): { raw: Raw; version: Version } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    fail('the text is not JSON.');
  }
  if (!isRecord(raw)) fail('the file does not hold a JSON object.');
  if (raw.kind !== kind) {
    fail(`the file is not a ${KIND_NAMES[kind]}. Its kind is "${String(raw.kind)}".`);
  }
  const version = raw.formatVersion;
  if (typeof version === 'number' && version > DATABASE_FORMAT_VERSION) {
    fail(
      `a newer version of Scorinator made this file (format version ${version}). ${READ_VERSIONS}`
    );
  }
  if (version !== 2 && version !== 3 && version !== 4) {
    fail(`the format version is "${String(version)}". ${READ_VERSIONS}`);
  }
  return { raw, version };
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

export function readBlueprint(
  value: unknown,
  index: number,
  fail: Fail = failManifest
): SavedBlueprint {
  const label = `Blueprint ${index + 1}`;
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
  if (isRecord(value) && value.kind === 'bracket') {
    const { phase, round } = value;
    const isRound =
      isPositiveInteger(round) && round >= 2 && bracketSlotCount(round) === round;
    if (!isPositiveInteger(phase) || phase > phaseCount || !isRound) {
      fail(`${label} has no valid progress.`);
    }
    return { kind: 'bracket', phase, round };
  }
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

/** One phase of a manifest row (Task 176 choice 4). */
function readPhaseSummary(value: unknown, label: string): SavedPhaseSummary {
  if (isRecord(value) && value.format === 'bracket') return { format: 'bracket' };
  if (!isRecord(value) || !isPhaseFormat(value.format) || !isLegs(value.legs)) {
    failManifest(`${label} has a phase that is not valid.`);
  }
  return { format: value.format, legs: value.legs };
}

/** The phases of a manifest row. A version-2 row has `phaseFormats`: each
 * one becomes a two-way phase. */
function readSummaryPhases(
  value: Raw,
  version: Version,
  label: string
): SavedPhaseSummary[] {
  const fail: Fail = failManifest;
  if (version === 2) {
    const formats = readList(value.phaseFormats, 'phaseFormats', fail);
    if (!formats.every(isPhaseFormat)) {
      fail(`${label} has a phase format that is not known.`);
    }
    return formats.map((format) => ({ format, legs: 'two-way' }));
  }
  return readList(value.phases, 'phases', fail).map((phase) =>
    readPhaseSummary(phase, label)
  );
}

function readSummary(
  value: unknown,
  index: number,
  version: Version
): SavedWrapperSummary {
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
  const phases = readSummaryPhases(value, version, label);

  return {
    uuid: value.uuid,
    contentType: 'league',
    name: value.name,
    teamCount: value.teamCount,
    homeAdvantage: value.homeAdvantage,
    points: readPoints(value.points, label, fail),
    phases,
    progress: readProgress(value.progress, phases.length, label),
  };
}

export function serializeManifest(manifest: SavedManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/** Parses and checks `manifest.json`. Throws an `Error` that starts with
 * `manifest.json is not valid:` and says what is wrong. */
export function parseManifest(text: string): SavedManifest {
  const fail: Fail = failManifest;
  const { raw, version } = readFileHeader(text, 'manifest', fail);
  if (!isUuidV4(raw.installationUuid)) fail('the installation UUID is not a UUID v4.');

  const blueprints = readList(raw.blueprints, 'blueprints', fail).map((value, index) =>
    readBlueprint(value, index)
  );
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

  const wrappers = readList(raw.wrappers, 'wrappers', fail).map((row, index) =>
    readSummary(row, index, version)
  );
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

function readGroupBye(
  value: unknown,
  label: string,
  groupCount: number
): GroupBye<string> {
  const bye = readBye(value, label);
  const group = isRecord(value) ? value.group : undefined;
  if (!isPositiveInteger(group) || group > groupCount) {
    failWrapper(`${label} has no valid group.`);
  }
  return { ...bye, group };
}

/** The draw of a Groups phase: each team of the league once at most. */
function readGroups(
  value: unknown,
  label: string,
  teams: ReadonlySet<string>
): string[][] {
  const fail: Fail = failWrapper;
  const groups = readList(value, 'groups', fail);
  const seen = new Set<string>();
  return groups.map((group, i) => {
    const members = readList(group, 'groups', fail);
    return members.map((team) => {
      if (typeof team !== 'string' || !teams.has(team)) {
        fail(`${label}, group ${i + 1} names a team that is not in the league.`);
      }
      if (seen.has(team)) fail(`${label} has a team in two groups.`);
      seen.add(team);
      return team;
    });
  });
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
  leagueFixtureIds: Set<string>,
  version: Version
): SavedPhase {
  const label = `phase ${index + 1}`;
  const fail: Fail = failWrapper;
  if (!isRecord(value)) fail(`${label} is not an object.`);
  if (value.format === 'bracket' && version >= 4) {
    return readBracketPhase(value, label, teams);
  }
  if (!isPhaseFormat(value.format)) fail(`${label} has a format that is not known.`);
  // A version-2 phase has no legs: it is a two-way round robin.
  const legs = version === 2 ? (value.legs ?? 'two-way') : value.legs;
  if (!isLegs(legs)) fail(`${label} has no valid legs.`);
  const groups =
    value.format === 'groups' ? readGroups(value.groups, label, teams) : undefined;

  const fixtures = readList(value.fixtures, 'fixtures', fail).map((item, i) =>
    readFixture(item, `${label}, fixture ${i + 1}`)
  );
  const byes = readList(value.byes, 'byes', fail).map((item, i) =>
    groups
      ? readGroupBye(item, `${label}, bye ${i + 1}`, groups.length)
      : readBye(item, `${label}, bye ${i + 1}`)
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

  if (groups) {
    return {
      format: 'groups',
      legs,
      groups,
      fixtures,
      byes: byes as GroupBye<string>[],
      results,
    };
  }
  return { format: 'round-robin', legs, fixtures, byes, results };
}

// --- Brackets (Task 139) -------------------------------------------------

const TIE_FORMATS: readonly string[] = ['single-match', 'two-legged'];
const TIEBREAK_METHODS: readonly string[] = ['penalties', 'replay-coin-toss'];
const MATCH_PARTS: readonly string[] = ['leg1', 'leg2', 'replay'];
const TIE_DECISIONS: readonly string[] = [
  'regulation',
  'away-goals',
  'aet',
  'penalties',
  'replay',
  'coin-toss',
];

function readBracketRules(value: unknown, label: string): BracketPlanRules {
  const fail: Fail = failWrapper;
  const valid =
    isRecord(value) &&
    TIE_FORMATS.includes(value.format as string) &&
    TIEBREAK_METHODS.includes(value.method as string) &&
    typeof value.awayGoals === 'boolean' &&
    typeof value.playsAet === 'boolean' &&
    typeof value.singleMatchFinal === 'boolean' &&
    typeof value.thirdPlace === 'boolean';
  if (!valid) fail(`${label} has no valid bracket rules.`);
  return {
    format: value.format as BracketPlanRules['format'],
    awayGoals: value.awayGoals as boolean,
    playsAet: value.playsAet as boolean,
    method: value.method as BracketPlanRules['method'],
    singleMatchFinal: value.singleMatchFinal as boolean,
    thirdPlace: value.thirdPlace as boolean,
  };
}

function readScore(
  value: unknown,
  label: string
): { homeGoals: number; awayGoals: number } {
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value.homeGoals) ||
    !isNonNegativeInteger(value.awayGoals)
  ) {
    return failWrapper(`${label} has no valid score.`);
  }
  return { homeGoals: value.homeGoals, awayGoals: value.awayGoals };
}

function readTieResult(
  value: unknown,
  label: string,
  seeds: ReadonlySet<string>
): SavedTieResult {
  const fail: Fail = failWrapper;
  if (!isRecord(value)) fail(`${label} is not an object.`);
  if (!isNonBlankString(value.tieId)) fail(`${label} has no tie id.`);
  const isSeed = (id: unknown): id is string => typeof id === 'string' && seeds.has(id);
  if (
    !isSeed(value.winnerId) ||
    !isSeed(value.loserId) ||
    value.winnerId === value.loserId
  ) {
    fail(`${label} names a winner or a loser that is not a seed of the bracket.`);
  }
  if (!TIE_DECISIONS.includes(value.decidedBy as string)) {
    fail(`${label} has no valid decision.`);
  }
  const matches = readList(value.matches, 'matches', fail).map((item, i) => {
    const matchLabel = `${label}, match ${i + 1}`;
    if (!isRecord(item) || !MATCH_PARTS.includes(item.part as string)) {
      fail(`${matchLabel} has no valid part.`);
    }
    if (!isSeed(item.homeId) || !isSeed(item.awayId)) {
      fail(`${matchLabel} names a team that is not a seed of the bracket.`);
    }
    return {
      part: item.part as SavedTieResult['matches'][number]['part'],
      homeId: item.homeId,
      awayId: item.awayId,
      score: readScore(item.score, matchLabel),
      ...(item.aet === undefined
        ? {}
        : { aet: readScore(item.aet, `${matchLabel} AET`) }),
    };
  });
  return {
    tieId: value.tieId,
    matches,
    ...(value.penalties === undefined
      ? {}
      : { penalties: readScore(value.penalties, `${label} penalties`) }),
    winnerId: value.winnerId,
    loserId: value.loserId,
    decidedBy: value.decidedBy as SavedTieResult['decidedBy'],
  };
}

/** Reads a bracket phase: each seed is a league team, once, and each bye
 * team is a seed. The tie ids of the results are checked against the tree
 * in `checkPlansAndPhases`, when the plan is known. */
function readBracketPhase(
  value: Raw,
  label: string,
  teams: ReadonlySet<string>
): SavedBracketPhase {
  const fail: Fail = failWrapper;
  const seeds = readList(value.seeds, 'seeds', fail);
  if (
    !seeds.every((team): team is string => typeof team === 'string' && teams.has(team))
  ) {
    fail(`${label} has a seed that is not in the league.`);
  }
  checkUnique(
    seeds,
    (team) => team,
    (i) => `${label}, seed ${i + 1} is a seed twice.`,
    fail
  );
  const seedSet = new Set(seeds);
  const byeTeams = readList(value.byeTeams, 'byeTeams', fail);
  if (
    !byeTeams.every(
      (team): team is string => typeof team === 'string' && seedSet.has(team)
    )
  ) {
    fail(`${label} has a bye team that is not a seed.`);
  }
  const results = readList(value.results, 'results', fail).map((item, i) =>
    readTieResult(item, `${label}, result ${i + 1}`, seedSet)
  );
  const flag = value.avoidGroupTies;
  if (flag !== undefined && typeof flag !== 'boolean') {
    fail(`${label} has no valid "avoidGroupTies" flag.`);
  }
  return {
    format: 'bracket',
    seeds,
    byeTeams,
    results,
    ...(flag === true ? { avoidGroupTies: true } : {}),
  };
}

/** Checks a bracket phase against its tree: the bye teams fit, and each
 * result names one tie of the tree that is not a bye, once. */
function checkBracketResults(
  phase: SavedBracketPhase,
  index: number,
  plan: SavedPhasePlan
): void {
  const fail: Fail = failWrapper;
  const label = `phase ${index + 1}`;
  if (plan.format !== 'bracket') return;
  let tieIds: Set<string>;
  try {
    const tree = buildBracketTree(
      index + 1,
      phase.seeds,
      phase.byeTeams,
      bracketRulesOf(plan).thirdPlace
    );
    const ties =
      tree.status === 'ready' ? tree.rounds.flatMap((round) => round.ties) : [];
    tieIds = new Set(
      ties.filter((tie) => tie.slots[1].kind !== 'bye').map((tie) => tie.id)
    );
  } catch {
    return fail(`${label} has more bye teams than its bracket has byes.`);
  }
  const played = new Set<string>();
  phase.results.forEach((result, i) => {
    const resultLabel = `${label}, result ${i + 1}`;
    if (!tieIds.has(result.tieId)) fail(`${resultLabel} names no tie of its bracket.`);
    if (played.has(result.tieId))
      fail(`${resultLabel} names a tie that already has a result.`);
    played.add(result.tieId);
  });
}

// --- Plans --------------------------------------------------------------

function readGrouping(value: unknown, label: string): GroupSetting {
  if (isRecord(value) && value.by === 'size' && isPositiveInteger(value.size)) {
    return { by: 'size', size: value.size };
  }
  if (isRecord(value) && value.by === 'count' && isPositiveInteger(value.count)) {
    return { by: 'count', count: value.count };
  }
  return failWrapper(`${label} has no valid group setting.`);
}

const ZONE_COLOURS: readonly ZoneColour[] = ['green', 'blue', 'yellow', 'red'];

/** One stored zone (Task 155 choice 3). `checkZones` checks the rules. */
function readZone(value: unknown, label: string): PlanZone {
  const places = isRecord(value) ? value.places : undefined;
  const valid =
    isRecord(value) &&
    ZONE_COLOURS.includes(value.colour as ZoneColour) &&
    typeof value.label === 'string' &&
    (places === undefined ||
      (isRecord(places) && isFiniteNumber(places.from) && isFiniteNumber(places.to)));
  if (!valid) failWrapper(`${label} has a zone that is not valid.`);
  return {
    colour: value.colour as ZoneColour,
    ...(isRecord(places)
      ? { places: { from: places.from as number, to: places.to as number } }
      : {}),
    label: value.label as string,
  };
}

/** The text of a zone problem (US-12.5): the import error. */
function zoneProblemText(problem: ZoneProblem): string {
  switch (problem.code) {
    case 'repeated-colour':
      return `two ${problem.colour} zones.`;
    case 'label-too-long':
      return `a ${problem.colour} zone label longer than ${ZONE_LABEL_MAX} characters.`;
    case 'places-on-automatic':
      return `places on its automatic ${problem.colour} zone.`;
    case 'missing-places':
      return `a ${problem.colour} zone with no places.`;
    case 'bad-places':
      return `a ${problem.colour} zone with places that are not valid.`;
    case 'shared-place':
      return `a ${problem.colours[0]} zone and a ${problem.colours[1]} zone that share a place.`;
  }
}

/** The zones of a plan, added to it (Task 155). A plan with no zone list
 * keeps none, so a file from before Task 155 reads as it is (choice 4). */
function withZones<Plan extends Exclude<SavedPhasePlan, { format: 'bracket' }>>(
  plan: Plan,
  value: unknown,
  label: string
): Plan {
  if (value === undefined) return plan;
  if (!Array.isArray(value)) failWrapper(`${label} has no valid zone list.`);
  const zoned = { ...plan, zones: value.map((zone) => readZone(zone, label)) };
  const [problem] = checkZones(zoned);
  if (problem) failWrapper(`${label} has ${zoneProblemText(problem)}`);
  return zoned;
}

/** One phase plan (Task 126). The numbers must be whole. The fit rules
 * (Task 126 `checkPhaseFit`) are the wizard's: a file keeps what the
 * wizard made. */
function readPlan(value: unknown, index: number): SavedPhasePlan {
  const label = `plan ${index + 1}`;
  const fail: Fail = failWrapper;
  if (!isRecord(value)) fail(`${label} is not an object.`);
  if (value.format === 'bracket') {
    // A plan with no rules plays with the defaults (Task 139 choice 2).
    if (value.rules === undefined) return { format: 'bracket' };
    return { format: 'bracket', rules: readBracketRules(value.rules, label) };
  }
  if (!isPhaseFormat(value.format)) fail(`${label} has a format that is not known.`);
  if (!isLegs(value.legs)) fail(`${label} has no valid legs.`);
  const advance = value.advance;
  if (advance !== undefined) {
    const valid =
      isRecord(advance) &&
      isPositiveInteger(advance.top) &&
      (value.format === 'round-robin' || isNonNegativeInteger(advance.bestOfNext));
    if (!valid) fail(`${label} has no valid advancement.`);
  }

  if (value.format === 'round-robin') {
    const plan: SavedPhasePlan = {
      format: 'round-robin',
      legs: value.legs,
      ...(isRecord(advance) ? { advance: { top: advance.top as number } } : {}),
    };
    return withZones(plan, value.zones, label);
  }
  const plan: SavedPhasePlan = {
    format: 'groups',
    legs: value.legs,
    grouping: readGrouping(value.grouping, label),
    ...(isRecord(advance)
      ? {
          advance: {
            top: advance.top as number,
            bestOfNext: advance.bestOfNext as number,
          },
        }
      : {}),
  };
  return withZones(plan, value.zones, label);
}

/** The text of a chain problem (US-01.3): the import error. */
function chainProblemText(problem: PhaseChainProblem): string {
  switch (problem.code) {
    case 'no-phases':
      return 'the league has no phase plan.';
    case 'bracket-not-last':
      return `phase ${problem.phase} is a bracket, but a bracket must be the last phase.`;
    case 'missing-advancement':
      return `phase ${problem.phase} has no advancement, but it is not the last phase.`;
    case 'advancement-on-last':
      return `phase ${problem.phase} is the last phase, but it has an advancement.`;
  }
}

const FORMAT_NAMES: Record<SavedPhasePlan['format'], string> = {
  'round-robin': 'a round robin',
  groups: 'a Groups phase',
  bracket: 'a bracket',
};

/** The plans of a league (Task 176 choice 6). A version-2 league has none:
 * each phase gets a two-way round-robin plan with no advancement. */
function readPlans(value: Raw, phaseCount: number, version: Version): SavedPhasePlan[] {
  if (version === 2 && value.plans === undefined) {
    return Array.from({ length: phaseCount }, () => ({
      format: 'round-robin',
      legs: 'two-way',
    }));
  }
  return readList(value.plans, 'plans', failWrapper).map(readPlan);
}

/** The plan and phase checks of Task 176 choice 6. */
function checkPlansAndPhases(
  plans: readonly SavedPhasePlan[],
  phases: readonly SavedPhase[]
): void {
  const fail: Fail = failWrapper;
  const [problem] = checkPhaseChain(plans);
  if (problem) fail(chainProblemText(problem));
  if (phases.length > plans.length) {
    fail(
      `the league has ${phases.length} started phases, but only ${plans.length} phase plan${plans.length === 1 ? '' : 's'}.`
    );
  }
  phases.forEach((phase, index) => {
    const plan = plans[index];
    if (plan.format !== phase.format) {
      fail(
        `phase ${index + 1} is ${FORMAT_NAMES[phase.format]}, but its plan is ${FORMAT_NAMES[plan.format]}.`
      );
    }
    if (phase.format === 'bracket') {
      checkBracketResults(phase, index, plan);
    } else if ('legs' in plan && plan.legs !== phase.legs) {
      fail(`phase ${index + 1} has other legs than its plan.`);
    }
  });
}

function readLeague(
  value: unknown,
  teams: ReadonlySet<string>,
  version: Version
): SavedWrapperLeague {
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
    readPhase(phase, index, teams, leagueFixtureIds, version)
  );
  const plans = readPlans(value, phases.length, version);
  checkPlansAndPhases(plans, phases);

  return {
    uuid: value.uuid,
    name: value.name,
    homeAdvantage: value.homeAdvantage,
    points,
    ...provenance,
    plans,
    phases,
  };
}

export function serializeWrapper(wrapper: SavedWrapper): string {
  return JSON.stringify(wrapper, null, 2);
}

/** Parses and checks one `wrapper-{uuid}.json`. Throws an `Error` that
 * starts with `A league file is not valid:` and says what is wrong. */
export function parseWrapper(text: string): SavedWrapper {
  const { raw, version } = readFileHeader(text, 'wrapper', failWrapper);
  return {
    kind: 'wrapper',
    formatVersion: DATABASE_FORMAT_VERSION,
    ...readWrapperBody(raw, version),
  };
}

/** Reads the UUID, the Instances, and the league of one wrapper: the body of
 * a wrapper file, and of each league in a league file (Task 145). Throws
 * with the prefix `A league file is not valid:`. */
export function readWrapperBody(raw: Raw, version: Version): SavedLeagueEntry {
  const fail: Fail = failWrapper;
  if (!isUuidV4(raw.uuid)) fail('the file has no valid UUID.');

  const teams = readList(raw.teams, 'teams', fail).map(readInstance);
  checkUnique(
    teams,
    (t) => t.blueprintUuid,
    (i, first) => `team ${i + 1} has the same Blueprint UUID as team ${first + 1}.`,
    fail
  );

  const content = readLeague(
    raw.content,
    new Set(teams.map((t) => t.blueprintUuid)),
    version
  );
  if (content.uuid !== raw.uuid) fail('the file UUID is not the league UUID.');

  return { uuid: raw.uuid, teams, content };
}
