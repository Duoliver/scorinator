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
import type ReviewStepProps from './types';
import styles from './ReviewStep.module.css';

export type { ReviewStepProps };

export function ReviewStep({
  name,
  homeAdvantage,
  points,
  selectedTeams,
  onBack,
  onCreate,
}: ReviewStepProps): JSX.Element {
  return (
    <Card padding="lg">
      <div class={styles.step}>
        <h3>{formatLeagueName(name)}</h3>

        <SetupChips
          labels={[
            FIXTURE_FORMAT_LABEL,
            ...settingsChipLabels(homeAdvantage, points),
            formatTeamCount(selectedTeams.length),
          ]}
        />

        <ul class={styles.teamList}>
          {selectedTeams.map((team) => (
            <li key={team.slug} class={styles.teamRow}>
              <TeamSwatch colour={team.colour} />
              <span class={styles.teamName}>{team.name}</span>
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
          <Button onClick={onCreate} disabled={selectedTeams.length === 0}>
            Create league
          </Button>
        </div>
      </div>
    </Card>
  );
}
ReviewStep.displayName = 'ReviewStep';
