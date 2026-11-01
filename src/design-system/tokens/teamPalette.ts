/**
 * The 24-colour palette a team colour is picked from (US-09.7, Task 101), in
 * 3 rows of 8, ordered by hue. This file is the one place that holds the
 * palette values: to change the palette, edit this file only.
 *
 * A team stores its hex value, not a palette entry, so a palette change does
 * not recolour existing teams: their old colour matches no swatch any more.
 * Task 114 changed Orange, Gold, Sky Blue, and Blue, with no map from the
 * old values (US-09.7).
 *
 * No CSS variable mirrors these values: a swatch gets its colour from data at
 * runtime, through a `style` prop.
 */
export interface TeamPaletteEntry {
  name: string;
  hex: string;
}

/** White is the colour of a new team: it is the traditional colour of an
 * away kit, and probably the cheapest kit to make. */
const WHITE: TeamPaletteEntry = { name: 'White', hex: '#FAFAFA' };

export const TEAM_PALETTE: readonly TeamPaletteEntry[] = [
  { name: 'Red', hex: '#E53935' },
  { name: 'Coral', hex: '#FF7043' },
  { name: 'Orange', hex: '#F57C00' },
  { name: 'Gold', hex: '#FFB300' },
  { name: 'Yellow', hex: '#FDD835' },
  { name: 'Lime', hex: '#A4C639' },
  { name: 'Olive', hex: '#827717' },
  { name: 'Green', hex: '#2E7D32' },
  { name: 'Bottle Green', hex: '#1B4D2E' },
  { name: 'Teal', hex: '#00897B' },
  { name: 'Turquoise', hex: '#26C6DA' },
  { name: 'Sky Blue', hex: '#64B5F6' },
  { name: 'Blue', hex: '#1565C0' },
  { name: 'Navy', hex: '#1A237E' },
  { name: 'Lavender', hex: '#B39DDB' },
  { name: 'Purple', hex: '#6A1B9A' },
  { name: 'Pink', hex: '#D81B60' },
  { name: 'Light Pink', hex: '#F48FB1' },
  { name: 'Maroon', hex: '#7B1E1E' },
  { name: 'Brown', hex: '#6D4C41' },
  { name: 'Sand', hex: '#E8D9A8' },
  { name: 'Black', hex: '#212121' },
  { name: 'Grey', hex: '#9E9E9E' },
  WHITE,
];

export const DEFAULT_TEAM_COLOUR = WHITE.hex;
