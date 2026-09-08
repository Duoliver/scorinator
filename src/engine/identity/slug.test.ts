import { describe, expect, it } from 'vitest';
import { slug } from './slug';

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
});
