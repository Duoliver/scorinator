import { create } from 'zustand';
import type { LeagueRecord } from '@/features/leagues/types';

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
 * one-line result of the latest save or load, shown by `AppShell`.
 *
 * `savedLeagues` (Task 26) holds each league object as it was when last
 * saved or loaded. It is a reference, not a copy. `isLeagueUnsaved` compares
 * it with the league in `leagueStore` by identity: the stores never change a
 * league in place, so any change builds a new object.
 *
 * State only. The actions that change it live in `fileActions.ts`. */
export interface FileState {
  currentLeagueSlug: string | null;
  paths: Record<string, string>;
  savedLeagues: Record<string, LeagueRecord>;
  status: FileStatus | null;
}

export const useFileStore = create<FileState>()(() => ({
  currentLeagueSlug: null,
  paths: {},
  savedLeagues: {},
  status: null,
}));

/** True when `league` is not the object last saved or loaded under its slug.
 * A league never saved or loaded counts as unsaved. Compares by reference,
 * so a re-scorinate that draws the same score still counts as a change. */
export function isLeagueUnsaved(
  league: LeagueRecord,
  savedLeagues: Record<string, LeagueRecord>
): boolean {
  return savedLeagues[league.slug] !== league;
}
