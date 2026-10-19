/** A team count with the right plural: `1 team`, `2 teams`. It lives here,
 * not in a screen folder, because both the Teams screen and the league
 * screens show it (`FEATURES.md`). */
export function formatTeamCount(count: number): string {
  return `${count} team${count === 1 ? '' : 's'}`;
}
