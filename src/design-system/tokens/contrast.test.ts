import { describe, expect, it } from 'vitest';
import { aaaTextPairs, colors, graphicPairs } from './tokens';
import { getContrastRatio, hasLowGraphicContrast } from './contrast';

describe('design tokens — WCAG AAA contrast', () => {
  it.each(aaaTextPairs)(
    '%s on %s meets the 7:1 AAA ratio for normal text',
    (foreground, background) => {
      expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(7);
    }
  );

  it.each([
    [colors.fg, colors.zoneGreenTint],
    [colors.fg, colors.zoneBlueTint],
    [colors.fg, colors.zoneYellowTint],
    [colors.fg, colors.zoneRedTint],
    [colors.formFg, colors.formWin],
    [colors.formFg, colors.formDraw],
    [colors.formFg, colors.formLoss],
  ])('%s on %s is in the AAA list', (foreground, background) => {
    expect(aaaTextPairs).toContainEqual([foreground, background]);
  });
});

describe('design tokens — WCAG graphics contrast', () => {
  it.each(graphicPairs)(
    '%s on %s meets the 3:1 ratio for a graphic that is not text',
    (graphic, background) => {
      expect(getContrastRatio(graphic, background)).toBeGreaterThanOrEqual(3);
    }
  );

  it('checks the stripe of each zone (US-12.5)', () => {
    expect(graphicPairs).toEqual([
      [colors.zoneGreen, colors.zoneGreenTint],
      [colors.zoneBlue, colors.zoneBlueTint],
      [colors.zoneYellow, colors.zoneYellowTint],
      [colors.zoneRed, colors.zoneRedTint],
    ]);
  });
});

describe('getContrastRatio', () => {
  it('gives 21 for black on white, 1 for a colour on itself, in either order', () => {
    expect(getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(getContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
    expect(getContrastRatio('#1565C0', '#1565C0')).toBe(1);
  });

  it('reads lower case hex', () => {
    expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });
});

describe('hasLowGraphicContrast (Task 156 choice 3)', () => {
  it('is true below 3:1 on the page background', () => {
    expect(hasLowGraphicContrast('#FAFAFA')).toBe(true); // White
    expect(hasLowGraphicContrast('#E8D9A8')).toBe(true); // Sand
    expect(hasLowGraphicContrast('#9E9E9E')).toBe(true); // Grey, 2.39:1
  });

  it('is false at 3:1 or more, and for a value that is not a hex colour', () => {
    expect(hasLowGraphicContrast('#1565C0')).toBe(false); // Blue
    expect(hasLowGraphicContrast('#E53935')).toBe(false); // Red
    expect(hasLowGraphicContrast('')).toBe(false);
    expect(hasLowGraphicContrast('red')).toBe(false);
  });
});
