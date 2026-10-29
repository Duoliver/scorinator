import type { PickerItem } from '@/design-system/components/PickerDialog';

/** A checklist item: the same shape as a picker item. The search text has
 * no use here. */
export type ChecklistItem = Omit<PickerItem, 'searchText'>;

export default interface ChecklistDialogProps {
  title: string;
  description?: string;
  /** The items, in list order. All start checked (US-10.3). */
  items: readonly ChecklistItem[];
  confirmLabel: string;
  /** Called with the checked ids, in list order. */
  onConfirm: (ids: string[]) => void;
  /** Called on "Cancel", Escape, and a backdrop click. */
  onCancel: () => void;
}
