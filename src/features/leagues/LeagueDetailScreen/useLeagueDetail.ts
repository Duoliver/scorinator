import { useEffect, useState } from 'preact/hooks';
import { getErrorMessage } from '@/app/getErrorMessage';
import { openLeague } from '@/app/state/databaseActions';
import { isLeagueUnsaved, useDatabaseStore } from '@/app/state/databaseStore';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import {
  describeLeague,
  formatHeaderProgress,
  formatPointsLabel,
} from '@/features/leagues/leagueSummary';
import {
  getLeagueTabs,
  getPhaseTabs,
  phaseTabId,
  type MatchdayMemory,
} from './helpers';
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
  // would reset on every switch. Kept here instead, one for each phase, and
  // fed back in.
  const [matchdays, setMatchdays] = useState<Record<number, number>>({});
  const memory: MatchdayMemory = {
    matchdayOf: (phaseIndex) => matchdays[phaseIndex] ?? 1,
    setMatchday: (phaseIndex, matchday) =>
      setMatchdays((now) => ({ ...now, [phaseIndex]: matchday })),
  };

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
    // The same row as the dashboard card, so both say the same (US-01.2).
    const summary = summarizeLeague(league);
    const { plans, phases } = league.content;
    const hasPhaseTabs = plans.length > 1;
    return {
      kind: 'open',
      detail: {
        league,
        meta: `${describeLeague(summary)} · ${formatPointsLabel(league.content.points)}`,
        progress: formatHeaderProgress(summary),
        isComplete: summary.progress.kind === 'completed',
        // The `Unsaved` badge beside the title (Task 26).
        isUnsaved,
        tabs: hasPhaseTabs
          ? getPhaseTabs(league, memory)
          : getLeagueTabs(league, 0, memory),
        // The current phase is the last started one.
        defaultTab: hasPhaseTabs
          ? phaseTabId(Math.max(0, phases.length - 1))
          : 'standings',
      },
    };
  }
  if (!isKnown) return { kind: 'not-found' };
  if (openError?.uuid === uuid) return { kind: 'error', message: openError.message };
  return { kind: 'opening' };
}
