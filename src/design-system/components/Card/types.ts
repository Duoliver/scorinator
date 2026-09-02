import type { ComponentChildren } from 'preact';

export type CardPadding = 'sm' | 'md' | 'lg';

export default interface CardProps {
  children: ComponentChildren;
  padding?: CardPadding;
}
