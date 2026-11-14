import { Badge, type PickerItem } from '@/design-system';
import type { SeasonWrapper, TeamBlueprint } from '@/domain';
import { pickJoinNames } from '@/engine/identity';
import { TeamLabel, TeamSwatch } from '@/features/components';
import styles from './SeasonViewScreen.module.css';

export const ADD_TEAMS_TEXT =
  'Each team gets its OVR rolled once, for the whole Season. A team cannot leave the Season.';

/** One Blueprint in the "Add teams" dialog. The search reads the name and
 * the Location, as the wizard does (US-15.6). */
export const toPickerItem = (blueprint: TeamBlueprint): PickerItem => ({
  id: blueprint.uuid,
  label: blueprint.name,
  searchText: `${blueprint.name} ${blueprint.location}`,
  content: (
    <span class={styles.pickRow}>
      <TeamSwatch colour={blueprint.colour} />
      <TeamLabel name={blueprint.name} location={blueprint.location} />
      <Badge tone="dark">{blueprint.tier}</Badge>
    </span>
  ),
});

/** The names of the leagues of the Season that a team plays in. */
export function findLeagueNames(
  season: SeasonWrapper,
  blueprintUuid: string
): string[] {
  return season.content.leagues
    .filter((league) => league.teamUuids.includes(blueprintUuid))
    .map((league) => league.name);
}

/**
 * The hint of the "Add teams" dialog: the new name of each picked team whose
 * name a Season team has (Task 213 choice 5). The roster keeps its names,
 * so the rule of Task 208 gives the name with no OVR roll. A clash between
 * two picked teams depends on the roll, so it gets no hint.
 */
export function formatJoinHints(
  rosterNames: readonly string[],
  picked: readonly TeamBlueprint[]
): string[] {
  return picked.flatMap((blueprint) => {
    const name = pickJoinNames(rosterNames, [
      {
        id: blueprint.uuid,
        name: blueprint.name,
        location: blueprint.location,
        ovr: 0,
        lot: 0,
      },
    ]).get(blueprint.uuid);
    if (name === undefined || name === blueprint.name) return [];
    const from =
      blueprint.location.trim() === '' ? '' : ` from ${blueprint.location.trim()}`;
    return [`"${blueprint.name}"${from} joins as "${name}".`];
  });
}
