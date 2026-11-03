import type { JSX, TargetedDragEvent } from 'preact';
import { DropdownMenu, type DropdownMenuItem } from '@/design-system';
import { groupLabel } from '@/engine/round-robin';
import { TeamSwatch } from '@/features/components';
import { TeamLabel } from '@/features/leagues/TeamLabel';
import type GroupCardsProps from './types';
import styles from './GroupCards.module.css';

export type { GroupCardsProps };

/** The drag data type of a team row: its Blueprint UUID. */
const DRAG_TYPE = 'text/plain';

/**
 * A draw that the user can change (US-02.4, US-02.5): the phase-1 draw of
 * the Teams step (Task 130), or a later Groups draw in League Detail (Task
 * 181). One card for each group, in a row that wraps. Each team row has ⠿,
 * its swatch, its name with the Location hint, and a ⋮ menu: Edit, Switch,
 * one "Move to Group X" item for each other group, and Remove, each when
 * its handler is given. A drag of a row onto another card moves the team.
 * With `onSwap`, the menu also has one "Swap with {team}" item for each
 * team of the other groups, and a drop onto a team row of another group
 * swaps the two teams (Task 183). The menu is the keyboard way.
 */
export function GroupCards({
  groups,
  teams,
  locationOf,
  onEdit,
  onSwitch,
  onRemove,
  onMove,
  onSwap,
  keepTwoPerGroup,
}: GroupCardsProps): JSX.Element {
  const teamOf = new Map(teams.map((team) => [team.blueprintUuid, team]));
  // A move out of a group of 2 would leave 1 team (Task 181 choice 4).
  const isStuck = (groupIndex: number): boolean =>
    Boolean(keepTwoPerGroup) && (groups[groupIndex]?.length ?? 0) <= 2;

  const menuItems = (uuid: string, groupIndex: number): DropdownMenuItem[] => {
    const items: DropdownMenuItem[] = [];
    if (onEdit) items.push({ label: 'Edit', icon: '✎', onSelect: () => onEdit(uuid) });
    if (onSwitch) {
      items.push({ label: 'Switch', icon: '⇄', onSelect: () => onSwitch(uuid) });
    }
    groups.forEach((_, other) => {
      if (other === groupIndex) return;
      items.push({
        label: `Move to Group ${groupLabel(other)}`,
        disabled: isStuck(groupIndex),
        onSelect: () => onMove(uuid, other),
      });
    });
    if (onSwap) {
      groups.forEach((members, other) => {
        if (other === groupIndex) return;
        for (const member of members) {
          items.push({
            label: `Swap with ${teamOf.get(member)?.name ?? member}`,
            onSelect: () => onSwap(uuid, member),
          });
        }
      });
    }
    if (onRemove) {
      items.push({
        label: 'Remove',
        icon: '✕',
        tone: 'danger',
        onSelect: () => onRemove(uuid),
      });
    }
    return items;
  };

  const handleDrop = (
    event: TargetedDragEvent<HTMLElement>,
    groupIndex: number
  ): void => {
    event.preventDefault();
    const uuid = event.dataTransfer?.getData(DRAG_TYPE);
    if (!uuid || groups[groupIndex]?.includes(uuid)) return;
    const from = groups.findIndex((group) => group.includes(uuid));
    if (from < 0 || isStuck(from)) return;
    onMove(uuid, groupIndex);
  };

  // A drop onto a team row of another group swaps the two teams. It stops
  // here, so the card does not also take the drop as a move.
  const handleRowDrop = (
    event: TargetedDragEvent<HTMLElement>,
    target: string,
    groupIndex: number
  ): void => {
    if (!onSwap) return;
    event.preventDefault();
    event.stopPropagation();
    const uuid = event.dataTransfer?.getData(DRAG_TYPE);
    if (!uuid || groups[groupIndex]?.includes(uuid)) return;
    if (!groups.some((group) => group.includes(uuid))) return;
    onSwap(uuid, target);
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
                    onDrop={(event) => handleRowDrop(event, uuid, groupIndex)}
                  >
                    <span class={styles.handle} aria-hidden="true">
                      ⠿
                    </span>
                    <TeamSwatch colour={team.colour} />
                    <span class={styles.label}>
                      <TeamLabel name={team.name} location={locationOf?.(uuid) ?? ''} />
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
