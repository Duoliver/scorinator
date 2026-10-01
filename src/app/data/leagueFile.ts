import {
  openTextFileWithDialog,
  saveTextFileWithDialog,
  tauriDialog,
  tauriFileSystem,
  writeTextFileAtomic,
} from '@/adapters/tauri-fs';
import { parseLeague, serializeLeague, SAVE_FORMAT_VERSION, type SavedLeague } from '@/adapters/json-io';
import { slug } from '@/engine/identity';
import type { FileSystem, SaveFileDialog } from '@/persistence/types';
import type { TeamRecord } from '@/features/components';
import type { LeagueRecord } from '@/features/leagues/types';

/** The thin `app/` → `adapters/` data layer for Save/Load (Task 17), the
 * same seam `teamsCsv.ts` is for team CSV. `features/file` calls these
 * instead of `adapters/json-io` or `adapters/tauri-fs`. `fs`/`dialog`
 * default to the real Tauri adapters and are only overridden in tests. */

export interface LoadedLeagueFile {
  path: string;
  league: LeagueRecord;
  /** The teams the file carried, as roster records, ready to merge into
   * `useTeamsStore` — a save file holds its own teams' name, colour, and
   * tier, because a `LeagueRecord` only references them by slug. */
  teams: TeamRecord[];
}

/** Builds the save-file shape for one league. Each `LeagueTeam` (slug,
 * rolled OVR) is joined with its roster entry (name, colour, tier), so only
 * the league's own teams are saved, not the whole roster. Throws if a
 * league team is no longer in the roster. */
export function leagueToSaved(league: LeagueRecord, roster: readonly TeamRecord[]): SavedLeague {
  const teams = league.teams.map((leagueTeam) => {
    const record = roster.find((candidate) => candidate.slug === leagueTeam.slug);
    if (!record) {
      throw new Error(
        `Cannot save "${league.name}": team "${leagueTeam.slug}" is not in the team roster.`
      );
    }
    return {
      slug: record.slug,
      name: record.name,
      colour: record.colour,
      tier: record.tier,
      ovr: leagueTeam.ovr,
    };
  });

  return {
    formatVersion: SAVE_FORMAT_VERSION,
    league: {
      name: league.name,
      homeAdvantage: league.homeAdvantage,
      points: league.points,
    },
    teams,
    fixtures: league.fixtures,
    byes: league.byes,
    results: league.results,
  };
}

/** Rebuilds a `LeagueRecord` and its roster teams from a parsed save file.
 *
 * `parseLeague` checks shape and type only, not cross-references (Task 9
 * decision). This is where those checks live, so a bad file fails here with
 * a readable message, before any store changes, instead of making
 * `calculateStandings` throw later inside `StandingsView`. Every fixture,
 * bye, and result must name a team in the file, and every result must match
 * a fixture by `(matchday, home, away)`. */
export function savedToLeague(data: SavedLeague): { league: LeagueRecord; teams: TeamRecord[] } {
  const known = new Set(data.teams.map((team) => team.slug));
  const requireKnown = (teamSlug: string, where: string): void => {
    if (!known.has(teamSlug)) {
      throw new Error(`Invalid save file: ${where} names team "${teamSlug}", which is not in the file.`);
    }
  };

  for (const fixture of data.fixtures) {
    requireKnown(fixture.home, `a fixture on matchday ${fixture.matchday}`);
    requireKnown(fixture.away, `a fixture on matchday ${fixture.matchday}`);
  }
  for (const bye of data.byes) {
    requireKnown(bye.team, `a bye on matchday ${bye.matchday}`);
  }
  for (const result of data.results) {
    requireKnown(result.home, `a result on matchday ${result.matchday}`);
    requireKnown(result.away, `a result on matchday ${result.matchday}`);
    const hasFixture = data.fixtures.some(
      (fixture) =>
        fixture.matchday === result.matchday &&
        fixture.home === result.home &&
        fixture.away === result.away
    );
    if (!hasFixture) {
      throw new Error(
        `Invalid save file: the result ${result.home} v ${result.away} on matchday ${result.matchday} has no matching fixture.`
      );
    }
  }

  return {
    league: {
      slug: slug(data.league.name),
      name: data.league.name,
      homeAdvantage: data.league.homeAdvantage,
      points: data.league.points,
      teams: data.teams.map((team) => ({ slug: team.slug, ovr: team.ovr })),
      fixtures: data.fixtures,
      byes: data.byes,
      results: data.results,
    },
    teams: data.teams.map((team) => ({
      slug: team.slug,
      name: team.name,
      colour: team.colour,
      tier: team.tier,
    })),
  };
}

/** Saves one league. With a known path, writes straight to it (atomically)
 * with no dialog — the quick save. With none, opens the save dialog, named
 * `<slug>.json` by default. Returns the path written, or `null` if the user
 * cancels the dialog. */
export async function saveLeagueFile(
  league: LeagueRecord,
  roster: readonly TeamRecord[],
  knownPath: string | null,
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  const contents = serializeLeague(leagueToSaved(league, roster));
  if (knownPath !== null) {
    await writeTextFileAtomic(fs, knownPath, contents);
    return knownPath;
  }
  return saveTextFileWithDialog(fs, dialog, contents, `${league.slug}.json`);
}

/** Save as: always opens the dialog, starting from the known path if there
 * is one. Returns the new path, or `null` if the user cancels. */
export async function saveLeagueFileAs(
  league: LeagueRecord,
  roster: readonly TeamRecord[],
  knownPath: string | null,
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<string | null> {
  const contents = serializeLeague(leagueToSaved(league, roster));
  return saveTextFileWithDialog(fs, dialog, contents, knownPath ?? `${league.slug}.json`);
}

/** Opens the open dialog, then reads, parses, and cross-checks the chosen
 * file. Returns `null` if the user cancels. Throws a readable `Error` for a
 * file that is not a league save, or is inconsistent. */
export async function loadLeagueFile(
  fs: FileSystem = tauriFileSystem,
  dialog: SaveFileDialog = tauriDialog
): Promise<LoadedLeagueFile | null> {
  const opened = await openTextFileWithDialog(fs, dialog);
  if (opened === null) return null;
  const { league, teams } = savedToLeague(parseLeague(opened.contents));
  return { path: opened.path, league, teams };
}
