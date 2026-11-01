import type { ComponentChildren } from 'preact';

/** One item to pick. The dialog knows nothing about what it is (Task 113,
 * choice 3): the caller gives the content to render. */
export interface PickerItem {
  id: string;
  /** The accessible name of the item, and its content when it has none. */
  label: string;
  /** The text that the search matches, for example a name and a Location.
   * The label when it has none. */
  searchText?: string;
  content?: ComponentChildren;
}

/** A button under the "Available" list, for example "+ Create new team". */
export interface PickerAction {
  label: string;
  onClick: () => void;
}

interface PickerDialogBase {
  title: string;
  description?: string;
  /** The items the user can pick, in list order. */
  items: readonly PickerItem[];
  availableAction?: PickerAction;
  /** Called on Escape, the ✕, a backdrop click, and "Cancel". */
  onCancel: () => void;
}

/** Many items, then a confirm (US-08.1). The caller holds the selection
 * (choice 2), so it can add an item that it creates while the dialog is
 * open. */
export interface MultiPickerProps extends PickerDialogBase {
  mode: 'multi';
  /** The selected ids, in the order of selection. */
  selected: readonly string[];
  onSelectedChange: (ids: string[]) => void;
  confirmLabel: string;
  onConfirm: () => void;
}

/** One replacement for the current item (US-08.5). A pick does not close
 * the dialog itself: the caller unmounts it. */
export interface SinglePickerProps extends PickerDialogBase {
  mode: 'single';
  /** The item in the slot now, shown under "Currently in slot". */
  current?: PickerItem;
  onPick: (id: string) => void;
}

type PickerDialogProps = MultiPickerProps | SinglePickerProps;
export default PickerDialogProps;
