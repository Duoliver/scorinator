import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/preact';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});

// jsdom does not implement `HTMLDialogElement.showModal()`/`close()`, or the
// Escape-to-cancel behaviour a real browser gives a modal dialog for free
// (https://github.com/jsdom/jsdom/issues/3294, open as of jsdom 26). This
// polyfill covers only what Scorinator's `Drawer` and `Modal` rely on, so
// tests can exercise the real `<dialog>` element instead of a hand-rolled
// stand-in. It keeps a stack of open modal dialogs, as a browser does: a
// `Modal` over a `Drawer` gets the Escape, and the `Drawer` does not
// (Task 112).
if (!HTMLDialogElement.prototype.showModal) {
  const openModalDialogs: HTMLDialogElement[] = [];

  const forget = (dialog: HTMLDialogElement): void => {
    const index = openModalDialogs.indexOf(dialog);
    if (index !== -1) openModalDialogs.splice(index, 1);
  };

  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
    this.setAttribute('open', '');
    forget(this);
    openModalDialogs.push(this);
  };

  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
    this.removeAttribute('open');
    forget(this);
    this.dispatchEvent(new Event('close'));
  };

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    // A dialog that left the page without `close()`, when its component
    // unmounted, is no longer open.
    const top = (): HTMLDialogElement | undefined =>
      openModalDialogs[openModalDialogs.length - 1];
    while (openModalDialogs.length > 0 && !top()?.isConnected) {
      openModalDialogs.pop();
    }
    const dialog = top();
    if (!dialog) return;
    const cancelled = !dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    if (!cancelled) dialog.close();
  });
}

// jsdom does not implement `window.scrollTo` and logs a "Not implemented"
// error on each call. `Tabs` calls it on a step change in League Setup, so
// a no-op keeps every screen test quiet. A test that checks the scroll spies
// on this stub with `vi.spyOn(window, 'scrollTo')`.
window.scrollTo = (): void => {};
