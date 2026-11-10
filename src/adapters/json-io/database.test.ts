import { describe, expect, it } from 'vitest';
import {
  DATABASE_FORMAT_VERSION,
  parseManifest,
  parseWrapper,
  serializeManifest,
  serializeWrapper,
  type SavedInstance,
  type SavedManifest,
  type SavedWrapper,
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

function buildManifest(): SavedManifest {
  return {
    kind: 'manifest',
    formatVersion: DATABASE_FORMAT_VERSION,
    installationUuid: INSTALLATION,
    blueprints: [
      {
        uuid: SALT_MARSH,
        slug: 'salt-marsh-united',
        name: 'Salt Marsh United',
        colour: '#1565C0',
        tier: 'B',
        location: 'Ashfield',
        trigrams: ['SMU', 'SAL'],
        ...provenance,
      },
      {
        uuid: HARBORVIEW,
        slug: 'harborview-sc',
        name: 'Harborview SC',
        colour: '#E53935',
        tier: 'C',
        location: '',
        trigrams: [],
        ...provenance,
      },
    ],
    wrappers: [
      {
        uuid: LEAGUE,
        contentType: 'league',
        name: 'Coastal Premier',
        teamCount: 2,
        homeAdvantage: true,
        points: { win: 3, draw: 1, loss: 0 },
        phases: [{ format: 'round-robin', legs: 'two-way' }],
        progress: { kind: 'phase', phase: 1, matchday: 2, matchdays: 2 },
      },
      {
        uuid: OTHER_LEAGUE,
        contentType: 'league',
        name: 'Old Cup',
        teamCount: 2,
        homeAdvantage: false,
        points: { win: 2, draw: 1, loss: 0 },
        phases: [{ format: 'round-robin', legs: 'two-way' }],
        progress: { kind: 'completed' },
      },
    ],
  };
}

function buildWrapper(): SavedWrapper {
  return {
    kind: 'wrapper',
    formatVersion: DATABASE_FORMAT_VERSION,
    uuid: LEAGUE,
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
      uuid: LEAGUE,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a test edits the raw JSON freely, to make a bad file
type RawFile = any;

/** The manifest as JSON text, after `change` edits a raw copy of it. */
function manifestText(change: (raw: RawFile) => void = () => {}): string {
  const raw = structuredClone(buildManifest()) as RawFile;
  change(raw);
  return JSON.stringify(raw);
}

function wrapperText(change: (raw: RawFile) => void = () => {}): string {
  const raw = structuredClone(buildWrapper()) as RawFile;
  change(raw);
  return JSON.stringify(raw);
}

describe('the format version', () => {
  it('is 4 for each MVP2 database file (Task 139)', () => {
    expect(DATABASE_FORMAT_VERSION).toBe(4);
  });
});

describe('serializeManifest and serializeWrapper', () => {
  it('write JSON with an indent of 2', () => {
    expect(serializeManifest(buildManifest())).toBe(
      JSON.stringify(buildManifest(), null, 2)
    );
    expect(serializeWrapper(buildWrapper())).toBe(
      JSON.stringify(buildWrapper(), null, 2)
    );
  });

  it('give the same manifest after a round trip', () => {
    expect(parseManifest(serializeManifest(buildManifest()))).toEqual(buildManifest());
  });

  it('give the same wrapper after a round trip, with its results', () => {
    expect(parseWrapper(serializeWrapper(buildWrapper()))).toEqual(buildWrapper());
  });

  it('write camelCase provenance keys', () => {
    const text = serializeManifest(buildManifest());
    expect(text).toContain('"createdByInstallation"');
    expect(text).toContain('"lastModifiedByInstallation"');
  });
});

describe('parseManifest', () => {
  it('rejects a text that is not JSON', () => {
    expect(() => parseManifest('{ not json')).toThrow(
      'manifest.json is not valid: the text is not JSON.'
    );
  });

  it('rejects a JSON value that is not an object', () => {
    expect(() => parseManifest('[]')).toThrow(
      'manifest.json is not valid: the file does not hold a JSON object.'
    );
  });

  it('rejects a file of another kind', () => {
    expect(() => parseManifest(serializeWrapper(buildWrapper()))).toThrow(
      'manifest.json is not valid: the file is not a manifest. Its kind is "wrapper".'
    );
  });

  it('rejects a newer format version, and says that a newer Scorinator made it', () => {
    expect(() => parseManifest(manifestText((raw) => (raw.formatVersion = 5)))).toThrow(
      'manifest.json is not valid: a newer version of Scorinator made this file (format version 5). This version reads format versions 2 to 4.'
    );
  });

  it('rejects an older or missing format version', () => {
    expect(() => parseManifest(manifestText((raw) => (raw.formatVersion = 1)))).toThrow(
      'manifest.json is not valid: the format version is "1". This version reads format versions 2 to 4.'
    );
    expect(() =>
      parseManifest(manifestText((raw) => delete raw.formatVersion))
    ).toThrow('the format version is "undefined"');
  });

  it('rejects an installation UUID that is not a UUID v4', () => {
    expect(() =>
      parseManifest(manifestText((raw) => (raw.installationUuid = 'abc')))
    ).toThrow('manifest.json is not valid: the installation UUID is not a UUID v4.');
  });

  it('rejects a Blueprint with a missing or bad field', () => {
    expect(() =>
      parseManifest(manifestText((raw) => (raw.blueprints[1].uuid = 'abc')))
    ).toThrow('Blueprint 2 has no valid UUID.');
    expect(() =>
      parseManifest(manifestText((raw) => delete raw.blueprints[0].name))
    ).toThrow('Blueprint 1 has no name.');
    expect(() =>
      parseManifest(manifestText((raw) => (raw.blueprints[0].tier = 'Z')))
    ).toThrow('Blueprint 1 has no valid tier.');
    expect(() =>
      parseManifest(
        manifestText((raw) => delete raw.blueprints[0].lastModifiedByInstallation)
      )
    ).toThrow('Blueprint 1 has no valid "lastModifiedByInstallation" UUID.');
    expect(() =>
      parseManifest(manifestText((raw) => (raw.blueprints[0].trigrams = ['SMU', 7])))
    ).toThrow('Blueprint 1 has trigrams that are not a list of text.');
  });

  it('gives an empty location and no trigrams when the fields are missing', () => {
    const manifest = parseManifest(
      manifestText((raw) => {
        delete raw.blueprints[0].location;
        delete raw.blueprints[0].trigrams;
      })
    );
    expect(manifest.blueprints[0].location).toBe('');
    expect(manifest.blueprints[0].trigrams).toEqual([]);
  });

  it('rejects two Blueprints with the same UUID or the same slug', () => {
    expect(() =>
      parseManifest(manifestText((raw) => (raw.blueprints[1].uuid = SALT_MARSH)))
    ).toThrow('Blueprint 2 has the same UUID as Blueprint 1.');
    expect(() =>
      parseManifest(
        manifestText((raw) => (raw.blueprints[1].slug = 'salt-marsh-united'))
      )
    ).toThrow('Blueprint 2 has the same slug as Blueprint 1.');
  });

  it('rejects a summary row with a missing or bad field', () => {
    expect(() =>
      parseManifest(manifestText((raw) => (raw.wrappers[0].contentType = 'season')))
    ).toThrow('league row 1 has no valid content type.');
    expect(() =>
      parseManifest(
        manifestText((raw) => (raw.wrappers[0].phases = [{ format: 'knockout' }]))
      )
    ).toThrow('league row 1 has a phase that is not valid.');
    expect(() =>
      parseManifest(
        manifestText(
          (raw) => (raw.wrappers[0].phases = [{ format: 'round-robin', legs: 'three' }])
        )
      )
    ).toThrow('league row 1 has a phase that is not valid.');
    expect(() =>
      parseManifest(manifestText((raw) => (raw.wrappers[0].teamCount = -1)))
    ).toThrow('league row 1 has no valid team count.');
    expect(() =>
      parseManifest(manifestText((raw) => delete raw.wrappers[0].points.draw))
    ).toThrow('league row 1 has no valid points for a draw.');
  });

  it('rejects a progress that is not valid', () => {
    expect(() =>
      parseManifest(
        manifestText((raw) => (raw.wrappers[0].progress = { kind: 'setup' }))
      )
    ).toThrow('league row 1 has no valid progress.');
    expect(() =>
      parseManifest(manifestText((raw) => (raw.wrappers[0].progress.matchday = 3)))
    ).toThrow('league row 1 has no valid progress.');
    expect(() =>
      parseManifest(manifestText((raw) => (raw.wrappers[0].progress.phase = 2)))
    ).toThrow('league row 1 has no valid progress.');
  });

  it('rejects two summary rows with the same UUID', () => {
    expect(() =>
      parseManifest(manifestText((raw) => (raw.wrappers[1].uuid = LEAGUE)))
    ).toThrow('league row 2 has the same UUID as league row 1.');
  });

  it('accepts a manifest with no Blueprints and no leagues', () => {
    const empty = manifestText((raw) => {
      raw.blueprints = [];
      raw.wrappers = [];
    });
    expect(parseManifest(empty)).toEqual({
      ...buildManifest(),
      blueprints: [],
      wrappers: [],
    });
  });
});

describe('parseWrapper', () => {
  it('rejects a text that is not JSON, or a file of another kind', () => {
    expect(() => parseWrapper('nope')).toThrow(
      'A league file is not valid: the text is not JSON.'
    );
    expect(() => parseWrapper(serializeManifest(buildManifest()))).toThrow(
      'A league file is not valid: the file is not a wrapper. Its kind is "manifest".'
    );
  });

  it('rejects a format version that is not the current one', () => {
    expect(() => parseWrapper(wrapperText((raw) => (raw.formatVersion = 9)))).toThrow(
      'a newer version of Scorinator made this file (format version 9).'
    );
  });

  it('rejects a wrapper UUID that is not the league UUID', () => {
    expect(() => parseWrapper(wrapperText((raw) => (raw.uuid = OTHER_LEAGUE)))).toThrow(
      'A league file is not valid: the file UUID is not the league UUID.'
    );
  });

  it('rejects a team with a missing or bad field', () => {
    expect(() => parseWrapper(wrapperText((raw) => delete raw.teams[1].ovr))).toThrow(
      'team 2 has no valid OVR.'
    );
    expect(() =>
      parseWrapper(wrapperText((raw) => (raw.teams[0].blueprintUuid = 'x')))
    ).toThrow('team 1 has no valid Blueprint UUID.');
  });

  it('reads the trigram of each team, and an empty one when it is missing (Task 121)', () => {
    const wrapper = parseWrapper(wrapperText((raw) => delete raw.teams[1].trigram));
    expect(wrapper.teams[0].trigram).toBe('SMU');
    expect(wrapper.teams[1].trigram).toBe('');
  });

  it('rejects a trigram that is not text', () => {
    expect(() =>
      parseWrapper(wrapperText((raw) => (raw.teams[0].trigram = 7)))
    ).toThrow('team 1 has a trigram that is not text.');
  });

  it('rejects two teams with the same Blueprint UUID', () => {
    expect(() =>
      parseWrapper(wrapperText((raw) => (raw.teams[1].blueprintUuid = SALT_MARSH)))
    ).toThrow('team 2 has the same Blueprint UUID as team 1.');
  });

  it('rejects a league with a missing or bad field', () => {
    expect(() =>
      parseWrapper(wrapperText((raw) => delete raw.content.homeAdvantage))
    ).toThrow('the league has no valid "homeAdvantage" flag.');
    expect(() =>
      parseWrapper(wrapperText((raw) => (raw.content.phases[0].format = 'cup')))
    ).toThrow('phase 1 has a format that is not known.');
  });

  it('rejects a fixture with a missing id, or an id that another fixture uses', () => {
    expect(() =>
      parseWrapper(wrapperText((raw) => delete raw.content.phases[0].fixtures[0].id))
    ).toThrow('phase 1, fixture 1 has no id.');
    expect(() =>
      parseWrapper(
        wrapperText((raw) => (raw.content.phases[0].fixtures[1].id = 'p1.g1.md1.m1'))
      )
    ).toThrow('phase 1, fixture 2 has an id that another fixture uses.');
  });

  it('rejects a fixture id that a fixture of another phase uses', () => {
    const twoPhases = wrapperText((raw) => {
      raw.content.plans = [
        { format: 'round-robin', legs: 'two-way', advance: { top: 2 } },
        { format: 'round-robin', legs: 'two-way' },
      ];
      raw.content.phases.push(structuredClone(raw.content.phases[0]));
      raw.content.phases[1].results = [];
    });
    expect(() => parseWrapper(twoPhases)).toThrow(
      'phase 2, fixture 1 has an id that another fixture uses.'
    );
  });

  it('rejects a fixture or a bye that names a team outside the league', () => {
    expect(() =>
      parseWrapper(
        wrapperText((raw) => (raw.content.phases[0].fixtures[0].away = OTHER_LEAGUE))
      )
    ).toThrow('phase 1, fixture 1 names a team that is not in the league.');
    expect(() =>
      parseWrapper(
        wrapperText(
          (raw) => (raw.content.phases[0].byes = [{ matchday: 1, team: OTHER_LEAGUE }])
        )
      )
    ).toThrow('phase 1, bye 1 names a team that is not in the league.');
  });

  it('rejects a result that names no fixture of its phase', () => {
    expect(() =>
      parseWrapper(
        wrapperText(
          (raw) => (raw.content.phases[0].results[0].fixtureId = 'p1.g1.md9.m1')
        )
      )
    ).toThrow('phase 1, result 1 names no fixture of its phase.');
  });

  it('rejects a result with other teams than its fixture', () => {
    expect(() =>
      parseWrapper(
        wrapperText((raw) => {
          const result = raw.content.phases[0].results[0];
          [result.home, result.away] = [result.away, result.home];
        })
      )
    ).toThrow('phase 1, result 1 has other teams than its fixture.');
  });

  it('rejects two results for the same fixture', () => {
    expect(() =>
      parseWrapper(
        wrapperText((raw) =>
          raw.content.phases[0].results.push({ ...raw.content.phases[0].results[0] })
        )
      )
    ).toThrow('phase 1, result 2 names a fixture that already has a result.');
  });

  it('rejects a bad score', () => {
    expect(() =>
      parseWrapper(
        wrapperText((raw) => (raw.content.phases[0].results[0].homeGoals = -1))
      )
    ).toThrow('phase 1, result 1 has no valid home score.');
  });

  it('accepts a league with no phases yet, and a phase with no results', () => {
    expect(
      parseWrapper(wrapperText((raw) => (raw.content.phases[0].results = []))).content
        .phases[0].results
    ).toEqual([]);
    expect(
      parseWrapper(wrapperText((raw) => (raw.content.phases = []))).content.phases
    ).toEqual([]);
  });
});

const NORTH = '00000000-0000-4000-8000-0000000000a3';
const EAST = '00000000-0000-4000-8000-0000000000a4';

/** A four-team league: phase 1 is Groups (2 groups of 2, single duels, top
 * 1), phase 2 a bracket that has not started. */
function buildGroupsWrapper(): SavedWrapper {
  const wrapper = buildWrapper();
  const extra = (blueprintUuid: string, name: string): SavedInstance => ({
    ...wrapper.teams[0],
    blueprintUuid,
    slug: name.toLowerCase(),
    name,
  });
  return {
    ...wrapper,
    teams: [...wrapper.teams, extra(NORTH, 'North'), extra(EAST, 'East')],
    content: {
      ...wrapper.content,
      plans: [
        {
          format: 'groups',
          legs: 'single-duels',
          grouping: { by: 'count', count: 2 },
          advance: { top: 1, bestOfNext: 0 },
        },
        { format: 'bracket' },
      ],
      phases: [
        {
          format: 'groups',
          legs: 'single-duels',
          groups: [
            [SALT_MARSH, HARBORVIEW],
            [NORTH, EAST],
          ],
          fixtures: [
            { id: 'p1.g1.md1.m1', matchday: 1, home: SALT_MARSH, away: HARBORVIEW },
            { id: 'p1.g2.md1.m1', matchday: 1, home: EAST, away: NORTH },
          ],
          byes: [],
          results: [
            {
              fixtureId: 'p1.g2.md1.m1',
              home: EAST,
              away: NORTH,
              homeGoals: 0,
              awayGoals: 0,
            },
          ],
        },
      ],
    },
  };
}

function groupsText(change: (raw: RawFile) => void = () => {}): string {
  const raw = structuredClone(buildGroupsWrapper()) as RawFile;
  change(raw);
  return JSON.stringify(raw);
}

describe('zones (Task 155, US-12.5)', () => {
  const ZONES = [
    { colour: 'green', label: 'Knockout' },
    { colour: 'red', places: { from: 2, to: 2 }, label: 'Out' },
  ];

  it('gives the same zones after a round trip', () => {
    const text = groupsText((raw) => (raw.content.plans[0].zones = ZONES));
    const wrapper = parseWrapper(text);
    expect(wrapper.content.plans[0]).toMatchObject({ zones: ZONES });
    expect(parseWrapper(serializeWrapper(wrapper))).toEqual(wrapper);
  });

  it('reads a plan with no zones, with no "zones" field, in version 4', () => {
    const [plan] = parseWrapper(groupsText()).content.plans;
    expect('zones' in plan).toBe(false);
  });

  it('reads an empty zone list', () => {
    const text = wrapperText((raw) => (raw.content.plans[0].zones = []));
    expect(parseWrapper(text).content.plans[0]).toMatchObject({ zones: [] });
  });

  it.each<[string, (raw: RawFile) => void, string]>([
    [
      'a zone list that is not a list',
      (raw): unknown => (raw.content.plans[0].zones = {}),
      'plan 1 has no valid zone list.',
    ],
    [
      'a zone that is not an object',
      (raw): unknown => (raw.content.plans[0].zones = ['red']),
      'plan 1 has a zone that is not valid.',
    ],
    [
      'a colour that is not known',
      (raw): unknown =>
        (raw.content.plans[0].zones = [
          { colour: 'pink', places: { from: 1, to: 1 }, label: '' },
        ]),
      'plan 1 has a zone that is not valid.',
    ],
    [
      'a label that is not text',
      (raw): unknown =>
        (raw.content.plans[0].zones = [
          { colour: 'red', places: { from: 1, to: 1 }, label: 3 },
        ]),
      'plan 1 has a zone that is not valid.',
    ],
    [
      'places that are not two numbers',
      (raw): unknown =>
        (raw.content.plans[0].zones = [
          { colour: 'red', places: { from: 1 }, label: '' },
        ]),
      'plan 1 has a zone that is not valid.',
    ],
    [
      'a colour used twice',
      (raw): unknown =>
        (raw.content.plans[0].zones = [
          { colour: 'red', places: { from: 1, to: 1 }, label: '' },
          { colour: 'red', places: { from: 2, to: 2 }, label: '' },
        ]),
      'plan 1 has two red zones.',
    ],
    [
      'a label that is too long',
      (raw): unknown =>
        (raw.content.plans[0].zones = [
          { colour: 'red', places: { from: 1, to: 1 }, label: 'x'.repeat(25) },
        ]),
      'plan 1 has a red zone label longer than 24 characters.',
    ],
    [
      'places on an automatic zone',
      (raw): unknown =>
        (raw.content.plans[0].zones = [
          { colour: 'green', places: { from: 1, to: 1 }, label: '' },
        ]),
      'plan 1 has places on its automatic green zone.',
    ],
    [
      'a free zone with no places',
      (raw): unknown => (raw.content.plans[0].zones = [{ colour: 'blue', label: '' }]),
      'plan 1 has a blue zone with no places.',
    ],
    [
      'a range that is not valid',
      (raw): unknown =>
        (raw.content.plans[0].zones = [
          { colour: 'blue', places: { from: 3, to: 2 }, label: '' },
        ]),
      'plan 1 has a blue zone with places that are not valid.',
    ],
    [
      'two zones that share a place',
      (raw): unknown =>
        (raw.content.plans[0].zones = [
          { colour: 'blue', places: { from: 1, to: 2 }, label: '' },
        ]),
      'plan 1 has a green zone and a blue zone that share a place.',
    ],
  ])('rejects %s', (_, change, message) => {
    expect(() => parseWrapper(groupsText(change))).toThrow(message);
  });
});

describe('phases, plans, and legs (Task 176)', () => {
  it('gives the same Groups league after a round trip, with its plans and draw', () => {
    expect(parseWrapper(serializeWrapper(buildGroupsWrapper()))).toEqual(
      buildGroupsWrapper()
    );
  });

  it('reads a version-2 wrapper: legs two-way, one round-robin plan for each phase', () => {
    const v2 = wrapperText((raw) => {
      raw.formatVersion = 2;
      delete raw.content.plans;
      delete raw.content.phases[0].legs;
    });
    expect(parseWrapper(v2)).toEqual(buildWrapper());
  });

  it('reads a version-2 manifest: each phase format becomes a two-way phase', () => {
    const v2 = manifestText((raw) => {
      raw.formatVersion = 2;
      for (const row of raw.wrappers) {
        delete row.phases;
        row.phaseFormats = ['round-robin'];
      }
    });
    expect(parseManifest(v2)).toEqual(buildManifest());
  });

  it('reads a bracket summary with no legs', () => {
    const manifest = parseManifest(
      manifestText(
        (raw) =>
          (raw.wrappers[1].phases = [
            { format: 'groups', legs: 'two-way' },
            { format: 'bracket' },
          ])
      )
    );
    expect(manifest.wrappers[1].phases).toEqual([
      { format: 'groups', legs: 'two-way' },
      { format: 'bracket' },
    ]);
  });

  it('rejects a bracket before the last phase (US-01.3)', () => {
    expect(() =>
      parseWrapper(
        groupsText(
          (raw) => (raw.content.plans = [{ format: 'bracket' }, raw.content.plans[0]])
        )
      )
    ).toThrow(
      'A league file is not valid: phase 1 is a bracket, but a bracket must be the last phase.'
    );
  });

  it('rejects a missing advancement, an advancement on the last phase, and no plans', () => {
    expect(() =>
      parseWrapper(groupsText((raw) => delete raw.content.plans[0].advance))
    ).toThrow('phase 1 has no advancement, but it is not the last phase.');
    expect(() =>
      parseWrapper(wrapperText((raw) => (raw.content.plans[0].advance = { top: 1 })))
    ).toThrow('phase 1 is the last phase, but it has an advancement.');
    expect(() => parseWrapper(wrapperText((raw) => (raw.content.plans = [])))).toThrow(
      'the league has no phase plan.'
    );
  });

  it('rejects a plan with a bad field', () => {
    expect(() =>
      parseWrapper(wrapperText((raw) => (raw.content.plans[0].format = 'knockout')))
    ).toThrow('plan 1 has a format that is not known.');
    expect(() =>
      parseWrapper(wrapperText((raw) => (raw.content.plans[0].legs = 'three')))
    ).toThrow('plan 1 has no valid legs.');
    expect(() =>
      parseWrapper(
        groupsText((raw) => (raw.content.plans[0].grouping = { by: 'size' }))
      )
    ).toThrow('plan 1 has no valid group setting.');
    expect(() =>
      parseWrapper(groupsText((raw) => (raw.content.plans[0].advance.top = 0)))
    ).toThrow('plan 1 has no valid advancement.');
    expect(() =>
      parseWrapper(groupsText((raw) => delete raw.content.plans[0].advance.bestOfNext))
    ).toThrow('plan 1 has no valid advancement.');
  });

  it('rejects more started phases than plans', () => {
    expect(() =>
      parseWrapper(
        wrapperText((raw) => {
          raw.content.phases.push(structuredClone(raw.content.phases[0]));
          raw.content.phases[1].fixtures = [];
          raw.content.phases[1].results = [];
        })
      )
    ).toThrow('the league has 2 started phases, but only 1 phase plan.');
  });

  it('rejects a phase with another format or other legs than its plan', () => {
    expect(() =>
      parseWrapper(wrapperText((raw) => (raw.content.plans[0] = { format: 'bracket' })))
    ).toThrow('phase 1 is a round robin, but its plan is a bracket.');
    expect(() =>
      parseWrapper(wrapperText((raw) => (raw.content.phases[0].legs = 'single-duels')))
    ).toThrow('phase 1 has other legs than its plan.');
  });

  it('rejects a team in two groups, or a group team outside the league', () => {
    expect(() =>
      parseWrapper(
        groupsText((raw) => raw.content.phases[0].groups[1].push(SALT_MARSH))
      )
    ).toThrow('phase 1 has a team in two groups.');
    expect(() =>
      parseWrapper(
        groupsText((raw) => (raw.content.phases[0].groups[1][0] = OTHER_LEAGUE))
      )
    ).toThrow('phase 1, group 2 names a team that is not in the league.');
  });

  it('rejects a Groups bye with no valid group number', () => {
    expect(() =>
      parseWrapper(
        groupsText(
          (raw) =>
            (raw.content.phases[0].byes = [{ matchday: 2, team: NORTH, group: 3 }])
        )
      )
    ).toThrow('phase 1, bye 1 has no valid group.');
  });

  it('reads the group number of a Groups bye', () => {
    const wrapper = parseWrapper(
      groupsText(
        (raw) => (raw.content.phases[0].byes = [{ matchday: 2, team: NORTH, group: 2 }])
      )
    );
    const [phase] = wrapper.content.phases;
    if (phase.format !== 'groups') throw new Error('expected a Groups phase');
    expect(phase.byes).toEqual([{ matchday: 2, team: NORTH, group: 2 }]);
  });
});
