import { useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import type { FieldHandle } from '@/design-system/field';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/Input';
import { Modal } from '@/design-system/components/Modal';
import type PickerDialogProps from './types';
import type {
  MultiPickerProps,
  PickerAction,
  PickerItem,
  SinglePickerProps,
} from './types';
import styles from './PickerDialog.module.css';

export type {
  MultiPickerProps,
  PickerAction,
  PickerDialogProps,
  PickerItem,
  SinglePickerProps,
};

const SINGLE_HINT =
  'Pick a replacement from Available — this closes the dialog right away.';

/** True when the search text of the item holds the query, with no regard to
 * case. An empty query matches every item. */
function matches(item: PickerItem, query: string): boolean {
  const text = (item.searchText ?? item.label).toLowerCase();
  return text.includes(query.trim().toLowerCase());
}

/**
 * The picker of the handoff "Add teams" dialog (Task 113): a search field,
 * then "Available" on the left and the picked items on the right, in a `lg`
 * `Modal`. In multi mode (US-08.1) a click moves an item to "Selected (N)",
 * and a confirm ends the pick. In single mode (US-08.5) the right side
 * shows "Currently in slot", and one click picks the replacement.
 *
 * A row is a button with no checkbox, as in the handoff (choice 1). The
 * caller mounts the dialog to open it, as `Modal`.
 */
export function PickerDialog(props: PickerDialogProps): JSX.Element {
  const { title, description, items, availableAction, onCancel } = props;
  const [query, setQuery] = useState('');
  const searchRef = useRef<FieldHandle<string>>(null);

  const selected = props.mode === 'multi' ? props.selected : [];
  const available = items.filter(
    (item) => !selected.includes(item.id) && matches(item, query)
  );
  const pick = (id: string): void => {
    if (props.mode === 'multi') props.onSelectedChange([...props.selected, id]);
    else props.onPick(id);
  };

  return (
    <Modal
      title={title}
      description={description}
      size="lg"
      showClose
      initialFocus={searchRef}
      onClose={onCancel}
    >
      <div class={styles.body}>
        <Input
          ref={searchRef}
          aria-label="Search"
          placeholder="Search by name…"
          onChange={setQuery}
        />
        <div class={styles.panels}>
          <AvailablePanel
            items={available}
            query={query}
            action={availableAction}
            onPick={pick}
          />
          {props.mode === 'multi' ? (
            <SelectedPanel {...props} />
          ) : (
            <CurrentPanel {...props} />
          )}
        </div>
        {props.mode === 'multi' ? (
          <div class={styles.actions}>
            <Button variant="secondary" size="md" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="md"
              disabled={props.selected.length === 0}
              onClick={props.onConfirm}
            >
              {props.confirmLabel}
            </Button>
          </div>
        ) : (
          <p class={styles.hint}>{SINGLE_HINT}</p>
        )}
      </div>
    </Modal>
  );
}
PickerDialog.displayName = 'PickerDialog';

function AvailablePanel({
  items,
  query,
  action,
  onPick,
}: {
  items: readonly PickerItem[];
  query: string;
  action?: PickerAction;
  onPick: (id: string) => void;
}): JSX.Element {
  return (
    <section class={styles.panel} aria-label="Available">
      <h3 class={styles.panelTitle} aria-hidden="true">
        Available
      </h3>
      <ul class={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              class={styles.pick}
              aria-label={item.label}
              onClick={() => onPick(item.id)}
            >
              {item.content ?? item.label}
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 && query.trim() !== '' && (
        <p class={styles.empty}>No match.</p>
      )}
      {action && (
        <button type="button" class={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </section>
  );
}

function SelectedPanel({
  items,
  selected,
  onSelectedChange,
}: MultiPickerProps): JSX.Element {
  const byId = new Map(items.map((item) => [item.id, item]));
  const picked = selected.flatMap((id) => byId.get(id) ?? []);
  const label = `Selected (${picked.length})`;
  return (
    <section class={styles.panel} aria-label={label}>
      <h3 class={styles.panelTitle} aria-hidden="true">
        {label}
      </h3>
      <ul class={styles.list}>
        {picked.map((item) => (
          <li key={item.id} class={styles.row}>
            <span class={styles.rowContent}>{item.content ?? item.label}</span>
            <button
              type="button"
              class={styles.remove}
              aria-label={`Remove ${item.label}`}
              onClick={() => onSelectedChange(selected.filter((id) => id !== item.id))}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CurrentPanel({ current }: SinglePickerProps): JSX.Element {
  return (
    <section class={styles.panel} aria-label="Currently in slot">
      <h3 class={styles.panelTitle} aria-hidden="true">
        Currently in slot
      </h3>
      <ul class={styles.list}>
        {current && (
          <li class={styles.row}>
            <span class={styles.rowContent}>{current.content ?? current.label}</span>
          </li>
        )}
      </ul>
    </section>
  );
}
