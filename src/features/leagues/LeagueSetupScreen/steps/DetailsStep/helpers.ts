/** A points field value as a number, or `fallback` for a blank or
 * non-numeric value. */
export function parsePoints(value: string, fallback: number): number {
  if (value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
