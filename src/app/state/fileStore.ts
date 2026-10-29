import { create } from 'zustand';

export interface FileStatus {
  tone: 'info' | 'error';
  message: string;
}

/** The status line of the session (Task 17), held in memory only. `status`
 * is the one-line result of the latest save, import, or export, shown by
 * `StatusLine`. The league save fields of MVP1 went with Task 162. Task 164
 * gives the store a name for the status line.
 *
 * State only. The actions that change it live in `fileActions.ts`. */
export interface FileState {
  status: FileStatus | null;
}

export const useFileStore = create<FileState>()(() => ({
  status: null,
}));
