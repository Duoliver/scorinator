/** The edge or the middle of the trigger that a popup lines up with. */
export type PopupAlign = 'start' | 'center' | 'end';

/** The place of a fixed popup, in px from the top left of the window. */
export interface PopupPlace {
  top: number;
  left: number;
}

/** The edges of an element box, in px. */
export interface PopupBox {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** The space between the trigger and the popup (the handoff 26px top below
 * a 22px button), and between the popup and the window edge, in px: the
 * place is a runtime value from the layout. */
const GAP = 4;
const EDGE = 8;

/** The trigger box without its CSS move. `Button` moves 1px on hover and
 * 2px on a press (the neubrutalist look), so the measured box is off by
 * that much while the pointer is on it. The popup lines up with the button
 * at rest. */
export function getRestingBox(element: Element): PopupBox {
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
 * the start edge, the middle, or the end edge of the trigger. The popup
 * keeps that line, also near the window edge. It moves in, `EDGE` px from
 * the window edge, only when it would go out of the window. */
export function placePopup(
  trigger: PopupBox,
  popup: DOMRect,
  align: PopupAlign
): PopupPlace {
  const below = trigger.bottom + GAP;
  const above = trigger.top - GAP - popup.height;
  const fitsBelow = below + popup.height <= window.innerHeight - EDGE;
  const top = fitsBelow || above < EDGE ? below : above;
  const middle = (trigger.left + trigger.right) / 2 - popup.width / 2;
  const wanted =
    align === 'end'
      ? trigger.right - popup.width
      : align === 'center'
        ? middle
        : trigger.left;
  let left = wanted;
  if (wanted < 0) left = EDGE;
  else if (wanted + popup.width > window.innerWidth)
    left = window.innerWidth - popup.width - EDGE;
  return { top, left };
}
