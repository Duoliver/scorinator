import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { PhaseResult } from '@/domain';
import { SCORE_FLASH_MS } from './helpers';

/** Tells which scores flash in the accent colour, by fixture id. A score
 * flashes for `SCORE_FLASH_MS` whenever it is generated, the first time or
 * on a re-scorinate. A generated score is a result object the previous
 * render did not hold (`scorinateFixture` adds one, `rescorinateFixture`
 * replaces one, and both leave every other result as the same object). So
 * the flash does not depend on the new score differing from the old, does
 * not play for results that exist when the view opens, and does not replay
 * when the user changes matchday. */
export function useScoreFlash(
  results: readonly PhaseResult[]
): (fixtureId: string) => boolean {
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(new Set());
  const seenResults = useRef(results);
  const flashTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useLayoutEffect(() => {
    const previous = new Set(seenResults.current);
    seenResults.current = results;
    const generated = results.filter((result) => !previous.has(result));
    if (generated.length === 0) return;

    const ids = generated.map((result) => result.fixtureId);
    setFlashing((current) => new Set([...current, ...ids]));
    for (const id of ids) {
      clearTimeout(flashTimers.current.get(id));
      flashTimers.current.set(
        id,
        setTimeout(() => {
          flashTimers.current.delete(id);
          setFlashing((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
        }, SCORE_FLASH_MS)
      );
    }
  }, [results]);

  useLayoutEffect(() => {
    const timers = flashTimers.current;
    return (): void => timers.forEach(clearTimeout);
  }, []);

  return (fixtureId) => flashing.has(fixtureId);
}
