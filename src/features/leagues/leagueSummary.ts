import type { LeagueRecord } from '@/domain';
import type { PointsConfig } from '@/engine/standings';
import { formatTeamCount } from '@/features/components';

/** The short texts that describe a league, in one place, so the dashboard,
 * League Detail, and League Setup say the same thing (Task 59). */

/** Round-robin (two-way) is hardcoded, not read off `LeagueRecord` — it is
 * the only fixture format `engine/fixtures` generates today (Task 3), and
 * no field stores a format name to read instead. */
export const FIXTURE_FORMAT_LABEL = 'Round robin (two-way)';

const UNTITLED_LEAGUE_NAME = 'Untitled league';

export function formatPointsLabel(points: PointsConfig): string {
  return `${points.win}/${points.draw}/${points.loss} pts`;
}

export function formatHomeAdvantageLabel(homeAdvantage: boolean): string {
  return `Home adv. ${homeAdvantage ? 'on' : 'off'}`;
}

/** A league name, or a placeholder while League Setup has no name yet. A
 * whitespace-only name counts as blank, since `addLeague` trims it. */
export function formatLeagueName(name: string): string {
  return name.trim() || UNTITLED_LEAGUE_NAME;
}

/** The fixture-format / team-count / home-advantage summary of a league. */
export function describeLeague(league: LeagueRecord): string {
  return [
    FIXTURE_FORMAT_LABEL,
    formatTeamCount(league.teams.length),
    formatHomeAdvantageLabel(league.homeAdvantage),
  ].join(' · ');
}
