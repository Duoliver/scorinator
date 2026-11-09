/** The text of an element without its hints. A `Tooltip` keeps its closed
 * hint in the DOM for `aria-describedby`, so `textContent` includes it. */
export function getTextWithoutHints(element: Element): string {
  const copy = element.cloneNode(true) as Element;
  copy.querySelectorAll('[role="tooltip"]').forEach((hint) => hint.remove());
  return copy.textContent ?? '';
}
