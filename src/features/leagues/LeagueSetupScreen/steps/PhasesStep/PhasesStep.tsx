import type { JSX } from 'preact';
import { Button } from '@/design-system';
import {
  COUNTS_LATER_NOTE,
  GROUPS_LAST_WARNING,
  HOME_ADVANTAGE_NOTE,
} from '@/features/leagues/LeagueSetupScreen/phaseChecks';
import { PhaseCard } from './PhaseCard';
import type PhasesStepProps from './types';
import { usePhasesStep } from './usePhasesStep';
import styles from './PhasesStep.module.css';

export type { PhasesStepProps };

/**
 * Step 2 of League Setup (Task 129, US-01.1 to US-01.6): the phase chain,
 * one card for each phase, and "+ Add phase". After a bracket, "+ Add
 * phase" is off, with a hint (US-01.3). The cards show the counts, the
 * problems, and the best M suggestion once the team list has 2 teams
 * (Task 177).
 */
export function PhasesStep({
  phaseList,
  teamCount,
  firstGroupSizes,
  onBack,
  onNext,
}: PhasesStepProps): JSX.Element {
  const step = usePhasesStep(phaseList, teamCount, firstGroupSizes);

  return (
    <div class={styles.step}>
      <p class={styles.intro}>
        A league runs as a sequence of phases. Stats reset to zero between phases.
        Bracket may only be the final phase.
      </p>
      <p class={styles.intro}>{HOME_ADVANTAGE_NOTE}</p>
      {!step.countsKnown && <p class={styles.intro}>{COUNTS_LATER_NOTE}</p>}
      {step.otherProblems.map((text) => (
        <p key={text} class={styles.problem}>
          {text}
        </p>
      ))}

      {step.cards.map((card) => (
        <PhaseCard
          key={phaseList.phaseKeys[card.index]}
          view={card}
          phaseList={phaseList}
        />
      ))}

      {step.groupsLast && <p class={styles.warning}>{GROUPS_LAST_WARNING}</p>}

      <div class={styles.add}>
        <Button
          variant="secondary"
          disabled={!step.addable}
          onClick={phaseList.addPhase}
        >
          + Add phase
        </Button>
        {!step.addable && <p class={styles.hint}>A bracket must be the last phase.</p>}
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
