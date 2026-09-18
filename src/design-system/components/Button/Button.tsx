import type { JSX } from 'preact';
import type ButtonProps from './types';
import type { ButtonVariant, ButtonSize } from './types';
import styles from './Button.module.css';

export type { ButtonProps, ButtonVariant, ButtonSize };

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  href,
  'aria-label': ariaLabel,
  onClick,
}: ButtonProps): JSX.Element {
  const className = `${styles.button} ${styles[variant]} ${styles[size]}`;

  if (href) {
    return (
      <a href={href} class={className} aria-label={ariaLabel} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      class={className}
    >
      {children}
    </button>
  );
}
