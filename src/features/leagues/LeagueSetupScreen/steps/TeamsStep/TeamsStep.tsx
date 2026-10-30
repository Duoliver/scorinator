import type { JSX } from 'preact';
import { Button, Card, PickerDialog, Table } from '@/design-system';
import { TeamFormDrawer } from '@/features/components';
import { SetupChips } from '@/features/leagues/LeagueSetupScreen/steps/SetupChips';
import type TeamsStepProps from './types';
import type { TeamsStepState } from './types';
import { describeNotFound, getRowKey } from './helpers';
import { useTeamsStep } from './useTeamsStep';
import styles from './TeamsStep.module.css';

export type { TeamsStepProps };

/** "+ Add teams", "Load them all", and "Import slug list": in the empty
 * state and above the list (US-08.1, US-08.2, US-08.7). */
function AddActions({ step }: { step: TeamsStepState }): JSX.Element {
  return (
    <div class={styles.actions}>
      <Button size="sm" onClick={step.openPicker}>
        + Add teams
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={step.loadAll}
        disabled={!step.canLoadAll}
      >
        Load them all
      </Button>
      <Button size="sm" variant="secondary" onClick={step.importSlugList}>
        Import slug list
      </Button>
    </div>
  );
}

/** The list, or one of the two empty states (US-08.3). */
function TeamListArea({
  step,
  teams,
}: {
  step: TeamsStepState;
  teams: TeamsStepProps['teams'];
}): JSX.Element {
  const isEmpty = teams.length === 0;
  if (isEmpty && step.hasNoBlueprints) {
    return (
      <div class={styles.empty}>
        <p class={styles.emptyTitle}>No teams yet. Create your first team.</p>
        <div class={styles.actions}>
          <Button size="sm" onClick={step.openFirstTeam}>
            + Create new team
          </Button>
        </div>
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div class={styles.empty}>
        <p class={styles.emptyTitle}>No teams added yet</p>
        <p class={styles.emptyText}>
          Add teams from your saved blueprints, or create new ones on the fly.
        </p>
        <AddActions step={step} />
      </div>
    );
  }
  return (
    <>
      <AddActions step={step} />
      <Table
        label="Teams"
        columns={step.columns}
        rows={[...teams]}
        rowKey={getRowKey}
      />
      <span class={styles.count}>{step.countText}</span>
    </>
  );
}

export function TeamsStep({ onBack, onNext, ...props }: TeamsStepProps): JSX.Element {
  const step = useTeamsStep(props);

  return (
    <Card padding="lg">
      <div class={styles.step}>
        <div class={styles.summary}>
          <p class={styles.leagueName}>{step.leagueName}</p>
          <SetupChips labels={step.chipLabels} />
        </div>

        {step.notFound && (
          <div role="alert" class={styles.notice}>
            <span>{describeNotFound(step.notFound)}</span>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close the notice"
              onClick={step.closeNotFound}
            >
              ✕
            </Button>
          </div>
        )}

        <TeamListArea step={step} teams={props.teams} />

        {(step.overlay === 'picker' || step.overlay === 'pickerTeam') && (
          <PickerDialog
            mode="multi"
            title="Add teams"
            description="Pick teams from your saved blueprints."
            items={step.pickerItems}
            selected={step.pickerSelected}
            onSelectedChange={step.setPickerSelected}
            availableAction={{
              label: '+ Create new team',
              onClick: step.openPickerTeam,
            }}
            confirmLabel={step.pickerConfirmLabel}
            onConfirm={step.confirmPicker}
            onCancel={step.closePicker}
          />
        )}

        {(step.overlay === 'firstTeam' || step.overlay === 'pickerTeam') && (
          <TeamFormDrawer
            takenSlugs={step.takenSlugs}
            onCancel={step.closeTeamDrawer}
            onSave={step.handleTeamCreated}
          />
        )}

        <div class={styles.footer}>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={!step.canGoNext}>
            Next: Review →
          </Button>
        </div>
      </div>
    </Card>
  );
}
TeamsStep.displayName = 'TeamsStep';
