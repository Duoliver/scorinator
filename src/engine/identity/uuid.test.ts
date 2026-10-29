import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/engine/rng';
import { isUuidV4, uuidV4, type RandomBytes } from './index';

function fixedBytes(bytes: readonly number[]): RandomBytes {
  return (length) => Uint8Array.from(bytes.slice(0, length));
}

function seededBytes(seed: number): RandomBytes {
  const rng = createSeededRng(seed);
  return (length) => Uint8Array.from({ length }, () => Math.floor(rng() * 256));
}

const COUNTING = Array.from({ length: 16 }, (_, i) => i);

describe('uuidV4', () => {
  it('gives the same UUID for the same source bytes', () => {
    expect(uuidV4(fixedBytes(COUNTING))).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
  });

  it('sets the version and variant bits on all-zero bytes', () => {
    expect(uuidV4(fixedBytes(new Array(16).fill(0x00)))).toBe(
      '00000000-0000-4000-8000-000000000000'
    );
  });

  it('sets the version and variant bits on all-0xff bytes', () => {
    expect(uuidV4(fixedBytes(new Array(16).fill(0xff)))).toBe(
      'ffffffff-ffff-4fff-bfff-ffffffffffff'
    );
  });

  it('asks the source for 16 bytes', () => {
    const lengths: number[] = [];
    uuidV4((length) => {
      lengths.push(length);
      return new Uint8Array(length);
    });
    expect(lengths).toEqual([16]);
  });

  it('throws a RangeError when the source gives a number of bytes other than 16', () => {
    expect(() => uuidV4(() => new Uint8Array(15))).toThrow(RangeError);
    expect(() => uuidV4(() => new Uint8Array(17))).toThrow(RangeError);
  });

  it('makes valid UUIDs with no duplicate from one seeded source', () => {
    const source = seededBytes(103);
    const uuids = Array.from({ length: 10_000 }, () => uuidV4(source));
    expect(uuids.every(isUuidV4)).toBe(true);
    expect(new Set(uuids).size).toBe(uuids.length);
  });
});

describe('isUuidV4', () => {
  it('accepts a lowercase UUID v4 with each of the four variants', () => {
    for (const variant of ['8', '9', 'a', 'b']) {
      expect(isUuidV4(`00010203-0405-4607-${variant}809-0a0b0c0d0e0f`)).toBe(true);
    }
  });

  it('rejects upper case', () => {
    expect(isUuidV4('00010203-0405-4607-8809-0A0B0C0D0E0F')).toBe(false);
  });

  it('rejects the nil UUID', () => {
    expect(isUuidV4('00000000-0000-0000-0000-000000000000')).toBe(false);
  });

  it('rejects another version', () => {
    expect(isUuidV4('00010203-0405-1607-8809-0a0b0c0d0e0f')).toBe(false);
    expect(isUuidV4('00010203-0405-7607-8809-0a0b0c0d0e0f')).toBe(false);
  });

  it('rejects a bad variant', () => {
    expect(isUuidV4('00010203-0405-4607-c809-0a0b0c0d0e0f')).toBe(false);
    expect(isUuidV4('00010203-0405-4607-7809-0a0b0c0d0e0f')).toBe(false);
  });

  it('rejects a bad form', () => {
    expect(isUuidV4('')).toBe(false);
    expect(isUuidV4('000102030405460788090a0b0c0d0e0f')).toBe(false);
    expect(isUuidV4(' 00010203-0405-4607-8809-0a0b0c0d0e0f')).toBe(false);
    expect(isUuidV4('00010203-0405-4607-8809-0a0b0c0d0e0g')).toBe(false);
  });

  it('rejects a value that is not a string', () => {
    expect(isUuidV4(undefined)).toBe(false);
    expect(isUuidV4(null)).toBe(false);
    expect(isUuidV4(42)).toBe(false);
    expect(isUuidV4({})).toBe(false);
  });
});
