import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { message } from '@tauri-apps/plugin-dialog';

/** What the user picked in the unsaved-changes dialog. */
export type UnsavedChoice = 'save' | 'discard' | 'cancel';

/** The part of Tauri's close event the app uses. Calling `preventDefault`
 * keeps the window open. Without it, Tauri closes the window once the
 * handler returns. */
export interface CloseRequest {
  preventDefault(): void;
}

/** What `app/closeGuard.ts` needs from the window, so a test can replace it
 * the way `FileSystem` and `SaveFileDialog` are replaced. */
export interface WindowCloseAdapter {
  /** Calls `handler` each time the user asks to close the window. Resolves
   * to a function that stops listening. Outside Tauri, such as the browser
   * dev server, there is no window to watch, so it resolves to a no-op. */
  listenForCloseRequest(
    handler: (request: CloseRequest) => Promise<void>
  ): Promise<() => void>;
  askUnsavedChoice(text: string): Promise<UnsavedChoice>;
}

const SAVE_LABEL = 'Save';
const DISCARD_LABEL = "Don't save";
const CANCEL_LABEL = 'Cancel';

/** Maps the label of the pressed button back to a choice. Any other answer,
 * such as a dialog closed with the window button, counts as cancel, so the
 * window stays open. */
export function choiceFromLabel(label: string): UnsavedChoice {
  if (label === SAVE_LABEL) return 'save';
  if (label === DISCARD_LABEL) return 'discard';
  return 'cancel';
}

/** `WindowCloseAdapter` backed by the real Tauri window and `dialog` plugin.
 * `onCloseRequested` closes the window itself after the handler, unless the
 * handler prevents it. That close needs the `core:window:allow-destroy`
 * permission in `src-tauri/capabilities/default.json`. */
export const tauriWindow: WindowCloseAdapter = {
  listenForCloseRequest: async (handler) => {
    if (!isTauri()) return () => undefined;
    return getCurrentWindow().onCloseRequested(async (event) => {
      await handler(event);
    });
  },
  askUnsavedChoice: async (text) => {
    const answer = await message(text, {
      title: 'Unsaved changes',
      kind: 'warning',
      buttons: { yes: SAVE_LABEL, no: DISCARD_LABEL, cancel: CANCEL_LABEL },
    });
    return choiceFromLabel(answer);
  },
};
