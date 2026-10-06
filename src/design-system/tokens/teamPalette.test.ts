import { describe, expect, it } from 'vitest';
import { DEFAULT_TEAM_COLOUR, TEAM_PALETTE } from './teamPalette';

// These tests check the rules of the palette, not its values. The values are
// placeholders (MVP1 spec §1, Team Colours) and can change, so a palette
// change must not need a test change.
describe('TEAM_PALETTE', () => {
  it('has 16 entries', () => {
    expect(TEAM_PALETTE).toHaveLength(16);
  });

  it('gives every entry a 6-digit hex value', () => {
    for (const { hex } of TEAM_PALETTE) {
      expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('gives every entry a non-blank name', () => {
    for (const { name } of TEAM_PALETTE) {
      expect(name.trim()).not.toBe('');
    }
  });

  it('has unique names', () => {
    const names = TEAM_PALETTE.map(({ name }) => name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('has unique hex values, ignoring case', () => {
    const hexes = TEAM_PALETTE.map(({ hex }) => hex.toLowerCase());
    expect(new Set(hexes).size).toBe(hexes.length);
  });
});

describe('DEFAULT_TEAM_COLOUR', () => {
  it('is one of the palette hex values', () => {
    expect(TEAM_PALETTE.map(({ hex }) => hex)).toContain(DEFAULT_TEAM_COLOUR);
  });
});
