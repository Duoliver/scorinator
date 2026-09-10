import type { JSX } from 'preact';
import { Badge, Button } from '../../../design-system';
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
    <div class={styles.step}>
      <h2>{name || 'Untitled league'}</h2>

      <div class={styles.badges}>
        <Badge tone="neutral">Round robin (two-way)</Badge>
        <Badge tone={homeAdvantage ? 'accent' : 'neutral'}>
          Home adv. {homeAdvantage ? 'on' : 'off'}
        </Badge>
        <Badge tone="neutral">
          {points.win}/{points.draw}/{points.loss} pts
        </Badge>
        <Badge tone="neutral">{selectedTeams.length} teams</Badge>
      </div>

      <ul class={styles.teamList}>
        {selectedTeams.map((team) => (
          <li key={team.slug} class={styles.teamRow}>
            <div class={styles.swatch} style={{ background: team.colour || 'transparent' }} />
            <span>{team.name}</span>
            <Badge tone="dark">{team.tier}</Badge>
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
  );
}
ReviewStep.displayName = 'ReviewStep';
