import type { JSX } from 'preact';
import { Button, Card } from '@/design-system';
import { TeamSwatch, formatTeamCount } from '@/features/components';
import {
  SetupChips,
  settingsChipLabels,
} from '@/features/leagues/LeagueSetupScreen/steps/SetupChips';
import {
  FIXTURE_FORMAT_LABEL,
  formatLeagueName,
} from '@/features/leagues/leagueSummary';
import { TeamLabel } from '@/features/leagues/LeagueSetupScreen/steps/TeamLabel';
import { useBlueprintLocation } from '@/features/leagues/LeagueSetupScreen/useBlueprintLocation';
import type ReviewStepProps from './types';
import styles from './ReviewStep.module.css';

export type { ReviewStepProps };

export function ReviewStep({
  name,
  homeAdvantage,
  points,
  teams,
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
            FIXTURE_FORMAT_LABEL,
            ...settingsChipLabels(homeAdvantage, points),
            formatTeamCount(teams.length),
          ]}
        />

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
          {/* No name check here: the Details step turns off Next for an
              invalid name. A jump through the step tabs still reaches
              this button, and `useLeagueSetup`'s `handleCreate` reports it. */}
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
