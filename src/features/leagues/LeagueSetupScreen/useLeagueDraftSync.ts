import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';
import { setLeagueDraft } from '@/app/state/leagueDraftActions';
import type { LeagueDraft } from '@/app/state/leagueDraftStore';
import type { DetailsStepHandle } from '@/features/leagues/steps/DetailsStep';

/** Writes the wizard's draft to `leagueDraftStore` when the screen
 * unmounts, so a nav switch does not lose it. See the cold-cache rule in
 * `docs/coding-standards.md`.
 *
 * Returns `skipDraftSync`. Call it right before a successful create resets
 * the store. `route(...)` then unmounts the screen, and Preact batches that
 * navigation with the create's own `setState` calls. So the screen can
 * unmount without a render with the new values, and `latestRef` still holds
 * the values from before the create. Without the skip, the unmount write
 * would put those stale values back into the store and undo the reset. */
export function useLeagueDraftSync(
  draft: LeagueDraft,
  detailsStepRef: RefObject<DetailsStepHandle>
): () => void {
  // Always holds the latest draft, for the unmount effect below. An empty
  // dependency array keeps that effect from registering again on each
  // change, so this ref is what keeps its closure from going stale.
  const latestRef = useRef(draft);
  latestRef.current = draft;
  const skipRef = useRef(false);

  useEffect(() => {
    // The refs are read for their value at the moment this cleanup runs
    // (a true unmount), not when the effect was registered.
    return (): void => {
      if (skipRef.current) return;
      // The Details fields are uncontrolled. When the screen unmounts on
      // the Details step, their values exist only in the fields.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- read on purpose at unmount, see above
      const fromFields = detailsStepRef.current?.getValues();
      setLeagueDraft({
        ...latestRef.current,
        details: fromFields ?? latestRef.current.details,
      });
    };
  }, [detailsStepRef]);

  return (): void => {
    skipRef.current = true;
  };
}
