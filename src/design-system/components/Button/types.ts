import type { ComponentChildren, TargetedMouseEvent } from 'preact';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export default interface ButtonProps {
  children: ComponentChildren;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** Renders as an `<a href>` instead of a `<button>`, sharing the same
   * variant/size CSS — for an action that is really a link to another
   * screen (see `AppShell`'s own nav links) rather than an in-place
   * action. `disabled` has no effect in this mode: an `<a>` has no native
   * disabled state, and no current caller needs one. */
  href?: string;
  onClick?: (event: TargetedMouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}
