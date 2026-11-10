import {
  parseManifest,
  parseWrapper,
  serializeManifest,
  serializeWrapper,
  DATABASE_FORMAT_VERSION,
  type SavedBlueprint,
  type SavedInstance,
  type SavedLeagueEntry,
  type SavedManifest,
  type SavedPhase,
  type SavedWrapper,
  type SavedWrapperSummary,
  SavedFileKind,
} from '@/adapters/json-io';
import { type PhasePlan, type PlanZone, PhaseFormat } from '@/engine/phases';
import type {
  LeagueWrapper,
  Manifest,
  Phase,
  PhaseSummary,
  TeamBlueprint,
  TeamInstance,
  WrapperSummary,
} from '@/domain';

/**
 * The map between the domain database records (Task 104) and the database
 * files of `adapters/json-io` (Task 106). The two shapes are the same today,
 * but each layer keeps its own types (`DOMAIN.md`), so each field is copied
 * here by name. This file is the only caller of the database parsers and
 * serializers. `exportFile.ts` reuses its maps for the export files.
 */

export function blueprintToFile(blueprint: TeamBlueprint): SavedBlueprint {
  return {
    uuid: blueprint.uuid,
    slug: blueprint.slug,
    name: blueprint.name,
    colour: blueprint.colour,
    tier: blueprint.tier,
    location: blueprint.location,
    trigrams: [...blueprint.trigrams],
    createdByInstallation: blueprint.createdByInstallation,
    lastModifiedByInstallation: blueprint.lastModifiedByInstallation,
  };
}

function phaseSummaryCopy(phase: PhaseSummary): PhaseSummary {
  return phase.format === PhaseFormat.BRACKET
    ? { format: PhaseFormat.BRACKET }
    : { format: phase.format, legs: phase.legs };
}

/** A copy of a phase plan (Task 176). The plan type is the engine type, in
 * the domain and in the file, so one copy serves both ways. */
function planCopy(plan: PhasePlan): PhasePlan {
  switch (plan.format) {
    case PhaseFormat.BRACKET:
      return plan.rules
        ? { format: PhaseFormat.BRACKET, rules: { ...plan.rules } }
        : { format: PhaseFormat.BRACKET };
    case PhaseFormat.ROUND_ROBIN:
      return {
        format: PhaseFormat.ROUND_ROBIN,
        legs: plan.legs,
        ...(plan.advance ? { advance: { top: plan.advance.top } } : {}),
        ...zonesCopy(plan.zones),
      };
    case PhaseFormat.GROUPS:
      return {
        format: PhaseFormat.GROUPS,
        legs: plan.legs,
        grouping: { ...plan.grouping },
        ...(plan.advance ? { advance: { ...plan.advance } } : {}),
        ...zonesCopy(plan.zones),
      };
  }
}

/** A copy of the zones of a plan (Task 155), or no field for a plan with
 * no zone list. */
function zonesCopy(zones: PlanZone[] | undefined): { zones?: PlanZone[] } {
  if (!zones) return {};
  return {
    zones: zones.map((zone) => ({
      colour: zone.colour,
      ...(zone.places ? { places: { ...zone.places } } : {}),
      label: zone.label,
    })),
  };
}

function summaryToFile(row: WrapperSummary): SavedWrapperSummary {
  return {
    uuid: row.uuid,
    contentType: row.contentType,
    name: row.name,
    teamCount: row.teamCount,
    homeAdvantage: row.homeAdvantage,
    points: { ...row.points },
    phases: row.phases.map(phaseSummaryCopy),
    progress: { ...row.progress },
  };
}

function instanceToFile(team: TeamInstance): SavedInstance {
  return {
    blueprintUuid: team.blueprintUuid,
    slug: team.slug,
    name: team.name,
    colour: team.colour,
    tier: team.tier,
    ovr: team.ovr,
    trigram: team.trigram,
  };
}

function phaseToFile(phase: Phase): SavedPhase {
  if (phase.format === PhaseFormat.BRACKET) {
    return {
      format: PhaseFormat.BRACKET,
      seeds: [...phase.seeds],
      byeTeams: [...phase.byeTeams],
      results: structuredClone(phase.results),
      ...(phase.avoidGroupTies ? { avoidGroupTies: true } : {}),
    };
  }
  const fixtures = phase.fixtures.map((fixture) => ({ ...fixture }));
  const results = phase.results.map((result) => ({ ...result }));
  if (phase.format === PhaseFormat.GROUPS) {
    return {
      format: PhaseFormat.GROUPS,
      legs: phase.legs,
      groups: phase.groups.map((group) => [...group]),
      fixtures,
      byes: phase.byes.map((bye) => ({ ...bye })),
      results,
    };
  }
  return {
    format: PhaseFormat.ROUND_ROBIN,
    legs: phase.legs,
    fixtures,
    byes: phase.byes.map((bye) => ({ ...bye })),
    results,
  };
}

/** The file shapes and the domain shapes have the same fields, so the read
 * side copies the same way as the write side. */
export const blueprintFromFile = (file: SavedBlueprint): TeamBlueprint =>
  blueprintToFile(file);
const summaryFromFile = (file: SavedWrapperSummary): WrapperSummary =>
  summaryToFile(file);
const instanceFromFile = (file: SavedInstance): TeamInstance => instanceToFile(file);
const phaseFromFile = (file: SavedPhase): Phase => phaseToFile(file);

export function serializeManifestRecord(manifest: Manifest): string {
  const file: SavedManifest = {
    kind: SavedFileKind.MANIFEST,
    formatVersion: DATABASE_FORMAT_VERSION,
    installationUuid: manifest.installationUuid,
    blueprints: manifest.blueprints.map(blueprintToFile),
    wrappers: manifest.wrappers.map(summaryToFile),
  };
  return serializeManifest(file);
}

/** Throws the `parseManifest` error for a bad file. */
export function parseManifestRecord(text: string): Manifest {
  const file = parseManifest(text);
  return {
    installationUuid: file.installationUuid,
    blueprints: file.blueprints.map(blueprintFromFile),
    wrappers: file.wrappers.map(summaryFromFile),
  };
}

/** The league and its Instances in the file shape: the body of a wrapper
 * file, and one item of a league file (Task 145). */
export function leagueToFile(wrapper: LeagueWrapper): SavedLeagueEntry {
  const { content: league } = wrapper;
  return {
    uuid: wrapper.uuid,
    teams: wrapper.teams.map(instanceToFile),
    content: {
      uuid: league.uuid,
      name: league.name,
      homeAdvantage: league.homeAdvantage,
      points: { ...league.points },
      createdByInstallation: league.createdByInstallation,
      lastModifiedByInstallation: league.lastModifiedByInstallation,
      plans: league.plans.map(planCopy),
      phases: league.phases.map(phaseToFile),
    },
  };
}

/** The domain league of a wrapper file body or a league file item. */
export function leagueFromFile(file: SavedLeagueEntry): LeagueWrapper {
  const { content: league } = file;
  return {
    uuid: file.uuid,
    teams: file.teams.map(instanceFromFile),
    content: {
      uuid: league.uuid,
      name: league.name,
      homeAdvantage: league.homeAdvantage,
      points: { ...league.points },
      createdByInstallation: league.createdByInstallation,
      lastModifiedByInstallation: league.lastModifiedByInstallation,
      plans: league.plans.map(planCopy),
      phases: league.phases.map(phaseFromFile),
    },
  };
}

export function serializeLeagueWrapper(wrapper: LeagueWrapper): string {
  const file: SavedWrapper = {
    kind: SavedFileKind.WRAPPER,
    formatVersion: DATABASE_FORMAT_VERSION,
    ...leagueToFile(wrapper),
  };
  return serializeWrapper(file);
}

/** Throws the `parseWrapper` error for a bad file. */
export function parseLeagueWrapper(text: string): LeagueWrapper {
  return leagueFromFile(parseWrapper(text));
}
