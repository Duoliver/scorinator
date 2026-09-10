import type { JSX } from 'preact';
import { Button, Card, Input, Switch } from '../../../design-system';
import type { PointsConfig } from '../../../engine/standings';
import styles from './DetailsStep.module.css';

interface DetailsStepProps {
  name: string;
  points: PointsConfig;
  homeAdvantage: boolean;
  onNameChange: (name: string) => void;
  onPointsChange: (points: PointsConfig) => void;
  onHomeAdvantageChange: (value: boolean) => void;
  onNext: () => void;
}

function parsePoints(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function DetailsStep({
  name,
  points,
  homeAdvantage,
  onNameChange,
  onPointsChange,
  onHomeAdvantageChange,
  onNext,
}: DetailsStepProps): JSX.Element {
  return (
    <Card padding="lg">
      <div class={styles.step}>
        <Input
          label="League name"
          defaultValue={name}
          placeholder="e.g. Coastal Premier"
          onChange={onNameChange}
        />

        <div class={styles.pointsRow}>
          <Input
            label="Points (win)"
            type="number"
            defaultValue={String(points.win)}
            onChange={(value) => {
              const win = parsePoints(value);
              if (win !== null) onPointsChange({ ...points, win });
            }}
          />
          <Input
            label="Points (draw)"
            type="number"
            defaultValue={String(points.draw)}
            onChange={(value) => {
              const draw = parsePoints(value);
              if (draw !== null) onPointsChange({ ...points, draw });
            }}
          />
          <Input
            label="Points (loss)"
            type="number"
            defaultValue={String(points.loss)}
            onChange={(value) => {
              const loss = parsePoints(value);
              if (loss !== null) onPointsChange({ ...points, loss });
            }}
          />
        </div>

        <Switch
          label="Home advantage"
          defaultChecked={homeAdvantage}
          onChange={onHomeAdvantageChange}
        />

        <div class={styles.footer}>
          <Button onClick={onNext}>Next: Teams →</Button>
        </div>
      </div>
    </Card>
  );
}
DetailsStep.displayName = 'DetailsStep';
