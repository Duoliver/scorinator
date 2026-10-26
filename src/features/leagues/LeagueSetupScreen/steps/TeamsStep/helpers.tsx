import { Badge, Checkbox, type FieldHandle, type TableColumn } from '@/design-system';
import type { TeamRecord } from '@/domain';
import { TeamSwatch } from '@/features/components';
import styles from './TeamsStep.module.css';

export const filterTeamsByName = (
  teams: readonly TeamRecord[],
  query: string
): TeamRecord[] =>
  teams.filter((team) => team.name.toLowerCase().includes(query.toLowerCase()));

export const getRowKey = (team: TeamRecord): string => team.slug;

/** The checkboxes stay uncontrolled. `registerCheckbox` keeps a handle to
 * each one, so Select all and Clear selection can check or clear the
 * visible rows. */
export const getTeamsStepColumns = (
  selectedSlugs: readonly string[],
  onToggleTeam: (slug: string) => void,
  registerCheckbox: (slug: string) => (handle: FieldHandle<boolean> | null) => void
): TableColumn<TeamRecord>[] => [
  {
    key: 'team',
    header: 'Team',
    render: (team) => (
      <div class={styles.teamCell}>
        <Checkbox
          label={team.name}
          defaultChecked={selectedSlugs.includes(team.slug)}
          onChange={() => onToggleTeam(team.slug)}
          ref={registerCheckbox(team.slug)}
        />
        <TeamSwatch colour={team.colour} />
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
