import type { ImportChoice } from '@/engine/identity';
import type { ImportRow } from '@/app/importFileActions';

/** The dialog that an import shows now: the picker (US-10.3), or the
 * conflict dialog (US-11.2). */
type FileImportDialogsProps =
  | {
      stage: 'picker';
      title: string;
      rows: readonly ImportRow[];
      onConfirm: (uuids: string[]) => void;
      onCancel: () => void;
    }
  | {
      stage: 'conflicts';
      rows: readonly ImportRow[];
      onConfirm: (choices: ReadonlyMap<string, ImportChoice>) => void;
      onCancel: () => void;
    };
export default FileImportDialogsProps;
