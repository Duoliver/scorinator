import type { ComponentChildren } from 'preact';

export type TableAlign = 'left' | 'center' | 'right';

export interface TableColumn<Row> {
  key: string;
  header: string;
  /** CSS grid track for this column's width. Defaults to "1fr". */
  width?: string;
  align?: TableAlign;
  render?: (row: Row) => ComponentChildren;
}

export default interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
}
