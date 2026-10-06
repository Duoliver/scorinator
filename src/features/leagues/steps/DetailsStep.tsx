import { forwardRef } from 'preact/compat';
import { useImperativeHandle, useRef, useState } from 'preact/hooks';
import { Button, Card, Input, Switch } from '@/design-system';
import type { FieldHandle } from '@/design-system/field';
import type { LeagueDraftDetails } from '@/app/state/leagueDraftStore';
import { leagueNameProblem } from './leagueName';
import styles from './DetailsStep.module.css';

/** `LeagueSetupScreen` reads the current field values through this handle,
 * at a step change and at unmount, instead of on every keystroke — see
 * `leagueDraftStore.ts` for why. Each field stays fully uncontrolled below;
 * `getValues()` is the only way out. */
export interface DetailsStepHandle {
  getValues: () => LeagueDraftDetails;
}

interface DetailsStepProps {
  initial: LeagueDraftDetails;
  /** Slugs of the leagues already open. A name that gives one of them is
   * refused, like an invalid name (Task 40). */
  takenSlugs?: readonly string[];
  onNext: () => void;
}

function parsePoints(value: string, fallback: number): number {
  if (value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const DetailsStep = forwardRef<DetailsStepHandle, DetailsStepProps>(
  ({ initial, takenSlugs = [], onNext }, ref) => {
    const nameRef = useRef<FieldHandle<string>>(null);
    const winRef = useRef<FieldHandle<string>>(null);
    const drawRef = useRef<FieldHandle<string>>(null);
    const lossRef = useRef<FieldHandle<string>>(null);
    const homeAdvantageRef = useRef<FieldHandle<boolean>>(null);
    // Next stays off while the name has a problem (invalid, or taken by an
    // open league), so such a league never reaches Review through Next. The
    // field stays uncontrolled: this copy of the name only feeds the check.
    const [name, setName] = useState(initial.name);
    const nameProblem = leagueNameProblem(name, takenSlugs);

    useImperativeHandle(
      ref,
      () => ({
        getValues: (): LeagueDraftDetails => ({
          name: nameRef.current?.getValue() ?? initial.name,
          points: {
            win: parsePoints(winRef.current?.getValue() ?? '', initial.points.win),
            draw: parsePoints(drawRef.current?.getValue() ?? '', initial.points.draw),
            loss: parsePoints(lossRef.current?.getValue() ?? '', initial.points.loss),
          },
          homeAdvantage: homeAdvantageRef.current?.getValue() ?? initial.homeAdvantage,
        }),
      }),
      [initial]
    );

    return (
      <Card padding="lg">
        <div class={styles.step}>
          <Input
            label="League name"
            defaultValue={initial.name}
            placeholder="e.g. Coastal Premier"
            onChange={setName}
            ref={nameRef}
          />

          <div class={styles.pointsRow}>
            <Input
              label="Points (win)"
              type="number"
              defaultValue={String(initial.points.win)}
              ref={winRef}
            />
            <Input
              label="Points (draw)"
              type="number"
              defaultValue={String(initial.points.draw)}
              ref={drawRef}
            />
            <Input
              label="Points (loss)"
              type="number"
              defaultValue={String(initial.points.loss)}
              ref={lossRef}
            />
          </div>

          <Switch
            label="Home advantage"
            defaultChecked={initial.homeAdvantage}
            ref={homeAdvantageRef}
          />

          <div class={styles.footer}>
            {/* Says why Next is off. Same text as the Create guard in
                `LeagueSetupScreen.handleCreate`. */}
            {nameProblem && <span class={styles.hint}>{nameProblem}</span>}
            <Button onClick={onNext} disabled={nameProblem !== null}>
              Next: Teams →
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);
DetailsStep.displayName = 'DetailsStep';
