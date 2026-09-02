import type CardProps from './types';
import type { CardPadding } from './types';
import styles from './Card.module.css';

export type { CardProps, CardPadding };

export function Card({ children, padding = 'md' }: CardProps) {
  return <div class={`${styles.card} ${styles[padding]}`}>{children}</div>;
}
