import { forwardRef } from 'preact/compat';
import { useImperativeHandle, useRef, useState } from 'preact/hooks';
import { Button, Card, Input, Switch } from '@/design-system';
import type { FieldHandle } from '@/design-system/field';
import { slug } from '@/engine/identity';
import type { LeagueDraftDetails } from '@/app/state/leagueDraftStore';
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
  onNext: () => void;
}

/** A league name must give a slug: at least one letter or number. The
 * same rule `addLeague` applies, through `slug()`, which throws otherwise. */
function isValidLeagueName(name: string): boolean {
  try {
    slug(name.trim());
    return true;
  } catch {
    return false;
  }
}

function parsePoints(value: string, fallback: number): number {
  if (value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const DetailsStep = forwardRef<DetailsStepHandle, DetailsStepProps>(
  ({ initial, onNext }, ref) => {
    const nameRef = useRef<FieldHandle<string>>(null);
    const winRef = useRef<FieldHandle<string>>(null);
    const drawRef = useRef<FieldHandle<string>>(null);
    const lossRef = useRef<FieldHandle<string>>(null);
    const homeAdvantageRef = useRef<FieldHandle<boolean>>(null);
    // Next stays off until the name is valid, so a nameless league never
    // reaches Review through Next. The field stays uncontrolled: only this
    // flag updates while the user types.
    const [nameValid, setNameValid] = useState(() => isValidLeagueName(initial.name));

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
            onChange={(name) => setNameValid(isValidLeagueName(name))}
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
            <Button onClick={onNext} disabled={!nameValid}>
              Next: Teams →
            </Button>
          </div>
        </div>
      </Card>
    );
  }
);
DetailsStep.displayName = 'DetailsStep';
