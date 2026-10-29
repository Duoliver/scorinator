import type { JSX, TargetedMouseEvent } from 'preact';
import type ButtonProps from './types';
import type { ButtonVariant, ButtonSize } from './types';
import styles from './Button.module.css';

export type { ButtonProps, ButtonVariant, ButtonSize };

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  focusableWhenDisabled = false,
  type = 'button',
  href,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  onClick,
}: ButtonProps): JSX.Element {
  const className = `${styles.button} ${styles[variant]} ${styles[size]}`;

  if (href) {
    return (
      <a
        href={href}
        class={className}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  // A disabled button that stays focusable keeps no native `disabled`, so
  // the click is dropped here instead.
  const softDisabled = disabled && focusableWhenDisabled;
  const handleClick = (
    event: TargetedMouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ): void => {
    if (softDisabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      disabled={disabled && !focusableWhenDisabled}
      aria-disabled={softDisabled ? 'true' : undefined}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onClick={handleClick}
      class={className}
    >
      {children}
    </button>
  );
}
