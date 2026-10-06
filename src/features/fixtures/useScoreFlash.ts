import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { LeagueResult } from '@/features/leagues/types';
import { SCORE_FLASH_MS, fixtureKey } from './helpers';
import type { MatchIdentity } from './types';

/** Tells which scores flash in the accent colour. A score flashes for
 * `SCORE_FLASH_MS` whenever it is generated, the first time or on a
 * re-scorinate. A generated score is a result object the previous render
 * did not hold (`scorinateFixture` adds one, `rescorinateFixture` replaces
 * one, and both leave every other result as the same object). So the flash
 * does not depend on the new score differing from the old, does not play for
 * results that exist when the view opens, and does not replay when the user
 * changes matchday. */
export function useScoreFlash(
  results: readonly LeagueResult[]
): (match: MatchIdentity) => boolean {
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(new Set());
  const seenResults = useRef(results);
  const flashTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useLayoutEffect(() => {
    const previous = new Set(seenResults.current);
    seenResults.current = results;
    const generated = results.filter((result) => !previous.has(result));
    if (generated.length === 0) return;

    const keys = generated.map(fixtureKey);
    setFlashing((current) => new Set([...current, ...keys]));
    for (const key of keys) {
      clearTimeout(flashTimers.current.get(key));
      flashTimers.current.set(
        key,
        setTimeout(() => {
          flashTimers.current.delete(key);
          setFlashing((current) => {
            const next = new Set(current);
            next.delete(key);
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

  return (match) => flashing.has(fixtureKey(match));
}
