import type { ComponentChildren, RefObject } from 'preact';

/** `sm` is the handoff confirm (23.75rem wide). `md` is the handoff import
 * picker (30rem wide, Task 113). `lg` is the handoff team picker (47.5rem
 * wide, 80% of the window high). */
export type ModalSize = 'sm' | 'md' | 'lg';

export default interface ModalProps {
  title: string;
  /** A line under the title. It also describes the dialog for assistive
   * technology (`aria-describedby`). */
  description?: string;
  size?: ModalSize;
  /** Shows a ✕ button in the header, as the handoff team picker has. */
  showClose?: boolean;
  /** The element that gets focus on open. With none, the first control in
   * the modal gets it. A `FieldHandle` fits too: it has `focus()`. */
  initialFocus?: RefObject<{ focus: () => void }>;
  /** Called on Escape, a backdrop click, and the ✕ button. The modal stays
   * open until the caller unmounts it. */
  onClose: () => void;
  children: ComponentChildren;
}
