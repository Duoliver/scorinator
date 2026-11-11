/** `danger` shows the item in the error colour, as the handoff ✕ Remove. */
export type DropdownMenuTone = 'default' | 'danger';

/** The edge of the trigger that the menu lines up with. `end` is the
 * handoff `right: 0`. */
export type DropdownMenuAlign = 'start' | 'end';

export interface DropdownMenuItem {
  label: string;
  /** A glyph in a fixed column before the label, as ✎ or ⇄. */
  icon?: string;
  tone?: DropdownMenuTone;
  /** A disabled item stays in the list, gets no focus, and does nothing. */
  disabled?: boolean;
  onSelect: () => void;
}

export default interface DropdownMenuProps {
  /** The visible trigger text, or its `aria-label` when it has an `icon`. */
  label: string;
  /** Makes the trigger a square icon button with this glyph, as `⋮`. */
  icon?: string;
  /** Off by default. On: the icon trigger is the smaller `icon-sm` square,
   * as the handoff ⋮ of a group row (Task 178). No effect without `icon`. */
  compact?: boolean;
  items: DropdownMenuItem[];
  align?: DropdownMenuAlign;
}
