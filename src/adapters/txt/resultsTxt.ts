import {
  calculateStandings,
  type MatchResult,
  type PointsConfig,
} from '@/engine/standings';
import type { Bye, Fixture } from '@/engine/fixtures';

/** What the results summary needs from a league. A `SavedLeague` (see
 * `adapters/json-io`) fits this shape as it is, so a caller can pass the
 * same object it would save. This type is declared here, not imported, so
 * the two adapters stay independent of each other. */
export interface ResultsTxtInput {
  league: { name: string; homeAdvantage: boolean; points: PointsConfig };
  teams: readonly { slug: string; name: string }[];
  fixtures: readonly Fixture<string>[];
  byes: readonly Bye<string>[];
  results: readonly (MatchResult<string> & { matchday: number })[];
}

type Align = 'left' | 'right';

function pad(text: string, width: number, align: Align): string {
  return align === 'left' ? text.padEnd(width) : text.padStart(width);
}

function center(text: string, width: number): string {
  const extra = width - text.length;
  const left = Math.floor(extra / 2);
  return ' '.repeat(left) + text + ' '.repeat(extra - left);
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function renderTable(
  header: readonly string[],
  aligns: readonly Align[],
  rows: readonly (readonly string[])[]
): string[] {
  const widths = header.map((label, column) =>
    Math.max(label.length, ...rows.map((row) => row[column].length))
  );
  const render = (cells: readonly string[]): string =>
    cells
      .map((cell, column) => pad(cell, widths[column], aligns[column]))
      .join('  ')
      .trimEnd();
  return [render(header), ...rows.map(render)];
}

function matchKey(matchday: number, home: string, away: string): string {
  return JSON.stringify([matchday, home, away]);
}

/**
 * Builds the read-only, human-readable results summary (MVP1 spec §1,
 * "Export (.txt)"): the league setup, a standings table, and every
 * matchday with its results, byes, and matches still to play. It is meant
 * for reading without the program, and nothing parses it back.
 *
 * Plain text only, LF line endings, no trailing spaces, and no date or
 * other clock value, so the same league always gives the same text. The
 * standings come from `calculateStandings`, so this file never repeats the
 * table rules. This function does no disk I/O. Task 18 wires it to a save
 * dialog.
 *
 * Throws a `RangeError` for a fixture, bye, or result that names a team
 * outside the roster, or a result with no fixture. A file that went
 * through `savedToLeague` cannot hold either problem, so this is a guard
 * against a caller bug, the same as `calculateStandings`.
 */
export function serializeResultsTxt(input: ResultsTxtInput): string {
  const { league, teams, fixtures, byes, results } = input;
  const names = new Map(teams.map((team) => [team.slug, team.name]));
  const nameOf = (slug: string): string => {
    const name = names.get(slug);
    if (name === undefined) {
      throw new RangeError(`Team "${slug}" is not in the league roster.`);
    }
    return name;
  };

  const resultByMatch = new Map(
    results.map((result) => [
      matchKey(result.matchday, result.home, result.away),
      result,
    ])
  );
  const fixtureKeys = new Set(
    fixtures.map((fixture) => matchKey(fixture.matchday, fixture.home, fixture.away))
  );
  for (const result of results) {
    if (!fixtureKeys.has(matchKey(result.matchday, result.home, result.away))) {
      throw new RangeError(
        `The result of matchday ${result.matchday}, "${result.home}" v "${result.away}", has no fixture.`
      );
    }
  }

  const played = fixtures.filter((fixture) =>
    resultByMatch.has(matchKey(fixture.matchday, fixture.home, fixture.away))
  ).length;
  const completed = fixtures.length > 0 && played === fixtures.length;

  const title = league.name.trim() || 'Untitled league';
  const { win, draw, loss } = league.points;
  const lines: string[] = [
    title,
    '',
    `Home advantage: ${league.homeAdvantage ? 'on' : 'off'}`,
    `Points: win ${win}, draw ${draw}, loss ${loss}`,
    `Matches played: ${played} of ${fixtures.length}${completed ? ' (league completed)' : ''}`,
    '',
    'STANDINGS',
  ];

  const standings = calculateStandings(
    teams.map((team) => team.slug),
    results,
    league.points
  );
  lines.push(
    ...renderTable(
      ['Pos', 'Team', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'],
      [
        'right',
        'left',
        'right',
        'right',
        'right',
        'right',
        'right',
        'right',
        'right',
        'right',
      ],
      standings.map((row) => [
        row.positionText,
        nameOf(row.team),
        String(row.played),
        String(row.won),
        String(row.drawn),
        String(row.lost),
        String(row.goalsFor),
        String(row.goalsAgainst),
        signed(row.goalDifference),
        String(row.points),
      ])
    )
  );

  lines.push('', 'RESULTS');
  const matchdays = [
    ...new Set([...fixtures.map((f) => f.matchday), ...byes.map((b) => b.matchday)]),
  ].sort((a, b) => a - b);

  if (matchdays.length === 0) {
    lines.push('No fixtures.');
  }

  const homeWidth = Math.max(0, ...teams.map((team) => team.name.length));
  const scoreOf = (fixture: Fixture<string>): string => {
    const result = resultByMatch.get(
      matchKey(fixture.matchday, fixture.home, fixture.away)
    );
    return result ? `${result.homeGoals} - ${result.awayGoals}` : 'vs';
  };
  const scoreWidth = Math.max(2, ...fixtures.map((fixture) => scoreOf(fixture).length));

  matchdays.forEach((matchday, index) => {
    if (index > 0) lines.push('');
    lines.push(`Matchday ${matchday}`);
    for (const fixture of fixtures.filter((f) => f.matchday === matchday)) {
      const home = pad(nameOf(fixture.home), homeWidth, 'right');
      const score = center(scoreOf(fixture), scoreWidth);
      lines.push(`  ${home}  ${score}  ${nameOf(fixture.away)}`);
    }
    for (const bye of byes.filter((b) => b.matchday === matchday)) {
      lines.push(`  Bye: ${nameOf(bye.team)}`);
    }
  });

  return `${lines.join('\n')}\n`;
}
