import { useEffect } from 'preact/hooks';
import { clearStatusLine } from '@/app/state/statusLineActions';
import { useStatusLineStore } from '@/app/state/statusLineStore';

/** How long a save/load result stays in the status line. */
export const STATUS_VISIBLE_MS = 4000;

/** Clears the status line `STATUS_VISIBLE_MS` after each new status. A new
 * status restarts the timer. It watches the store through `subscribe`, not
 * a selector, so the component that calls it does not render again on a
 * status change (Task 46). Call it from a component that stays mounted for
 * the whole session, such as `AppShell`. */
export function useStatusAutoClear(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A status set before the first render gets its timer too.
    if (useStatusLineStore.getState().status)
      timer = setTimeout(clearStatusLine, STATUS_VISIBLE_MS);
    const unsubscribe = useStatusLineStore.subscribe((state, previous) => {
      if (state.status === previous.status) return;
      clearTimeout(timer);
      if (state.status) timer = setTimeout(clearStatusLine, STATUS_VISIBLE_MS);
    });
    return (): void => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
}
