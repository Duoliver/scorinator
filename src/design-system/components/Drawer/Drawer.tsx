import { useId, useLayoutEffect, useRef } from 'preact/hooks';
import type { JSX, TargetedMouseEvent } from 'preact';
import type DrawerProps from './types';
import styles from './Drawer.module.css';

export type { DrawerProps };

/** A right-side overlay panel — the generic chrome, with no domain
 * knowledge of what it holds. `TeamForm` is its first consumer, from both
 * `features/teams/TeamsScreen` and `features/leagues/steps/TeamsStep`; see
 * the design-reference prototypes, which use this exact panel in both
 * places. Mount `Drawer` to open it, unmount it to close it — the same
 * conditional-render pattern already used everywhere else in this
 * codebase, rather than an internal `open` prop.
 *
 * Renders as a native `<dialog>`: `showModal()` below gives focus
 * trapping, Escape-to-cancel, and the backdrop for free, instead of this
 * component hand-rolling them. */
export function Drawer({ title, onClose, children }: DrawerProps): JSX.Element {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // `useLayoutEffect`, not `useEffect`: `useEffect` runs on a later tick,
  // so a field inside the drawer can already hold real focus (typed into,
  // by a real user or by a test) by the time a deferred focus move here
  // would fire — pulling focus away mid-type. `useLayoutEffect` runs
  // synchronously, right after mount, closing that window.
  useLayoutEffect(() => {
    dialogRef.current?.showModal();
    closeButtonRef.current?.focus();
  }, []);

  const handleBackdropClick = (event: TargetedMouseEvent<HTMLDialogElement>): void => {
    // A click lands on the dialog element itself only when it hits the
    // backdrop, since every actual control is a descendant and stops the
    // event there first.
    if (event.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      class={styles.host}
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
      onCancel={onClose}
    >
      <div class={styles.panel}>
        <div class={styles.header}>
          <h2 id={titleId} class={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            class={styles.close}
            aria-label="Close"
            onClick={onClose}
            ref={closeButtonRef}
          >
            ✕
          </button>
        </div>
        <div class={styles.content}>{children}</div>
      </div>
    </dialog>
  );
}
Drawer.displayName = 'Drawer';
