import type { ComponentChildren } from 'preact';
import styles from './Card.module.css';

export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps {
  children: ComponentChildren;
  padding?: CardPadding;
}

export function Card({ children, padding = 'md' }: CardProps) {
  return <div class={`${styles.card} ${styles[padding]}`}>{children}</div>;
}
