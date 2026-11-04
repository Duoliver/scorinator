import { beforeEach, describe, expect, it } from 'vitest';
import { parseLeagueFile } from '@/adapters/json-io';
import type { TeamBlueprint } from '@/domain';
import {
  blueprint,
  HARBORVIEW,
  LEAGUE,
  leagueWrapper,
  openTestDatabase,
  result,
  SALT_MARSH,
  testUuid,
} from '@/test/databaseRecords';
import { importLeagues, planLeagueImport } from '@/app/state/importActions';
import { useDatabaseStore } from '@/app/state/databaseStore';
import { serializeLeagueWrapper, serializeManifestRecord } from './databaseFile';
import {
  readBlueprintImport,
  readLeagueImport,
  serializeBlueprintExport,
  serializeLeagueExport,
} from './exportFile';

const harborview = blueprint({
  uuid: HARBORVIEW,
  slug: 'harborview-sc',
  name: 'Harborview SC',
  colour: '#E53935',
  tier: 'C',
  location: '',
  trigrams: [],
});
const unrelated = blueprint({ uuid: testUuid(9), slug: 'nine', name: 'Nine' });
const played = leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)]);

const MVP1_TEXT =
  'This file is from Scorinator MVP1. MVP2 cannot import it. Move your teams with the CSV.';
const DATABASE_TEXT =
  'This file is part of a database folder. Use "Import database" with a .zip file.';

beforeEach(() => {
  useDatabaseStore.setState(useDatabaseStore.getInitialState(), true);
});

describe('the league export (US-10.1, US-10.2, Task 145)', () => {
  it('holds each league, and a snapshot of each Blueprint that an Instance names', () => {
    const text = serializeLeagueExport(
      [played, leagueWrapper([], testUuid(50))],
      [unrelated, blueprint(), harborview]
    );
    const file = parseLeagueFile(text);
    expect(file.leagues.map((league) => league.uuid)).toEqual([LEAGUE, testUuid(50)]);
    expect(file.blueprints.map((b) => b.uuid)).toEqual([SALT_MARSH, HARBORVIEW]);
  });

  it('has no snapshot of a deleted Blueprint (US-09.4)', () => {
    const file = parseLeagueFile(serializeLeagueExport([played], [blueprint()]));
    expect(file.blueprints.map((b) => b.uuid)).toEqual([SALT_MARSH]);
  });

  it('reads back the leagues and the snapshots as domain records', () => {
    const read = readLeagueImport(
      serializeLeagueExport([played], [blueprint(), harborview])
    );
    expect(read).toEqual({ leagues: [played], blueprints: [blueprint(), harborview] });
  });

  it('imports into an empty database with the same league and Blueprints (US-10.1, US-11.1)', async () => {
    const text = serializeLeagueExport([played], [blueprint(), harborview]);
    openTestDatabase();
    const read = readLeagueImport(text);
    importLeagues(await planLeagueImport(read.leagues), new Map(), read.blueprints);

    const state = useDatabaseStore.getState();
    expect(state.leagues[LEAGUE]).toEqual(played);
    expect(state.blueprints).toEqual([blueprint(), harborview]);
  });
});

describe('the Blueprint export (US-10.2, Task 145)', () => {
  it('reads back every Blueprint, with its UUID and provenance', () => {
    const all: TeamBlueprint[] = [blueprint(), harborview, unrelated];
    expect(readBlueprintImport(serializeBlueprintExport(all))).toEqual(all);
  });
});

describe('the wrong-file errors (US-10.3, choices 4 and 5)', () => {
  const leagueText = serializeLeagueExport([played], [blueprint()]);
  const blueprintText = serializeBlueprintExport([blueprint()]);
  const manifestText = serializeManifestRecord({
    installationUuid: testUuid(1),
    blueprints: [],
    wrappers: [],
  });
  const mvp1Teams = JSON.stringify([{ slug: 'a', name: 'A', colour: '', tier: 'B' }]);
  const mvp1Save = JSON.stringify({ formatVersion: 1, league: {}, teams: [] });

  it.each([
    [
      'a Blueprint file',
      blueprintText,
      'This is a team blueprints file. Use "Import teams" for it.',
    ],
    ['a manifest', manifestText, DATABASE_TEXT],
    ['a wrapper file', serializeLeagueWrapper(played), DATABASE_TEXT],
    ['an MVP1 save file', mvp1Save, MVP1_TEXT],
    ['an MVP1 teams JSON', mvp1Teams, MVP1_TEXT],
    [
      'a text that is not JSON',
      '{',
      'A league file is not valid: the text is not JSON.',
    ],
  ])('"Import leagues" rejects %s', (_name, text, message) => {
    expect(() => readLeagueImport(text)).toThrow(message);
  });

  it.each([
    [
      'a league file',
      leagueText,
      'This is a league file. Use "Import leagues" for it.',
    ],
    ['a manifest', manifestText, DATABASE_TEXT],
    ['an MVP1 teams JSON (choice 5)', mvp1Teams, MVP1_TEXT],
    ['an MVP1 save file', mvp1Save, MVP1_TEXT],
    [
      'a text that is not JSON',
      '{',
      'A team blueprints file is not valid: the text is not JSON.',
    ],
  ])('"Import teams" rejects %s', (_name, text, message) => {
    expect(() => readBlueprintImport(text)).toThrow(message);
  });
});
