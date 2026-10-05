import type { JSX } from 'preact';
import { Button, Card } from '@/design-system';
import type { PointsConfig } from '@/engine/standings';
import type { TeamRecord } from '@/features/components';
import { SetupChips, settingsChipLabels } from './SetupChips';
import styles from './ReviewStep.module.css';

interface ReviewStepProps {
  name: string;
  homeAdvantage: boolean;
  points: PointsConfig;
  selectedTeams: readonly TeamRecord[];
  onBack: () => void;
  onCreate: () => void;
}

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
        <h3>{name || 'Untitled league'}</h3>

        <SetupChips
          labels={[
            'Round robin (two-way)',
            ...settingsChipLabels(homeAdvantage, points),
            `${selectedTeams.length} teams`,
          ]}
        />

        <ul class={styles.teamList}>
          {selectedTeams.map((team) => (
            <li key={team.slug} class={styles.teamRow}>
              <div
                class={styles.swatch}
                style={{ background: team.colour || 'transparent' }}
              />
              <span class={styles.teamName}>{team.name}</span>
              <span class={styles.tier}>{team.tier}</span>
            </li>
          ))}
        </ul>

        <div class={styles.footer}>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={onCreate}
            disabled={!name.trim() || selectedTeams.length === 0}
          >
            Create league
          </Button>
        </div>
      </div>
    </Card>
  );
}
ReviewStep.displayName = 'ReviewStep';
