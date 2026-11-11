import type { StatusLineMessage } from '@/app/state/statusLineStore';
import type { StatusLinePlacement } from './types';
import styles from './StatusLine.module.css';

export const statusClassName = (
  status: StatusLineMessage,
  placement: StatusLinePlacement
): string =>
  [styles.status, styles[placement], status.tone === 'error' ? styles.error : '']
    .filter(Boolean)
    .join(' ');
