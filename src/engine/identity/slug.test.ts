import { describe, expect, it } from 'vitest';
import { slug, uniqueSlug } from './slug';

describe('slug', () => {
  it('lowercases and hyphenates a plain name', () => {
    expect(slug('Salt Marsh United')).toBe('salt-marsh-united');
  });

  it('leaves an already-slugged name unchanged', () => {
    expect(slug('fc-united')).toBe('fc-united');
  });

  it('strips diacritics', () => {
    expect(slug('Réal Sociedad')).toBe('real-sociedad');
  });

  it('collapses punctuation and symbols into single hyphens', () => {
    expect(slug('Real C.F. & Co.')).toBe('real-c-f-co');
  });

  it('trims surrounding whitespace and symbols', () => {
    expect(slug('  !!!Wildcats!!!  ')).toBe('wildcats');
  });

  it('collapses repeated internal whitespace', () => {
    expect(slug('Harborview   SC')).toBe('harborview-sc');
  });

  it('keeps digits', () => {
    expect(slug('Hannover 96')).toBe('hannover-96');
  });

  it('throws a RangeError for a blank name', () => {
    expect(() => slug('')).toThrow(RangeError);
    expect(() => slug('   ')).toThrow(RangeError);
  });

  it('throws a RangeError for a symbols-only name', () => {
    expect(() => slug('!!!')).toThrow(RangeError);
  });

  it('gives an error text that fits a team name and a league name', () => {
    expect(() => slug('!!!')).toThrow(
      'Cannot make a slug from the name "!!!". The name needs at least one letter or number.'
    );
  });
});

describe('uniqueSlug', () => {
  it('returns the plain slug when it is free', () => {
    expect(uniqueSlug('Ashfield Rovers', ['harborview-sc'])).toBe('ashfield-rovers');
  });

  it('returns the plain slug when nothing is taken', () => {
    expect(uniqueSlug('Ashfield', [])).toBe('ashfield');
  });

  it('adds -2 when the plain slug is taken', () => {
    expect(uniqueSlug('Ashfield', ['ashfield'])).toBe('ashfield-2');
  });

  it('adds -3 when the plain slug and -2 are taken', () => {
    expect(uniqueSlug('Ashfield', ['ashfield', 'ashfield-2'])).toBe('ashfield-3');
  });

  it('takes the first free suffix, also in a gap', () => {
    expect(uniqueSlug('Ashfield', ['ashfield', 'ashfield-3'])).toBe('ashfield-2');
  });

  it('skips a suffix that a name with a number already holds', () => {
    // "Team 2" has the slug team-2, so a second "Team" goes to team-3.
    expect(uniqueSlug('Team', ['team', 'team-2'])).toBe('team-3');
  });

  it('adds a suffix to a name that ends in a number', () => {
    expect(uniqueSlug('Team 2', ['team-2'])).toBe('team-2-2');
  });

  it('accepts any iterable of taken slugs', () => {
    expect(uniqueSlug('Ashfield', new Set(['ashfield']))).toBe('ashfield-2');
  });

  it('gives no clash with the Blueprint itself when the caller leaves out its slug', () => {
    // A regenerate (US-09.5): the Blueprint holds "ashfield", and its name
    // still gives "ashfield". The caller leaves its own slug out of the list.
    const slugs = ['ashfield', 'harborview-sc'];
    const own = 'ashfield';
    expect(
      uniqueSlug(
        'Ashfield',
        slugs.filter((s) => s !== own)
      )
    ).toBe('ashfield');
  });

  it('does not change the taken list', () => {
    const taken = ['ashfield'];
    uniqueSlug('Ashfield', taken);
    expect(taken).toEqual(['ashfield']);
  });

  it('throws the same RangeError as slug() for a blank or symbols-only name', () => {
    expect(() => uniqueSlug('', [])).toThrow(RangeError);
    expect(() => uniqueSlug('!!!', ['ashfield'])).toThrow(
      'Cannot make a slug from the name "!!!". The name needs at least one letter or number.'
    );
  });
});
