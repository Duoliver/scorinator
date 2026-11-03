import type { LeagueProgress, PhaseSummary, WrapperSummary } from '@/domain';
import type { PhasePlan } from '@/engine/phases';
import type { PointsConfig } from '@/engine/standings';
import { formatTeamCount } from '@/features/components';

/** The short texts that describe a league, in one place, so the dashboard,
 * League Detail, and League Setup say the same thing (Task 59). */

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

/** The phase-format / team-count / home-advantage summary of a league
 * (US-01.2), from its manifest row, so a dashboard card needs no league
 * file. */
export function describeLeague(
  league: Pick<WrapperSummary, 'phases' | 'teamCount' | 'homeAdvantage'>
): string {
  return [
    formatPhasesLabel(league.phases),
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

/** The progress badge of a dashboard card (US-01.2, Task 131 choice 4):
 * "MD 7/16" during a phase, "Complete" for a complete league. M4 adds the
 * round name of a bracket. */
export function formatProgressBadge(progress: LeagueProgress): string {
  if (progress.kind === 'completed') return 'Complete';
  return `MD ${progress.matchday}/${progress.matchdays}`;
}

/** The progress badge of the League Detail header (US-01.2, Task 131
 * choice 3): the card badge after the short name of the current phase, also
 * for a one-phase league. "Complete" stays alone. */
export function formatHeaderProgress(
  league: Pick<WrapperSummary, 'phases' | 'progress'>
): string {
  const { progress } = league;
  if (progress.kind === 'completed') return formatProgressBadge(progress);
  const phase = league.phases[progress.phase - 1];
  const badge = formatProgressBadge(progress);
  return phase ? `${phaseShortName(phase)} · ${badge}` : badge;
}

/** The line under the tables of a phase that sends teams on (Task 130
 * choice 5, US-07.2), in the wizard and in League Detail: "Top 2 of each
 * group advance to the Bracket." or "Top 4 advance to the Bracket.".
 * `undefined` for the last phase, a Bracket, or no advancement.
 * `phaseIndex` counts from 0. */
export function formatAdvanceText(
  plans: readonly PhasePlan[],
  phaseIndex = 0
): string | undefined {
  const plan = plans[phaseIndex];
  const next = plans[phaseIndex + 1];
  if (!plan || plan.format === 'bracket' || !plan.advance || !next) return undefined;
  const target = `advance to the ${phaseShortName(next)}.`;
  if (plan.format === 'round-robin') return `Top ${plan.advance.top} ${target}`;
  const { top, bestOfNext } = plan.advance;
  const best = bestOfNext > 0 ? ` and the best ${bestOfNext} of place ${top + 1}` : '';
  return `Top ${top} of each group${best} ${target}`;
}
