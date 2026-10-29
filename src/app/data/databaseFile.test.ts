import { describe, expect, it } from 'vitest';
import type { Manifest } from '@/domain';
import {
  blueprint,
  HARBORVIEW,
  INSTALLATION,
  leagueWrapper,
  result,
  SALT_MARSH,
} from '@/test/databaseRecords';
import {
  parseLeagueWrapper,
  parseManifestRecord,
  serializeLeagueWrapper,
  serializeManifestRecord,
} from './databaseFile';

const manifest = (): Manifest => ({
  installationUuid: INSTALLATION,
  blueprints: [
    blueprint(),
    blueprint({ uuid: HARBORVIEW, slug: 'harborview-sc', location: '' }),
  ],
  wrappers: [
    {
      uuid: leagueWrapper().uuid,
      contentType: 'league',
      name: 'Coastal Premier',
      teamCount: 2,
      homeAdvantage: true,
      points: { win: 3, draw: 1, loss: 0 },
      phaseFormats: ['round-robin'],
      progress: { kind: 'phase', phase: 1, matchday: 2, matchdays: 2 },
    },
  ],
});

describe('the manifest map (Task 108)', () => {
  it('gives the same manifest after a round trip', () => {
    expect(parseManifestRecord(serializeManifestRecord(manifest()))).toEqual(
      manifest()
    );
  });

  it('writes the MVP2 file format, with its kind and version', () => {
    const file = JSON.parse(serializeManifestRecord(manifest()));
    expect(file.kind).toBe('manifest');
    expect(file.formatVersion).toBe(2);
  });

  it('gives the parser error for a bad file', () => {
    expect(() => parseManifestRecord('{}')).toThrow('manifest.json is not valid:');
  });
});

describe('the wrapper map (Task 108)', () => {
  it('gives the same wrapper after a round trip, with its results', () => {
    const wrapper = leagueWrapper([result('p1.g1.md1.m1', SALT_MARSH, HARBORVIEW)]);
    expect(parseLeagueWrapper(serializeLeagueWrapper(wrapper))).toEqual(wrapper);
  });

  it('writes the MVP2 file format, with its kind and version', () => {
    const file = JSON.parse(serializeLeagueWrapper(leagueWrapper()));
    expect(file.kind).toBe('wrapper');
    expect(file.formatVersion).toBe(2);
  });

  it('gives the parser error for a bad file', () => {
    expect(() => parseLeagueWrapper('[]')).toThrow('A league file is not valid:');
  });
});
