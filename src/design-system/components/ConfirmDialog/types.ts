/** `destructive` gives the confirm button the red look, for an action that
 * removes or clears data, as the handoff "Clear & scorinate". */
export type ConfirmTone = 'primary' | 'destructive';

export default interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  /** Called on "Cancel", Escape, and a backdrop click. */
  onCancel: () => void;
}
