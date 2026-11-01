import type { JSX, TargetedDragEvent } from 'preact';
import { DropdownMenu, type DropdownMenuItem } from '@/design-system';
import { groupLabel } from '@/engine/round-robin';
import { TeamSwatch } from '@/features/components';
import { TeamLabel } from '@/features/leagues/LeagueSetupScreen/steps/TeamLabel';
import type GroupCardsProps from './types';
import styles from './GroupCards.module.css';

export type { GroupCardsProps };

/** The drag data type of a team row: its Blueprint UUID. */
const DRAG_TYPE = 'text/plain';

/**
 * The phase-1 draw of the Teams step (Task 130, US-02.4, US-02.5): one card
 * for each group, in a row that wraps. Each team row has ⠿, its swatch, its
 * name with the Location hint, and a ⋮ menu: Edit, Switch, one "Move to
 * Group X" item for each other group, and Remove. A drag of a row onto
 * another card moves the team. The menu is the keyboard way.
 */
export function GroupCards({
  groups,
  teams,
  locationOf,
  onEdit,
  onSwitch,
  onRemove,
  onMove,
}: GroupCardsProps): JSX.Element {
  const teamOf = new Map(teams.map((team) => [team.blueprintUuid, team]));

  const menuItems = (uuid: string, groupIndex: number): DropdownMenuItem[] => [
    { label: 'Edit', icon: '✎', onSelect: () => onEdit(uuid) },
    { label: 'Switch', icon: '⇄', onSelect: () => onSwitch(uuid) },
    ...groups.flatMap((_, other) =>
      other === groupIndex
        ? []
        : [
            {
              label: `Move to Group ${groupLabel(other)}`,
              onSelect: () => onMove(uuid, other),
            },
          ]
    ),
    { label: 'Remove', icon: '✕', tone: 'danger', onSelect: () => onRemove(uuid) },
  ];

  const handleDrop = (
    event: TargetedDragEvent<HTMLElement>,
    groupIndex: number
  ): void => {
    event.preventDefault();
    const uuid = event.dataTransfer?.getData(DRAG_TYPE);
    if (!uuid || groups[groupIndex]?.includes(uuid)) return;
    onMove(uuid, groupIndex);
  };

  return (
    <div class={styles.cards}>
      {groups.map((group, groupIndex) => {
        const name = `Group ${groupLabel(groupIndex)}`;
        return (
          <section
            key={name}
            aria-label={name}
            class={styles.card}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, groupIndex)}
          >
            <h4 class={styles.name}>{name}</h4>
            <ul class={styles.rows}>
              {group.map((uuid) => {
                const team = teamOf.get(uuid);
                if (!team) return null;
                return (
                  <li
                    key={uuid}
                    class={styles.row}
                    draggable
                    onDragStart={(event) =>
                      event.dataTransfer?.setData(DRAG_TYPE, uuid)
                    }
                  >
                    <span class={styles.handle} aria-hidden="true">
                      ⠿
                    </span>
                    <TeamSwatch colour={team.colour} />
                    <span class={styles.label}>
                      <TeamLabel name={team.name} location={locationOf(uuid)} />
                    </span>
                    <DropdownMenu
                      label={`Options for ${team.name}`}
                      icon="⋮"
                      items={menuItems(uuid, groupIndex)}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
GroupCards.displayName = 'GroupCards';
