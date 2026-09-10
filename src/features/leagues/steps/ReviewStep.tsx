import type { JSX } from 'preact';
import { Button, Card } from '../../../design-system';
import type { PointsConfig } from '../../../engine/standings';
import type { TeamRecord } from '../../components';
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

        <div class={styles.chips}>
          <span class={styles.chip}>Round robin (two-way)</span>
          <span class={styles.chip}>Home adv. {homeAdvantage ? 'on' : 'off'}</span>
          <span class={styles.chip}>
            {points.win}/{points.draw}/{points.loss} pts
          </span>
          <span class={styles.chip}>{selectedTeams.length} teams</span>
        </div>

        <ul class={styles.teamList}>
          {selectedTeams.map((team) => (
            <li key={team.slug} class={styles.teamRow}>
              <div class={styles.swatch} style={{ background: team.colour || 'transparent' }} />
              <span class={styles.teamName}>{team.name}</span>
              <span class={styles.tier}>{team.tier}</span>
            </li>
          ))}
        </ul>

        <div class={styles.footer}>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onCreate} disabled={!name.trim() || selectedTeams.length === 0}>
            Create league
          </Button>
        </div>
      </div>
    </Card>
  );
}
ReviewStep.displayName = 'ReviewStep';
