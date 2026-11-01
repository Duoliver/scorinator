import type { PhaseSummary, WrapperSummary } from '@/domain';
import type { PointsConfig } from '@/engine/standings';
import { formatTeamCount } from '@/features/components';

/** The short texts that describe a league, in one place, so the dashboard,
 * League Detail, and League Setup say the same thing (Task 59). */

/** Round-robin (two-way) is hardcoded, not read off the phase formats: it
 * is the only phase format in M1 (Task 104). Task 131 shows the phase
 * formats. */
export const FIXTURE_FORMAT_LABEL = 'Round robin (two-way)';

const UNTITLED_LEAGUE_NAME = 'Untitled league';

export function formatPointsLabel(points: PointsConfig): string {
  return `${points.win}/${points.draw}/${points.loss} pts`;
}

export function formatHomeAdvantageLabel(homeAdvantage: boolean): string {
  return `Home adv. ${homeAdvantage ? 'on' : 'off'}`;
}

/** A league name, or a placeholder while League Setup has no name yet. A
 * whitespace-only name counts as blank, since "Create league" trims it. */
export function formatLeagueName(name: string): string {
  return name.trim() || UNTITLED_LEAGUE_NAME;
}

/** The fixture-format / team-count / home-advantage summary of a league,
 * from its manifest row, so a dashboard card needs no league file. */
export function describeLeague(
  league: Pick<WrapperSummary, 'teamCount' | 'homeAdvantage'>
): string {
  return [
    FIXTURE_FORMAT_LABEL,
    formatTeamCount(league.teamCount),
    formatHomeAdvantageLabel(league.homeAdvantage),
  ].join(' · ');
}

/** The full label of a phase format (US-01.2), from a manifest phase or a
 * phase plan: both have the format and, but for a bracket, the legs. */
export function formatPhaseLabel(phase: PhaseSummary): string {
  if (phase.format === 'bracket') return 'Bracket';
  const legs = phase.legs === 'two-way' ? '(two-way)' : '(single duels)';
  return phase.format === 'groups'
    ? `Groups round robin ${legs}`
    : `Round robin ${legs}`;
}

/** The fixed short name of a phase format family (US-01.2): "Round robin",
 * "Group Stage", or "Bracket". */
export function phaseShortName(phase: PhaseSummary): string {
  if (phase.format === 'bracket') return 'Bracket';
  return phase.format === 'groups' ? 'Group Stage' : 'Round robin';
}

/** The format text of a league (US-01.2): the full label of a one-phase
 * league, or the short names joined with " → ". */
export function formatPhasesLabel(phases: readonly PhaseSummary[]): string {
  if (phases.length === 1) return formatPhaseLabel(phases[0]);
  return phases.map(phaseShortName).join(' → ');
}
