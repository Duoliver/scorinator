import { describe, expect, it } from 'vitest';
import { parseCsv, stringifyCsv } from './csv';

describe('parseCsv', () => {
  it('parses plain rows with no quoting', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('parses a quoted field with an embedded comma', () => {
    expect(parseCsv('name,note\n"Ada, Inc.",fine')).toEqual([
      ['name', 'note'],
      ['Ada, Inc.', 'fine'],
    ]);
  });

  it('parses a quoted field with an embedded doubled quote', () => {
    expect(parseCsv('name\n"Say ""hi"""')).toEqual([['name'], ['Say "hi"']]);
  });

  it('parses a quoted field with an embedded newline', () => {
    expect(parseCsv('name\n"line one\nline two"')).toEqual([
      ['name'],
      ['line one\nline two'],
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('stringifyCsv', () => {
  it('round-trips through parseCsv', () => {
    const rows = [
      ['name', 'note'],
      ['Ada, Inc.', 'Say "hi"'],
      ['plain', 'line one\nline two'],
    ];
    expect(parseCsv(stringifyCsv(rows))).toEqual(rows);
  });
});
