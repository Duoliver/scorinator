import { useMemo, useState } from 'preact/hooks';
import type { SeasonSummary } from '@/domain';
import { getErrorMessage } from '@/app/getErrorMessage';
import {
  currentSeasonRows,
  isSeasonNameTaken,
  isSeasonUnsaved,
  useDatabaseStore,
} from '@/app/state/databaseStore';
import { createSeason, deleteSeason, renameSeason } from '@/app/state/seasonActions';
import { setStatusLine } from '@/app/state/statusLineActions';
import {
  formatDeleteMessage,
  formatSeasonLabel,
  formatSeasonSubtitle,
  isSeasonMatch,
} from './helpers';
import type { OpenSeasonDialog, SeasonsList } from './types';

/** The Seasons list (Task 212): the cards, the search, the create and
 * rename dialog, and the delete confirm. */
export function useSeasonsList(): SeasonsList {
  const seasonRows = useDatabaseStore((state) => state.seasonRows);
  const seasons = useDatabaseStore((state) => state.seasons);
  const savedSeasons = useDatabaseStore((state) => state.savedSeasons);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<OpenSeasonDialog>(null);
  const [deleting, setDeleting] = useState<SeasonSummary | null>(null);

  const rows = useMemo(
    () => currentSeasonRows({ seasonRows, seasons }),
    [seasonRows, seasons]
  );
  const cards = rows
    .filter((row) => isSeasonMatch(row, search))
    .map((row) => ({
      row,
      isUnsaved: isSeasonUnsaved({ seasons, savedSeasons }, row.uuid),
    }));

  const isTaken = (name: string, year: string, exceptUuid?: string): boolean =>
    isSeasonNameTaken({ seasonRows, seasons }, name, year, exceptUuid);

  const closeDialog = (): void => setDialog(null);

  const submitCreate = (input: { name: string; year: string }): void => {
    const season = createSeason(input);
    setDialog(null);
    setStatusLine({
      tone: 'info',
      message: `Created ${formatSeasonLabel(season.content)}.`,
    });
  };

  const submitRename = async (
    row: SeasonSummary,
    input: { name: string; year: string }
  ): Promise<void> => {
    try {
      await renameSeason(row.uuid, input);
      setDialog(null);
      setStatusLine({
        tone: 'info',
        message: `Renamed to ${formatSeasonLabel(input)}.`,
      });
    } catch (error) {
      setDialog(null);
      setStatusLine({ tone: 'error', message: getErrorMessage(error) });
    }
  };

  const dialogProps =
    dialog === null
      ? null
      : dialog.mode === 'create'
        ? {
            title: 'New Season',
            description: 'A Season starts with no leagues and no teams.',
            submitLabel: 'Create Season',
            initialName: '',
            initialYear: '',
            isTaken: (name: string, year: string): boolean => isTaken(name, year),
            onSubmit: submitCreate,
            onCancel: closeDialog,
          }
        : {
            title: 'Rename Season',
            description: 'The name and the year together must stay unique.',
            submitLabel: 'Save',
            initialName: dialog.row.name,
            initialYear: dialog.row.year,
            isTaken: (name: string, year: string): boolean =>
              isTaken(name, year, dialog.row.uuid),
            onSubmit: (input: { name: string; year: string }): void =>
              void submitRename(dialog.row, input),
            onCancel: closeDialog,
          };

  const deleteConfirm =
    deleting === null
      ? null
      : {
          title: `Delete ${formatSeasonLabel(deleting)}?`,
          message: formatDeleteMessage(deleting),
          confirmLabel: 'Delete',
          tone: 'destructive' as const,
          onConfirm: (): void => {
            deleteSeason(deleting.uuid);
            setDeleting(null);
            setStatusLine({
              tone: 'info',
              message: `Deleted ${formatSeasonLabel(deleting)}.`,
            });
          },
          onCancel: (): void => setDeleting(null),
        };

  return {
    cards,
    hasSeasons: rows.length > 0,
    subtitle: formatSeasonSubtitle(rows),
    search,
    setSearch,
    noMatchText:
      rows.length > 0 && cards.length === 0
        ? `No Season matches "${search.trim()}".`
        : null,
    openCreate: () => setDialog({ mode: 'create' }),
    openRename: (row) => setDialog({ mode: 'rename', row }),
    openDelete: (row) => setDeleting(row),
    dialog: dialogProps,
    deleteConfirm,
  };
}
