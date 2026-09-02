import type { ComponentChildren } from 'preact';
import styles from './Badge.module.css';

export type BadgeTone = 'dark' | 'accent' | 'neutral' | 'error' | 'warning';

export interface BadgeProps {
  children: ComponentChildren;
  tone?: BadgeTone;
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span class={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
