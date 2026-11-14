import type { JSX } from 'preact';
import {
  Button,
  Input,
  Modal,
  PickerDialog,
  SegmentedControl,
  Switch,
} from '@/design-system';
import { TieFormat } from '@/engine/tiebreak';
import type { TeamInstance } from '@/domain';
import { TeamSwatch } from '@/features/components';
import type PlayoffDialogProps from './types';
import type { PlayoffSlot } from './types';
import { FORMAT_OPTIONS, METHOD_OPTIONS } from './helpers';
import { usePlayoffDialog } from './usePlayoffDialog';
import styles from './PlayoffDialog.module.css';

export type { PlayoffDialogProps };

/** "Team 1" or "Team 2": a field that opens the team picker. The label
 * names the button, as a field label names its input (Task 215 point 4). */
function TeamField({
  slot,
  team,
  onOpen,
}: {
  slot: PlayoffSlot;
  team: TeamInstance | undefined;
  onOpen: (slot: PlayoffSlot) => void;
}): JSX.Element {
  const labelId = `playoff-team-${slot}`;
  return (
    <div class={styles.field}>
      <span class={styles.label} id={labelId}>
        Team {slot}
      </span>
      <button
        type="button"
        class={styles.teamPick}
        aria-labelledby={labelId}
        onClick={() => onOpen(slot)}
      >
        {team ? (
          <>
            <TeamSwatch colour={team.colour} />
            <span class={styles.teamName}>{team.name}</span>
          </>
        ) : (
          <span class={styles.placeholder}>Pick a team…</span>
        )}
      </button>
    </div>
  );
}

/** "New playoff" (US-13.7, Task 220): a name, two Season teams, and the
 * rules of the tie. The team fields open the single team picker. */
export function PlayoffDialog(props: PlayoffDialogProps): JSX.Element {
  const dialog = usePlayoffDialog(props);

  return (
    <Modal
      title="New playoff"
      description="A one-off tie between two Season teams. It belongs to the Season, not to a league."
      size="md"
      onClose={props.onCancel}
    >
      <form class={styles.form} onSubmit={dialog.handleCreate}>
        <div class={styles.field}>
          <Input label="Name" onChange={dialog.setName} />
          {dialog.nameError && (
            <p class={styles.error} role="alert">
              {dialog.nameError}
            </p>
          )}
        </div>
        <div class={styles.teams}>
          <TeamField slot={1} team={dialog.team1} onOpen={dialog.openPicker} />
          <TeamField slot={2} team={dialog.team2} onOpen={dialog.openPicker} />
        </div>
        <div class={styles.rules}>
          <SegmentedControl
            label="Tie format"
            options={FORMAT_OPTIONS}
            defaultValue={dialog.format}
            onChange={dialog.setFormat}
          />
          {dialog.format === TieFormat.TWO_LEGGED && (
            <Switch
              label="Away goals rule"
              defaultChecked={dialog.awayGoals}
              onChange={dialog.setAwayGoals}
            />
          )}
          <Switch
            label="Plays AET"
            defaultChecked={dialog.playsAet}
            onChange={dialog.setPlaysAet}
          />
          <SegmentedControl
            label="Tiebreak method"
            options={METHOD_OPTIONS}
            defaultValue={dialog.method}
            onChange={dialog.setMethod}
          />
          <Switch
            label="Home advantage"
            defaultChecked={dialog.homeAdvantage}
            onChange={dialog.setHomeAdvantage}
          />
        </div>
        <div class={styles.actions}>
          <Button variant="secondary" size="sm" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!dialog.canCreate}
          >
            Create playoff
          </Button>
        </div>
      </form>
      {dialog.picker && <PickerDialog {...dialog.picker} />}
    </Modal>
  );
}
PlayoffDialog.displayName = 'PlayoffDialog';
