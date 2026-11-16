import type { ComponentChildren } from 'preact';
import type { PopupAlign } from '@/design-system/placement';

export default interface PopoverProps {
  /** The name of the trigger, for a screen reader, such as "Condition of Porto Velho SC: Level +1". */
  label: string;
  /** The glyph of the square trigger button, such as "↗". */
  icon: string;
  /** The name of the panel, such as "Condition of Porto Velho SC". */
  panelLabel: string;
  /** The part of the trigger that the panel lines up with. The default is
   * `center`, as the condition overlay of the Task 223 demo. */
  align?: PopupAlign;
  /** The panel content. `close` closes the panel and puts the focus back on
   * the trigger, for example after a pick. */
  children: (close: () => void) => ComponentChildren;
}
