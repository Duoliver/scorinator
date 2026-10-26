import type { TeamSwatchSize } from './types';
import styles from './TeamSwatch.module.css';

export const getTeamSwatchClassName = (
  size: TeamSwatchSize,
  extraClass: string | undefined
): string => [styles.swatch, styles[size], extraClass].filter(Boolean).join(' ');
