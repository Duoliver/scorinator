import { describe, expect, it } from 'vitest';
import {
  DATABASE_FORMAT_VERSION,
  detectFileKind,
  parseBlueprintFile,
  parseLeagueFile,
  serializeBlueprintFile,
  serializeLeagueFile,
  type SavedBlueprint,
  type SavedBlueprintFile,
  type SavedLeagueEntry,
  type SavedLeagueFile,
} from './index';

const INSTALLATION = '00000000-0000-4000-8000-000000000001';
const SALT_MARSH = '00000000-0000-4000-8000-0000000000a1';
const HARBORVIEW = '00000000-0000-4000-8000-0000000000a2';
const LEAGUE = '00000000-0000-4000-8000-0000000000b1';
const OTHER_LEAGUE = '00000000-0000-4000-8000-0000000000b2';

const provenance = {
  createdByInstallation: INSTALLATION,
  lastModifiedByInstallation: INSTALLATION,
};

function savedBlueprint(uuid: string, slug: string): SavedBlueprint {
  return {
    uuid,
    slug,
    name: slug,
    colour: '#1565C0',
    tier: 'B',
    location: 'Ashfield',
    trigrams: ['SMU'],
    ...provenance,
  };
}

function entry(uuid: string, name: string): SavedLeagueEntry {
  return {
    uuid,
    teams: [
      {
        blueprintUuid: SALT_MARSH,
        slug: 'salt-marsh-united',
        name: 'Salt Marsh United',
        colour: '#1565C0',
        tier: 'B',
        ovr: 74,
        trigram: 'SMU',
      },
      {
        blueprintUuid: HARBORVIEW,
        slug: 'harborview-sc',
        name: 'Harborview SC',
        colour: '#E53935',
        tier: 'C',
        ovr: 63,
        trigram: 'HAR',
      },
    ],
    content: {
      uuid,
      name,
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
          results: [
            {
              fixtureId: 'p1.g1.md1.m1',
              home: SALT_MARSH,
              away: HARBORVIEW,
              homeGoals: 2,
              awayGoals: 1,
            },
          ],
        },
      ],
    },
  };
}

function leagueFile(): SavedLeagueFile {
  return {
    kind: 'leagues',
    formatVersion: DATABASE_FORMAT_VERSION,
    leagues: [entry(LEAGUE, 'Coastal Premier'), entry(OTHER_LEAGUE, 'Old Cup')],
    blueprints: [savedBlueprint(SALT_MARSH, 'salt-marsh-united')],
  };
}

function blueprintFile(): SavedBlueprintFile {
  return {
    kind: 'blueprints',
    formatVersion: DATABASE_FORMAT_VERSION,
    blueprints: [
      savedBlueprint(SALT_MARSH, 'salt-marsh-united'),
      savedBlueprint(HARBORVIEW, 'harborview-sc'),
    ],
  };
}

/** The file as JSON, with one change made to the parsed object. */
function edited(file: object, change: (raw: Record<string, unknown>) => void): string {
  const raw = JSON.parse(JSON.stringify(file)) as Record<string, unknown>;
  change(raw);
  return JSON.stringify(raw);
}

describe('the league file (US-10.1, US-10.2, Task 145)', () => {
  it('reads back what it writes, with many leagues and one Blueprint list', () => {
    const text = serializeLeagueFile(leagueFile());
    expect(parseLeagueFile(text)).toEqual(leagueFile());
  });

  it('starts with the kind and the format version', () => {
    const raw = JSON.parse(serializeLeagueFile(leagueFile())) as Record<
      string,
      unknown
    >;
    expect(Object.keys(raw)).toEqual([
      'kind',
      'formatVersion',
      'leagues',
      'blueprints',
    ]);
    expect(raw.formatVersion).toBe(5);
  });

  it('reads a file with one league and no Blueprint', () => {
    const one = {
      ...leagueFile(),
      leagues: [entry(LEAGUE, 'Coastal Premier')],
      blueprints: [],
    };
    expect(parseLeagueFile(serializeLeagueFile(one))).toEqual(one);
  });

  it('rejects a text that is not JSON, and a file of another kind', () => {
    expect(() => parseLeagueFile('{')).toThrow(
      'A league file is not valid: the text is not JSON.'
    );
    expect(() => parseLeagueFile(serializeBlueprintFile(blueprintFile()))).toThrow(
      'A league file is not valid: the file is not a league file.'
    );
  });

  it('rejects a newer format version', () => {
    expect(() =>
      parseLeagueFile(edited(leagueFile(), (raw) => (raw.formatVersion = 6)))
    ).toThrow(
      'A league file is not valid: a newer version of Scorinator made this file (format version 6).'
    );
  });

  it('rejects a file with no league', () => {
    expect(() =>
      parseLeagueFile(edited(leagueFile(), (raw) => (raw.leagues = [])))
    ).toThrow('A league file is not valid: the file has no league.');
  });

  it('names the league of an error, when the file has many', () => {
    const text = edited(leagueFile(), (raw) => {
      const leagues = raw.leagues as SavedLeagueEntry[];
      (leagues[1].teams[0] as unknown as Record<string, unknown>).ovr = 'x';
    });
    expect(() => parseLeagueFile(text)).toThrow(
      /^A league file is not valid: league 2: team 1/
    );
  });

  it('rejects two leagues or two Blueprints with the same UUID', () => {
    expect(() =>
      parseLeagueFile(
        edited(leagueFile(), (raw) => {
          raw.leagues = [entry(LEAGUE, 'A'), entry(LEAGUE, 'B')];
        })
      )
    ).toThrow('A league file is not valid: league 2 has the same UUID as league 1.');
    expect(() =>
      parseLeagueFile(
        edited(leagueFile(), (raw) => {
          raw.blueprints = [
            savedBlueprint(SALT_MARSH, 'one'),
            savedBlueprint(SALT_MARSH, 'two'),
          ];
        })
      )
    ).toThrow(
      'A league file is not valid: Blueprint 2 has the same UUID as Blueprint 1.'
    );
  });

  it('rejects a Blueprint that is not valid, with the league file prefix', () => {
    const text = edited(leagueFile(), (raw) => {
      (raw.blueprints as SavedBlueprint[])[0].tier = 'Z' as SavedBlueprint['tier'];
    });
    expect(() => parseLeagueFile(text)).toThrow(
      'A league file is not valid: Blueprint 1 has no valid tier.'
    );
  });
});

describe('the Blueprint file (US-10.2, Task 145)', () => {
  it('reads back what it writes', () => {
    const text = serializeBlueprintFile(blueprintFile());
    expect(parseBlueprintFile(text)).toEqual(blueprintFile());
    const raw = JSON.parse(text) as Record<string, unknown>;
    expect(Object.keys(raw)).toEqual(['kind', 'formatVersion', 'blueprints']);
  });

  it('rejects a file of another kind, no Blueprint, and a repeated UUID', () => {
    expect(() => parseBlueprintFile(serializeLeagueFile(leagueFile()))).toThrow(
      'A team blueprints file is not valid: the file is not a team blueprints file.'
    );
    expect(() =>
      parseBlueprintFile(edited(blueprintFile(), (raw) => (raw.blueprints = [])))
    ).toThrow('A team blueprints file is not valid: the file has no Blueprint.');
    expect(() =>
      parseBlueprintFile(
        edited(blueprintFile(), (raw) => {
          raw.blueprints = [
            savedBlueprint(SALT_MARSH, 'one'),
            savedBlueprint(SALT_MARSH, 'two'),
          ];
        })
      )
    ).toThrow(
      'A team blueprints file is not valid: Blueprint 2 has the same UUID as Blueprint 1.'
    );
  });

  it('reads a missing location or trigram list as empty', () => {
    const text = edited(blueprintFile(), (raw) => {
      const [first] = raw.blueprints as Record<string, unknown>[];
      delete first.location;
      delete first.trigrams;
    });
    expect(parseBlueprintFile(text).blueprints[0]).toMatchObject({
      location: '',
      trigrams: [],
    });
  });
});

describe('detectFileKind (US-10.3, Task 145)', () => {
  it.each([
    ['a league file', serializeLeagueFile(leagueFile()), 'leagues'],
    ['a Blueprint file', serializeBlueprintFile(blueprintFile()), 'blueprints'],
    ['a manifest', JSON.stringify({ kind: 'manifest' }), 'manifest'],
    ['a wrapper file', JSON.stringify({ kind: 'wrapper' }), 'wrapper'],
    ['an MVP1 teams JSON', JSON.stringify([{ name: 'A', tier: 'B' }]), 'mvp1'],
    [
      'an MVP1 save file',
      JSON.stringify({ formatVersion: 1, league: {}, teams: [] }),
      'mvp1',
    ],
    ['a text that is not JSON', '{', 'unknown'],
    ['an object with another kind', JSON.stringify({ kind: 'calendar' }), 'unknown'],
    ['an object with no kind', JSON.stringify({ name: 'x' }), 'unknown'],
  ])('finds %s', (_name, text, kind) => {
    expect(detectFileKind(text)).toBe(kind);
  });
});
