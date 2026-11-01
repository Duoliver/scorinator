import { useState } from 'preact/hooks';
import { applyTeamImport, type TeamImportPreview } from '@/app/loadActions';
import type { TeamImport } from './types';

export type { TeamImport };

/** The team import with its confirm (Task 75, Task 168): "4 new, 8
 * updated. Continue?". Each screen with a team import button uses it, so
 * every team import asks first (Task 119 choice 9). The read file waits in
 * the hook state, and "Import" applies it. "Cancel" drops it, with no
 * change. */
export function useTeamImport(): TeamImport {
  const [pending, setPending] = useState<TeamImportPreview | null>(null);

  const startImport = async (
    read: () => Promise<TeamImportPreview | null>
  ): Promise<void> => {
    const preview = await read();
    if (preview !== null) setPending(preview);
  };

  const confirmImport = (): void => {
    if (pending) applyTeamImport(pending.records);
    setPending(null);
  };

  const importConfirm = pending && {
    title: 'Import teams?',
    message: `${pending.added} new, ${pending.updated} updated. Continue?`,
    confirmLabel: 'Import',
    onConfirm: confirmImport,
    onCancel: (): void => setPending(null),
  };

  return { startImport, importConfirm };
}
