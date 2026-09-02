/**
 * Plain-JS mirror of the colour values in `tokens.css`. Exists because the
 * automated AAA contrast check (contrast.test.ts) needs real hex values to
 * compute luminance ratios — CSS custom properties can't be read outside a
 * DOM. `tokens.css.test.ts` asserts every value here matches `tokens.css`
 * so the two can't silently drift.
 */
export const colors = {
  bg: '#F2F2F0',
  surface: '#FFFFFF',
  fg: '#1A1A1A',
  fgMuted: '#5C5C5C',
  accent: '#17551C',
  accentFg: '#FFFFFF',
  error: '#8C1414',
  errorFg: '#FFFFFF',
  warning: '#D9A900',
  warningFg: '#1A1A1A',
} as const;

/**
 * Pairings the design brief requires to meet WCAG AAA (7:1 for normal text).
 *
 * `fgMuted` is intentionally excluded — it's used for disabled/de-emphasized
 * elements, not primary text, and only reaches ~6.69:1 on `surface`. See the
 * "Known contrast exception" note at the end of `docs/design-reference/README.md`.
 */
export const aaaTextPairs: Array<[foreground: string, background: string]> = [
  [colors.fg, colors.bg],
  [colors.fg, colors.surface],
  [colors.accentFg, colors.accent],
  [colors.errorFg, colors.error],
  [colors.warningFg, colors.warning],
  [colors.fg, colors.warning],
];
