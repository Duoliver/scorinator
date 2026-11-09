/** The local date of `today` as `YYYY-MM-DD`, for a file name or a comment
 * line. */
export function getLocalDate(today: Date): string {
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}
