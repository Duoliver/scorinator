import { findPhaseResult, isPhaseMatchdayPlayed } from '@/engine/round-robin';
import { findCurrentPhase } from '@/app/state/currentPhase';
import {
  rescorinateFixture,
  scorinateFixture,
  scorinateMatchday,
} from '@/app/state/leagueWrapperActions';
import { useTeamLookup } from '@/features/components';
import type FixturesViewProps from './types';
import type { FixtureRow, Fixtures } from './types';
import { EMPTY_PHASE } from './helpers';
import { useMatchdayNav } from './useMatchdayNav';
import { useScoreFlash } from './useScoreFlash';

/** The matchday browser for the current phase of one league, ready for
 * `FixturesView` to render.
 *
 * Scorination (Task 15) plays an unplayed match, or a whole unplayed
 * matchday, with the `leagueWrapperActions` of Task 160, by fixture id. A
 * played match shows its real score, and its button turns into
 * Re-scorinate (Task 7 action, Task 19 UI), which draws a new score
 * and overwrites the old one with no confirm. MVP1 §1: a round-robin
 * match feeds nothing downstream. */
export function useFixtures(props: FixturesViewProps): Fixtures {
  const { league } = props;
  const phase = findCurrentPhase(league) ?? EMPTY_PHASE;
  const lookupTeam = useTeamLookup(league.teams);
  const nav = useMatchdayNav(props);
  const isFlashing = useScoreFlash(phase.results);
  const { matchday } = nav;

  const rows = phase.fixtures
    .filter((fixture) => fixture.matchday === matchday)
    .map((fixture): FixtureRow => {
      const result = findPhaseResult(phase.results, fixture);
      return {
        key: fixture.id,
        home: lookupTeam(fixture.home),
        away: lookupTeam(fixture.away),
        result,
        flashing: isFlashing(fixture.id),
        scorinate: () =>
          result
            ? rescorinateFixture(league.uuid, fixture.id)
            : scorinateFixture(league.uuid, fixture.id),
      };
    });

  const bye = phase.byes.find((candidate) => candidate.matchday === matchday);

  return {
    hasFixtures: phase.fixtures.length > 0,
    nav,
    rows,
    byeTeamName: bye ? lookupTeam(bye.team).name : undefined,
    matchdayFullyPlayed: isPhaseMatchdayPlayed(phase.fixtures, phase.results, matchday),
    scorinateMatchday: () => scorinateMatchday(league.uuid, matchday),
  };
}
