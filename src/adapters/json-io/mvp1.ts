import { SAVE_FORMAT_VERSION } from './types';

/**
 * True for a file from Scorinator MVP1: a league save file (format version
 * 1, with `league` and `teams`) or a teams JSON (a plain list). MVP2 does
 * not import these files, and the import shows a message for them (US-10.3,
 * Task 149). False for an MVP2 file, which has a `kind`, and for a text that
 * is not JSON.
 */
export function isMvp1File(text: string): boolean {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return false;
  }
  if (Array.isArray(raw)) return true;
  if (typeof raw !== 'object' || raw === null) return false;
  const file = raw as Record<string, unknown>;
  return (
    file.kind === undefined &&
    file.formatVersion === SAVE_FORMAT_VERSION &&
    'league' in file &&
    'teams' in file
  );
}
