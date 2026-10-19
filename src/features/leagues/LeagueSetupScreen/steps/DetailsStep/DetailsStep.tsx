import { forwardRef } from 'preact/compat';
import { Button, Card, Input, Switch } from '@/design-system';
import type DetailsStepProps from './types';
import type { DetailsStepHandle } from './types';
import { useDetailsStep } from './useDetailsStep';
import styles from './DetailsStep.module.css';

export type { DetailsStepProps, DetailsStepHandle };

export const DetailsStep = forwardRef<DetailsStepHandle, DetailsStepProps>(
  ({ onNext, ...props }, ref) => {
    const step = useDetailsStep(props, ref);

    return (
      <Card padding="lg">
        <div class={styles.step}>
          <Input
            label="League name"
            defaultValue={step.startValues.name}
            placeholder="e.g. Coastal Premier"
            onChange={step.handleNameChange}
            ref={step.nameRef}
          />

          <div class={styles.pointsRow}>
            <Input
              label="Points (win)"
              type="number"
              defaultValue={step.startValues.win}
              ref={step.winRef}
            />
            <Input
              label="Points (draw)"
              type="number"
              defaultValue={step.startValues.draw}
              ref={step.drawRef}
            />
            <Input
              label="Points (loss)"
              type="number"
              defaultValue={step.startValues.loss}
              ref={step.lossRef}
            />
          </div>

          <Switch
            label="Home advantage"
            defaultChecked={step.startValues.homeAdvantage}
            ref={step.homeAdvantageRef}
          />

          <div class={styles.footer}>
            {/* Says why Next is off. Same text as the Create guard in
                `useLeagueSetup`'s `handleCreate`. */}
            {step.nameProblem && <span class={styles.hint}>{step.nameProblem}</span>}
            <Button onClick={onNext} disabled={step.nameProblem !== null}>
              Next: Teams →
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);
DetailsStep.displayName = 'DetailsStep';
