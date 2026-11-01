import { useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { JSX, TargetedKeyboardEvent } from 'preact';
import type TooltipProps from './types';
import styles from './Tooltip.module.css';

export type { TooltipProps };

/** The space between the trigger and the hint, and between the hint and
 * the window edge, in px: the position is a runtime value from the layout. */
const GAP = 6;
const EDGE = 8;
/** The time the pointer has to move from the trigger onto the hint. */
const HIDE_DELAY_MS = 100;

interface Place {
  side: 'top' | 'bottom';
  top: number;
  left: number;
}

/** Above the trigger, centered on it, or below it when the window has no
 * room above. Kept inside the window on the left and the right. */
function placeHint(trigger: DOMRect, hint: DOMRect): Place {
  const above = trigger.top - GAP - hint.height;
  const side = above >= EDGE ? 'top' : 'bottom';
  const centered = trigger.left + trigger.width / 2 - hint.width / 2;
  const maxLeft = window.innerWidth - hint.width - EDGE;
  return {
    side,
    top: side === 'top' ? above : trigger.bottom + GAP,
    left: Math.max(EDGE, Math.min(centered, maxLeft)),
  };
}

/**
 * A hint that shows on hover and on keyboard focus (Task 111): the
 * Location of a team (US-09.3), the reason a button is off (US-09.5), and
 * the standings hints (US-12.1 to US-12.3).
 *
 * The hint is `position: fixed`, placed from the trigger box when it opens,
 * so a scroll box around the trigger, such as the standings table, does not
 * cut it off. It hides on Escape, on a scroll, and when the pointer and the
 * focus leave. It stays while the pointer moves onto it (WCAG 1.4.13).
 */
export function Tooltip({
  content,
  underline = false,
  notHoverable = false,
  children,
}: TooltipProps): JSX.Element {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);

  const show = (): void => {
    clearTimeout(hideTimer.current);
    setOpen(true);
  };
  const hide = (): void => {
    clearTimeout(hideTimer.current);
    setOpen(false);
  };
  const hideSoon = (): void => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hide, HIDE_DELAY_MS);
  };

  const measure = (): void => {
    // The trigger is the first child. The wrapper can be taller than it, for
    // example when a flex row stretches the wrapper to its tallest item.
    const trigger = anchorRef.current?.firstElementChild;
    const hint = hintRef.current;
    if (trigger && hint) {
      setPlace(
        placeHint(trigger.getBoundingClientRect(), hint.getBoundingClientRect())
      );
    }
  };

  // Measured before the paint, so the hint never shows in the wrong place.
  useLayoutEffect(() => {
    if (open) measure();
    else setPlace(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // A scroll moves the trigger, so a fixed hint would float away from it.
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', measure);
    return (): void => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', measure);
    };
  }, [open]);

  useEffect(() => (): void => clearTimeout(hideTimer.current), []);

  const handleKeyDown = (event: TargetedKeyboardEvent<HTMLSpanElement>): void => {
    if (event.key === 'Escape' && open) {
      // A Tooltip inside a `Modal` closes first. The browser cancels a
      // dialog on an Escape that nothing prevents, so prevent it here.
      event.preventDefault();
      event.stopPropagation();
      hide();
    }
  };

  const trigger =
    typeof children === 'function' ? (
      children(tooltipId)
    ) : (
      <span
        tabIndex={0}
        class={underline ? `${styles.trigger} ${styles.underline}` : styles.trigger}
        data-underline={underline ? '' : undefined}
        aria-describedby={tooltipId}
      >
        {children}
      </span>
    );

  return (
    <span
      ref={anchorRef}
      class={styles.anchor}
      onMouseEnter={show}
      onMouseLeave={notHoverable ? hide : hideSoon}
      onFocusIn={show}
      onFocusOut={hide}
      onKeyDown={handleKeyDown}
    >
      {trigger}
      <span
        ref={hintRef}
        id={tooltipId}
        role="tooltip"
        class={notHoverable ? `${styles.hint} ${styles.passThrough}` : styles.hint}
        hidden={!open}
        data-not-hoverable={notHoverable ? '' : undefined}
        data-side={place?.side}
        // A runtime value from the layout, which the coding standards allow.
        style={place ? { top: `${place.top}px`, left: `${place.left}px` } : undefined}
        onMouseEnter={show}
        onMouseLeave={hideSoon}
      >
        {content}
      </span>
    </span>
  );
}
Tooltip.displayName = 'Tooltip';
