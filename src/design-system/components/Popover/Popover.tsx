import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { JSX, TargetedFocusEvent, TargetedKeyboardEvent } from 'preact';
import { Button } from '@/design-system/components/Button';
import { getRestingBox, placePopup, type PopupPlace } from '@/design-system/placement';
import type PopoverProps from './types';
import styles from './Popover.module.css';

export type { PopoverProps };

/** The elements that take the focus by Tab, as the browser has them. */
const FOCUSABLE =
  'button:not([disabled]):not([tabindex="-1"]), [href]:not([tabindex="-1"]), ' +
  'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), ' +
  'textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

/**
 * A square icon button that opens a small panel next to it, with any
 * content (Task 268): the condition overlay of the wizard Teams step
 * (US-14.2). It is a popup, not a modal dialog: the page stays usable, as
 * with `DropdownMenu`.
 *
 * The panel opens below the trigger, or above it with no room below
 * (`placePopup`), and the focus goes to its first element that takes it.
 * Escape closes it and puts the focus back on the trigger. A click outside,
 * a scroll, and a focus that leaves the panel close it. The content closes
 * it through the `close` of `children`.
 */
export function Popover({
  label,
  icon,
  panelLabel,
  align = 'center',
  children,
}: PopoverProps): JSX.Element {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<PopupPlace | null>(null);

  const triggerButton = (): HTMLButtonElement | null =>
    anchorRef.current?.querySelector('button') ?? null;

  const close = (): void => {
    setOpen(false);
    triggerButton()?.focus();
  };

  // Measured before the paint, so the panel never shows in the wrong place.
  // The focus moves in after the place is set.
  useLayoutEffect(() => {
    const trigger = triggerButton();
    const panel = panelRef.current;
    if (open && trigger && panel) {
      setPlace(
        placePopup(getRestingBox(trigger), panel.getBoundingClientRect(), align)
      );
      panel.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    } else {
      setPlace(null);
    }
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const closeQuietly = (): void => setOpen(false);
    const closeOnOutside = (event: PointerEvent): void => {
      if (!anchorRef.current?.contains(event.target as Node)) closeQuietly();
    };
    // A scroll moves the trigger, so a fixed panel would float away from it.
    document.addEventListener('pointerdown', closeOnOutside);
    window.addEventListener('scroll', closeQuietly, true);
    return (): void => {
      document.removeEventListener('pointerdown', closeOnOutside);
      window.removeEventListener('scroll', closeQuietly, true);
    };
  }, [open]);

  const handlePanelKeyDown = (event: TargetedKeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Escape') return;
    // A panel inside a `Modal` closes first. The browser cancels a dialog
    // on an Escape that nothing prevents, so prevent it here.
    event.preventDefault();
    event.stopPropagation();
    close();
  };

  // Tab out of the panel, to an element that is not the trigger, closes it.
  const handlePanelFocusOut = (event: TargetedFocusEvent<HTMLDivElement>): void => {
    const next = event.relatedTarget as Node | null;
    if (next && !anchorRef.current?.contains(next)) setOpen(false);
  };

  return (
    <span ref={anchorRef} class={styles.anchor}>
      <Button
        size="icon"
        variant="secondary"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {icon}
      </Button>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={panelLabel}
          class={styles.panel}
          // A runtime value from the layout, which the coding standards allow.
          style={place ? { top: `${place.top}px`, left: `${place.left}px` } : undefined}
          onKeyDown={handlePanelKeyDown}
          onFocusOut={handlePanelFocusOut}
        >
          {children(close)}
        </div>
      )}
    </span>
  );
}
Popover.displayName = 'Popover';
