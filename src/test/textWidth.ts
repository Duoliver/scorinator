import { act } from '@testing-library/preact';

/** jsdom has no layout, so a test sets the text width and the box width of
 * every element here, and fires the `ResizeObserver` callbacks (Task 180). */
const size = { text: 100, box: 100 };
const callbacks = new Set<() => void>();

class FakeResizeObserver {
  private readonly callback: () => void;
  constructor(callback: () => void) {
    this.callback = callback;
  }
  observe(): void {
    callbacks.add(this.callback);
  }
  disconnect(): void {
    callbacks.delete(this.callback);
  }
  unobserve(): void {}
}

/** Mocks `scrollWidth`, `clientWidth`, and `ResizeObserver`. Call it in a
 * `beforeEach`. Every element gets the same two widths. */
export function mockTextWidth(): void {
  size.text = 100;
  size.box = 100;
  callbacks.clear();
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get: () => size.text,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => size.box,
  });
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
}

/** Sets the widths before a render: a text wider than its box is cut. */
export function setTextWidth(text: number, box: number): void {
  size.text = text;
  size.box = box;
}

/** Sets the widths, then fires each observer, as a resize does. */
export function resizeText(text: number, box: number): void {
  setTextWidth(text, box);
  act(() => {
    for (const callback of [...callbacks]) callback();
  });
}
