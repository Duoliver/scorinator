import { useEffect, useState } from 'preact/hooks';
import { setCurrentLeague } from '@/app/state/fileActions';
import { isLeagueUnsaved, useFileStore } from '@/app/state/fileStore';
import { findLeague, useLeagueStore } from '@/app/state/leagueStore';
import { describeLeague, formatPointsLabel } from '@/features/leagues/leagueSummary';
import { getLeagueTabs } from './helpers';
import type { LeagueDetail } from './types';

/** The league with this slug, ready for League Detail, or `null` when no
 * open league has the slug. */
export function useLeagueDetail(slug: string): LeagueDetail | null {
  const leagues = useLeagueStore((state) => state.leagues);
  const savedLeagues = useFileStore((state) => state.savedLeagues);
  // `Tabs` unmounts the inactive tab, so `FixturesView`'s own matchday state
  // would reset on every switch. Kept here instead, and fed back in.
  const [fixturesMatchday, setFixturesMatchday] = useState(1);
  const league = findLeague(leagues, slug);
  const found = league !== undefined;

  // The league on screen is the one Ctrl+S saves (Task 17).
  useEffect(() => {
    if (found) setCurrentLeague(slug);
  }, [slug, found]);

  if (!league) return null;

  return {
    league,
    meta: `${describeLeague(league)} · ${formatPointsLabel(league.points)}`,
    // The `Unsaved` badge beside the title (Task 26).
    isUnsaved: isLeagueUnsaved(league, savedLeagues),
    tabs: getLeagueTabs(league, fixturesMatchday, setFixturesMatchday),
  };
}
