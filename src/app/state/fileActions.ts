import type { LeagueRecord } from '@/features/leagues/types';
import { useFileStore, type FileStatus } from './fileStore';

/** Makes `slug` the league Ctrl+S saves. */
export function setCurrentLeague(slug: string): void {
  useFileStore.setState({ currentLeagueSlug: slug });
}

/** Remembers where the league was last saved or loaded. */
export function setLeaguePath(slug: string, path: string): void {
  useFileStore.setState((state) => ({ paths: { ...state.paths, [slug]: path } }));
}

/** Keeps `league` as the object last saved or loaded under its slug. See
 * `isLeagueUnsaved`. */
export function markLeagueSaved(league: LeagueRecord): void {
  useFileStore.setState((state) => ({
    savedLeagues: { ...state.savedLeagues, [league.slug]: league },
  }));
}

export function setFileStatus(status: FileStatus): void {
  useFileStore.setState({ status });
}

export function clearFileStatus(): void {
  useFileStore.setState({ status: null });
}
