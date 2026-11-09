import type { JSX } from 'preact';
import { ChecklistDialog } from '@/design-system';
import { getPickerItem } from './helpers';
import { ResolveConflictsDialog } from './ResolveConflictsDialog';
import type FileImportDialogsProps from './types';

export type { FileImportDialogsProps };

/** The dialogs between the read of an import file and its apply. They are
 * modal, so no edit comes between the plan and the apply (Task 144). */
export function FileImportDialogs(props: FileImportDialogsProps): JSX.Element {
  if (props.stage === 'conflicts') {
    return (
      <ResolveConflictsDialog
        rows={props.rows}
        onConfirm={props.onConfirm}
        onCancel={props.onCancel}
      />
    );
  }
  return (
    <ChecklistDialog
      title={props.title}
      description={`Found ${props.rows.length} in the file. Choose which to import.`}
      items={props.rows.map(getPickerItem)}
      confirmLabel="Import selected"
      onConfirm={props.onConfirm}
      onCancel={props.onCancel}
    />
  );
}
FileImportDialogs.displayName = 'FileImportDialogs';
