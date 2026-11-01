import type { JSX } from 'preact';
import { Button } from '@/design-system';
import {
  canAddPhase,
  canMovePhase,
} from '@/features/leagues/LeagueSetupScreen/phasePlans';
import { PhaseCard } from './PhaseCard';
import type PhasesStepProps from './types';
import styles from './PhasesStep.module.css';

export type { PhasesStepProps };

/**
 * Step 2 of League Setup (Task 129, US-01.1 to US-01.4, US-01.6): the
 * phase chain, one card for each phase, and "+ Add phase". After a bracket,
 * "+ Add phase" is off, with a hint (US-01.3). Task 177 adds the counts and
 * the warnings.
 */
export function PhasesStep({
  phaseList,
  onBack,
  onNext,
}: PhasesStepProps): JSX.Element {
  const { plans, phaseKeys } = phaseList;
  const addable = canAddPhase(plans);

  return (
    <div class={styles.step}>
      <p class={styles.intro}>
        A league runs as a sequence of phases. Stats reset to zero between phases.
        Bracket may only be the final phase.
      </p>

      {plans.map((plan, index) => (
        <PhaseCard
          key={phaseKeys[index]}
          plan={plan}
          index={index}
          isLast={index === plans.length - 1}
          canRemove={plans.length > 1}
          canMoveUp={canMovePhase(plans, index, -1)}
          canMoveDown={canMovePhase(plans, index, 1)}
          phaseList={phaseList}
        />
      ))}

      <div class={styles.add}>
        <Button variant="secondary" disabled={!addable} onClick={phaseList.addPhase}>
          + Add phase
        </Button>
        {!addable && <p class={styles.hint}>A bracket must be the last phase.</p>}
      </div>

      <div class={styles.footer}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next: Teams →</Button>
      </div>
    </div>
  );
}
PhasesStep.displayName = 'PhasesStep';
