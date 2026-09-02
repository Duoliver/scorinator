import type TableProps from './types';
import type { TableColumn, TableAlign } from './types';
import styles from './Table.module.css';

export type { TableProps, TableColumn, TableAlign };

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
