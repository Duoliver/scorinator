import type { LeagueWrapper, PhaseResult, TeamBlueprint, TeamInstance } from '@/domain';
import type { DatabaseFolder, WrapperText } from '@/persistence/types';

/** Test data for the v2 database records (Task 108). Fixed UUIDs, so the
 * file parsers accept them and a failed test shows a readable value. */

export const INSTALLATION = '00000000-0000-4000-8000-000000000001';
export const SALT_MARSH = '00000000-0000-4000-8000-0000000000a1';
export const HARBORVIEW = '00000000-0000-4000-8000-0000000000a2';
export const LEAGUE = '00000000-0000-4000-8000-0000000000b1';
export const OTHER_LEAGUE = '00000000-0000-4000-8000-0000000000b2';

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
      phases: [
        {
          format: 'round-robin',
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

/** An in-memory `DatabaseFolder`, with a log of each `save` call. */
export function memoryFolder(
  initial: { manifest?: string; wrappers?: Record<string, string> } = {}
): {
  folder: DatabaseFolder;
  files: { manifest: string | null; wrappers: Record<string, string> };
  saves: { wrappers: readonly WrapperText[]; manifest: string | null }[];
} {
  const files = {
    manifest: initial.manifest ?? null,
    wrappers: { ...initial.wrappers },
  };
  const saves: { wrappers: readonly WrapperText[]; manifest: string | null }[] = [];
  const folder: DatabaseFolder = {
    readManifest: async (): Promise<string | null> => files.manifest,
    readWrapper: async (uuid): Promise<string> => {
      const text = files.wrappers[uuid];
      if (text === undefined)
        throw new Error(`The database has no file for the league ${uuid}.`);
      return text;
    },
    save: async (wrappers, manifest): Promise<void> => {
      saves.push({ wrappers, manifest });
      for (const wrapper of wrappers) files.wrappers[wrapper.uuid] = wrapper.contents;
      if (manifest !== null) files.manifest = manifest;
    },
  };
  return { folder, files, saves };
}
