import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { JSX, TargetedKeyboardEvent } from 'preact';
import { Button } from '@/design-system/components/Button';
import type DropdownMenuProps from './types';
import type { DropdownMenuAlign, DropdownMenuItem, DropdownMenuTone } from './types';
import styles from './DropdownMenu.module.css';

export type {
  DropdownMenuProps,
  DropdownMenuAlign,
  DropdownMenuItem,
  DropdownMenuTone,
};

/** The space between the trigger and the menu (the handoff 26px top below a
 * 22px button), and between the menu and the window edge, in px: the
 * position is a runtime value from the layout. */
const GAP = 4;
const EDGE = 8;

interface Place {
  top: number;
  left: number;
}

interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** The trigger box without its CSS move. `Button` moves 1px on hover and
 * 2px on a press (the neubrutalist look), so the measured box is off by
 * that much while the pointer is on it. The menu lines up with the button
 * at rest. */
function restingBox(element: Element): Box {
  const box = element.getBoundingClientRect();
  const transform = getComputedStyle(element).transform;
  let dx = 0;
  let dy = 0;
  const matrix = /^matrix\(([^)]+)\)$/.exec(transform);
  const translate = /translate\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px\s*\)/.exec(transform);
  if (matrix) {
    const values = matrix[1].split(',').map(Number);
    dx = values[4] ?? 0;
    dy = values[5] ?? 0;
  } else if (translate) {
    dx = Number(translate[1]);
    dy = Number(translate[2]);
  }
  return {
    top: box.top - dy,
    bottom: box.bottom - dy,
    left: box.left - dx,
    right: box.right - dx,
  };
}

/** Below the trigger, or above it when the window has no room below. On
 * the end or the start edge of the trigger. The menu keeps that edge, also
 * near the window edge. It moves in, `EDGE` px from the window edge, only
 * when it would go out of the window. */
function placeMenu(trigger: Box, menu: DOMRect, align: DropdownMenuAlign): Place {
  const below = trigger.bottom + GAP;
  const above = trigger.top - GAP - menu.height;
  const fitsBelow = below + menu.height <= window.innerHeight - EDGE;
  const top = fitsBelow || above < EDGE ? below : above;
  const wanted = align === 'end' ? trigger.right - menu.width : trigger.left;
  let left = wanted;
  if (wanted < 0) left = EDGE;
  else if (wanted + menu.width > window.innerWidth)
    left = window.innerWidth - menu.width - EDGE;
  return { top, left };
}

/** The next enabled item from `from`, in `step` direction, with a wrap.
 * `-1` when no item is enabled. */
function nextEnabled(
  items: readonly DropdownMenuItem[],
  from: number,
  step: 1 | -1
): number {
  for (let i = 1; i <= items.length; i++) {
    const index = (from + step * i + items.length * 2) % items.length;
    if (!items[index].disabled) return index;
  }
  return -1;
}

/**
 * A button that opens a short list of actions (Task 127): the team row
 * menu ⋮ (US-02.5) and the League Detail export menu (US-10.1).
 *
 * The trigger is a `Button`: a square icon button with `icon`, or a text
 * button `label ▾`. The menu follows the WAI-ARIA menu button pattern: Enter,
 * Space, or Arrow Down opens it on the first item, Arrow Up on the last.
 * The arrows move and wrap, Home and End jump, a disabled item gets no
 * focus. Escape and a select close it and put the focus back on the
 * trigger. Tab, a click outside, and a scroll close it.
 *
 * The menu is `position: fixed`, placed from the trigger box when it
 * opens, as `Tooltip` does, so a scroll box around the trigger does not cut
 * it off.
 */
export function DropdownMenu({
  label,
  icon,
  items,
  align = 'end',
}: DropdownMenuProps): JSX.Element {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState<Place | null>(null);

  // One item with an icon gives every item the icon column, so the labels
  // line up.
  const hasIcons = items.some((item) => item.icon);

  const triggerButton = (): HTMLButtonElement | null =>
    anchorRef.current?.querySelector('button') ?? null;

  const openAt = (index: number): void => {
    setActive(index);
    setOpen(true);
  };
  const close = (returnFocus: boolean): void => {
    setOpen(false);
    setActive(-1);
    if (returnFocus) triggerButton()?.focus();
  };

  // Measured before the paint, so the menu never shows in the wrong place.
  useLayoutEffect(() => {
    const trigger = triggerButton();
    const menu = menuRef.current;
    if (open && trigger && menu) {
      setPlace(placeMenu(restingBox(trigger), menu.getBoundingClientRect(), align));
    } else {
      setPlace(null);
    }
  }, [open, align]);

  // Right after the render, not after the paint, so a fast key sequence
  // always lands on the item it moved to.
  useLayoutEffect(() => {
    if (open && active >= 0) itemRefs.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    // The state setters are stable, so this effect needs only `open`.
    const closeQuietly = (): void => {
      setOpen(false);
      setActive(-1);
    };
    const closeOnOutside = (event: PointerEvent): void => {
      if (!anchorRef.current?.contains(event.target as Node)) closeQuietly();
    };
    // A scroll moves the trigger, so a fixed menu would float away from it.
    const closeOnScroll = closeQuietly;
    document.addEventListener('pointerdown', closeOnOutside);
    window.addEventListener('scroll', closeOnScroll, true);
    return (): void => {
      document.removeEventListener('pointerdown', closeOnOutside);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [open]);

  const select = (item: DropdownMenuItem): void => {
    if (item.disabled) return;
    close(true);
    item.onSelect();
  };

  const handleTriggerKeyDown = (
    event: TargetedKeyboardEvent<HTMLSpanElement>
  ): void => {
    if (open || event.target !== triggerButton()) return;
    if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openAt(nextEnabled(items, -1, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(nextEnabled(items, items.length, -1));
    }
  };

  const handleMenuKeyDown = (event: TargetedKeyboardEvent<HTMLDivElement>): void => {
    const moves: Record<string, () => number> = {
      ArrowDown: () => nextEnabled(items, active, 1),
      ArrowUp: () => nextEnabled(items, active < 0 ? items.length : active, -1),
      Home: () => nextEnabled(items, -1, 1),
      End: () => nextEnabled(items, items.length, -1),
    };
    if (moves[event.key]) {
      event.preventDefault();
      setActive(moves[event.key]());
    } else if (event.key === 'Escape') {
      // A menu inside a `Modal` closes first. The browser cancels a dialog
      // on an Escape that nothing prevents, so prevent it here.
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  return (
    <span ref={anchorRef} class={styles.anchor} onKeyDown={handleTriggerKeyDown}>
      {icon ? (
        <Button
          size="icon"
          variant="secondary"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => (open ? close(false) : openAt(nextEnabled(items, -1, 1)))}
        >
          {icon}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => (open ? close(false) : openAt(nextEnabled(items, -1, 1)))}
        >
          {`${label} ▾`}
        </Button>
      )}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          class={styles.menu}
          // A runtime value from the layout, which the coding standards allow.
          style={place ? { top: `${place.top}px`, left: `${place.left}px` } : undefined}
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={item.disabled ? 'true' : undefined}
              data-tone={item.tone === 'danger' ? 'danger' : undefined}
              class={
                item.tone === 'danger' ? `${styles.item} ${styles.danger}` : styles.item
              }
              onClick={() => select(item)}
            >
              {hasIcons && (
                <span class={styles.icon} aria-hidden="true" data-icon="">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
DropdownMenu.displayName = 'DropdownMenu';
