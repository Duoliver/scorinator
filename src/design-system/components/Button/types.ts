import type { ComponentChildren, TargetedMouseEvent } from 'preact';

/** `destructive-outline` is the quiet red button: red text and border, no
 * shadow, for a rare action that asks first, as "Delete team" (Task 167). */
export type ButtonVariant =
  'primary' | 'secondary' | 'destructive' | 'destructive-outline' | 'ghost' | 'outline';
/** `icon` is a square button with a glyph and no visible text (Task 111), as
 * the handoff row buttons ✎, ⇄, and ✕. */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonBaseProps {
  children: ComponentChildren;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** With `disabled`, the button stays a Tab stop and gets hover, marked
   * `aria-disabled`, and a click does nothing. A `Tooltip` on it then still
   * shows, for example the reason it is off (Task 111, US-09.5). */
  focusableWhenDisabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** Renders as an `<a href>` instead of a `<button>`, sharing the same
   * variant/size CSS — for an action that is really a link to another
   * screen (see `AppShell`'s own nav links) rather than an in-place
   * action. `disabled` has no effect in this mode: an `<a>` has no native
   * disabled state, and no current caller needs one. */
  href?: string;
  /** The id of the element that describes the button, for example a
   * `Tooltip` (Task 111). */
  'aria-describedby'?: string;
  onClick?: (event: TargetedMouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}

/** A button with visible text. `aria-label` replaces that text for
 * assistive technology, for a symbol such as `«`, so it names the action in
 * full. */
interface TextButtonProps extends ButtonBaseProps {
  size?: Exclude<ButtonSize, 'icon'>;
  'aria-label'?: string;
  fieldHeight?: never;
}

/** An icon button has no visible text, so it must have an `aria-label`. */
interface IconButtonProps extends ButtonBaseProps {
  size: 'icon';
  'aria-label': string;
  /** Makes the square as tall as an `Input` (`--field-height`), for a
   * button next to a field, as the slug regenerate (Task 167). */
  fieldHeight?: boolean;
}

type ButtonProps = TextButtonProps | IconButtonProps;
export default ButtonProps;
