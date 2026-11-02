import { useState } from 'preact/hooks';
import { findPhaseCurrentMatchday } from '@/engine/round-robin';
import type FixturesViewProps from './types';
import type { MatchdayNav } from './types';
import { getShownPhase } from './helpers';

/** The visible matchday and the header's jump buttons. The matchday is
 * local state, seeded from `initialMatchday`, and each change goes to
 * `onMatchdayChange` too. See `FixturesViewProps`. */
export function useMatchdayNav({
  league,
  phaseIndex,
  initialMatchday = 1,
  onMatchdayChange,
}: FixturesViewProps): MatchdayNav {
  const [matchday, setMatchday] = useState(initialMatchday);
  const phase = getShownPhase(league, phaseIndex);

  const goTo = (next: number): void => {
    setMatchday(next);
    onMatchdayChange?.(next);
  };

  const totalMatchdays = Math.max(
    0,
    ...phase.fixtures.map((fixture) => fixture.matchday),
    ...phase.byes.map((bye) => bye.matchday)
  );
  // `undefined` means every match has a result: the league is completed.
  const currentMatchday = findPhaseCurrentMatchday(phase.fixtures, phase.results);

  return {
    matchday,
    totalMatchdays,
    canGoBack: matchday > 1,
    canGoForward: matchday < totalMatchdays,
    leagueCompleted: currentMatchday === undefined,
    atCurrentMatchday: matchday === currentMatchday,
    goToFirst: () => goTo(1),
    goToPrevious: () => goTo(matchday - 1),
    goToNext: () => goTo(matchday + 1),
    goToLast: () => goTo(totalMatchdays),
    goToCurrent: (): void => {
      if (currentMatchday !== undefined) goTo(currentMatchday);
    },
  };
}
