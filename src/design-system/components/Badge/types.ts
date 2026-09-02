import type { ComponentChildren } from 'preact';

export type BadgeTone = 'dark' | 'accent' | 'neutral' | 'error' | 'warning';

export default interface BadgeProps {
  children: ComponentChildren;
  tone?: BadgeTone;
}
