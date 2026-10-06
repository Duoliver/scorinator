import type { JSX } from 'preact';
import { useFileStore } from '@/app/state/fileStore';
import type StatusLineProps from './types';
import type { StatusLinePlacement } from './types';
import { statusClassName } from './helpers';

export type { StatusLineProps, StatusLinePlacement };

/** The one-line result of the latest save, load, import, or export, from
 * `fileStore`. It reads the status itself, so a status change renders only
 * this line, not the screen around it (Task 46). Renders nothing while
 * there is no status. `useStatusAutoClear` in `app/` clears it. */
export function StatusLine({ placement }: StatusLineProps): JSX.Element | null {
  const status = useFileStore((state) => state.status);
  if (!status) return null;
  return (
    <p role="status" class={statusClassName(status, placement)}>
      {status.message}
    </p>
  );
}
StatusLine.displayName = 'StatusLine';
