import { useState } from 'preact/hooks';
import {
  applyFileImport,
  getImportRows,
  type ImportRow,
  type PendingFileImport,
} from '@/app/importFileActions';
import type { ImportChoice } from '@/engine/identity';
import type { FileImportDialogsProps } from './FileImportDialogs';
import type { FileImport } from './types';

export type { FileImport };

type ImportStage =
  | { name: 'picker'; pending: PendingFileImport; rows: ImportRow[] }
  | {
      name: 'conflicts';
      pending: PendingFileImport;
      selected: ReadonlySet<string>;
      rows: ImportRow[];
    };

/**
 * The steps of a file import (US-10.3, US-11.2): the picker when a league
 * or team file has many items, the conflict dialog when the selection has a
 * conflict, then the apply. A database has no picker (US-10.4). Each screen
 * with an import button uses it, so every import asks the same way.
 */
export function useFileImport(): FileImport {
  const [stage, setStage] = useState<ImportStage | null>(null);

  const finishImport = (
    pending: PendingFileImport,
    selected: ReadonlySet<string>,
    choices: ReadonlyMap<string, ImportChoice>
  ): void => {
    applyFileImport(pending, selected, choices);
    setStage(null);
  };

  const continueWithSelection = (
    pending: PendingFileImport,
    rows: readonly ImportRow[],
    uuids: readonly string[]
  ): void => {
    const selected = new Set(uuids);
    const conflicts = rows.filter((row) => row.conflict && selected.has(row.uuid));
    if (conflicts.length === 0) finishImport(pending, selected, new Map());
    else setStage({ name: 'conflicts', pending, selected, rows: conflicts });
  };

  const startFileImport = async (
    read: () => Promise<PendingFileImport | null>
  ): Promise<void> => {
    const pending = await read();
    if (pending === null) return;
    const rows = getImportRows(pending);
    if (pending.kind !== 'database' && rows.length > 1) {
      setStage({ name: 'picker', pending, rows });
    } else {
      continueWithSelection(
        pending,
        rows,
        rows.map((row) => row.uuid)
      );
    }
  };

  const cancelImport = (): void => setStage(null);

  let importDialogs: FileImportDialogsProps | null = null;
  if (stage?.name === 'picker') {
    const { pending, rows } = stage;
    importDialogs = {
      stage: 'picker',
      title: pending.kind === 'blueprints' ? 'Import teams' : 'Import leagues',
      rows,
      onConfirm: (uuids): void => continueWithSelection(pending, rows, uuids),
      onCancel: cancelImport,
    };
  } else if (stage?.name === 'conflicts') {
    const { pending, selected, rows } = stage;
    importDialogs = {
      stage: 'conflicts',
      rows,
      onConfirm: (choices): void => finishImport(pending, selected, choices),
      onCancel: cancelImport,
    };
  }

  return { startFileImport, importDialogs };
}
