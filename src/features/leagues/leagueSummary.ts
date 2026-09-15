import type { LeagueRecord } from './types';

/** Round-robin (two-way) is hardcoded, not read off `LeagueRecord` — it is
 * the only fixture format `engine/fixtures` generates today (Task 3), and
 * no field stores a format name to read instead. */
const FIXTURE_FORMAT = 'Round robin (two-way)';

/** The fixture-format / team-count / home-advantage summary both
 * `LeagueDetailScreen` and `LeaguesDashboardScreen` show for a league —
 * shared here so the two do not drift out of sync with each other. */
export function describeLeague(league: LeagueRecord): string {
  const teamsSummary = `${league.teams.length} team${league.teams.length === 1 ? '' : 's'}`;
  const homeAdvantageSummary = league.homeAdvantage ? 'Home adv. on' : 'Home adv. off';
  return [FIXTURE_FORMAT, teamsSummary, homeAdvantageSummary].join(' · ');
}
