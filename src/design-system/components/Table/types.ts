import type { ComponentChildren } from 'preact';

export type TableAlign = 'left' | 'center' | 'right';

/** The tone of one row (Task 155): the tint and the left stripe of a
 * position zone (US-12.5). */
export type TableRowTone = 'green' | 'blue' | 'yellow' | 'red';

export interface TableColumn<Row> {
  key: string;
  header: string;
  /** The full name of a short header, for example "Played" for "P": a hint
   * with a dotted underline, and the name a screen reader reads (US-12.3). */
  headerHint?: string;
  /** CSS grid track for this column's width. Defaults to "1fr". */
  width?: string;
  align?: TableAlign;
  render?: (row: Row) => ComponentChildren;
}

export default interface TableProps<Row> {
  /** The name a screen reader gives the table (`aria-label`). */
  label: string;
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Smaller gaps, padding, and text, for a table in a narrow card, such
   * as a group card (Task 131). Default (false) is the full-size table. */
  compact?: boolean;
  /** The tone of each row, or `undefined` for none. The screen decides what
   * a tone means, for example a position zone. */
  rowTone?: (row: Row) => TableRowTone | undefined;
}
