import { colors } from './tokens';

/**
 * The WCAG contrast ratio of two colours (WCAG 2.x relative luminance),
 * from 1 to 21. Each colour is a `#RRGGBB` hex value, in any case. The
 * token test checks the token pairs with it, and the position chart checks
 * a team colour (Task 156).
 */
export function getContrastRatio(hexA: string, hexB: string): number {
  const lighter = Math.max(getRelativeLuminance(hexA), getRelativeLuminance(hexB));
  const darker = Math.min(getRelativeLuminance(hexA), getRelativeLuminance(hexB));
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) =>
    toLinear(parseInt(hex.slice(start, start + 2), 16))
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

const HEX_COLOUR = /^#[0-9a-f]{6}$/i;

/** The WCAG level for a graphic that is not text (WCAG 1.4.11). */
const GRAPHIC_CONTRAST = 3;

/**
 * True for a colour below 3:1 on the page background (`--color-bg`): a
 * line or a mark in this colour needs a dark outline to show (Task 156
 * choice 3). A value that is not a `#RRGGBB` colour gives false.
 */
export function hasLowGraphicContrast(hex: string): boolean {
  if (!HEX_COLOUR.test(hex)) return false;
  return getContrastRatio(hex, colors.bg) < GRAPHIC_CONTRAST;
}
