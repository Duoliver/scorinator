import { findPhaseResult, isPhaseMatchdayPlayed } from '@/engine/round-robin';
import {
  rescorinateFixture,
  scorinateFixture,
  scorinateMatchday,
} from '@/app/state/leagueWrapperActions';
import { useTeamLookup } from '@/features/components';
import type FixturesViewProps from './types';
import type { ByeRow, FixtureRow, Fixtures } from './types';
import {
  getCompleteBadge,
  getGroupIndexes,
  getGroupTag,
  getShownPhase,
} from './helpers';
import { useMatchdayNav } from './useMatchdayNav';
import { useScoreFlash } from './useScoreFlash';

/** The matchday browser for one started phase of one league, ready for
 * `FixturesView` to render. A Groups phase gives each match and each bye
 * its group letter, in group order (Task 131 choice 6). A phase before the
 * latest started one is locked: its buttons are off (Task 132).
 *
 * Scorination (Task 15) plays an unplayed match, or a whole unplayed
 * matchday, with the `leagueWrapperActions` of Task 160, by fixture id. A
 * played match shows its real score, and its button turns into
 * Re-scorinate (Task 7 action, Task 19 UI), which draws a new score
 * and overwrites the old one with no confirm. MVP1 §1: a round-robin
 * match feeds nothing downstream. */
export function useFixtures(props: FixturesViewProps): Fixtures {
  const { league } = props;
  const phase = getShownPhase(league, props.phaseIndex);
  const { phases, plans } = league.content;
  const shownIndex = props.phaseIndex ?? phases.length - 1;
  // The scorinate actions play the latest started phase only (Task 128).
  const locked = shownIndex < phases.length - 1;
  const groupOf = getGroupIndexes(phase);
  const byGroup = (a: { group?: number }, b: { group?: number }): number =>
    (a.group ?? 0) - (b.group ?? 0);
  const lookupTeam = useTeamLookup(league.teams);
  const nav = useMatchdayNav(props);
  const isFlashing = useScoreFlash(phase.results);
  const { matchday } = nav;

  const rows = phase.fixtures
    .filter((fixture) => fixture.matchday === matchday)
    .map((fixture) => ({ fixture, group: groupOf.get(fixture.home) }))
    .sort(byGroup)
    .map(({ fixture, group }): FixtureRow => {
      const result = findPhaseResult(phase.results, fixture);
      return {
        key: fixture.id,
        groupTag: getGroupTag(group),
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

  const byes = phase.byes
    .filter((bye) => bye.matchday === matchday)
    .map((bye) => ({ bye, group: groupOf.get(bye.team) }))
    .sort(byGroup)
    .map(({ bye, group }): ByeRow => ({
      key: bye.team,
      groupTag: getGroupTag(group),
      teamName: lookupTeam(bye.team).name,
    }));

  return {
    hasFixtures: phase.fixtures.length > 0,
    nav,
    rows,
    byes,
    matchdayFullyPlayed: isPhaseMatchdayPlayed(phase.fixtures, phase.results, matchday),
    scorinateMatchday: () => scorinateMatchday(league.uuid, matchday),
    locked,
    lockHint: locked
      ? `Phase ${shownIndex + 2} started. This phase is locked.`
      : undefined,
    completeBadge: getCompleteBadge(shownIndex >= plans.length - 1),
  };
}
