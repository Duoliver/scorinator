import { openDatabaseZipFile } from '@/app/data/databaseZip';
import { openBlueprintImportFile, openLeagueImportFile } from '@/app/data/exportFile';
import { getErrorMessage } from '@/app/getErrorMessage';
import {
  importDatabase,
  planDatabaseImport,
  type DatabaseImportPlan,
} from '@/app/state/databaseZipActions';
import { setStatusLine } from '@/app/state/statusLineActions';
import {
  importBlueprints,
  importLeagues,
  planBlueprintImport,
  planLeagueImport,
} from '@/app/state/importActions';
import type { ImportChoice, ImportCounts, ImportStep } from '@/engine/identity';
import type { LeagueWrapper, TeamBlueprint } from '@/domain';
import { SavedFileKind } from '@/adapters/json-io';

/**
 * The imports of the File module (US-10.3, US-10.4, US-11.2, Task 149). An
 * import has two steps, so the screen can ask first: a `plan*FileImport`
 * action reads the file and sorts its items, then `applyFileImport` takes
 * the picks and the choices. Each one reports on the status line and never
 * throws. The dialogs between the two steps are modal, because the apply
 * does not plan again (Task 144).
 */

/** A file that is read and sorted, and waits for the user. */
export type PendingFileImport =
  | { kind: 'leagues'; steps: ImportStep<LeagueWrapper>[]; embedded: TeamBlueprint[] }
  | { kind: 'blueprints'; steps: ImportStep<TeamBlueprint>[] }
  | { kind: 'database'; plan: DatabaseImportPlan };

/** One item of a file, for the picker and the conflict dialog. */
export interface ImportRow {
  uuid: string;
  name: string;
  type: 'team' | 'league';
  /** A known UUID with other content (choice 2). A same-content item is no
   * conflict. */
  conflict: boolean;
}

async function runPlan(
  plan: () => Promise<PendingFileImport | null>
): Promise<PendingFileImport | null> {
  try {
    return await plan();
  } catch (error) {
    setStatusLine({ tone: 'error', message: getErrorMessage(error) });
    return null;
  }
}

/** Reads a league file. `null` on Cancel or an error. */
export function planLeagueFileImport(): Promise<PendingFileImport | null> {
  return runPlan(async () => {
    const file = await openLeagueImportFile();
    if (file === null) return null;
    return {
      kind: SavedFileKind.LEAGUES,
      steps: await planLeagueImport(file.leagues),
      embedded: file.blueprints,
    };
  });
}

/** Reads a Blueprint file. `null` on Cancel or an error. */
export function planBlueprintFileImport(): Promise<PendingFileImport | null> {
  return runPlan(async () => {
    const blueprints = await openBlueprintImportFile();
    if (blueprints === null) return null;
    return { kind: SavedFileKind.BLUEPRINTS, steps: planBlueprintImport(blueprints) };
  });
}

/** Reads a database `.zip`. `null` on Cancel or an error. */
export function planDatabaseFileImport(): Promise<PendingFileImport | null> {
  return runPlan(async () => {
    const bytes = await openDatabaseZipFile();
    if (bytes === null) return null;
    return { kind: 'database', plan: await planDatabaseImport(bytes) };
  });
}

const getTeamRow = (step: ImportStep<TeamBlueprint>): ImportRow => ({
  uuid: step.incoming.uuid,
  name: step.incoming.name,
  type: 'team',
  conflict: step.kind === 'conflict',
});

const getLeagueRow = (step: ImportStep<LeagueWrapper>): ImportRow => ({
  uuid: step.incoming.uuid,
  name: step.incoming.content.name,
  type: 'league',
  conflict: step.kind === 'conflict',
});

/** Each item of the file, in the file order. A database lists its
 * Blueprints first, the order of its import. */
export function getImportRows(pending: PendingFileImport): ImportRow[] {
  switch (pending.kind) {
    case 'leagues':
      return pending.steps.map(getLeagueRow);
    case 'blueprints':
      return pending.steps.map(getTeamRow);
    case 'database':
      return [
        ...pending.plan.blueprints.map(getTeamRow),
        ...pending.plan.leagues.map(getLeagueRow),
      ];
  }
}

/** The steps of the items that the user picked. */
function pickSteps<T extends { uuid: string }>(
  steps: readonly ImportStep<T>[],
  selected: ReadonlySet<string>
): ImportStep<T>[] {
  return steps.filter((step) => selected.has(step.incoming.uuid));
}

function formatCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** The counts after the first one. A zero does not show (choice 4). */
function getOtherCounts(counts: ImportCounts): string[] {
  const parts: [number, string][] = [
    [counts.importedAsNew, 'imported as new'],
    [counts.skipped, 'skipped'],
    [counts.upToDate, 'already up to date'],
  ];
  return parts
    .filter(([count]) => count > 0)
    .map(([count, text]) => `${count} ${text}`);
}

function describeEntityImport(counts: ImportCounts, noun: string): string {
  return [
    `${formatCount(counts.imported, noun)} imported.`,
    ...getOtherCounts(counts).map((text) => `${text}.`),
  ].join(' ');
}

function describeDatabasePart(label: string, counts: ImportCounts): string {
  const parts = [`${counts.imported} imported`, ...getOtherCounts(counts)];
  return `${label}: ${parts.join(', ')}.`;
}

/** Applies the import and gives the message. */
function runImport(
  pending: PendingFileImport,
  selected: ReadonlySet<string>,
  choices: ReadonlyMap<string, ImportChoice>
): string {
  switch (pending.kind) {
    case 'leagues': {
      const steps = pickSteps(pending.steps, selected);
      const counts = importLeagues(steps, choices, pending.embedded);
      const added = counts.blueprintsAdded;
      const teams = added > 0 ? ` ${formatCount(added, 'team')} added.` : '';
      return `${describeEntityImport(counts, 'league')}${teams}`;
    }
    case 'blueprints': {
      const steps = pickSteps(pending.steps, selected);
      return describeEntityImport(importBlueprints(steps, choices), 'team');
    }
    case 'database': {
      const { blueprints, leagues } = importDatabase(pending.plan, choices);
      return [
        describeDatabasePart('Teams', blueprints),
        describeDatabasePart('Leagues', leagues),
      ].join(' ');
    }
  }
}

/**
 * Applies a file import: the picked items, and the choice for each conflict
 * by UUID. A conflict with no choice is skipped. The added items stay
 * unsaved until Ctrl+S, as each other change does (choice 11).
 */
export function applyFileImport(
  pending: PendingFileImport,
  selected: ReadonlySet<string>,
  choices: ReadonlyMap<string, ImportChoice>
): void {
  try {
    setStatusLine({ tone: 'info', message: runImport(pending, selected, choices) });
  } catch (error) {
    setStatusLine({ tone: 'error', message: getErrorMessage(error) });
  }
}
