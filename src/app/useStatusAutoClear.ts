import { useEffect } from 'preact/hooks';
import { clearFileStatus } from '@/app/state/fileActions';
import { useFileStore } from '@/app/state/fileStore';

/** How long a save/load result stays in the status line. */
export const STATUS_VISIBLE_MS = 4000;

/** Clears the status line `STATUS_VISIBLE_MS` after each new status. A new
 * status restarts the timer. It watches the store through `subscribe`, not
 * a selector, so the component that calls it does not render again on a
 * status change (Task 46). `AppShell` calls it, since it stays mounted for
 * the whole session. */
export function useStatusAutoClear(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A status set before the first render gets its timer too.
    if (useFileStore.getState().status)
      timer = setTimeout(clearFileStatus, STATUS_VISIBLE_MS);
    const unsubscribe = useFileStore.subscribe((state, previous) => {
      if (state.status === previous.status) return;
      clearTimeout(timer);
      if (state.status) timer = setTimeout(clearFileStatus, STATUS_VISIBLE_MS);
    });
    return (): void => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
}
