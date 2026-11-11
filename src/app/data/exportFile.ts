import {
  DATABASE_FORMAT_VERSION,
  detectFileKind,
  parseBlueprintFile,
  parseLeagueFile,
  serializeBlueprintFile,
  serializeLeagueFile,
  type DetectedFileKind,
  SavedFileKind,
} from '@/adapters/json-io';
import {
  openTextFileWithDialog,
  saveTextFileWithDialog,
  tauriDialog,
  tauriFileSystem,
} from '@/adapters/tauri-fs';
import { slug } from '@/engine/identity';
import type { LeagueWrapper, TeamBlueprint } from '@/domain';
import type { FileFilter, FileSystem, SaveFileDialog } from '@/persistence/types';
import {
  blueprintFromFile,
  blueprintToFile,
  leagueFromFile,
  leagueToFile,
} from './databaseFile';
import { getLocalDate } from './localDate';

/**
 * The map between the domain records and the export files of the File
 * module (Task 145): the league file (US-10.1, US-10.2) and the Blueprint
 * file (US-10.2). A read gives the records that the import actions of
 * Task 144 take. A wrong file throws a text that names the right import
 * button (US-10.3, choices 4 and 5).
 */

const MVP1_FILE =
  'This file is from Scorinator MVP1. MVP2 cannot import it. Move your teams with the CSV.';
const DATABASE_FILE =
  'This file is part of a database folder. Use "Import entire database" with a .zip file.';
const BLUEPRINT_FILE = 'This is a team blueprints file. Use "Import teams" for it.';
const LEAGUE_FILE = 'This is a league file. Use "Import leagues" for it.';

const JSON_FILTERS: readonly FileFilter[] = [
  { name: 'JSON file', extensions: ['json'] },
];

/** The leagues and the Blueprint snapshots of a league file. */
export interface LeagueImport {
  leagues: LeagueWrapper[];
  blueprints: TeamBlueprint[];
}

/** Throws the wrong-file text for a kind that the import does not take. */
function rejectWrongFile(
  kind: DetectedFileKind,
  expected: 'leagues' | 'blueprints'
): void {
  if (kind === 'mvp1') throw new Error(MVP1_FILE);
  if (kind === 'manifest' || kind === 'wrapper') throw new Error(DATABASE_FILE);
  if (kind === 'blueprints' && expected === SavedFileKind.LEAGUES)
    throw new Error(BLUEPRINT_FILE);
  if (kind === 'leagues' && expected === SavedFileKind.BLUEPRINTS)
    throw new Error(LEAGUE_FILE);
}

/**
 * A league file with the given leagues, for one league (US-10.1) or all
 * (US-10.2). It holds a snapshot of each Blueprint in `blueprints` that an
 * Instance names, in the order of `blueprints`. A deleted Blueprint is not
 * in `blueprints`, so it has no snapshot (US-09.4).
 */
export function serializeLeagueExport(
  leagues: readonly LeagueWrapper[],
  blueprints: readonly TeamBlueprint[]
): string {
  const named = new Set(
    leagues.flatMap((league) => league.teams.map((team) => team.blueprintUuid))
  );
  return serializeLeagueFile({
    kind: SavedFileKind.LEAGUES,
    formatVersion: DATABASE_FORMAT_VERSION,
    leagues: leagues.map(leagueToFile),
    blueprints: blueprints.filter((b) => named.has(b.uuid)).map(blueprintToFile),
  });
}

/** Reads a file for "Import leagues". Throws the wrong-file text, or the
 * `parseLeagueFile` error. */
export function readLeagueImport(text: string): LeagueImport {
  rejectWrongFile(detectFileKind(text), SavedFileKind.LEAGUES);
  const file = parseLeagueFile(text);
  return {
    leagues: file.leagues.map(leagueFromFile),
    blueprints: file.blueprints.map(blueprintFromFile),
  };
}

/** A Blueprint file with every given Blueprint (US-10.2). */
export function serializeBlueprintExport(blueprints: readonly TeamBlueprint[]): string {
  return serializeBlueprintFile({
    kind: SavedFileKind.BLUEPRINTS,
    formatVersion: DATABASE_FORMAT_VERSION,
    blueprints: blueprints.map(blueprintToFile),
  });
}

/** Reads a file for "Import teams". Throws the wrong-file text, or the
 * `parseBlueprintFile` error. */
export function readBlueprintImport(text: string): TeamBlueprint[] {
  rejectWrongFile(detectFileKind(text), SavedFileKind.BLUEPRINTS);
  return parseBlueprintFile(text).blueprints.map(blueprintFromFile);
}

/** Asks where to write the file of one league, and writes it. The default
 * name comes from the league name (US-10.1). Returns the path, or `null` on
 * Cancel. */
export function saveLeagueFile(
  league: LeagueWrapper,
  blueprints: readonly TeamBlueprint[],
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  return saveTextFileWithDialog(
    fs,
    dialog,
    serializeLeagueExport([league], blueprints),
    `${slug(league.content.name)}.json`,
    JSON_FILTERS
  );
}

/** Asks where to write one league file with the given leagues, and writes
 * it. Returns the path, or `null` on Cancel (Task 149). */
export function saveLeaguesFile(
  leagues: readonly LeagueWrapper[],
  blueprints: readonly TeamBlueprint[],
  today: Date = new Date(),
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  return saveTextFileWithDialog(
    fs,
    dialog,
    serializeLeagueExport(leagues, blueprints),
    `scorinator-leagues-${getLocalDate(today)}.json`,
    JSON_FILTERS
  );
}

/** Asks where to write one Blueprint file, and writes it. Returns the path,
 * or `null` on Cancel (Task 149). */
export function saveBlueprintsFile(
  blueprints: readonly TeamBlueprint[],
  today: Date = new Date(),
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  return saveTextFileWithDialog(
    fs,
    dialog,
    serializeBlueprintExport(blueprints),
    `scorinator-team-blueprints-${getLocalDate(today)}.json`,
    JSON_FILTERS
  );
}

/** The file the user picks for "Import leagues", or `null` on Cancel.
 * Rejects as `readLeagueImport` does. */
export async function openLeagueImportFile(
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<LeagueImport | null> {
  const opened = await openTextFileWithDialog(fs, dialog, JSON_FILTERS);
  return opened === null ? null : readLeagueImport(opened.contents);
}

/** The file the user picks for "Import teams", or `null` on Cancel. Rejects
 * as `readBlueprintImport` does. */
export async function openBlueprintImportFile(
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<TeamBlueprint[] | null> {
  const opened = await openTextFileWithDialog(fs, dialog, JSON_FILTERS);
  return opened === null ? null : readBlueprintImport(opened.contents);
}
