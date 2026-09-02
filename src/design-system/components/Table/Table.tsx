import type { ComponentChildren } from 'preact';
import styles from './Table.module.css';

export type TableAlign = 'left' | 'center' | 'right';

export interface TableColumn<Row> {
  key: string;
  header: string;
  /** CSS grid track for this column's width. Defaults to "1fr". */
  width?: string;
  align?: TableAlign;
  render?: (row: Row) => ComponentChildren;
}

export interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
}

const alignClass: Record<TableAlign, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
};

export function Table<Row>({ columns, rows, rowKey }: TableProps<Row>) {
  const gridTemplateColumns = columns.map((c) => c.width ?? '1fr').join(' ');

  return (
    <div class={styles.table}>
      <div class={styles.headerRow} style={{ gridTemplateColumns }} role="row">
        {columns.map((column) => (
          <span key={column.key} class={alignClass[column.align ?? 'left']}>
            {column.header}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={rowKey(row)}
          class={styles.row}
          style={{ gridTemplateColumns }}
          role="row"
        >
          {columns.map((column) => (
            <span key={column.key} class={alignClass[column.align ?? 'left']}>
              {column.render
                ? column.render(row)
                : String((row as Record<string, unknown>)[column.key])}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
