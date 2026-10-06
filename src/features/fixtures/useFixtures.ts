import {
  rescorinateFixture,
  scorinateFixture,
  scorinateMatchday,
} from '@/app/state/leagueActions';
import { useTeamLookup } from '@/features/components';
import { findResult, isMatchdayFullyPlayed } from '@/features/scorination';
import { fixtureKey } from './helpers';
import type FixturesViewProps from './types';
import type { FixtureRow, Fixtures } from './types';
import { useMatchdayNav } from './useMatchdayNav';
import { useScoreFlash } from './useScoreFlash';

/** The matchday browser for one league, ready for `FixturesView` to render.
 *
 * Scorination (Task 15) plays an unplayed match, or a whole unplayed
 * matchday, via `leagueActions`' `scorinateFixture`/`scorinateMatchday`.
 * A played match shows its real score, and its button turns into
 * Re-scorinate (Task 7 action, Task 19 UI), which draws a new score
 * and overwrites the old one with no confirm — MVP1 §1: a round-robin
 * match feeds nothing downstream. */
export function useFixtures(props: FixturesViewProps): Fixtures {
  const { league } = props;
  const lookupTeam = useTeamLookup();
  const nav = useMatchdayNav(props);
  const isFlashing = useScoreFlash(league.results);
  const { matchday } = nav;

  const rows = league.fixtures
    .filter((fixture) => fixture.matchday === matchday)
    .map((fixture): FixtureRow => {
      const result = findResult(league, fixture);
      return {
        key: fixtureKey(fixture),
        home: lookupTeam(fixture.home),
        away: lookupTeam(fixture.away),
        result,
        flashing: isFlashing(fixture),
        scorinate: () =>
          result
            ? rescorinateFixture(league.slug, fixture)
            : scorinateFixture(league.slug, fixture),
      };
    });

  const bye = league.byes.find((candidate) => candidate.matchday === matchday);

  return {
    hasFixtures: league.fixtures.length > 0,
    nav,
    rows,
    byeTeamName: bye ? lookupTeam(bye.team).name : undefined,
    matchdayFullyPlayed: isMatchdayFullyPlayed(league, matchday),
    scorinateMatchday: () => scorinateMatchday(league.slug, matchday),
  };
}
