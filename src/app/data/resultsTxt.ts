import {
  saveTextFileWithDialog,
  tauriDialog,
  tauriFileSystem,
} from '@/adapters/tauri-fs';
import {
  serializeResultsTxt,
  type ResultsTxtInput,
  type ResultsTxtPhase,
} from '@/adapters/txt';
import { slug } from '@/engine/identity';
import { bracketTreeOf } from '@/app/state/bracket';
import { leagueLotOf, phaseTeamLists } from '@/app/state/phases';
import type { FileFilter, FileSystem, SaveFileDialog } from '@/persistence/types';
import type { LeagueWrapper } from '@/domain';
import { PhaseFormat } from '@/engine/phases';

/** The thin `app/` → `adapters/` data layer for the results export (Task
 * 18), the same seam `teamsCsv.ts` is for team CSV, so `features/` never
 * imports `adapters/txt` or `adapters/tauri-fs` directly. `fs`/`dialog`
 * default to the real Tauri adapters and are only overridden in tests. */

/** Restricts the save dialog to `.txt` files, for the same reason
 * `teamsCsv.ts` restricts its dialog to `.csv`: without it the dialog falls
 * back to its default `.json` filter. */
const TXT_FILTERS: readonly FileFilter[] = [{ name: 'Text file', extensions: ['txt'] }];

/** Every started phase of a league, for the v2 text layout (US-10.6, Task
 * 148). Fixtures name teams by Blueprint UUID, so that is the team id. The
 * fixed lots order a joint place (Task 128). */
function toResultsTxtInput(wrapper: LeagueWrapper): ResultsTxtInput {
  const { name, homeAdvantage, points, plans } = wrapper.content;
  const phases = wrapper.content.phases.map((phase, index): ResultsTxtPhase => {
    if (phase.format === PhaseFormat.BRACKET) {
      const tree = bracketTreeOf(wrapper, index);
      return {
        format: PhaseFormat.BRACKET,
        rounds: tree.status === 'ready' ? tree.rounds : null,
        results: phase.results,
      };
    }
    return {
      format: phase.format,
      groups: phaseTeamLists(wrapper, index),
      fixtures: phase.fixtures,
      byes: phase.byes,
      results: phase.results,
    };
  });
  return {
    league: { name, homeAdvantage, points },
    plans: plans.map((plan) =>
      plan.format === PhaseFormat.BRACKET
        ? { format: PhaseFormat.BRACKET }
        : { format: plan.format, legs: plan.legs }
    ),
    teams: wrapper.teams.map((team) => ({ id: team.blueprintUuid, name: team.name })),
    phases,
    lotOf: leagueLotOf(wrapper),
  };
}

/** Asks where to write the plain-text results summary of one league, then
 * writes it, with every started phase and the Instance names (US-09.2,
 * US-10.6). Returns the path written,
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
