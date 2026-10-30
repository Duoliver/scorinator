import type { JSX } from 'preact';
import { Button, Card, Input, Table } from '@/design-system';
import { TeamFormDrawer } from '@/features/components';
import { SetupChips } from '@/features/leagues/LeagueSetupScreen/steps/SetupChips';
import type TeamsStepProps from './types';
import { getRowKey } from './helpers';
import { useTeamsStep } from './useTeamsStep';
import styles from './TeamsStep.module.css';

export type { TeamsStepProps };

export function TeamsStep({ onBack, onNext, ...props }: TeamsStepProps): JSX.Element {
  const step = useTeamsStep(props);

  return (
    <Card padding="lg">
      <div class={styles.step}>
        <div class={styles.summary}>
          <p class={styles.leagueName}>{step.leagueName}</p>
          <SetupChips labels={step.chipLabels} />
        </div>

        <div class={styles.toolbar}>
          <Input
            label="Search teams"
            placeholder="Search teams…"
            onChange={step.handleSearchChange}
          />
          <Button variant="secondary" onClick={step.openCreateTeam}>
            + Create new team
          </Button>
        </div>

        <Table
          label="Teams"
          columns={step.columns}
          rows={step.rows}
          rowKey={getRowKey}
        />

        <div class={styles.selectionRow}>
          <span class={styles.count}>{step.selectedCountText}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={step.handleSelectionButton}
            disabled={!step.hasVisibleTeams}
          >
            {step.allVisibleSelected ? 'Clear selection' : 'Select all'}
          </Button>
        </div>

        {step.showCreateTeam && (
          <TeamFormDrawer
            takenSlugs={step.takenSlugs}
            onCancel={step.closeCreateTeam}
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
