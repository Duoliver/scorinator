import { create } from 'zustand';

export interface StatusLineMessage {
  tone: 'info' | 'error';
  message: string;
}

/** The status line of the session (Task 17), held in memory only. `status`
 * is the one-line result of the latest save, import, or export, shown by
 * `StatusLine`. The league save fields of MVP1 went with Task 162. Task 164
 * renamed the store from `fileStore`.
 *
 * State only. The actions that change it live in `statusLineActions.ts`. */
export interface StatusLineState {
  status: StatusLineMessage | null;
}

export const useStatusLineStore = create<StatusLineState>()(() => ({
  status: null,
}));
