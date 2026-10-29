import {
  calculateStandings,
  type MatchResult,
  type PointsConfig,
} from '@/engine/standings';
import type { Bye, PhaseFixture } from '@/engine/round-robin';

/** What the results summary needs from one phase of a league. Teams are
 * named by an `id`, and a result finds its fixture by `fixtureId` (Task
 * 77). A round-robin phase of the domain fits it with no change to the
 * fixtures and results. This type is declared here, not imported, so the
 * adapter does not depend on `domain/`. */
export interface ResultsTxtInput {
  league: { name: string; homeAdvantage: boolean; points: PointsConfig };
  teams: readonly { id: string; name: string }[];
  fixtures: readonly PhaseFixture<string>[];
  byes: readonly Bye<string>[];
  results: readonly (MatchResult<string> & { fixtureId: string })[];
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
  const names = new Map(teams.map((team) => [team.id, team.name]));
  const nameOf = (id: string): string => {
    const name = names.get(id);
    if (name === undefined) {
      throw new RangeError(`Team "${id}" is not in the league roster.`);
    }
    return name;
  };

  const resultByFixture = new Map(results.map((result) => [result.fixtureId, result]));
  const fixtureIds = new Set(fixtures.map((fixture) => fixture.id));
  for (const result of results) {
    if (!fixtureIds.has(result.fixtureId)) {
      throw new RangeError(`No fixture has the id "${result.fixtureId}" of a result.`);
    }
  }

  const played = fixtures.filter((fixture) => resultByFixture.has(fixture.id)).length;
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
    teams.map((team) => team.id),
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
  const scoreOf = (fixture: PhaseFixture<string>): string => {
    const result = resultByFixture.get(fixture.id);
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
