/** The height of one place, in rem (choice 2). The SVG draws in `em` with
 * a font size of 1rem, so the place rows of the HTML columns line up. */
export const PLACE_HEIGHT = 1.75;

/** The smallest space for one matchday, in rem: a narrower box scrolls
 * sideways (choice 2). */
export const MIN_MATCHDAY_WIDTH = 1;

/** The space at each side of the plot, in percent, so the first and the
 * last points show in full. */
const EDGE = 2;

/** The x of a matchday, in percent of the plot width: the chart fills the
 * width of the tab (choice 2). One matchday sits in the middle. */
export function getMatchdayX(matchday: number, matchdays: number): number {
  if (matchdays <= 1) return 50;
  return EDGE + ((matchday - 1) / (matchdays - 1)) * (100 - 2 * EDGE);
}

/** The y of a place, in rem: the middle of its row, 1 at the top. */
export const getPlaceY = (place: number): number => (place - 0.5) * PLACE_HEIGHT;

/** "1st", "2nd", "3rd", "4th", "11th", "21st" (choice 8). */
export function formatOrdinal(place: number): string {
  const lastTwo = place % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${place}th`;
  const suffix = ['th', 'st', 'nd', 'rd'][place % 10] ?? 'th';
  return `${place}${suffix}`;
}
