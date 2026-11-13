import { useEffect, useState } from 'preact/hooks';
import { getErrorMessage } from '@/app/getErrorMessage';
import {
  currentSeasonRows,
  isSeasonUnsaved,
  useDatabaseStore,
} from '@/app/state/databaseStore';
import {
  addSeasonTeams,
  finishSeason,
  openSeason,
  reopenSeason,
  updateSeasonTeam,
} from '@/app/state/seasonActions';
import { setStatusLine } from '@/app/state/statusLineActions';
import { summarizeSeason } from '@/app/state/summarizeSeason';
import {
  formatCount,
  formatSeasonLabel,
  formatSeasonMeta,
} from '@/features/seasons/seasonText';
import {
  ADD_TEAMS_TEXT,
  findLeagueNames,
  formatJoinHints,
  toPickerItem,
} from './helpers';
import type { SeasonViewState } from './types';

/** The Season view (Task 213). The screen opens the Season from its file,
 * as League Detail opens a league. */
export function useSeasonView(uuid: string): SeasonViewState {
  const season = useDatabaseStore((state) => state.seasons[uuid]);
  const isUnsaved = useDatabaseStore((state) => isSeasonUnsaved(state, uuid));
  const isKnown = useDatabaseStore((state) =>
    currentSeasonRows(state).some((row) => row.uuid === uuid)
  );
  const blueprints = useDatabaseStore((state) => state.blueprints);
  // Kept with its UUID, so a route to another Season does not show the error
  // of the last one.
  const [openError, setOpenError] = useState<{ uuid: string; message: string }>();
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

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
  const inRoster = new Set(season.teams.map((team) => team.blueprintUuid));
  const rosterNames = season.teams.map((team) => team.name);
  const locationOf = new Map(blueprints.map((b) => [b.uuid, b.location]));
  const rosterRows = season.teams.map((team) => ({
    team,
    location: locationOf.get(team.blueprintUuid) ?? '',
    leagueNames: findLeagueNames(season, team.blueprintUuid),
  }));

  const pickedBlueprints = blueprints.filter((b) => picked?.includes(b.uuid));
  const picker =
    picked === null
      ? null
      : {
          mode: 'multi' as const,
          title: 'Add teams',
          description: [
            ADD_TEAMS_TEXT,
            ...formatJoinHints(rosterNames, pickedBlueprints),
          ].join(' '),
          items: blueprints.filter((b) => !inRoster.has(b.uuid)).map(toPickerItem),
          searchPlaceholder: 'Name or Location',
          selected: picked,
          onSelectedChange: setPicked,
          confirmLabel: `Add ${formatCount(picked.length, 'team')}`,
          onConfirm: (): void => {
            const added = addSeasonTeams(uuid, picked);
            setPicked(null);
            setStatusLine({
              tone: 'info',
              message: `Added ${formatCount(added.length, 'team')} to ${label}.`,
            });
          },
          onCancel: (): void => setPicked(null),
        };

  const editedTeam = season.teams.find((team) => team.blueprintUuid === editing);
  const others = season.teams.filter((team) => team !== editedTeam);
  const drawer = !editedTeam
    ? null
    : {
        team: editedTeam,
        leagueNames: findLeagueNames(season, editedTeam.blueprintUuid),
        otherNames: others.map((team) => team.name),
        otherTrigrams: others.map((team) => team.trigram),
        onSave: (changes: Parameters<typeof updateSeasonTeam>[2]): void => {
          updateSeasonTeam(uuid, editedTeam.blueprintUuid, changes);
          setEditing(null);
          setStatusLine({
            tone: 'info',
            message: `Saved ${changes.name ?? editedTeam.name}.`,
          });
        },
        onCancel: (): void => setEditing(null),
      };

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
      openPicker: (): void => setPicked([]),
      picker,
      openDrawer: setEditing,
      drawer,
    },
  };
}
