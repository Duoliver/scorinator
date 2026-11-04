import { useRef, useState } from 'preact/hooks';
import type { PhasePlan } from '@/engine/phases';
import * as edits from './phasePlans';
import type { PhaseList } from './types';

/** The phase chain of the Phases step, as local state seeded from the draft
 * (Task 129). Each edit comes from `phasePlans.ts`. The keys are local: a
 * new mount gives new keys, and the fields read the plans again. */
export function usePhaseList(initialPlans: readonly PhasePlan[]): PhaseList {
  const [plans, setPlans] = useState<PhasePlan[]>([...initialPlans]);
  const nextKey = useRef(initialPlans.length);
  const [phaseKeys, setPhaseKeys] = useState<number[]>(() =>
    initialPlans.map((_, index) => index)
  );

  const change = (edit: (current: PhasePlan[]) => PhasePlan[]): void =>
    setPlans((current) => edit(current));

  return {
    plans,
    phaseKeys,
    addPhase: (): void => {
      const key = nextKey.current++;
      setPhaseKeys((keys) => [...keys, key]);
      change(edits.addPhase);
    },
    removePhase: (index): void => {
      setPhaseKeys((keys) => keys.filter((_, i) => i !== index));
      change((current) => edits.removePhase(current, index));
    },
    movePhase: (index, step): void => {
      setPhaseKeys((keys) => {
        const moved = [...keys];
        [moved[index], moved[index + step]] = [moved[index + step], moved[index]];
        return moved;
      });
      change((current) => edits.movePhase(current, index, step));
    },
    setFormat: (index, key) =>
      change((current) => edits.setPhaseFormat(current, index, key)),
    setGroupBy: (index, by) =>
      change((current) => edits.setGroupBy(current, index, by)),
    setGroupNumber: (index, value) =>
      change((current) => edits.setGroupNumber(current, index, value)),
    setTop: (index, top) => change((current) => edits.setTop(current, index, top)),
    setBestOfNext: (index, bestOfNext) =>
      change((current) => edits.setBestOfNext(current, index, bestOfNext)),
    setBracketRules: (index, rules) =>
      change((current) => edits.setBracketRules(current, index, rules)),
  };
}
