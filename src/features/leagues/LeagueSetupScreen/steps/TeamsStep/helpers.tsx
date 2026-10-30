import type { JSX } from 'preact';
import {
  Badge,
  Button,
  Tooltip,
  type PickerItem,
  type TableColumn,
} from '@/design-system';
import type { TeamBlueprint, TeamInstance } from '@/domain';
import type { TrigramPick } from '@/engine/identity';
import { TeamSwatch } from '@/features/components';
import { TeamLabel } from '@/features/leagues/LeagueSetupScreen/steps/TeamLabel';
import styles from './TeamsStep.module.css';

export const getRowKey = (team: TeamInstance): string => team.blueprintUuid;

export const FALLBACK_HINT = 'No free trigram. Add an alternative to the team.';

/** The trigram a team gets, in the mono font, and a ⚠ with the hint for a
 * digit fallback (US-09.6). */
function TrigramCell({ pick }: { pick: TrigramPick | undefined }): JSX.Element {
  return (
    <span class={styles.trigramCell}>
      <span class={styles.trigram}>{pick?.trigram ?? ''}</span>
      {pick?.fallback && (
        <span class={styles.fallback}>
          <Tooltip content={FALLBACK_HINT}>⚠</Tooltip>
        </span>
      )}
    </span>
  );
}

/** The team list columns (US-08.1): swatch, name with Location, the live
 * trigram (Task 121), Tier, ⇄ Switch, and ✕ Remove. No OVR: the Edit drawer
 * shows it (Task 120). Task 172 adds ✎. */
export const getTeamsStepColumns = (
  locationOf: (blueprintUuid: string) => string,
  pickOf: (blueprintUuid: string) => TrigramPick | undefined,
  onSwitch: (blueprintUuid: string) => void,
  onRemove: (blueprintUuid: string) => void
): TableColumn<TeamInstance>[] => [
  {
    key: 'team',
    header: 'Team',
    render: (team) => (
      <div class={styles.teamCell}>
        <TeamSwatch colour={team.colour} />
        <TeamLabel name={team.name} location={locationOf(team.blueprintUuid)} />
      </div>
    ),
  },
  {
    key: 'trigram',
    header: 'Trigram',
    width: '6rem',
    render: (team) => <TrigramCell pick={pickOf(team.blueprintUuid)} />,
  },
  {
    key: 'tier',
    header: 'Tier',
    width: '5rem',
    render: (team) => <Badge tone="dark">{team.tier}</Badge>,
  },
  {
    key: 'actions',
    header: '',
    width: '5.5rem',
    align: 'right',
    render: (team) => (
      <span class={styles.rowActions}>
        <Button
          size="icon"
          variant="secondary"
          aria-label={`Switch ${team.name}`}
          onClick={() => onSwitch(team.blueprintUuid)}
        >
          ⇄
        </Button>
        <Button
          size="icon"
          variant="secondary"
          aria-label={`Remove ${team.name}`}
          onClick={() => onRemove(team.blueprintUuid)}
        >
          ✕
        </Button>
      </span>
    ),
  },
];

/** One row of the add dialog: swatch, name over Location, and the Tier at
 * the row end. The search matches the name or the Location (US-08.1). */
export const toPickerItem = (blueprint: TeamBlueprint): PickerItem => ({
  id: blueprint.uuid,
  label: blueprint.name,
  searchText: `${blueprint.name} ${blueprint.location}`,
  content: (
    <span class={`${styles.teamCell} ${styles.pickRow}`}>
      <TeamSwatch colour={blueprint.colour} />
      <TeamLabel name={blueprint.name} location={blueprint.location} />
      <Badge tone="dark">{blueprint.tier}</Badge>
    </span>
  ),
});

/** The row of a team of the list in the "Currently in slot" panel of the
 * Switch dialog (US-08.5). */
export const toCurrentItem = (team: TeamInstance, location: string): PickerItem => ({
  id: team.blueprintUuid,
  label: team.name,
  content: (
    <span class={`${styles.teamCell} ${styles.pickRow}`}>
      <TeamSwatch colour={team.colour} />
      <TeamLabel name={team.name} location={location} />
      <Badge tone="dark">{team.tier}</Badge>
    </span>
  ),
});

const teams = (count: number): string => `${count} team${count === 1 ? '' : 's'}`;

/** The confirm of the add dialog: "Add 4 teams", or "Add teams" with no
 * selection, while the button is disabled. */
export const pickerConfirmLabel = (count: number): string =>
  count === 0 ? 'Add teams' : `Add ${teams(count)}`;

/** The message after a slug list import (US-08.7, Task 120 choice 6). */
export function describeSlugListImport(added: number, alreadyInList: number): string {
  const already = alreadyInList > 0 ? ` ${alreadyInList} already in the list.` : '';
  return `${teams(added)} added.${already}`;
}

/** The notice for the slugs that a slug list import did not find. */
export function describeNotFound(slugs: readonly string[]): string {
  const noun = slugs.length === 1 ? 'slug' : 'slugs';
  return `${slugs.length} ${noun} not found: ${slugs.join(', ')}`;
}

export const NO_SLUGS = 'The file has no slugs.';
