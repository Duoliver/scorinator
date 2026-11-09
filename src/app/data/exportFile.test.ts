import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  openBlueprintImportFile,
  openLeagueImportFile,
  readBlueprintImport,
  readLeagueImport,
  saveBlueprintsFile,
  saveLeagueFile,
  saveLeaguesFile,
  serializeBlueprintExport,
  serializeLeagueExport,
} from './exportFile';
import type { FileSystem, SaveFileDialog } from '@/persistence/types';

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
  'This file is part of a database folder. Use "Import entire database" with a .zip file.';

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

describe('the file dialogs of the File screen (Task 149)', () => {
  const TODAY = new Date(2026, 10, 9);
  const fakeFs = (contents = ''): FileSystem => ({
    readTextFile: vi.fn().mockResolvedValue(contents),
    writeTextFile: vi.fn().mockResolvedValue(undefined),
    readBinaryFile: vi.fn(),
    writeBinaryFile: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    exists: vi.fn(),
  });
  const fakeDialog = (path: string | null): SaveFileDialog => ({
    pickSavePath: vi.fn().mockResolvedValue(path),
    pickOpenPath: vi.fn().mockResolvedValue(path),
  });
  const JSON_FILTER = [{ name: 'JSON file', extensions: ['json'] }];

  it('saves the leagues under the default name with the date', async () => {
    const fs = fakeFs();
    const dialog = fakeDialog('/l.json');
    const path = await saveLeaguesFile(
      [leagueWrapper()],
      [blueprint()],
      TODAY,
      fs,
      dialog
    );
    expect(path).toBe('/l.json');
    expect(dialog.pickSavePath).toHaveBeenCalledWith(
      'scorinator-leagues-2026-11-09.json',
      JSON_FILTER
    );
    const written = vi.mocked(fs.writeTextFile).mock.calls[0][1];
    expect(parseLeagueFile(written).leagues).toHaveLength(1);
  });

  it('saves one league under its slug, with no date (US-10.1, Task 150)', async () => {
    const fs = fakeFs();
    const dialog = fakeDialog('/c.json');
    const path = await saveLeagueFile(leagueWrapper(), [blueprint()], fs, dialog);
    expect(path).toBe('/c.json');
    expect(dialog.pickSavePath).toHaveBeenCalledWith(
      'coastal-premier.json',
      JSON_FILTER
    );
    const written = vi.mocked(fs.writeTextFile).mock.calls[0][1];
    const file = parseLeagueFile(written);
    expect(file.leagues).toHaveLength(1);
    expect(file.blueprints.map((b) => b.uuid)).toEqual([SALT_MARSH]);
  });

  it('saves the Blueprints under the default name with the date', async () => {
    const fs = fakeFs();
    const dialog = fakeDialog('/b.json');
    await saveBlueprintsFile([blueprint()], TODAY, fs, dialog);
    expect(dialog.pickSavePath).toHaveBeenCalledWith(
      'scorinator-team-blueprints-2026-11-09.json',
      JSON_FILTER
    );
    expect(fs.writeTextFile).toHaveBeenCalledOnce();
  });

  it('gives null and writes nothing when the save dialog is canceled', async () => {
    const fs = fakeFs();
    expect(
      await saveBlueprintsFile([blueprint()], TODAY, fs, fakeDialog(null))
    ).toBeNull();
    expect(fs.writeTextFile).not.toHaveBeenCalled();
  });

  it('reads a league file from the open dialog', async () => {
    const text = serializeLeagueExport([leagueWrapper()], [blueprint()]);
    const dialog = fakeDialog('/l.json');
    const file = await openLeagueImportFile(fakeFs(text), dialog);
    expect(file?.leagues.map((league) => league.uuid)).toEqual([LEAGUE]);
    expect(dialog.pickOpenPath).toHaveBeenCalledWith(JSON_FILTER);
  });

  it('reads a Blueprint file from the open dialog', async () => {
    const text = serializeBlueprintExport([blueprint()]);
    const file = await openBlueprintImportFile(fakeFs(text), fakeDialog('/b.json'));
    expect(file?.map((b) => b.uuid)).toEqual([SALT_MARSH]);
  });

  it('gives null when the open dialog is canceled', async () => {
    expect(await openLeagueImportFile(fakeFs(), fakeDialog(null))).toBeNull();
    expect(await openBlueprintImportFile(fakeFs(), fakeDialog(null))).toBeNull();
  });

  it('rejects with the wrong-file text', async () => {
    const text = serializeBlueprintExport([blueprint()]);
    await expect(
      openLeagueImportFile(fakeFs(text), fakeDialog('/b.json'))
    ).rejects.toThrow('Use "Import teams"');
  });
});
