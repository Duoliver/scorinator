export function formatLeagueCount(count: number): string {
  return `${count} league${count === 1 ? '' : 's'}`;
}
