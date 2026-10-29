import type { RandomBytes } from './types';

const UUID_BYTES = 16;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Makes a UUID v4 (RFC 9562) from 16 bytes of the injected source: the
 * permanent identity of a Blueprint or a league (US-11.1). It sets the
 * version and variant bits, so any 16 bytes give a valid UUID, and the same
 * bytes always give the same UUID. The result is lower case.
 *
 * Throws a `RangeError` if the source gives a number of bytes other than 16.
 */
export function uuidV4(randomBytes: RandomBytes): string {
  const bytes = randomBytes(UUID_BYTES);
  if (bytes.length !== UUID_BYTES) {
    throw new RangeError(
      `A UUID needs ${UUID_BYTES} random bytes. The source gave ${bytes.length}.`
    );
  }

  const parts = Array.from(bytes, (byte, i) => {
    if (i === 6) return (byte & 0x0f) | 0x40; // version 4
    if (i === 8) return (byte & 0x3f) | 0x80; // variant 10xx
    return byte;
  });
  const hex = parts.map((byte) => byte.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/** True for a lowercase UUID v4 string. A file parser calls it on a value it
 * reads, before it trusts the value as an identity (Task 106). Upper case is
 * rejected: the app writes lower case only, so two UUIDs compare as plain
 * strings. */
export function isUuidV4(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4.test(value);
}
