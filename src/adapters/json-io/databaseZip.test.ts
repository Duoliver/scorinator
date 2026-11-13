import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import {
  DATABASE_FORMAT_VERSION,
  packDatabaseZip,
  serializeManifest,
  unpackDatabaseZip,
  type SavedManifest,
} from './index';

const INSTALLATION = '00000000-0000-4000-8000-000000000001';
const LEAGUE = '00000000-0000-4000-8000-0000000000b1';
const OTHER_LEAGUE = '00000000-0000-4000-8000-0000000000b2';
const PREFIX = 'This .zip file is not a Scorinator database: ';

function manifestText(rows: string[], seasons: string[] = []): string {
  const manifest: SavedManifest = {
    kind: 'manifest',
    formatVersion: DATABASE_FORMAT_VERSION,
    installationUuid: INSTALLATION,
    blueprints: [],
    wrappers: rows.map((uuid) => ({
      uuid,
      contentType: 'league',
      name: `League ${uuid.slice(-2)}`,
      teamCount: 2,
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      phases: [{ format: 'round-robin', legs: 'two-way' }],
      progress: { kind: 'completed' },
    })),
    seasons: seasons.map((uuid) => ({
      uuid,
      name: `Season ${uuid.slice(-2)}`,
      year: '1',
      finished: false,
      leagueCount: 0,
      teamCount: 0,
      playoffCount: 0,
    })),
  };
  return serializeManifest(manifest);
}

const bundle = {
  manifest: manifestText([LEAGUE, OTHER_LEAGUE]),
  wrappers: [
    { uuid: LEAGUE, contents: '{"league":"b1"}' },
    { uuid: OTHER_LEAGUE, contents: '{"league":"b2"}' },
  ],
  seasons: [],
};

/** A zip with the given files, as another tool makes it. */
const zipOf = (files: Record<string, string>): Uint8Array =>
  zipSync(Object.fromEntries(Object.entries(files).map(([n, t]) => [n, strToU8(t)])));

describe('the database .zip (US-10.4, Task 146)', () => {
  it('reads back the manifest and each wrapper text that it packs', () => {
    expect(unpackDatabaseZip(packDatabaseZip(bundle))).toEqual(bundle);
  });

  it('names the files as the database folder does', () => {
    const bytes = packDatabaseZip(bundle);
    const zipped = zipOf({
      'manifest.json': bundle.manifest,
      [`wrapper-${LEAGUE}.json`]: '{"league":"b1"}',
      [`wrapper-${OTHER_LEAGUE}.json`]: '{"league":"b2"}',
    });
    expect(unpackDatabaseZip(zipped)).toEqual(unpackDatabaseZip(bytes));
  });

  it('reads a database with no league', () => {
    const empty = { manifest: manifestText([]), wrappers: [], seasons: [] };
    expect(unpackDatabaseZip(packDatabaseZip(empty))).toEqual(empty);
  });

  it('skips a folder entry', () => {
    const zipped = zipSync({
      'manifest.json': strToU8(manifestText([])),
      'notes/': new Uint8Array(0),
    });
    expect(unpackDatabaseZip(zipped).wrappers).toEqual([]);
  });

  it('rejects a file that is not a zip', () => {
    expect(() => unpackDatabaseZip(strToU8('not a zip'))).toThrow(
      `${PREFIX}the file is not a zip file.`
    );
  });

  it('rejects a zip with no manifest.json', () => {
    expect(() => unpackDatabaseZip(zipOf({ 'other.json': '{}' }))).toThrow(
      `${PREFIX}it has no manifest.json.`
    );
  });

  it('rejects a manifest that is not valid, with the manifest error', () => {
    expect(() => unpackDatabaseZip(zipOf({ 'manifest.json': '{' }))).toThrow(
      `${PREFIX}manifest.json is not valid: the text is not JSON.`
    );
  });

  it('rejects a manifest row with no wrapper file', () => {
    const zipped = zipOf({
      'manifest.json': manifestText([LEAGUE]),
    });
    expect(() => unpackDatabaseZip(zipped)).toThrow(
      `${PREFIX}it has no file for the league "League b1".`
    );
  });

  it('rejects a file that a database does not have', () => {
    const zipped = zipOf({
      'manifest.json': manifestText([]),
      'notes.txt': 'hello',
    });
    expect(() => unpackDatabaseZip(zipped)).toThrow(
      `${PREFIX}it has a file that a database does not have: "notes.txt".`
    );
  });
});

describe('the Seasons in the database .zip (US-13.11, Task 209)', () => {
  const SEASON = '00000000-0000-4000-8000-0000000000c1';
  const withSeason = {
    manifest: manifestText([LEAGUE], [SEASON]),
    wrappers: [{ uuid: LEAGUE, contents: '{"league":"b1"}' }],
    seasons: [{ uuid: SEASON, contents: '{"season":"c1"}' }],
  };

  it('reads back each Season wrapper text, apart from the leagues', () => {
    expect(unpackDatabaseZip(packDatabaseZip(withSeason))).toEqual(withSeason);
  });

  it('names a Season file as the database folder does', () => {
    const zipped = zipOf({
      'manifest.json': withSeason.manifest,
      [`wrapper-${LEAGUE}.json`]: '{"league":"b1"}',
      [`wrapper-${SEASON}.json`]: '{"season":"c1"}',
    });
    expect(unpackDatabaseZip(zipped)).toEqual(withSeason);
  });

  it('rejects a zip with no file for a Season row', () => {
    const zipped = zipOf({
      'manifest.json': withSeason.manifest,
      [`wrapper-${LEAGUE}.json`]: '{"league":"b1"}',
    });
    expect(() => unpackDatabaseZip(zipped)).toThrow(
      `${PREFIX}it has no file for the Season "Season c1".`
    );
  });
});
