import { useEffect, useState } from 'preact/hooks';
import { getErrorMessage } from '@/app/getErrorMessage';
import { openLeague } from '@/app/state/databaseActions';
import { isLeagueUnsaved, useDatabaseStore } from '@/app/state/databaseStore';
import { describeLeague, formatPointsLabel } from '@/features/leagues/leagueSummary';
import { getLeagueTabs } from './helpers';
import type { LeagueDetailState } from './types';

/** The league with this UUID, ready for League Detail (Task 161). A league
 * in the manifest that is not open yet is read from its file once, with
 * `openLeague`. A UUID that no manifest row has is not found. */
export function useLeagueDetail(uuid: string): LeagueDetailState {
  const league = useDatabaseStore((state) => state.leagues[uuid]);
  const isUnsaved = useDatabaseStore((state) => isLeagueUnsaved(state, uuid));
  const isKnown = useDatabaseStore((state) =>
    state.rows.some((row) => row.uuid === uuid)
  );
  // Kept with its UUID, so a route to another league does not show the
  // error of the last one.
  const [openError, setOpenError] = useState<{ uuid: string; message: string }>();
  // `Tabs` unmounts the inactive tab, so `FixturesView`'s own matchday state
  // would reset on every switch. Kept here instead, and fed back in.
  const [fixturesMatchday, setFixturesMatchday] = useState(1);

  const needsOpen = league === undefined && isKnown;
  useEffect(() => {
    if (!needsOpen) return;
    let active = true;
    openLeague(uuid).catch((error: unknown) => {
      if (active) setOpenError({ uuid, message: getErrorMessage(error) });
    });
    return (): void => {
      active = false;
    };
  }, [uuid, needsOpen]);

  if (league) {
    return {
      kind: 'open',
      detail: {
        league,
        meta: `${describeLeague({
          teamCount: league.teams.length,
          homeAdvantage: league.content.homeAdvantage,
        })} · ${formatPointsLabel(league.content.points)}`,
        // The `Unsaved` badge beside the title (Task 26).
        isUnsaved,
        tabs: getLeagueTabs(league, fixturesMatchday, setFixturesMatchday),
      },
    };
  }
  if (!isKnown) return { kind: 'not-found' };
  if (openError?.uuid === uuid) return { kind: 'error', message: openError.message };
  return { kind: 'opening' };
}
