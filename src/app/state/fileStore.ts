import { create } from 'zustand';

export interface FileStatus {
  tone: 'info' | 'error';
  message: string;
}

/** Save/Load session state (Task 17), held in memory only — nothing here
 * goes to disk. Kept apart from `LeagueRecord` on purpose: the record
 * mirrors the save file, and a file path is not part of the file.
 *
 * `currentLeagueSlug` is the league Ctrl+S saves — the last one created,
 * opened, or loaded. `paths` holds where each league was last saved or
 * loaded, so a later save writes there without a dialog. `status` is the
 * one-line result of the latest save or load, shown by `AppShell`. */
export interface FileState {
  currentLeagueSlug: string | null;
  paths: Record<string, string>;
  status: FileStatus | null;
  setCurrent: (slug: string) => void;
  setPath: (slug: string, path: string) => void;
  setStatus: (status: FileStatus) => void;
  clearStatus: () => void;
}

export const useFileStore = create<FileState>()((set) => ({
  currentLeagueSlug: null,
  paths: {},
  status: null,
  setCurrent: (slug): void => set({ currentLeagueSlug: slug }),
  setPath: (slug, path): void => set((state) => ({ paths: { ...state.paths, [slug]: path } })),
  setStatus: (status): void => set({ status }),
  clearStatus: (): void => set({ status: null }),
}));
