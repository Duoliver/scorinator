/**
 * The 16-colour palette a team colour is picked from (MVP1 spec §1, Team
 * Colours). This file is the one place that holds the palette values: to
 * change the palette, edit this file only.
 *
 * The values are placeholders, taken from the Foundations and Teams screens
 * of the design handoff. A later design pass can change them. A team stores
 * its hex value, not a palette entry, so a palette change does not recolour
 * existing teams — their old colour simply matches no swatch any more.
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
  { name: 'Maroon', hex: '#7B1E1E' },
  { name: 'Orange', hex: '#FB8C00' },
  { name: 'Gold', hex: '#F9A825' },
  { name: 'Yellow', hex: '#FDD835' },
  { name: 'Olive', hex: '#827717' },
  { name: 'Green', hex: '#2E7D32' },
  { name: 'Teal', hex: '#00897B' },
  { name: 'Sky Blue', hex: '#039BE5' },
  { name: 'Navy', hex: '#1A237E' },
  { name: 'Blue', hex: '#1E88E5' },
  { name: 'Purple', hex: '#6A1B9A' },
  { name: 'Pink', hex: '#D81B60' },
  { name: 'Black', hex: '#212121' },
  { name: 'Grey', hex: '#9E9E9E' },
  WHITE,
];

export const DEFAULT_TEAM_COLOUR = WHITE.hex;
