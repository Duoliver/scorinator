import { isSlug } from '@/engine/identity';
import { isConditionLevel, type ConditionLevel } from '@/engine/tier-ovr';

const BYTE_ORDER_MARK = '﻿';

/** One team line of a slug list file: the slug as typed, and its condition
 * level (US-14.4). */
export interface SlugListEntry {
  slug: string;
  level: ConditionLevel;
}

/** A line whose level is not valid: its number in the file, and its text
 * after the trim (US-14.4). */
export interface SlugListBadLevel {
  line: number;
  text: string;
}

export interface SlugListFile {
  entries: SlugListEntry[];
  badLevels: SlugListBadLevel[];
}

/** The level of a level text, or `undefined` for a text that is not one.
 * A positive level can have a plus or not, and -0 is 0 (Task 228 choice 1). */
function readLevel(text: string): ConditionLevel | undefined {
  if (!/^[+-]?\d+$/.test(text)) return undefined;
  const level = Number(text);
  if (!isConditionLevel(level)) return undefined;
  return level === 0 ? 0 : level;
}

/**
 * Reads a slug list file (US-08.7, US-14.4): one Blueprint slug on each
 * line, in file order, with an optional condition level after a space, for
 * example `north-fc +1`. A line with no level gives level 0, so a file from
 * before the condition stays valid. It trims each line. It skips a blank
 * line and a line that starts with `#`, such as the comment line of the
 * US-10.5 export. The case and the duplicates stay as in the file: the
 * caller matches with no case, and skips a second copy (Task 120).
 *
 * A line with a level that is not valid gives level 0, and goes in
 * `badLevels`, so the import goes on (US-14.4). Throws for the first line
 * that is not a slug, or that has more than two parts, with its line
 * number in the file (Task 118 choice 3, Task 228 choice 2). A file with no
 * slug gives no entries.
 */
export function parseSlugList(text: string): SlugListFile {
  const body = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;
  const file: SlugListFile = { entries: [], badLevels: [] };
  body.split(/\r\n|\r|\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) return;
    const [slug, levelText, ...rest] = line.split(/\s+/);
    // Any case is a slug: the match with a Blueprint slug ignores case
    // (US-08.7, Task 118 choice 1).
    if (rest.length > 0 || !isSlug(slug)) {
      throw new Error(
        `Slug list line ${index + 1}, "${line}", is not a slug. Use only letters, digits, and hyphens, with no spaces or other characters.`
      );
    }
    const level = levelText === undefined ? 0 : readLevel(levelText);
    if (level === undefined) file.badLevels.push({ line: index + 1, text: line });
    file.entries.push({ slug, level: level ?? 0 });
  });
  return file;
}

/** The level as the file writes it: a plus on a positive level (US-14.4). */
function formatLevel(level: ConditionLevel): string {
  return level > 0 ? `+${level}` : String(level);
}

/**
 * Writes a slug list file (US-10.5, Task 148, US-14.4): a comment line with
 * the league name and the date, then one line for each team, in the given
 * order: the slug, a space, and the level, also for level 0. The caller
 * gives the date as text, for example `2026-10-28`, so this writer reads no
 * clock (choice 5). `parseSlugList` skips the comment line.
 */
export function serializeSlugList(input: {
  leagueName: string;
  date: string;
  teams: readonly SlugListEntry[];
}): string {
  const name = input.leagueName.trim() || 'Untitled league';
  const lines = [
    `# ${name} — final ranking, ${input.date}`,
    ...input.teams.map((team) => `${team.slug} ${formatLevel(team.level)}`),
  ];
  return `${lines.join('\n')}\n`;
}
