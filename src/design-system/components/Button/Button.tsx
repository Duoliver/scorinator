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
  onClick,
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      class={`${styles.button} ${styles[variant]} ${styles[size]}`}
    >
      {children}
    </button>
  );
}
