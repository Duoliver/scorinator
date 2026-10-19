/** The text of a caught error, for the status line. A caught value is not
 * always an `Error`: a Tauri plugin rejects with a plain string, and
 * `(error as Error).message` gives `undefined` for it. */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
