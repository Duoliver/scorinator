import { describe, expect, it } from 'vitest';
import {
  DATABASE_FORMAT_VERSION,
  parseSeasonFile,
  parseWrapper,
  serializeSeasonFile,
  type SavedInstance,
  type SavedSeasonFile,
  type SavedSeasonLeague,
} from './index';

const INSTALLATION = '00000000-0000-4000-8000-000000000001';
const SALT_MARSH = '00000000-0000-4000-8000-0000000000a1';
const HARBORVIEW = '00000000-0000-4000-8000-0000000000a2';
const PORTO = '00000000-0000-4000-8000-0000000000a3';
const SEASON = '00000000-0000-4000-8000-0000000000c1';
const LEAGUE = '00000000-0000-4000-8000-0000000000b1';
const CUP = '00000000-0000-4000-8000-0000000000b2';
const PLAYOFF = '00000000-0000-4000-8000-0000000000d1';

const provenance = {
  createdByInstallation: INSTALLATION,
  lastModifiedByInstallation: INSTALLATION,
};

const instance = (
  blueprintUuid: string,
  name: string,
  trigram: string
): SavedInstance => ({
  blueprintUuid,
  slug: name.toLowerCase().replace(/ /g, '-'),
  name,
  colour: '#1565C0',
  tier: 'B',
  ovr: 74,
  trigram,
});

const league = (
  uuid: string,
  name: string,
  home: string,
  away: string
): SavedSeasonLeague => ({
  uuid,
  name,
  homeAdvantage: true,
  points: { win: 3, draw: 1, loss: 0 },
  ...provenance,
  teamUuids: [home, away],
  plans: [{ format: 'round-robin', legs: 'two-way' }],
  phases: [
    {
      format: 'round-robin',
      legs: 'two-way',
      fixtures: [
        { id: 'p1.g1.md1.m1', matchday: 1, home, away },
        { id: 'p1.g1.md2.m1', matchday: 2, home: away, away: home },
      ],
      byes: [],
      results: [{ fixtureId: 'p1.g1.md1.m1', home, away, homeGoals: 2, awayGoals: 1 }],
    },
  ],
});

function buildSeasonFile(): SavedSeasonFile {
  return {
    kind: 'season',
    formatVersion: DATABASE_FORMAT_VERSION,
    uuid: SEASON,
    teams: [
      instance(SALT_MARSH, 'Salt Marsh United', 'SMU'),
      instance(HARBORVIEW, 'Harborview SC', 'HAR'),
      instance(PORTO, 'Porto Velho SC', 'POR'),
    ],
    content: {
      uuid: SEASON,
      name: 'Liga Norte',
      year: '2026-27',
      finished: false,
      ...provenance,
      leagues: [
        league(LEAGUE, 'Primeira Divisão', SALT_MARSH, HARBORVIEW),
        league(CUP, 'Taça Norte', SALT_MARSH, PORTO),
      ],
      playoffs: [
        {
          uuid: PLAYOFF,
          name: 'Supertaça',
          homeUuid: SALT_MARSH,
          awayUuid: PORTO,
          rules: {
            format: 'single-match',
            awayGoals: false,
            playsAet: true,
            method: 'penalties',
            homeAdvantage: true,
          },
          result: {
            matches: [
              {
                part: 'leg1',
                homeId: SALT_MARSH,
                awayId: PORTO,
                score: { homeGoals: 2, awayGoals: 0 },
              },
            ],
            winnerId: SALT_MARSH,
            loserId: PORTO,
            decidedBy: 'regulation',
          },
        },
      ],
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a test edits the raw JSON freely, to make a bad file
type RawFile = any;

/** The Season file as JSON text, after `change` edits a raw copy of it. */
function seasonText(change: (raw: RawFile) => void = () => {}): string {
  const raw = structuredClone(buildSeasonFile()) as RawFile;
  change(raw);
  return JSON.stringify(raw);
}

describe('serializeSeasonFile and parseSeasonFile (US-13.1, Task 209)', () => {
  it('round-trips a Season file', () => {
    expect(parseSeasonFile(serializeSeasonFile(buildSeasonFile()))).toEqual(
      buildSeasonFile()
    );
  });

  it('writes formatted JSON', () => {
    expect(serializeSeasonFile(buildSeasonFile())).toBe(
      JSON.stringify(buildSeasonFile(), null, 2)
    );
  });

  it('takes any year text (Task 209)', () => {
    for (const year of ['2026', '1', '2026-27', '4E 201']) {
      const file = parseSeasonFile(seasonText((raw) => (raw.content.year = year)));
      expect(file.content.year).toBe(year);
    }
  });

  it('reads a Season with no leagues and no playoffs', () => {
    const file = parseSeasonFile(
      seasonText((raw) => {
        raw.content.leagues = [];
        raw.content.playoffs = [];
      })
    );
    expect(file.content.leagues).toEqual([]);
    expect(file.content.playoffs).toEqual([]);
  });

  it('reads a playoff that is not played yet', () => {
    const file = parseSeasonFile(
      seasonText((raw) => delete raw.content.playoffs[0].result)
    );
    expect(file.content.playoffs[0]).not.toHaveProperty('result');
  });
});

describe('parseSeasonFile checks (Task 209 choices 2 to 4)', () => {
  const fails = (change: (raw: RawFile) => void, message: string): void => {
    expect(() => parseSeasonFile(seasonText(change))).toThrow(
      `A Season file is not valid: ${message}`
    );
  };

  it('rejects a league file, and the league reader rejects a Season file', () => {
    fails(
      (raw) => (raw.kind = 'wrapper'),
      'the file is not a Season file. Its kind is "wrapper".'
    );
    expect(() => parseWrapper(seasonText())).toThrow('A league file is not valid:');
  });

  it('rejects a newer format version', () => {
    fails(
      (raw) => (raw.formatVersion = DATABASE_FORMAT_VERSION + 1),
      'a newer version of Scorinator made this file'
    );
  });

  it('wants the file UUID to be the Season UUID', () => {
    fails(
      (raw) => (raw.content.uuid = LEAGUE),
      'the file UUID is not the Season UUID.'
    );
  });

  it('wants a name, a year, and the finished flag', () => {
    fails((raw) => (raw.content.name = ' '), 'the Season has no name.');
    fails((raw) => (raw.content.year = ''), 'the Season has no year.');
    fails((raw) => (raw.content.year = 2026), 'the Season has no year.');
    fails(
      (raw) => delete raw.content.finished,
      'the Season has no valid "finished" flag.'
    );
  });

  it('wants each Blueprint once in the roster', () => {
    fails(
      (raw) => raw.teams.push(raw.teams[0]),
      'team 4 has the same Blueprint UUID as team 1.'
    );
  });

  it('wants each league UUID once in the Season', () => {
    fails(
      (raw) => (raw.content.leagues[1].uuid = LEAGUE),
      'league 2 has the same UUID as league 1.'
    );
  });

  it('wants each team of a league in the roster, once', () => {
    fails(
      (raw) => raw.content.leagues[0].teamUuids.push(INSTALLATION),
      'league 1 has a team that is not in the Season roster.'
    );
    fails(
      (raw) => raw.content.leagues[0].teamUuids.push(SALT_MARSH),
      'league 1 has a team twice.'
    );
  });

  it('checks each league as a league file does, for its own teams only', () => {
    fails(
      (raw) => (raw.content.leagues[0].phases[0].fixtures[0].home = PORTO),
      'league 1: '
    );
    fails(
      (raw) => delete raw.content.leagues[1].name,
      'league 2: the league has no name.'
    );
  });

  it('wants each playoff UUID and name once in the Season', () => {
    const second = (raw: RawFile): RawFile => {
      const copy = structuredClone(raw.content.playoffs[0]);
      copy.uuid = '00000000-0000-4000-8000-0000000000d2';
      copy.name = 'Taça de Honra';
      raw.content.playoffs.push(copy);
      return copy;
    };
    fails(
      (raw) => (second(raw).uuid = PLAYOFF),
      'playoff 2 has the same UUID as playoff 1.'
    );
    fails(
      (raw) => (second(raw).name = ' supertaça '),
      'playoff 2 has the same name as playoff 1.'
    );
  });

  it('wants two different roster teams in a playoff', () => {
    fails(
      (raw) => (raw.content.playoffs[0].awayUuid = SALT_MARSH),
      'playoff 1 has the same team at home and away.'
    );
    fails(
      (raw) => (raw.content.playoffs[0].homeUuid = INSTALLATION),
      'playoff 1 has a team that is not in the Season roster.'
    );
  });

  it('wants valid tie rules in a playoff', () => {
    fails(
      (raw) => (raw.content.playoffs[0].rules.format = 'best-of-three'),
      'playoff 1 has no valid tie rules.'
    );
    fails(
      (raw) => delete raw.content.playoffs[0].rules.homeAdvantage,
      'playoff 1 has no valid tie rules.'
    );
  });

  it('wants the winner and the loser of a playoff to be its two teams', () => {
    fails(
      (raw) => (raw.content.playoffs[0].result.winnerId = HARBORVIEW),
      'playoff 1 result names a winner or a loser that is not a team of the playoff.'
    );
  });
});
