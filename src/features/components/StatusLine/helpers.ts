import type { FileStatus } from '@/app/state/fileStore';
import type { StatusLinePlacement } from './types';
import styles from './StatusLine.module.css';

export const statusClassName = (
  status: FileStatus,
  placement: StatusLinePlacement
): string =>
  [styles.status, styles[placement], status.tone === 'error' ? styles.error : '']
    .filter(Boolean)
    .join(' ');
