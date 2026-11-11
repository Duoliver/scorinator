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
  // Position zones (US-12.5): the stripe and legend colour, and the row tint.
  // The green tint `#EAF3EA` is the MVP2 handoff value of a qualifier row.
  zoneGreen: '#17551C',
  zoneGreenTint: '#EAF3EA',
  zoneBlue: '#1565C0',
  zoneBlueTint: '#E3EEF9',
  zoneYellow: '#9A7400',
  zoneYellowTint: '#FBF3D6',
  zoneRed: '#8C1414',
  zoneRedTint: '#F9E6E6',
  // Form dots (US-12.1).
  formWin: '#17551C',
  formDraw: '#545454',
  formLoss: '#8C1414',
  formFg: '#FFFFFF',
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
  // The red text of the `destructive-outline` button (Task 167).
  [colors.error, colors.surface],
  [colors.warningFg, colors.warning],
  [colors.fg, colors.warning],
  // The text of a row in a zone, and the letter of a Form dot (Task 152).
  [colors.fg, colors.zoneGreenTint],
  [colors.fg, colors.zoneBlueTint],
  [colors.fg, colors.zoneYellowTint],
  [colors.fg, colors.zoneRedTint],
  [colors.formFg, colors.formWin],
  [colors.formFg, colors.formDraw],
  [colors.formFg, colors.formLoss],
];

/**
 * A graphic that is not text must reach 3:1 against what is next to it
 * (WCAG 1.4.11). The stripe of a zone is on the tint of its row (Task 152).
 */
export const graphicPairs: Array<[graphic: string, background: string]> = [
  [colors.zoneGreen, colors.zoneGreenTint],
  [colors.zoneBlue, colors.zoneBlueTint],
  [colors.zoneYellow, colors.zoneYellowTint],
  [colors.zoneRed, colors.zoneRedTint],
];
