import { useId, useLayoutEffect, useRef } from 'preact/hooks';
import type { JSX, TargetedEvent, TargetedMouseEvent } from 'preact';
import type ModalProps from './types';
import type { ModalSize } from './types';
import styles from './Modal.module.css';

export type { ModalProps, ModalSize };

/** The controls that can take focus, for the default first focus. */
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A centered dialog over a dark backdrop (Task 112), the generic chrome with
 * no domain knowledge of what it holds. `ConfirmDialog` and the Picker
 * dialog (Task 113) build on it. Mount it to open it, unmount it to close
 * it, the same pattern as `Drawer`.
 *
 * It renders as a native `<dialog>`: `showModal()` gives the focus trap and
 * the backdrop, and the browser stacks a modal over an open `Drawer`, so
 * Escape reaches the top one only. Escape calls `onClose` and does not
 * close the dialog itself: the caller decides, and unmounts it. On close,
 * focus goes back to the element that had it before the open.
 */
export function Modal({
  title,
  description,
  size = 'sm',
  showClose = false,
  initialFocus,
  onClose,
  children,
}: ModalProps): JSX.Element {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // `useLayoutEffect`, as in `Drawer`: the focus moves at once, before a
  // user or a test can type into a field of the modal.
  useLayoutEffect(() => {
    const opener = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.showModal();
    if (initialFocus?.current) initialFocus.current.focus();
    else dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return (): void => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once, on mount: a later `initialFocus` change does not move focus
  }, []);

  const handleBackdropClick = (event: TargetedMouseEvent<HTMLDialogElement>): void => {
    // A click lands on the dialog element itself only when it hits the
    // backdrop, since every visible part is a descendant.
    if (event.target === dialogRef.current) onClose();
  };

  const handleCancel = (event: TargetedEvent<HTMLDialogElement>): void => {
    event.preventDefault();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      class={styles.host}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
    >
      <div class={`${styles.panel} ${styles[size]}`} data-size={size}>
        <div class={styles.header}>
          <div class={styles.heading}>
            <h2 id={titleId} class={styles.title}>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} class={styles.description}>
                {description}
              </p>
            )}
          </div>
          {showClose && (
            <button
              type="button"
              class={styles.close}
              aria-label="Close"
              onClick={onClose}
            >
              ✕
            </button>
          )}
        </div>
        <div class={styles.content}>{children}</div>
      </div>
    </dialog>
  );
}
Modal.displayName = 'Modal';
