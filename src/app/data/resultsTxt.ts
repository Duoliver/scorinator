import {
  saveTextFileWithDialog,
  tauriDialog,
  tauriFileSystem,
} from '@/adapters/tauri-fs';
import { serializeResultsTxt, type ResultsTxtInput } from '@/adapters/txt';
import { slug } from '@/engine/identity';
import { findCurrentPhase } from '@/app/state/currentPhase';
import type { FileFilter, FileSystem, SaveFileDialog } from '@/persistence/types';
import type { LeagueWrapper } from '@/domain';

/** The thin `app/` → `adapters/` data layer for the results export (Task
 * 18), the same seam `teamsCsv.ts` is for team CSV, so `features/` never
 * imports `adapters/txt` or `adapters/tauri-fs` directly. `fs`/`dialog`
 * default to the real Tauri adapters and are only overridden in tests. */

/** Restricts the save dialog to `.txt` files, for the same reason
 * `teamsCsv.ts` restricts its dialog to `.csv`: without it the dialog falls
 * back to its default `.json` filter. */
const TXT_FILTERS: readonly FileFilter[] = [{ name: 'Text file', extensions: ['txt'] }];

/** The current phase of a league, in the MVP1 text layout (Task 161).
 * Fixtures name teams by Blueprint UUID, so that is the team id. Task 148
 * writes every phase. */
function toResultsTxtInput(wrapper: LeagueWrapper): ResultsTxtInput {
  const { name, homeAdvantage, points } = wrapper.content;
  const phase = findCurrentPhase(wrapper);
  return {
    league: { name, homeAdvantage, points },
    teams: wrapper.teams.map((team) => ({ id: team.blueprintUuid, name: team.name })),
    fixtures: phase?.fixtures ?? [],
    byes: phase?.byes ?? [],
    results: phase?.results ?? [],
  };
}

/** Asks where to write the plain-text results summary of one league, then
 * writes it, with the Instance names (US-09.2). Returns the path written,
 * or `null` if the user cancels the dialog. */
export async function exportResultsTxt(
  wrapper: LeagueWrapper,
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  const contents = serializeResultsTxt(toResultsTxtInput(wrapper));
  return saveTextFileWithDialog(
    fs,
    dialog,
    contents,
    `${slug(wrapper.content.name)}-results.txt`,
    TXT_FILTERS
  );
}
