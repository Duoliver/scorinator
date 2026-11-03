import type { JSX } from 'preact';
import { SegmentedControl, Switch } from '@/design-system';
import type { TieFormat, TiebreakMethod } from '@/engine/tiebreak';
import type BracketSettingsProps from './types';
import styles from './BracketSettings.module.css';

export type { BracketSettingsProps };

const METHOD_OPTIONS: { value: TiebreakMethod; label: string }[] = [
  { value: 'penalties', label: 'Penalties' },
  { value: 'replay-coin-toss', label: 'Replay → Coin toss' },
];

const FORMAT_OPTIONS: { value: TieFormat; label: string }[] = [
  { value: 'single-match', label: 'Single match' },
  { value: 'two-legged', label: 'Two-legged' },
];

/**
 * The settings of a Bracket phase card (Task 140 choice 1): the handoff
 * order, "Plays AET", the method, the tie format, and "Away goals rule",
 * then "Single-match final" and "Third-place playoff". Each change writes
 * the full rules (choice 2). The fields are uncontrolled: a two-leg switch
 * mounts again with its kept value (choice 3).
 */
export function BracketSettings({
  index,
  bracket,
  phaseList,
}: BracketSettingsProps): JSX.Element {
  const { rules, thirdPlaceAllowed, warning } = bracket;
  const set = (change: Parameters<typeof phaseList.setBracketRules>[1]): void =>
    phaseList.setBracketRules(index, change);
  const twoLegged = rules.format === 'two-legged';

  return (
    <div class={styles.settings}>
      <Switch
        label="Plays AET"
        defaultChecked={rules.playsAet}
        onChange={(playsAet) => set({ playsAet })}
      />
      <SegmentedControl<TiebreakMethod>
        label="Tiebreak method"
        options={METHOD_OPTIONS}
        defaultValue={rules.method}
        onChange={(method) => set({ method })}
      />
      <SegmentedControl<TieFormat>
        label="Tie format"
        options={FORMAT_OPTIONS}
        defaultValue={rules.format}
        onChange={(format) => set({ format })}
      />
      {twoLegged && (
        <>
          <Switch
            label="Away goals rule"
            defaultChecked={rules.awayGoals}
            onChange={(awayGoals) => set({ awayGoals })}
          />
          <Switch
            label="Single-match final"
            defaultChecked={rules.singleMatchFinal}
            onChange={(singleMatchFinal) => set({ singleMatchFinal })}
          />
        </>
      )}
      <div class={styles.third}>
        {/* A new key mounts the switch again when it turns off or on. */}
        <Switch
          key={String(thirdPlaceAllowed)}
          label="Third-place playoff"
          defaultChecked={thirdPlaceAllowed && rules.thirdPlace}
          disabled={!thirdPlaceAllowed}
          onChange={(thirdPlace) => set({ thirdPlace })}
        />
        {!thirdPlaceAllowed && <p class={styles.hint}>Needs 4 qualifiers or more.</p>}
      </div>
      {warning && <p class={styles.hint}>{warning}</p>}
    </div>
  );
}
BracketSettings.displayName = 'BracketSettings';
