import { useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Table,
  type TableColumn,
} from '@/design-system';
import type { FieldHandle } from '@/design-system/field';
import { TeamFormDrawer, type TeamRecord } from '@/features/components';
import { addTeam } from '@/app/state/teamsActions';
import { useTeamsStore } from '@/app/state/teamsStore';
import {
  SetupChips,
  settingsChipLabels,
} from '@/features/leagues/LeagueSetupScreen/steps/SetupChips';
import type TeamsStepProps from './types';
import styles from './TeamsStep.module.css';

export type { TeamsStepProps };

export function TeamsStep({
  name,
  homeAdvantage,
  points,
  selectedSlugs,
  onToggleTeam,
  onSelectAll,
  onClearSelection,
  onTeamCreated,
  onBack,
  onNext,
}: TeamsStepProps): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const [query, setQuery] = useState('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const checkboxHandles = useRef(new Map<string, FieldHandle<boolean>>());

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredSlugs = filteredTeams.map((team) => team.slug);
  const allFilteredSelected =
    filteredSlugs.length > 0 &&
    filteredSlugs.every((slug) => selectedSlugs.includes(slug));

  const handleSelectAll = (): void => {
    onSelectAll(filteredSlugs);
    filteredSlugs.forEach((slug) => checkboxHandles.current.get(slug)?.setValue(true));
  };

  const handleClearSelection = (): void => {
    onClearSelection(filteredSlugs);
    filteredSlugs.forEach((slug) => checkboxHandles.current.get(slug)?.setValue(false));
  };

  const handleTeamCreated = (record: TeamRecord): void => {
    addTeam(record);
    onTeamCreated(record.slug);
    setShowCreateTeam(false);
  };

  const columns: TableColumn<TeamRecord>[] = [
    {
      key: 'team',
      header: 'Team',
      render: (team) => (
        <div class={styles.teamCell}>
          <Checkbox
            label={team.name}
            defaultChecked={selectedSlugs.includes(team.slug)}
            onChange={() => onToggleTeam(team.slug)}
            ref={(handle: FieldHandle<boolean> | null) => {
              if (handle) checkboxHandles.current.set(team.slug, handle);
              else checkboxHandles.current.delete(team.slug);
            }}
          />
          <div
            class={styles.swatch}
            style={{ background: team.colour || 'transparent' }}
          />
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      width: '5rem',
      align: 'right',
      render: (team) => <Badge tone="dark">{team.tier}</Badge>,
    },
  ];

  return (
    <Card padding="lg">
      <div class={styles.step}>
        <div class={styles.summary}>
          <p class={styles.leagueName}>{name || 'Untitled league'}</p>
          <SetupChips labels={settingsChipLabels(homeAdvantage, points)} />
        </div>

        <div class={styles.toolbar}>
          <Input label="Search teams" placeholder="Search teams…" onChange={setQuery} />
          <Button variant="secondary" onClick={() => setShowCreateTeam(true)}>
            + Create new team
          </Button>
        </div>

        <Table columns={columns} rows={filteredTeams} rowKey={(team) => team.slug} />

        <div class={styles.selectionRow}>
          <span class={styles.count}>{selectedSlugs.length} teams selected</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={allFilteredSelected ? handleClearSelection : handleSelectAll}
            disabled={filteredSlugs.length === 0}
          >
            {allFilteredSelected ? 'Clear selection' : 'Select all'}
          </Button>
        </div>

        {showCreateTeam && (
          <TeamFormDrawer
            onCancel={() => setShowCreateTeam(false)}
            onSave={handleTeamCreated}
          />
        )}

        <div class={styles.footer}>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={selectedSlugs.length === 0}>
            Next: Review →
          </Button>
        </div>
      </div>
    </Card>
  );
}
TeamsStep.displayName = 'TeamsStep';
