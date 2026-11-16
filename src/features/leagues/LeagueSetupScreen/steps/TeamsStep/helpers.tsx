import type { JSX } from 'preact';
import {
  Badge,
  Button,
  Tooltip,
  type PickerItem,
  type TableColumn,
} from '@/design-system';
import type { SeasonWrapper, TeamBlueprint, TeamInstance } from '@/domain';
import type { TrigramPick } from '@/engine/identity';
import { TeamLabel, TeamSwatch } from '@/features/components';
import {
  formatSeasonTeamStatus,
  NOT_IN_SEASON,
} from '@/features/leagues/LeagueSetupScreen/seasonTeams';
import type { ConditionLevel } from '@/engine/tier-ovr';
import { ConditionPicker } from './ConditionPicker';
import styles from './TeamsStep.module.css';

export const getRowKey = (team: TeamInstance): string => team.blueprintUuid;

/** The condition button of one team (US-14.2). */
export function renderConditionPicker(
  teamName: string,
  level: ConditionLevel,
  onChange: (level: ConditionLevel) => void
): JSX.Element {
  return <ConditionPicker teamName={teamName} level={level} onChange={onChange} />;
}

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
 * trigram (Task 121), Tier, the condition (US-14.2), ✎ Edit (Task 172), ⇄
 * Switch, and ✕ Remove. No OVR: the Edit drawer shows it (Task 120). */
export const getTeamsStepColumns = (
  locationOf: (blueprintUuid: string) => string,
  pickOf: (blueprintUuid: string) => TrigramPick | undefined,
  onEdit: (blueprintUuid: string) => void,
  onSwitch: (blueprintUuid: string) => void,
  onRemove: (blueprintUuid: string) => void,
  renderCondition: (team: TeamInstance) => JSX.Element,
  badgeOf: (blueprintUuid: string) => string | undefined = () => undefined
): TableColumn<TeamInstance>[] => [
  {
    key: 'team',
    header: 'Team',
    render: (team): JSX.Element => {
      const badge = badgeOf(team.blueprintUuid);
      return (
        <div class={styles.teamCell}>
          <TeamSwatch colour={team.colour} />
          <TeamLabel name={team.name} location={locationOf(team.blueprintUuid)} />
          {badge && <Badge tone="warning">{badge}</Badge>}
        </div>
      );
    },
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
    key: 'condition',
    header: 'Condition',
    width: '6rem',
    render: renderCondition,
  },
  {
    key: 'actions',
    header: '',
    width: '8rem',
    align: 'right',
    render: (team) => (
      <span class={styles.rowActions}>
        <Button
          size="icon"
          variant="secondary"
          aria-label={`Edit ${team.name}`}
          onClick={() => onEdit(team.blueprintUuid)}
        >
          ✎
        </Button>
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

/** The search placeholder of the add and the Switch dialogs. The search
 * matches the name or the Location (US-08.1, Task 165). */
export const TEAM_SEARCH_PLACEHOLDER = 'Search by name or location…';

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

/** One row of the dialogs of a wizard in a Season: swatch, name over
 * Location, the Season status, and the Tier (Task 215 point 6). */
function SeasonPickRow({
  colour,
  name,
  location,
  status,
  tier,
}: {
  colour: string;
  name: string;
  location: string;
  status: string;
  tier: string;
}): JSX.Element {
  return (
    <span class={`${styles.teamCell} ${styles.pickRow}`}>
      <TeamSwatch colour={colour} />
      <TeamLabel name={name} location={location} />
      <span class={styles.pickStatus}>{status}</span>
      <Badge tone="dark">{tier}</Badge>
    </span>
  );
}

/**
 * The items of the "Add teams" and Switch dialogs in a Season (Task 218
 * choice 5): the Season teams first, tinted, with where they play, then
 * the other Blueprints with "Not in the Season". A team of the list is not
 * an item. A Season team whose Blueprint was deleted cannot be added again,
 * so it is not an item either.
 */
export function getSeasonPickerItems(
  season: SeasonWrapper,
  blueprints: readonly TeamBlueprint[],
  inList: ReadonlySet<string>
): PickerItem[] {
  const byUuid = new Map(blueprints.map((b) => [b.uuid, b]));
  const inRoster = new Set(season.teams.map((team) => team.blueprintUuid));
  const seasonItems = season.teams.flatMap((team): PickerItem[] => {
    const blueprint = byUuid.get(team.blueprintUuid);
    if (!blueprint || inList.has(team.blueprintUuid)) return [];
    const leagueCount = season.content.leagues.filter((league) =>
      league.teamUuids.includes(team.blueprintUuid)
    ).length;
    return [
      {
        id: team.blueprintUuid,
        label: team.name,
        searchText: `${team.name} ${blueprint.location}`,
        group: SEASON_TEAMS,
        highlight: true,
        content: (
          <SeasonPickRow
            colour={team.colour}
            name={team.name}
            location={blueprint.location}
            status={formatSeasonTeamStatus(leagueCount)}
            tier={team.tier}
          />
        ),
      },
    ];
  });
  const otherItems = blueprints
    .filter((b) => !inRoster.has(b.uuid) && !inList.has(b.uuid))
    .map((b): PickerItem => ({
      id: b.uuid,
      label: b.name,
      searchText: `${b.name} ${b.location}`,
      group: OTHER_TEAMS,
      content: (
        <SeasonPickRow
          colour={b.colour}
          name={b.name}
          location={b.location}
          status={NOT_IN_SEASON}
          tier={b.tier}
        />
      ),
    }));
  return [...seasonItems, ...otherItems];
}

export const SEASON_TEAMS = 'Season teams';
export const OTHER_TEAMS = 'Other teams';

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

/** The slug list lines with a level that is not valid (US-14.4, Task 229
 * choice 4), as the notice says them. */
export function describeBadLevels(
  lines: readonly { line: number; text: string }[]
): string {
  const noun = lines.length === 1 ? 'level' : 'levels';
  const list = lines.map(({ line, text }) => `line ${line} "${text}"`).join(', ');
  return `${lines.length} ${noun} not valid, set to 0: ${list}`;
}

export const NO_SLUGS = 'The file has no slugs.';
