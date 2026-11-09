import { useRef } from 'preact/hooks';
import type { FieldHandle } from '@/design-system';
import type { ImportChoice } from '@/engine/identity';
import type ResolveConflictsDialogProps from './types';
import type { ResolveConflicts } from './types';

/** Each row owns its choice in an uncontrolled `SegmentedControl`, so the
 * "all" buttons write through the refs, and "Confirm" reads them. */
export function useResolveConflicts({
  rows,
  onConfirm,
}: Pick<ResolveConflictsDialogProps, 'rows' | 'onConfirm'>): ResolveConflicts {
  const fields = useRef(new Map<string, FieldHandle<ImportChoice>>());

  return {
    bindChoice: (uuid) => (handle) => {
      if (handle) fields.current.set(uuid, handle);
      else fields.current.delete(uuid);
    },
    setAllChoices: (choice: ImportChoice): void => {
      fields.current.forEach((field) => field.setValue(choice));
    },
    confirmChoices: (): void => {
      onConfirm(
        new Map(
          rows.map((row) => [
            row.uuid,
            fields.current.get(row.uuid)?.getValue() ?? 'skip',
          ])
        )
      );
    },
  };
}
