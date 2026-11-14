import { useEffect, useRef, useState } from 'preact/hooks';
import type { FieldHandle } from '@/design-system';
import { getErrorMessage } from '@/app/getErrorMessage';
import { openLeague } from '@/app/state/databaseActions';
import { setStatusLine } from '@/app/state/statusLineActions';
import {
  moveTeamInCurrentGroups,
  setPhaseZones,
  shuffleCurrentGroups,
  startNextPhase,
  swapTeamsInCurrentGroups,
} from '@/app/state/leagueWrapperActions';
import { canChangeCurrentGroups, canStartNextPhase } from '@/app/state/phases';
import {
  currentSeasonRows,
  findLeagueWrapper,
  isLeagueUnsaved,
  isSeasonUnsaved,
  useDatabaseStore,
  type LeagueRef,
} from '@/app/state/databaseStore';
import { openSeason } from '@/app/state/seasonActions';
import { ROUTES, seasonDetailPath } from '@/app/routes';
import { formatSeasonLabel } from '@/features/components';
import { summarizeLeague } from '@/app/state/summarizeLeague';
import {
  describeLeague,
  formatHeaderProgress,
  formatPointsLabel,
  phaseShortName,
} from '@/features/components/leagueSummary';
import type { LeagueWrapper } from '@/domain';
import {
  firstLeagueTab,
  getExportItems,
  getLeagueTabs,
  getPhaseTabs,
  phaseTabId,
  renderEditZonesButton,
  type GroupsDraw,
  type MatchdayMemory,
  type PhaseStart,
} from './helpers';
import type {
  LeagueAccess,
  LeagueDetailState,
  PhaseStartConfirm,
  ZoneDrawerView,
} from './types';
import { PhaseFormat } from '@/engine/phases';

/** The text of League Detail in a finished Season (US-13.9). */
export const FINISHED_NOTICE =
  'This Season is finished. It is read only. Reopen it to change it.';

/** The league with this UUID, ready for League Detail (Task 161). A league
 * in the manifest that is not open yet is read from its file once, with
 * `openLeague`. A UUID that no manifest row has is not found.
 *
 * With a `seasonUuid`, it is a league of that Season (Task 219). The
 * Season opens from its file, the "Unsaved" badge follows the Season, and
 * a finished Season makes the league read only. */
export function useLeagueDetail(uuid: string, seasonUuid?: string): LeagueDetailState {
  const ref: LeagueRef =
    seasonUuid === undefined ? uuid : { seasonUuid, leagueUuid: uuid };
  const league = useDatabaseStore((state) => findLeagueWrapper(state, ref));
  const season = useDatabaseStore((state) =>
    seasonUuid === undefined ? undefined : state.seasons[seasonUuid]
  );
  const isUnsaved = useDatabaseStore((state) =>
    seasonUuid === undefined
      ? isLeagueUnsaved(state, uuid)
      : isSeasonUnsaved(state, seasonUuid)
  );
  // A Season league is known while its Season is known and not open, so the
  // Season opens. An open Season knows its leagues.
  const isKnown = useDatabaseStore((state) => {
    if (seasonUuid === undefined) return state.rows.some((row) => row.uuid === uuid);
    const open = state.seasons[seasonUuid];
    if (open) return open.content.leagues.some((candidate) => candidate.uuid === uuid);
    return currentSeasonRows(state).some((row) => row.uuid === seasonUuid);
  });
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

  const tabsRef = useRef<FieldHandle<string>>(null);
  const [confirmingStart, setConfirmingStart] = useState(false);
  // The phase of the open "Edit zones" drawer, from 0 (Task 189).
  const [zonePhase, setZonePhase] = useState<number>();

  const needsOpen = league === undefined && isKnown;
  useEffect(() => {
    if (!needsOpen) return;
    let active = true;
    const open = seasonUuid === undefined ? openLeague(uuid) : openSeason(seasonUuid);
    open.catch((error: unknown) => {
      if (active) setOpenError({ uuid, message: getErrorMessage(error) });
    });
    return (): void => {
      active = false;
    };
  }, [uuid, seasonUuid, needsOpen]);

  if (league) {
    // The same row as the dashboard card, so both say the same (US-01.2).
    const summary = summarizeLeague(league);
    const { plans, phases } = league.content;
    const hasPhaseTabs = plans.length > 1;
    // A finished Season keeps the league as it is (US-13.9, Task 219 choice
    // 4): no start, no draw change, no zones.
    const readOnly = season?.content.finished ?? false;
    const access: LeagueAccess = { leagueRef: ref, readOnly };
    const start = readOnly
      ? undefined
      : findPhaseStart(league, () => setConfirmingStart(true));
    const next = phases.length + 1;
    const startConfirm: PhaseStartConfirm | undefined = confirmingStart
      ? {
          title: `Start phase ${next}?`,
          message: `Phase ${next - 1} locks, and its results can no longer change.`,
          confirmLabel: `Start phase ${next}`,
          onConfirm: (): void => {
            setConfirmingStart(false);
            try {
              startNextPhase(ref);
              // The new phase tab opens (Task 132 choice 3).
              tabsRef.current?.setValue(phaseTabId(next - 1));
            } catch (error) {
              setStatusLine({ tone: 'error', message: getErrorMessage(error) });
            }
          },
          onCancel: () => setConfirmingStart(false),
        }
      : undefined;
    const zoneDrawer = findZoneDrawer(ref, league, zonePhase, hasPhaseTabs, () =>
      setZonePhase(undefined)
    );
    const editZones = readOnly ? undefined : setZonePhase;
    const onePlan = plans[0];
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
          ? getPhaseTabs(
              league,
              memory,
              start,
              readOnly ? undefined : findGroupsDraw(ref, league),
              editZones,
              access
            )
          : getLeagueTabs(league, 0, memory, undefined, access),
        tabsActions:
          hasPhaseTabs || readOnly || !onePlan || onePlan.format === PhaseFormat.BRACKET
            ? undefined
            : renderEditZonesButton(() => setZonePhase(0)),
        // The current phase is the last started one.
        defaultTab: hasPhaseTabs
          ? phaseTabId(Math.max(0, phases.length - 1))
          : firstLeagueTab(league, 0),
        tabsRef,
        exportItems: season ? undefined : getExportItems(league),
        crumbs: season && [
          { label: 'Seasons', href: ROUTES.seasons },
          {
            label: formatSeasonLabel(season.content),
            href: seasonDetailPath(season.uuid),
          },
          { label: league.content.name },
        ],
        notice: readOnly ? FINISHED_NOTICE : undefined,
        startConfirm,
        zoneDrawer,
      },
    };
  }
  if (!isKnown) return { kind: 'not-found' };
  if (openError?.uuid === uuid) return { kind: 'error', message: openError.message };
  return { kind: 'opening' };
}

/** The Start button of the next phase (US-07.3), or `undefined` while the
 * current phase is not complete or no next phase is planned. A Bracket next
 * phase starts too, since Task 141. */
function findPhaseStart(
  league: LeagueWrapper,
  open: () => void
): PhaseStart | undefined {
  if (!canStartNextPhase(league)) return undefined;
  const { phases, plans } = league.content;
  const nextPlan = plans[phases.length];
  return {
    label: `Start phase ${phases.length + 1} · ${phaseShortName(nextPlan)}`,
    onClick: open,
  };
}

/** The "Edit zones" drawer of the phase at `phaseIndex`, or `undefined`
 * when it is closed (Task 189). Save sets the zones and closes it. */
function findZoneDrawer(
  ref: LeagueRef,
  league: LeagueWrapper,
  phaseIndex: number | undefined,
  hasPhaseTabs: boolean,
  close: () => void
): ZoneDrawerView | undefined {
  if (phaseIndex === undefined) return undefined;
  const plan = league.content.plans[phaseIndex];
  if (!plan || plan.format === PhaseFormat.BRACKET) return undefined;
  return {
    title: hasPhaseTabs ? `Zones · Phase ${phaseIndex + 1}` : 'Zones',
    plan,
    onSave: (zones): void => {
      close();
      try {
        setPhaseZones(ref, phaseIndex, zones);
      } catch (error) {
        setStatusLine({ tone: 'error', message: getErrorMessage(error) });
      }
    },
    onCancel: close,
  };
}

/** Runs a draw change, and shows its error in the status line. The screen
 * keeps a bad move off, so an error here is a fault. */
function changeDraw(change: () => void): void {
  try {
    change();
  } catch (error) {
    setStatusLine({ tone: 'error', message: getErrorMessage(error) });
  }
}

/** The draw of the current phase while Shuffle, moves, and swaps can change
 * it (Tasks 181 and 183, US-02.1, US-02.5), or `undefined`. */
function findGroupsDraw(ref: LeagueRef, league: LeagueWrapper): GroupsDraw | undefined {
  if (!canChangeCurrentGroups(league)) return undefined;
  const current = league.content.phases[league.content.phases.length - 1];
  if (current?.format !== PhaseFormat.GROUPS) return undefined;
  return {
    groups: current.groups,
    onMove: (team, groupIndex) =>
      changeDraw(() => moveTeamInCurrentGroups(ref, team, groupIndex)),
    onSwap: (team, other) =>
      changeDraw(() => swapTeamsInCurrentGroups(ref, team, other)),
    onShuffle: () => changeDraw(() => shuffleCurrentGroups(ref)),
  };
}
