import type { ComponentChildren } from 'preact';

export default interface TooltipProps {
  /** The hint: text, or richer content such as a swatch and a trigram. */
  content: ComponentChildren;
  /** A dotted underline and the help cursor on a text trigger, for a short
   * table header (US-12.3). */
  underline?: boolean;
  /** Off by default: the hint stays while the pointer moves onto it (WCAG
   * 1.4.13). On: the pointer goes through the hint to the item under it,
   * and the hint hides at once when the pointer leaves the trigger. Turn it
   * on when the hint repeats a name the trigger already has, and covers
   * items the user clicks next, as the swatches (Task 114). */
  notHoverable?: boolean;
  /** A text trigger, which becomes a Tab stop. Or a render function for an
   * interactive trigger, such as a button, that already takes focus: it gets
   * the tooltip id to pass as `aria-describedby`. */
  children: ComponentChildren | ((describedBy: string) => ComponentChildren);
}
