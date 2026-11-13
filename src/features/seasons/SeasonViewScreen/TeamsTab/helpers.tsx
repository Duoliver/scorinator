import { Button, type TableColumn } from '@/design-system';
import { TeamLabel, TeamSwatch } from '@/features/components';
import type { RosterRow } from './types';
import styles from './TeamsTab.module.css';

export const getRowKey = (row: RosterRow): string => row.team.blueprintUuid;

/** The roster columns of the M1 demo (point 7): the Tier and the OVR share
 * one outlined box, the Tier on black (Task 249). */
export const getRosterColumns = (
  isFinished: boolean,
  onEdit: (blueprintUuid: string) => void
): TableColumn<RosterRow>[] => [
  {
    key: 'team',
    header: 'Team',
    render: ({ team, location }) => (
      <div class={styles.teamCell}>
        <TeamSwatch colour={team.colour} />
        <TeamLabel name={team.name} location={location} inline />
      </div>
    ),
  },
  {
    key: 'trigram',
    header: 'Trigram',
    width: '5rem',
    render: ({ team }) => <span class={styles.mono}>{team.trigram}</span>,
  },
  {
    key: 'tierOvr',
    header: 'Tier · OVR',
    width: '6rem',
    render: ({ team }) => (
      <span class={styles.tierOvr} aria-label={`Tier ${team.tier}, OVR ${team.ovr}`}>
        <span class={styles.tier}>{team.tier}</span>
        <span class={styles.ovr}>{team.ovr}</span>
      </span>
    ),
  },
  {
    key: 'leagues',
    header: 'Leagues',
    render: ({ leagueNames }) =>
      leagueNames.length === 0 ? (
        <span class={styles.muted}>Rests: in no league</span>
      ) : (
        leagueNames.join(', ')
      ),
  },
  {
    key: 'actions',
    header: '',
    width: '2.5rem',
    align: 'right',
    render: ({ team }) => (
      <Button
        size="icon"
        variant="secondary"
        aria-label={`Edit ${team.name}`}
        disabled={isFinished}
        onClick={() => onEdit(team.blueprintUuid)}
      >
        ✎
      </Button>
    ),
  },
];
