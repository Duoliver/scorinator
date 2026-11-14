import { useEffect, useState } from 'preact/hooks';
import { getErrorMessage } from '@/app/getErrorMessage';
import {
  currentSeasonRows,
  isSeasonUnsaved,
  useDatabaseStore,
} from '@/app/state/databaseStore';
import { finishSeason, openSeason, reopenSeason } from '@/app/state/seasonActions';
import { setStatusLine } from '@/app/state/statusLineActions';
import { summarizeSeason } from '@/app/state/summarizeSeason';
import { formatSeasonLabel, formatSeasonMeta } from '@/features/seasons/seasonText';
import { findLeagueNames } from './helpers';
import { useAddTeams } from './useAddTeams';
import { useTeamEdit } from './useTeamEdit';
import type { SeasonViewState } from './types';

/** The Season view (Task 213). The screen opens the Season from its file,
 * as League Detail opens a league. The add dialog and the edit drawer have
 * hooks of their own. */
export function useSeasonView(uuid: string): SeasonViewState {
  const season = useDatabaseStore((state) => state.seasons[uuid]);
  const isUnsaved = useDatabaseStore((state) => isSeasonUnsaved(state, uuid));
  const isKnown = useDatabaseStore((state) =>
    currentSeasonRows(state).some((row) => row.uuid === uuid)
  );
  const blueprints = useDatabaseStore((state) => state.blueprints);
  const { openPicker, picker } = useAddTeams(season);
  const { openDrawer, drawer } = useTeamEdit(season);
  // Kept with its UUID, so a route to another Season does not show the error
  // of the last one.
  const [openError, setOpenError] = useState<{ uuid: string; message: string }>();
  const [confirmingFinish, setConfirmingFinish] = useState(false);

  const needsOpen = season === undefined && isKnown;
  useEffect(() => {
    if (!needsOpen) return;
    let active = true;
    openSeason(uuid).catch((error: unknown) => {
      if (active) setOpenError({ uuid, message: getErrorMessage(error) });
    });
    return (): void => {
      active = false;
    };
  }, [uuid, needsOpen]);

  if (!season) {
    if (openError?.uuid === uuid) return { kind: 'error', message: openError.message };
    return isKnown ? { kind: 'opening' } : { kind: 'not-found' };
  }

  const label = formatSeasonLabel(season.content);
  const { finished } = season.content;
  const locationOf = new Map(blueprints.map((b) => [b.uuid, b.location]));
  const rosterRows = season.teams.map((team) => ({
    team,
    location: locationOf.get(team.blueprintUuid) ?? '',
    leagueNames: findLeagueNames(season, team.blueprintUuid),
  }));

  return {
    kind: 'open',
    view: {
      name: season.content.name,
      year: season.content.year,
      meta: formatSeasonMeta(summarizeSeason(season)),
      isFinished: finished,
      isUnsaved,
      hasLeagues: season.content.leagues.length > 0,
      rosterRows,
      toggleFinished: (): void => {
        if (!finished) {
          setConfirmingFinish(true);
          return;
        }
        reopenSeason(uuid);
        setStatusLine({ tone: 'info', message: `Reopened ${label}.` });
      },
      finishConfirm: !confirmingFinish
        ? null
        : {
            title: `Finish ${label}?`,
            message:
              'A finished Season is read only. You can read its leagues, teams, matches, and playoffs. You can reopen it later.',
            confirmLabel: 'Finish Season',
            onConfirm: (): void => {
              finishSeason(uuid);
              setConfirmingFinish(false);
              setStatusLine({ tone: 'info', message: `Finished ${label}.` });
            },
            onCancel: (): void => setConfirmingFinish(false),
          },
      openPicker,
      picker,
      openDrawer,
      drawer,
    },
  };
}
