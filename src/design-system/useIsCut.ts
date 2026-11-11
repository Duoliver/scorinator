import { useLayoutEffect, useState } from 'preact/hooks';

/**
 * True when the text of `element` is wider than its box, so the CSS cuts it,
 * for example with an ellipsis (Task 180). It checks again each time the
 * box changes size. Pass the element from a `useState` ref callback, so a
 * new element gets a new check.
 */
export function useIsCut(element: HTMLElement | null): boolean {
  const [cut, setCut] = useState(false);

  useLayoutEffect(() => {
    if (!element) {
      setCut(false);
      return;
    }
    const check = (): void => setCut(element.scrollWidth > element.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(element);
    return (): void => observer.disconnect();
  }, [element]);

  return cut;
}
