import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/preact';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});

// jsdom does not implement `HTMLDialogElement.showModal()`/`close()`, or the
// Escape-to-cancel behaviour a real browser gives a modal dialog for free
// (https://github.com/jsdom/jsdom/issues/3294, open as of jsdom 26). This
// polyfill covers only what Scorinator's `Drawer` relies on, so tests can
// exercise the real `<dialog>` element instead of a hand-rolled stand-in.
if (!HTMLDialogElement.prototype.showModal) {
  let openModalDialog: HTMLDialogElement | null = null;

  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
    this.setAttribute('open', '');
    trackOpenModalDialog(this);
  };

  function trackOpenModalDialog(dialog: HTMLDialogElement): void {
    openModalDialog = dialog;
  }

  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
    this.removeAttribute('open');
    if (openModalDialog === this) openModalDialog = null;
    this.dispatchEvent(new Event('close'));
  };

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !openModalDialog) return;
    const dialog = openModalDialog;
    const cancelled = !dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    if (!cancelled) dialog.close();
  });
}
