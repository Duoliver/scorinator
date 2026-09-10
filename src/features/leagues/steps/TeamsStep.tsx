import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Badge, Button, Checkbox, Input, Table, type TableColumn } from '../../../design-system';
import { TeamForm, type TeamRecord } from '../../components';
import { useTeamsStore } from '../../../app/state/teamsStore';

interface TeamsStepProps {
  selectedSlugs: readonly string[];
  onToggleTeam: (slug: string) => void;
  onTeamCreated: (slug: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function TeamsStep({
  selectedSlugs,
  onToggleTeam,
  onTeamCreated,
  onBack,
  onNext,
}: TeamsStepProps): JSX.Element {
  const teams = useTeamsStore((state) => state.teams);
  const addTeam = useTeamsStore((state) => state.addTeam);
  const [query, setQuery] = useState('');
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(query.toLowerCase())
  );

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Checkbox
            label={team.name}
            defaultChecked={selectedSlugs.includes(team.slug)}
            onChange={() => onToggleTeam(team.slug)}
          />
          <div
            style={{
              width: '1rem',
              height: '1rem',
              border: '2px solid var(--color-fg)',
              background: team.colour || 'transparent',
            }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
        <Input
          label="Search teams"
          placeholder="Search teams…"
          onChange={setQuery}
        />
        <Button variant="secondary" onClick={() => setShowCreateTeam(true)}>
          + Create new team
        </Button>
      </div>

      <Table columns={columns} rows={filteredTeams} rowKey={(team) => team.slug} />

      <span style={{ fontSize: '0.8125rem', color: 'var(--color-fg-muted)' }}>
        {selectedSlugs.length} teams selected
      </span>

      {showCreateTeam && (
        <TeamForm
          title="New team"
          saveLabel="Create team"
          onCancel={() => setShowCreateTeam(false)}
          onSave={handleTeamCreated}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={selectedSlugs.length === 0}>
          Next: Review →
        </Button>
      </div>
    </div>
  );
}
TeamsStep.displayName = 'TeamsStep';
