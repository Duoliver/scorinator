import { isSlug } from '@/engine/identity';

const BYTE_ORDER_MARK = '﻿';

/**
 * Reads a slug list file (US-08.7): one Blueprint slug on each line, in
 * file order. It trims each line. It skips a blank line and a line that
 * starts with `#`, such as the comment line of the US-10.5 export. The case
 * and the duplicates stay as in the file: the caller matches with no case,
 * and skips a second copy (Task 120).
 *
 * Throws for the first line that is not a slug, with its line number in
 * the file (Task 118 choice 3). A file with no slug gives `[]`.
 */
export function parseSlugList(text: string): string[] {
  const body = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;
  const slugs: string[] = [];
  body.split(/\r\n|\r|\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) return;
    // Any case is a slug: the match with a Blueprint slug ignores case
    // (US-08.7, Task 118 choice 1).
    if (!isSlug(line)) {
      throw new Error(
        `Slug list line ${index + 1}, "${line}", is not a slug. Use only letters, digits, and hyphens, with no spaces or other characters.`
      );
    }
    slugs.push(line);
  });
  return slugs;
}
