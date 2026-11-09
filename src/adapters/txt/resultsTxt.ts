import {
  calculateStandings,
  type LotOf,
  type MatchResult,
  type PointsConfig,
} from '@/engine/standings';
import type { Bye, PhaseFixture } from '@/engine/round-robin';
import {
  findBracketWinner,
  findTieTeams,
  roundName,
  THIRD_PLACE_NAME,
  type BracketRound,
  type BracketTie,
  type BracketTieResult,
  type TieSide,
} from '@/engine/bracket';
import type { Legs } from '@/engine/phases';
import type { TieMatch } from '@/engine/tiebreak';

/** One started phase for the results summary (US-10.6, Task 148). Teams are
 * named by an `id`, and a result finds its fixture by `fixtureId` (Task 77).
 *
 * - `round-robin` and `groups`: `groups` holds the teams of each table, one
 *   list for a round robin. The fixtures, byes, and results of the phase.
 * - `bracket`: the tree and the tie results. `rounds` is `null` while the
 *   bracket waits for its byes (US-04.10).
 *
 * These types are declared here, not imported, so the adapter does not
 * depend on `domain/`. */
export type ResultsTxtPhase =
  | {
      format: 'round-robin' | 'groups';
      groups: readonly (readonly string[])[];
      fixtures: readonly PhaseFixture<string>[];
      byes: readonly Bye<string>[];
      results: readonly (MatchResult<string> & { fixtureId: string })[];
    }
  | {
      format: 'bracket';
      rounds: readonly BracketRound<string>[] | null;
      results: readonly BracketTieResult<string>[];
    };

/** What the results summary needs from a league. `plans` is the whole phase
 * chain, for the format line. `phases` holds the started phases only. */
export interface ResultsTxtInput {
  league: { name: string; homeAdvantage: boolean; points: PointsConfig };
  plans: readonly (
    { format: 'round-robin' | 'groups'; legs: Legs } | { format: 'bracket' }
  )[];
  teams: readonly { id: string; name: string }[];
  phases: readonly ResultsTxtPhase[];
  /** The fixed lots of the league (Task 124): they order a joint place.
   * Without them, the roster order does. */
  lotOf?: LotOf<string>;
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

// --- The format line (US-01.2) -------------------------------------------
// A copy of the screen texts in `features/leagues/leagueSummary.ts` and
// `formatTeamCount` (Task 148 choice 1). The tests pin the same texts.

type PlanText = ResultsTxtInput['plans'][number];

function legsLabel(legs: Legs): string {
  return legs === 'two-way' ? '(two-way)' : '(single duels)';
}

function phaseLabel(plan: PlanText): string {
  if (plan.format === 'bracket') return 'Bracket';
  const prefix = plan.format === 'groups' ? 'Groups round robin' : 'Round robin';
  return `${prefix} ${legsLabel(plan.legs)}`;
}

function phaseShortName(format: PlanText['format']): string {
  if (format === 'bracket') return 'Bracket';
  return format === 'groups' ? 'Group Stage' : 'Round robin';
}

function formatLine(input: ResultsTxtInput): string {
  const { plans, teams, league } = input;
  const phases =
    plans.length === 1
      ? phaseLabel(plans[0])
      : plans.map((plan) => phaseShortName(plan.format)).join(' → ');
  const { win, draw, loss } = league.points;
  return [
    phases,
    `${teams.length} team${teams.length === 1 ? '' : 's'}`,
    `Home adv. ${league.homeAdvantage ? 'on' : 'off'}`,
    `${win}/${draw}/${loss} pts`,
  ].join(' · ');
}

// --- A round robin or Groups phase ---------------------------------------

type ScheduledInput = Extract<ResultsTxtPhase, { format: 'round-robin' | 'groups' }>;
type NameOf = (id: string) => string;

function playedLine(label: string, played: number, total: number): string {
  const completed = total > 0 && played === total ? ' (phase completed)' : '';
  return `${label} played: ${played} of ${total}${completed}`;
}

function standingsLines(
  teams: readonly string[],
  results: ScheduledInput['results'],
  input: ResultsTxtInput,
  nameOf: NameOf
): string[] {
  const rows = calculateStandings(teams, results, input.league.points, input.lotOf);
  return renderTable(
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
    rows.map((row) => [
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
  );
}

/** The matchdays of one table: each match, then each bye. */
function matchdayLines(
  teams: readonly string[],
  fixtures: ScheduledInput['fixtures'],
  byes: ScheduledInput['byes'],
  resultByFixture: ReadonlyMap<string, MatchResult<string>>,
  nameOf: NameOf
): string[] {
  const matchdays = [
    ...new Set([...fixtures.map((f) => f.matchday), ...byes.map((b) => b.matchday)]),
  ].sort((a, b) => a - b);
  if (matchdays.length === 0) return ['No fixtures.'];

  const homeWidth = Math.max(0, ...teams.map((team) => nameOf(team).length));
  const scoreOf = (fixture: PhaseFixture<string>): string => {
    const result = resultByFixture.get(fixture.id);
    return result ? `${result.homeGoals} - ${result.awayGoals}` : 'vs';
  };
  const scoreWidth = Math.max(2, ...fixtures.map((fixture) => scoreOf(fixture).length));

  const lines: string[] = [];
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
  return lines;
}

function scheduledLines(
  phase: ScheduledInput,
  input: ResultsTxtInput,
  nameOf: NameOf
): string[] {
  const { fixtures, byes, results } = phase;
  for (const fixture of fixtures) {
    nameOf(fixture.home);
    nameOf(fixture.away);
  }
  for (const bye of byes) nameOf(bye.team);
  const resultByFixture = new Map(results.map((result) => [result.fixtureId, result]));
  const fixtureIds = new Set(fixtures.map((fixture) => fixture.id));
  for (const result of results) {
    if (!fixtureIds.has(result.fixtureId)) {
      throw new RangeError(`No fixture has the id "${result.fixtureId}" of a result.`);
    }
  }
  const played = fixtures.filter((fixture) => resultByFixture.has(fixture.id)).length;
  const lines = [playedLine('Matches', played, fixtures.length)];

  if (phase.format === 'round-robin') {
    const teams = phase.groups.flat();
    lines.push('', 'STANDINGS', ...standingsLines(teams, results, input, nameOf));
    lines.push('', 'RESULTS');
    lines.push(...matchdayLines(teams, fixtures, byes, resultByFixture, nameOf));
    return lines;
  }

  // Groups (choice 2): one block for each group, its table, then its
  // matchdays. A match or a result belongs to the group of its two teams.
  phase.groups.forEach((teams, index) => {
    const members = new Set(teams);
    const inGroup = (match: { home: string; away: string }): boolean =>
      members.has(match.home) && members.has(match.away);
    lines.push('', `GROUP ${String.fromCharCode(65 + index)}`);
    lines.push(...standingsLines(teams, results.filter(inGroup), input, nameOf));
    lines.push('');
    lines.push(
      ...matchdayLines(
        teams,
        fixtures.filter(inGroup),
        byes.filter((bye) => members.has(bye.team)),
        resultByFixture,
        nameOf
      )
    );
  });
  return lines;
}

// --- A bracket phase (Task 148 review) ------------------------------------
// The tie texts are a copy of the tie card texts in
// `features/bracket/BracketView/helpers.ts` (choice 1).

type BracketInput = Extract<ResultsTxtPhase, { format: 'bracket' }>;

/** The goals of one team in one match, AET goals included. */
function goalsIn(match: TieMatch<string>, teamId: string): number {
  const side = match.homeId === teamId ? 'homeGoals' : 'awayGoals';
  return match.score[side] + (match.aet?.[side] ?? 0);
}

/** The texts of one tie: the two names, the middle cell of the main line,
 * and the detail line below it, empty when the tie has none. */
interface TieText {
  top: string;
  middle: string;
  bottom: string;
  detail: string;
}

/** The tag of the decision. The penalties put the top team first. */
function decisionTags(
  result: BracketTieResult<string>,
  top: string,
  bottom: string
): string[] {
  const last = result.matches[result.matches.length - 1];
  const { penalties } = result;
  if (result.decidedBy === 'penalties' && penalties && last) {
    const pens = (id: string): number =>
      last.homeId === id ? penalties.homeGoals : penalties.awayGoals;
    return [`Pens ${pens(top)}-${pens(bottom)}`];
  }
  if (result.decidedBy === 'coin-toss') return ['Coin toss'];
  if (result.decidedBy === 'away-goals') return ['Away goals'];
  return [];
}

function tieText(
  phase: BracketInput,
  tie: BracketTie<string>,
  nameOf: NameOf
): TieText {
  const rounds = phase.rounds ?? [];
  const [top, bottom] = findTieTeams(rounds, phase.results, tie.id);
  const sideName = (side: TieSide<string>): string =>
    side.kind === 'team' ? nameOf(side.teamId) : 'TBD';
  if (bottom.kind === 'bye') {
    return { top: sideName(top), middle: 'Bye', bottom: '', detail: '' };
  }

  const result = phase.results.find((r) => r.tieId === tie.id);
  if (!result || top.kind !== 'team' || bottom.kind !== 'team') {
    return { top: sideName(top), middle: 'vs', bottom: sideName(bottom), detail: '' };
  }
  // The main line holds the total of the legs. A replay is not part of it.
  const legs = result.matches.filter((match) => match.part !== 'replay');
  const total = (id: string): number =>
    legs.reduce((sum, leg) => sum + goalsIn(leg, id), 0);
  const scores = result.matches.map((match) => {
    const cell = `${goalsIn(match, top.teamId)}-${goalsIn(match, bottom.teamId)}`;
    return match.aet ? `${cell}*` : cell;
  });
  // One match with no extra time: the main line already says it all.
  const showScores = scores.length > 1 || result.matches.some((match) => match.aet);
  return {
    top: nameOf(top.teamId),
    middle: `${total(top.teamId)} - ${total(bottom.teamId)}`,
    bottom: nameOf(bottom.teamId),
    detail: [
      ...(showScores ? [scores.join(', ')] : []),
      ...decisionTags(result, top.teamId, bottom.teamId),
    ].join(' · '),
  };
}

/** A detail line on the centre of the middle cell. A line too wide for the
 * space before that cell starts at the first column. */
function centredDetail(detail: string, topWidth: number, middleWidth: number): string {
  const start = topWidth + 2 + Math.ceil((middleWidth - detail.length) / 2);
  return ' '.repeat(Math.max(0, start)) + detail;
}

/** The widths of the name column and the middle column. All rounds of a
 * bracket share them, so `vs` and the scores line up (Task 148 review). */
function tieColumns(ties: readonly TieText[]): { top: number; middle: number } {
  return {
    top: Math.max(0, ...ties.map((tie) => tie.top.length)),
    middle: Math.max(0, ...ties.map((tie) => tie.middle.length)),
  };
}

/** The ties under one heading: the top names end at one column, and the
 * middle cell and the detail line share one centre. */
function tieBlockLines(
  ties: readonly TieText[],
  { top: topWidth, middle: middleWidth }: ReturnType<typeof tieColumns>
): string[] {
  return ties.flatMap((tie) => [
    `${pad(tie.top, topWidth, 'right')}  ${center(tie.middle, middleWidth)}  ${tie.bottom}`.trimEnd(),
    ...(tie.detail ? [centredDetail(tie.detail, topWidth, middleWidth)] : []),
  ]);
}

function bracketLines(phase: BracketInput, nameOf: NameOf): string[] {
  const { rounds, results } = phase;
  if (rounds === null) return ['The bracket waits for its byes.'];

  const ties = rounds.flatMap((round) => round.ties);
  const played = ties.filter((tie) =>
    results.some((result) => result.tieId === tie.id)
  ).length;
  const total = ties.filter((tie) => tie.slots[1].kind !== 'bye').length;
  const lines = [playedLine('Ties', played, total)];
  const textOf = (tie: BracketTie<string>): TieText => tieText(phase, tie, nameOf);
  const columns = tieColumns(ties.map(textOf));

  for (const round of rounds) {
    const ordered = [...round.ties].sort((a, b) => a.tie - b.tie);
    const own = ordered.filter((tie) => tie.kind !== 'third');
    const third = ordered.find((tie) => tie.kind === 'third');
    if (third) {
      lines.push(
        '',
        THIRD_PLACE_NAME.toUpperCase(),
        ...tieBlockLines([textOf(third)], columns)
      );
    }
    lines.push('', roundName(round.teams).toUpperCase());
    lines.push(...tieBlockLines(own.map(textOf), columns));
  }

  const winner = findBracketWinner(rounds, results);
  if (winner !== undefined) lines.push('', `Winner: ${nameOf(winner)}`);
  return lines;
}

/**
 * Builds the read-only, human-readable results summary (US-10.6): the
 * league name and its format line, then each started phase with its heading
 * and its "played" line. A round robin has its table and its results by
 * matchday. A Groups phase has one block for each group (choice 2). A
 * bracket has each round with its ties, the total between the two names and
 * one detail line centred below it, then the winner. It is meant for reading without the program, and nothing
 * parses it back.
 *
 * Plain text only, LF line endings, no trailing spaces, and no date or
 * other clock value, so the same league always gives the same text. The
 * tables come from `calculateStandings`, so this file never repeats the
 * table rules. This function does no disk I/O.
 *
 * Throws a `RangeError` for a fixture, bye, result, or tie that names a team
 * outside the roster, or a result with no fixture: a guard against a
 * caller bug.
 */
export function serializeResultsTxt(input: ResultsTxtInput): string {
  const names = new Map(input.teams.map((team) => [team.id, team.name]));
  const nameOf: NameOf = (id) => {
    const name = names.get(id);
    if (name === undefined) {
      throw new RangeError(`Team "${id}" is not in the league roster.`);
    }
    return name;
  };

  const lines: string[] = [
    input.league.name.trim() || 'Untitled league',
    formatLine(input),
  ];
  input.phases.forEach((phase, index) => {
    lines.push('', `Phase ${index + 1} · ${phaseShortName(phase.format)}`);
    lines.push(
      ...(phase.format === 'bracket'
        ? bracketLines(phase, nameOf)
        : scheduledLines(phase, input, nameOf))
    );
  });
  return `${lines.join('\n')}\n`;
}
