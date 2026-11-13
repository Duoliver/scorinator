import { buildPhase, type PhasePlan } from '@/engine/phases';
import { createSeededRng } from '@/engine/rng';
import { assignFixtureIds, generateRoundRobin } from '@/engine/round-robin';
import type {
  LeagueWrapper,
  Phase,
  PhaseResult,
  ScheduledPhase,
  SeasonSummary,
  SeasonWrapper,
  TeamBlueprint,
  TeamInstance,
} from '@/domain';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import type { DatabaseFolder, WrapperText } from '@/persistence/types';

/** Test data for the v2 database records (Task 108). Fixed UUIDs, so the
 * file parsers accept them and a failed test shows a readable value. */

export const INSTALLATION = '00000000-0000-4000-8000-000000000001';
export const SALT_MARSH = '00000000-0000-4000-8000-0000000000a1';
export const HARBORVIEW = '00000000-0000-4000-8000-0000000000a2';
export const LEAGUE = '00000000-0000-4000-8000-0000000000b1';
export const OTHER_LEAGUE = '00000000-0000-4000-8000-0000000000b2';
export const SEASON = '00000000-0000-4000-8000-0000000000c1';

const provenance = {
  createdByInstallation: INSTALLATION,
  lastModifiedByInstallation: INSTALLATION,
};

export function blueprint(overrides: Partial<TeamBlueprint> = {}): TeamBlueprint {
  return {
    uuid: SALT_MARSH,
    slug: 'salt-marsh-united',
    name: 'Salt Marsh United',
    colour: '#1565C0',
    tier: 'B',
    location: 'Ashfield',
    trigrams: ['SMU'],
    ...provenance,
    ...overrides,
  };
}

export function instance(overrides: Partial<TeamInstance> = {}): TeamInstance {
  return {
    blueprintUuid: SALT_MARSH,
    slug: 'salt-marsh-united',
    name: 'Salt Marsh United',
    colour: '#1565C0',
    tier: 'B',
    ovr: 74,
    trigram: 'SMU',
    ...overrides,
  };
}

export function result(fixtureId: string, home: string, away: string): PhaseResult {
  return { fixtureId, home, away, homeGoals: 2, awayGoals: 1 };
}

/** A two-team league with one round-robin phase of two matchdays, and the
 * given results. */
export function leagueWrapper(
  results: PhaseResult[] = [],
  uuid: string = LEAGUE
): LeagueWrapper {
  return {
    uuid,
    teams: [
      instance(),
      instance({
        blueprintUuid: HARBORVIEW,
        slug: 'harborview-sc',
        name: 'Harborview SC',
        colour: '#E53935',
        tier: 'C',
        ovr: 63,
      }),
    ],
    content: {
      uuid,
      name: 'Coastal Premier',
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      ...provenance,
      plans: [{ format: 'round-robin', legs: 'two-way' }],
      phases: [
        {
          format: 'round-robin',
          legs: 'two-way',
          fixtures: [
            { id: 'p1.g1.md1.m1', matchday: 1, home: SALT_MARSH, away: HARBORVIEW },
            { id: 'p1.g1.md2.m1', matchday: 2, home: HARBORVIEW, away: SALT_MARSH },
          ],
          byes: [],
          results,
        },
      ],
    },
  };
}

/** A Season with the two teams of `leagueWrapper`, one league of both, and
 * no playoffs (Task 209). */
export function seasonWrapper(uuid: string = SEASON): SeasonWrapper {
  const league = leagueWrapper();
  // A Season roster has one trigram for each team (US-13.4).
  const trigrams = ['SMU', 'HAR'];
  return {
    uuid,
    teams: league.teams.map((team, index) => ({ ...team, trigram: trigrams[index] })),
    content: {
      uuid,
      name: 'Liga Norte',
      year: '2026-27',
      finished: false,
      ...provenance,
      leagues: [{ ...league.content, teamUuids: [SALT_MARSH, HARBORVIEW] }],
      playoffs: [],
    },
  };
}

/** The manifest row of `seasonWrapper` (Task 209). */
export function seasonRow(uuid: string = SEASON): SeasonSummary {
  return {
    uuid,
    name: 'Liga Norte',
    year: '2026-27',
    finished: false,
    leagueCount: 1,
    teamCount: 2,
    playoffCount: 0,
  };
}

/** An in-memory `DatabaseFolder`, with a log of each `save` call. */
export function memoryFolder(
  initial: { manifest?: string; wrappers?: Record<string, string> } = {}
): {
  folder: DatabaseFolder;
  files: { manifest: string | null; wrappers: Record<string, string> };
  saves: {
    wrappers: readonly WrapperText[];
    manifest: string | null;
    removed: readonly string[];
  }[];
} {
  const files = {
    manifest: initial.manifest ?? null,
    wrappers: { ...initial.wrappers },
  };
  const saves: {
    wrappers: readonly WrapperText[];
    manifest: string | null;
    removed: readonly string[];
  }[] = [];
  const folder: DatabaseFolder = {
    readManifest: async (): Promise<string | null> => files.manifest,
    readWrapper: async (uuid): Promise<string> => {
      const text = files.wrappers[uuid];
      if (text === undefined)
        throw new Error(`The database has no file for the league ${uuid}.`);
      return text;
    },
    save: async (wrappers, manifest, removed = []): Promise<void> => {
      saves.push({ wrappers, manifest, removed });
      for (const wrapper of wrappers) files.wrappers[wrapper.uuid] = wrapper.contents;
      if (manifest !== null) files.manifest = manifest;
      for (const uuid of removed) delete files.wrappers[uuid];
    },
  };
  return { folder, files, saves };
}

/** A UUID v4 for test item `n`, for test data built from a list. */
export function testUuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
}

/**
 * Puts an open database in the store, with one Blueprint for each team and
 * nothing unsaved. A test that seeded the MVP1 roster uses this (Task 109).
 * Each Blueprint gets the UUID `testUuid(1)`, `testUuid(2)`, and so on.
 */
export function openTestDatabase(
  teams: readonly (Pick<TeamBlueprint, 'slug' | 'name' | 'colour' | 'tier'> &
    Partial<Pick<TeamBlueprint, 'location' | 'trigrams'>>)[] = []
): ReturnType<typeof memoryFolder> {
  const memory = memoryFolder();
  const blueprints = teams.map((team, index) =>
    blueprint({
      uuid: testUuid(index + 1),
      location: team.location ?? '',
      trigrams: team.trigrams ?? [],
      slug: team.slug,
      name: team.name,
      colour: team.colour,
      tier: team.tier,
    })
  );
  useDatabaseStore.setState(
    {
      ...useDatabaseStore.getInitialState(),
      status: { kind: 'open' },
      folder: memory.folder,
      installationUuid: INSTALLATION,
      blueprints,
      savedBlueprints: blueprints,
    },
    true
  );
  return memory;
}

/** The four MVP1 team fields of each Blueprint, for a test that compares the
 * Blueprints with an MVP1 team list (Task 109). */
export function teamFields(
  blueprints: readonly Pick<TeamBlueprint, 'slug' | 'name' | 'colour' | 'tier'>[]
): Pick<TeamBlueprint, 'slug' | 'name' | 'colour' | 'tier'>[] {
  return blueprints.map(({ slug, name, colour, tier }) => ({
    slug,
    name,
    colour,
    tier,
  }));
}

/**
 * A league with one Instance for each team, and phase 1 built as
 * `createLeague` builds it, with no results (Task 161). Team n gets the
 * Blueprint UUID `testUuid(n)`, the slug `team-n`, Tier B, and OVR 70. The
 * schedule has no shuffle, so a test can predict it.
 */
export function roundRobinLeague(
  teams: readonly Pick<TeamInstance, 'name' | 'colour'>[],
  overrides: Partial<
    Pick<LeagueWrapper['content'], 'name' | 'homeAdvantage' | 'points'>
  > & {
    uuid?: string;
  } = {}
): LeagueWrapper {
  const { uuid = LEAGUE, ...details } = overrides;
  const instances = teams.map((team, index): TeamInstance => ({
    blueprintUuid: testUuid(index + 1),
    slug: `team-${index + 1}`,
    name: team.name,
    colour: team.colour,
    tier: 'B',
    ovr: 70,
    trigram: '',
  }));
  const uuids = instances.map((team) => team.blueprintUuid);
  const schedule =
    uuids.length >= 2 ? generateRoundRobin(uuids) : { fixtures: [], byes: [] };
  return {
    uuid,
    teams: instances,
    content: {
      uuid,
      name: 'Coastal Premier',
      homeAdvantage: false,
      points: { win: 3, draw: 1, loss: 0 },
      ...provenance,
      ...details,
      plans: [{ format: 'round-robin', legs: 'two-way' }],
      phases: [
        {
          format: 'round-robin',
          legs: 'two-way',
          fixtures: assignFixtureIds(schedule.fixtures, { phase: 1, group: 1 }),
          byes: schedule.byes,
          results: [],
        },
      ],
    },
  };
}

/** The plans of `groupsLeague` when a test gives none: two-way groups, the
 * top 2 of each group to a bracket. */
export const GROUPS_THEN_BRACKET: PhasePlan[] = [
  {
    format: 'groups',
    legs: 'two-way',
    grouping: { by: 'count', count: 2 },
    advance: { top: 2, bestOfNext: 0 },
  },
  { format: 'bracket' },
];

/**
 * A league whose phase 1 is a Groups phase with the given draw, built as
 * `createLeague` builds it, with no results (Task 131). `groups` lists team
 * numbers from 1: `[[1, 2], [3, 4]]` puts teams 1 and 2 in Group A. The
 * teams are as in `roundRobinLeague`. A fixed seed makes the schedule the
 * same in each run.
 */
export function groupsLeague(
  teams: readonly Pick<TeamInstance, 'name' | 'colour'>[],
  groups: readonly (readonly number[])[],
  plans: PhasePlan[] = GROUPS_THEN_BRACKET
): LeagueWrapper {
  const base = roundRobinLeague(teams);
  const draw = groups.map((group) => group.map((n) => testUuid(n)));
  const built = buildPhase(plans[0], 1, draw.flat(), createSeededRng(1), draw);
  return {
    ...base,
    content: { ...base.content, plans, phases: [{ ...built, results: [] }] },
  };
}

/** Puts one league in the open test database, as `openLeague` leaves it:
 * opened, with its manifest row, and nothing unsaved. Call
 * `openTestDatabase` first. */
export function openTestLeague(wrapper: LeagueWrapper): LeagueWrapper {
  const row = summarizeLeague(wrapper);
  useDatabaseStore.setState((state) => ({
    leagues: { ...state.leagues, [wrapper.uuid]: wrapper },
    savedLeagues: { ...state.savedLeagues, [wrapper.uuid]: wrapper },
    rows: [...state.rows, row],
    savedRows: [...state.savedRows, row],
  }));
  return wrapper;
}

/** A started phase as a round robin or Groups phase, for a test that reads
 * its fixtures or byes. Throws for a missing phase or a bracket. */
export function scheduled(phase: Phase | undefined): ScheduledPhase {
  if (!phase || phase.format === 'bracket') {
    throw new Error('The test expected a round robin or Groups phase.');
  }
  return phase;
}
