import { useEffect, useState } from 'preact/hooks';
import type { SeasonWrapper } from '@/domain';
import { getErrorMessage } from '@/app/getErrorMessage';
import { currentSeasonRows, useDatabaseStore } from '@/app/state/databaseStore';
import { openSeason } from '@/app/state/seasonActions';
import { formatSeasonLabel } from '@/features/components';
import type { WizardSeasonState } from './types';

/** The Season of a wizard in a Season (Task 218 choice 1). A Season that is
 * not open yet opens from its file, as the Season view opens it. A finished
 * Season is read only, so it gets no wizard (US-13.9). */
export function useWizardSeason(seasonUuid: string | undefined): WizardSeasonState {
  const uuid = seasonUuid ?? '';
  const season: SeasonWrapper | undefined = useDatabaseStore(
    (state) => state.seasons[uuid]
  );
  const isKnown = useDatabaseStore((state) =>
    currentSeasonRows(state).some((row) => row.uuid === uuid)
  );
  // Kept with its UUID, so a route to another Season does not show the
  // error of the last one.
  const [openError, setOpenError] = useState<{ uuid: string; message: string }>();

  const needsOpen = seasonUuid !== undefined && season === undefined && isKnown;
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

  if (seasonUuid === undefined) return { kind: 'standalone' };
  if (!season) {
    if (openError?.uuid === uuid) return { kind: 'error', message: openError.message };
    return isKnown ? { kind: 'opening' } : { kind: 'not-found' };
  }
  const label = formatSeasonLabel(season.content);
  if (season.content.finished) return { kind: 'finished', label };
  return { kind: 'open', season, label };
}
