import type { FieldHandle } from '@/design-system';
import type { ImportChoice } from '@/engine/identity';
import type { ImportRow } from '@/app/importFileActions';

export default interface ResolveConflictsDialogProps {
  /** One row for each conflict. */
  rows: readonly ImportRow[];
  /** Called with the choice for each row, by UUID. */
  onConfirm: (choices: ReadonlyMap<string, ImportChoice>) => void;
  onCancel: () => void;
}

/** What `useResolveConflicts` gives the dialog. */
export interface ResolveConflicts {
  /** A ref callback for the choice field of the row with this UUID. */
  bindChoice: (uuid: string) => (handle: FieldHandle<ImportChoice> | null) => void;
  setAllChoices: (choice: ImportChoice) => void;
  confirmChoices: () => void;
}
