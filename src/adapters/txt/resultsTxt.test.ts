import { describe, expect, it } from 'vitest';
import {
  buildBracketTree,
  findTieTeams,
  type BracketRound,
  type BracketTieResult,
} from '@/engine/bracket';
import type { TieMatch } from '@/engine/tiebreak';
import {
  serializeResultsTxt,
  type ResultsTxtInput,
  type ResultsTxtPhase,
} from './resultsTxt';

const POINTS = { win: 3, draw: 1, loss: 0 };

// Three teams, two matchdays, one match played, one still to play, and a
// bye on each matchday. Team names differ in length on purpose, so the
// alignment is visible in the exact-string test below.
function roundRobin(): ResultsTxtPhase {
  return {
    format: 'round-robin',
    groups: [['ash', 'north', 'salt']],
    fixtures: [
      { id: 'f1', matchday: 1, home: 'ash', away: 'north' },
      { id: 'f2', matchday: 2, home: 'salt', away: 'ash' },
    ],
    byes: [
      { matchday: 1, team: 'salt' },
      { matchday: 2, team: 'north' },
    ],
    results: [
      { fixtureId: 'f1', home: 'ash', away: 'north', homeGoals: 2, awayGoals: 1 },
    ],
  };
}

const TEAMS = [
  { id: 'ash', name: 'Ash Town' },
  { id: 'north', name: 'Northgate FC' },
  { id: 'salt', name: 'Salt Marsh United' },
];

function oneRoundRobin(): ResultsTxtInput {
  return {
    league: { name: 'Ash League', homeAdvantage: true, points: POINTS },
    plans: [{ format: 'round-robin', legs: 'two-way' }],
    teams: TEAMS,
    phases: [roundRobin()],
  };
}

type ScheduledPhase = Extract<ResultsTxtPhase, { groups: unknown }>;

function duelPhase(homeGoals: number, awayGoals: number): ScheduledPhase {
  return {
    format: 'round-robin',
    groups: [['a', 'b']],
    fixtures: [{ id: 'f1', matchday: 1, home: 'a', away: 'b' }],
    byes: [],
    results: [{ fixtureId: 'f1', home: 'a', away: 'b', homeGoals, awayGoals }],
  };
}

function twoTeams(
  homeGoals: number,
  awayGoals: number,
  phase: ScheduledPhase = duelPhase(homeGoals, awayGoals)
): ResultsTxtInput {
  return {
    league: { name: 'Duel', homeAdvantage: false, points: POINTS },
    plans: [{ format: 'round-robin', legs: 'single-duels' }],
    teams: [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Bravo' },
    ],
    phases: [phase],
  };
}

const tableRows = (text: string): string[] =>
  text.split('\n').filter((line) => /^ +[1-9-] {2}(Alpha|Bravo)/.test(line));

describe('serializeResultsTxt: a round robin (US-10.6, Task 148)', () => {
  it('writes the whole summary for a partly played league', () => {
    const expected = [
      'Ash League',
      'Round robin (two-way) · 3 teams · Home adv. on · 3/1/0 pts',
      '',
      'Phase 1 · Round robin',
      'Matches played: 1 of 2',
      '',
      'STANDINGS',
      'Pos  Team               P  W  D  L  GF  GA  GD  Pts',
      '  1  Ash Town           1  1  0  0   2   1  +1    3',
      '  2  Salt Marsh United  0  0  0  0   0   0   0    0',
      '  3  Northgate FC       1  0  0  1   1   2  -1    0',
      '',
      'RESULTS',
      'Matchday 1',
      '           Ash Town  2 - 1  Northgate FC',
      '  Bye: Salt Marsh United',
      '',
      'Matchday 2',
      '  Salt Marsh United   vs    Ash Town',
      '  Bye: Northgate FC',
      '',
    ].join('\n');

    expect(serializeResultsTxt(oneRoundRobin())).toBe(expected);
  });

  it('says the phase is completed once every fixture has a result', () => {
    expect(serializeResultsTxt(twoTeams(1, 0))).toContain(
      'Matches played: 1 of 1 (phase completed)'
    );
    expect(serializeResultsTxt(oneRoundRobin())).not.toContain('completed');
  });

  it('writes the home advantage, the points, and one team in the format line', () => {
    const input = twoTeams(1, 0, {
      ...duelPhase(1, 0),
      groups: [['a']],
      fixtures: [],
      results: [],
    });
    const text = serializeResultsTxt({
      ...input,
      league: { ...input.league, points: { win: 2, draw: 1, loss: 0 } },
      teams: input.teams.slice(0, 1),
    });
    expect(text.split('\n')[1]).toBe(
      'Round robin (single duels) · 1 team · Home adv. off · 2/1/0 pts'
    );
  });

  it('shows a joint place on the first row only, and a dash on the rest', () => {
    const rows = tableRows(serializeResultsTxt(twoTeams(1, 1)));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatch(/^ {2}1 {2}Alpha/);
    expect(rows[1]).toMatch(/^ {2}- {2}Bravo/);
  });

  it('orders a joint place by the lot when it has one (Task 128)', () => {
    const input = {
      ...twoTeams(1, 1),
      lotOf: (team: string): number => (team === 'b' ? 1 : 2),
    };
    const rows = tableRows(serializeResultsTxt(input));
    expect(rows[0]).toMatch(/^ {2}1 {2}Bravo/);
    expect(rows[1]).toMatch(/^ {2}- {2}Alpha/);
  });

  it('shows "Untitled league" for a blank name', () => {
    const input = twoTeams(1, 0);
    const text = serializeResultsTxt({
      ...input,
      league: { ...input.league, name: '  ' },
    });
    expect(text.split('\n')[0]).toBe('Untitled league');
  });

  it('lists matchdays in ascending order, whatever the fixture order', () => {
    const phase = roundRobin();
    if (phase.format === 'bracket') throw new Error('expected a round robin');
    const text = serializeResultsTxt({
      ...oneRoundRobin(),
      phases: [{ ...phase, fixtures: [...phase.fixtures].reverse() }],
    });
    expect(text.indexOf('Matchday 1')).toBeLessThan(text.indexOf('Matchday 2'));
  });

  it('handles a phase with no fixtures', () => {
    const text = serializeResultsTxt(
      twoTeams(1, 0, { ...duelPhase(1, 0), fixtures: [], results: [] })
    );
    expect(text).toContain('Matches played: 0 of 0');
    expect(text).not.toContain('completed');
    expect(text).toContain('No fixtures.');
  });

  it('ends with one newline, with no carriage return and no trailing spaces', () => {
    const text = serializeResultsTxt(oneRoundRobin());
    expect(text.endsWith('\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
    expect(text).not.toContain('\r');
    for (const line of text.split('\n')) expect(line).toBe(line.trimEnd());
  });

  it('gives the same text for the same input, and leaves the input alone', () => {
    const input = oneRoundRobin();
    const before = JSON.stringify(input);
    expect(serializeResultsTxt(input)).toBe(serializeResultsTxt(input));
    expect(JSON.stringify(input)).toBe(before);
  });

  it('throws a RangeError for an unknown team, or a result with no fixture', () => {
    const phase = roundRobin();
    if (phase.format === 'bracket') throw new Error('expected a round robin');
    const withPhase = (changed: ResultsTxtPhase): ResultsTxtInput => ({
      ...oneRoundRobin(),
      phases: [changed],
    });
    expect(() =>
      serializeResultsTxt(
        withPhase({
          ...phase,
          fixtures: [
            ...phase.fixtures,
            { id: 'f3', matchday: 3, home: 'ghost', away: 'ash' },
          ],
        })
      )
    ).toThrow(RangeError);
    expect(() =>
      serializeResultsTxt(
        withPhase({ ...phase, byes: [...phase.byes, { matchday: 3, team: 'ghost' }] })
      )
    ).toThrow(RangeError);
    expect(() =>
      serializeResultsTxt(
        withPhase({
          ...phase,
          results: [
            ...phase.results,
            {
              fixtureId: 'f9',
              home: 'north',
              away: 'salt',
              homeGoals: 0,
              awayGoals: 0,
            },
          ],
        })
      )
    ).toThrow(RangeError);
  });
});

describe('serializeResultsTxt: a Groups phase (choice 2)', () => {
  it('writes one block for each group: its table, then its matchdays', () => {
    const text = serializeResultsTxt({
      league: { name: 'Cup', homeAdvantage: true, points: POINTS },
      plans: [{ format: 'groups', legs: 'single-duels' }, { format: 'bracket' }],
      teams: [
        { id: 'a', name: 'Alpha' },
        { id: 'b', name: 'Bravo' },
        { id: 'c', name: 'Charlie' },
        { id: 'd', name: 'Delta' },
      ],
      phases: [
        {
          format: 'groups',
          groups: [
            ['a', 'b'],
            ['c', 'd'],
          ],
          fixtures: [
            { id: 'p1.g1.md1.m1', matchday: 1, home: 'a', away: 'b' },
            { id: 'p1.g2.md1.m1', matchday: 1, home: 'c', away: 'd' },
          ],
          byes: [],
          results: [
            {
              fixtureId: 'p1.g2.md1.m1',
              home: 'c',
              away: 'd',
              homeGoals: 0,
              awayGoals: 3,
            },
          ],
        },
      ],
    });
    expect(text).toBe(
      [
        'Cup',
        'Group Stage → Bracket · 4 teams · Home adv. on · 3/1/0 pts',
        '',
        'Phase 1 · Group Stage',
        'Matches played: 1 of 2',
        '',
        'GROUP A',
        'Pos  Team   P  W  D  L  GF  GA  GD  Pts',
        '  1  Alpha  0  0  0  0   0   0   0    0',
        '  -  Bravo  0  0  0  0   0   0   0    0',
        '',
        'Matchday 1',
        '  Alpha  vs  Bravo',
        '',
        'GROUP B',
        'Pos  Team     P  W  D  L  GF  GA  GD  Pts',
        '  1  Delta    1  1  0  0   3   0  +3    3',
        '  2  Charlie  1  0  0  1   0   3  -3    0',
        '',
        'Matchday 1',
        '  Charlie  0 - 3  Delta',
        '',
      ].join('\n')
    );
  });
});

describe('serializeResultsTxt: a Bracket phase (choice 3)', () => {
  const teams = ['s1', 's2', 's3', 's4'].map((id) => ({ id, name: id.toUpperCase() }));

  function bracketInput(
    rounds: BracketRound<string>[] | null,
    results: BracketTieResult<string>[]
  ): ResultsTxtInput {
    return {
      league: { name: 'Cup', homeAdvantage: true, points: POINTS },
      plans: [{ format: 'bracket' }],
      teams,
      phases: [{ format: 'bracket', rounds, results }],
    };
  }

  function treeOf(
    seeds: string[],
    byeTeams: string[],
    thirdPlace: boolean
  ): BracketRound<string>[] {
    const tree = buildBracketTree(1, seeds, byeTeams, thirdPlace);
    if (tree.status !== 'ready') throw new Error('expected a ready tree');
    return tree.rounds;
  }

  const tieId = (
    rounds: BracketRound<string>[],
    round: number,
    tie: number
  ): string => {
    const found = rounds[round - 1].ties.find((t) => t.tie === tie);
    if (!found) throw new Error('no such tie');
    return found.id;
  };

  const match = (
    part: TieMatch<string>['part'],
    homeId: string,
    awayId: string,
    homeGoals: number,
    awayGoals: number,
    aet?: { homeGoals: number; awayGoals: number }
  ): TieMatch<string> => ({
    part,
    homeId,
    awayId,
    score: { homeGoals, awayGoals },
    ...(aet && { aet }),
  });

  it('writes the example layout: names around a centred total, details below it', () => {
    const all = Array.from({ length: 16 }, (_, index) => `t${index + 1}`);
    const tree = treeOf(all, [], false);
    const rounds: BracketRound<string>[] = [
      { ...tree[0], ties: tree[0].ties.slice(0, 3) },
    ];
    const sides = rounds[0].ties.map((tie) => {
      const [top, bottom] = findTieTeams(rounds, [], tie.id);
      if (top.kind !== 'team' || bottom.kind !== 'team')
        throw new Error('expected teams');
      return { id: tie.id, top: top.teamId, bottom: bottom.teamId };
    });
    const [a, b, c] = sides;
    const results: BracketTieResult<string>[] = [
      {
        tieId: a.id,
        matches: [
          match('leg1', a.bottom, a.top, 1, 3),
          match('leg2', a.top, a.bottom, 2, 2),
        ],
        winnerId: a.top,
        loserId: a.bottom,
        decidedBy: 'regulation',
      },
      {
        tieId: b.id,
        matches: [
          match('leg1', b.bottom, b.top, 0, 1),
          match('leg2', b.top, b.bottom, 0, 1),
        ],
        penalties: { homeGoals: 3, awayGoals: 5 },
        winnerId: b.bottom,
        loserId: b.top,
        decidedBy: 'penalties',
      },
      {
        tieId: c.id,
        matches: [
          match('leg1', c.bottom, c.top, 0, 2),
          match('leg2', c.top, c.bottom, 3, 3, { homeGoals: 1, awayGoals: 1 }),
        ],
        winnerId: c.top,
        loserId: c.bottom,
        decidedBy: 'aet',
      },
    ];
    const names: [string, string][] = [
      [a.top, 'Ashfield Rovers'],
      [a.bottom, 'Harbourview United'],
      [b.top, 'Team 3'],
      [b.bottom, 'Another Team SC'],
      [c.top, 'Aston Hamlet'],
      [c.bottom, 'Towercrest City'],
    ];
    const text = serializeResultsTxt({
      ...bracketInput(rounds, results),
      teams: names.map(([id, name]) => ({ id, name })),
    });
    expect(text).toContain(
      [
        'ROUND OF 16',
        'Ashfield Rovers  5 - 3  Harbourview United',
        '                3-1, 2-2',
        '         Team 3  1 - 1  Another Team SC',
        '          1-0, 0-1 · Pens 3-5',
        '   Aston Hamlet  6 - 4  Towercrest City',
        '               2-0, 4-4*',
        '',
      ].join('\n')
    );
  });

  it('writes each round, the legs from the top team view, the tags, TBD, and the third place', () => {
    const rounds = treeOf(['s1', 's2', 's3', 's4'], [], true);
    const results: BracketTieResult<string>[] = [
      {
        tieId: tieId(rounds, 1, 1),
        matches: [
          match('leg1', 's4', 's1', 1, 2),
          match('leg2', 's1', 's4', 0, 1, { homeGoals: 0, awayGoals: 0 }),
        ],
        penalties: { homeGoals: 4, awayGoals: 3 },
        winnerId: 's1',
        loserId: 's4',
        decidedBy: 'penalties',
      },
    ];
    expect(serializeResultsTxt(bracketInput(rounds, results))).toBe(
      [
        'Cup',
        'Bracket · 4 teams · Home adv. on · 3/1/0 pts',
        '',
        'Phase 1 · Bracket',
        'Ties played: 1 of 4',
        '',
        'SEMI-FINALS',
        'S1  2 - 2  S4',
        '2-1, 0-1* · Pens 4-3',
        'S2   vs    S3',
        '',
        'THIRD-PLACE PLAYOFF',
        'S4   vs    TBD',
        '',
        'FINAL',
        'S1   vs    TBD',
        '',
      ].join('\n')
    );
  });

  it('writes a replay, a coin toss, and the winner line', () => {
    const rounds = treeOf(['s1', 's2'], [], false);
    const results: BracketTieResult<string>[] = [
      {
        tieId: tieId(rounds, 1, 1),
        matches: [match('leg1', 's1', 's2', 0, 0), match('replay', 's2', 's1', 2, 2)],
        winnerId: 's2',
        loserId: 's1',
        decidedBy: 'coin-toss',
      },
    ];
    const text = serializeResultsTxt({
      ...bracketInput(rounds, results),
      teams: teams.slice(0, 2),
    });
    expect(text).toContain('Ties played: 1 of 1 (phase completed)');
    expect(text).toContain(
      'FINAL\nS1  0 - 0  S2\n0-0, 2-2 · Coin toss\n\nWinner: S2\n'
    );
  });

  it('writes away goals, and a bye', () => {
    const rounds = treeOf(['s1', 's2', 's3'], ['s1'], false);
    const results: BracketTieResult<string>[] = [
      {
        tieId: tieId(rounds, 1, 2),
        matches: [match('leg1', 's3', 's2', 1, 1), match('leg2', 's2', 's3', 0, 0)],
        winnerId: 's2',
        loserId: 's3',
        decidedBy: 'away-goals',
      },
    ];
    const text = serializeResultsTxt(bracketInput(rounds, results));
    expect(text).toContain('S1   Bye\n');
    expect(text).toContain('S2  1 - 1  S3\n1-1, 0-0 · Away goals\n');
    expect(text).toContain('Ties played: 1 of 2');
  });

  it('writes no detail line for a single match with no extra time', () => {
    const rounds = treeOf(['s1', 's2'], [], false);
    const results: BracketTieResult<string>[] = [
      {
        tieId: tieId(rounds, 1, 1),
        matches: [match('leg1', 's1', 's2', 3, 1)],
        winnerId: 's1',
        loserId: 's2',
        decidedBy: 'regulation',
      },
    ];
    expect(serializeResultsTxt(bracketInput(rounds, results))).toContain(
      'FINAL\nS1  3 - 1  S2\n\nWinner: S1\n'
    );
  });

  it('shows the extra-time mark of a single match on a detail line', () => {
    const rounds = treeOf(['s1', 's2'], [], false);
    const results: BracketTieResult<string>[] = [
      {
        tieId: tieId(rounds, 1, 1),
        matches: [match('leg1', 's1', 's2', 1, 1, { homeGoals: 1, awayGoals: 0 })],
        winnerId: 's1',
        loserId: 's2',
        decidedBy: 'aet',
      },
    ];
    expect(serializeResultsTxt(bracketInput(rounds, results))).toContain(
      'FINAL\nS1  2 - 1  S2\n     2-1*\n'
    );
  });

  it('shows only the shootout on the detail line of a single match', () => {
    const rounds = treeOf(['s1', 's2'], [], false);
    const results: BracketTieResult<string>[] = [
      {
        tieId: tieId(rounds, 1, 1),
        matches: [match('leg1', 's1', 's2', 1, 1)],
        penalties: { homeGoals: 3, awayGoals: 5 },
        winnerId: 's2',
        loserId: 's1',
        decidedBy: 'penalties',
      },
    ];
    expect(serializeResultsTxt(bracketInput(rounds, results))).toContain(
      'FINAL\nS1  1 - 1  S2\n   Pens 3-5\n'
    );
  });

  it('shares the name column across all rounds of the bracket', () => {
    const rounds = treeOf(['s1', 's2', 's3', 's4'], [], false);
    const text = serializeResultsTxt({
      ...bracketInput(rounds, []),
      teams: teams.map((team) =>
        team.id === 's2' ? { ...team, name: 'Long Name FC' } : team
      ),
    });
    expect(text).toContain('SEMI-FINALS\n          S1  vs  S4\nLong Name FC  vs  S3\n');
    expect(text).toContain('FINAL\n         TBD  vs  TBD\n');
  });

  it('starts a detail line at the first column when it is wider than the space', () => {
    const rounds = treeOf(['s1', 's2'], [], false);
    const aet = { homeGoals: 1, awayGoals: 1 };
    const results: BracketTieResult<string>[] = [
      {
        tieId: tieId(rounds, 1, 1),
        matches: [
          match('leg1', 's2', 's1', 9, 9, aet),
          match('leg2', 's1', 's2', 9, 9, aet),
          match('replay', 's1', 's2', 9, 9, aet),
        ],
        winnerId: 's1',
        loserId: 's2',
        decidedBy: 'coin-toss',
      },
    ];
    expect(serializeResultsTxt(bracketInput(rounds, results))).toContain(
      'S1  20 - 20  S2\n10-10*, 10-10*, 10-10* · Coin toss\n'
    );
  });

  it('says that a bracket waits for its byes', () => {
    expect(serializeResultsTxt(bracketInput(null, []))).toContain(
      'Phase 1 · Bracket\nThe bracket waits for its byes.\n'
    );
  });
});
