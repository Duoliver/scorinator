import type { JSX } from 'preact';
import { Button, Card } from '@/design-system';
import {
  TeamSwatch,
  formatTeamCount,
  useBlueprintLocation,
} from '@/features/components';
import {
  SetupChips,
  settingsChipLabels,
} from '@/features/leagues/LeagueSetupScreen/steps/SetupChips';
import {
  formatLeagueName,
  formatPhasesLabel,
  phaseShortName,
} from '@/features/leagues/leagueSummary';
import { describePhasePlan } from '@/features/leagues/LeagueSetupScreen/phasePlans';
import {
  endsWithGroups,
  GROUPS_LAST_WARNING,
} from '@/features/leagues/LeagueSetupScreen/phaseChecks';
import { TeamLabel } from '@/features/leagues/TeamLabel';
import type ReviewStepProps from './types';
import styles from './ReviewStep.module.css';
import { PhaseFormat } from '@/engine/phases';

export type { ReviewStepProps };

export function ReviewStep({
  name,
  homeAdvantage,
  points,
  teams,
  plans,
  bracketQualifiers,
  phaseProblems,
  createProblem,
  onBack,
  onCreate,
}: ReviewStepProps): JSX.Element {
  const locationOf = useBlueprintLocation();
  return (
    <Card padding="lg">
      <div class={styles.step}>
        <h3>{formatLeagueName(name)}</h3>

        <SetupChips
          labels={[
            formatPhasesLabel(plans),
            ...settingsChipLabels(homeAdvantage, points),
            formatTeamCount(teams.length),
          ]}
        />

        <ol class={styles.phaseList} aria-label="Phases">
          {plans.map((plan, index) => (
            <li key={index}>
              {`${index + 1} · ${phaseShortName(plan)} · ${describePhasePlan(plan, plan.format === PhaseFormat.BRACKET ? bracketQualifiers : undefined)}`}
            </li>
          ))}
        </ol>

        {phaseProblems.length > 0 && (
          <ul class={styles.phaseProblems} aria-label="Phase problems">
            {phaseProblems.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        )}
        {endsWithGroups(plans) && <p class={styles.warning}>{GROUPS_LAST_WARNING}</p>}

        <ul class={styles.teamList}>
          {teams.map((team) => (
            <li key={team.blueprintUuid} class={styles.teamRow}>
              <TeamSwatch colour={team.colour} />
              <TeamLabel
                name={team.name}
                location={locationOf(team.blueprintUuid)}
                inline
              />
              <span class={styles.tier}>{team.tier}</span>
            </li>
          ))}
        </ul>

        <div class={styles.footer}>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          {/* `createProblem` covers the name too (Task 179): a jump
              through the step tabs reaches this button past the Details
              step. */}
          <div class={styles.create}>
            {createProblem && <p class={styles.problem}>{createProblem}</p>}
            <Button onClick={onCreate} disabled={createProblem !== null}>
              Create league
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
ReviewStep.displayName = 'ReviewStep';
