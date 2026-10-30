import {
  parseManifest,
  parseWrapper,
  serializeManifest,
  serializeWrapper,
  DATABASE_FORMAT_VERSION,
  type SavedBlueprint,
  type SavedInstance,
  type SavedManifest,
  type SavedPhase,
  type SavedWrapper,
  type SavedWrapperSummary,
} from '@/adapters/json-io';
import type {
  LeagueWrapper,
  Manifest,
  Phase,
  TeamBlueprint,
  TeamInstance,
  WrapperSummary,
} from '@/domain';

/**
 * The map between the domain database records (Task 104) and the database
 * files of `adapters/json-io` (Task 106). The two shapes are the same today,
 * but each layer keeps its own types (`DOMAIN.md`), so each field is copied
 * here by name. This file is the only caller of the database parsers and
 * serializers.
 */

function blueprintToFile(blueprint: TeamBlueprint): SavedBlueprint {
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

function summaryToFile(row: WrapperSummary): SavedWrapperSummary {
  return {
    uuid: row.uuid,
    contentType: row.contentType,
    name: row.name,
    teamCount: row.teamCount,
    homeAdvantage: row.homeAdvantage,
    points: { ...row.points },
    phaseFormats: [...row.phaseFormats],
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
  return {
    format: phase.format,
    fixtures: phase.fixtures.map((fixture) => ({ ...fixture })),
    byes: phase.byes.map((bye) => ({ ...bye })),
    results: phase.results.map((result) => ({ ...result })),
  };
}

/** The file shapes and the domain shapes have the same fields, so the read
 * side copies the same way as the write side. */
const blueprintFromFile = (file: SavedBlueprint): TeamBlueprint =>
  blueprintToFile(file);
const summaryFromFile = (file: SavedWrapperSummary): WrapperSummary =>
  summaryToFile(file);
const instanceFromFile = (file: SavedInstance): TeamInstance => instanceToFile(file);
const phaseFromFile = (file: SavedPhase): Phase => phaseToFile(file);

export function serializeManifestRecord(manifest: Manifest): string {
  const file: SavedManifest = {
    kind: 'manifest',
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

export function serializeLeagueWrapper(wrapper: LeagueWrapper): string {
  const { content: league } = wrapper;
  const file: SavedWrapper = {
    kind: 'wrapper',
    formatVersion: DATABASE_FORMAT_VERSION,
    uuid: wrapper.uuid,
    teams: wrapper.teams.map(instanceToFile),
    content: {
      uuid: league.uuid,
      name: league.name,
      homeAdvantage: league.homeAdvantage,
      points: { ...league.points },
      createdByInstallation: league.createdByInstallation,
      lastModifiedByInstallation: league.lastModifiedByInstallation,
      phases: league.phases.map(phaseToFile),
    },
  };
  return serializeWrapper(file);
}

/** Throws the `parseWrapper` error for a bad file. */
export function parseLeagueWrapper(text: string): LeagueWrapper {
  const file = parseWrapper(text);
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
      phases: league.phases.map(phaseFromFile),
    },
  };
}
