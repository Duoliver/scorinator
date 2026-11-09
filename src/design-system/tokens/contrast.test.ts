import { describe, expect, it } from 'vitest';
import { aaaTextPairs, colors, graphicPairs } from './tokens';

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const [rl, gl, bl] = [r, g, b].map(srgbToLinear);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('design tokens — WCAG AAA contrast', () => {
  it.each(aaaTextPairs)(
    '%s on %s meets the 7:1 AAA ratio for normal text',
    (foreground, background) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(7);
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
      expect(contrastRatio(graphic, background)).toBeGreaterThanOrEqual(3);
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
