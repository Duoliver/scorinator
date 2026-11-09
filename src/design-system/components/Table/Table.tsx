import type { JSX } from 'preact';
import { Tooltip } from '@/design-system/components/Tooltip';
import type TableProps from './types';
import type { TableColumn, TableAlign, TableRowTone } from './types';
import styles from './Table.module.css';

export type { TableProps, TableColumn, TableAlign, TableRowTone };

const alignClass: Record<TableAlign, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
};

export function Table<Row>({
  label,
  columns,
  rows,
  rowKey,
  compact,
  rowTone,
}: TableProps<Row>): JSX.Element {
  const gridTemplateColumns = columns.map((c) => c.width ?? '1fr').join(' ');

  return (
    <div
      class={`${styles.table} ${compact ? styles.compact : ''}`}
      role="table"
      aria-label={label}
    >
      <div class={styles.headerRow} style={{ gridTemplateColumns }} role="row">
        {columns.map((column) => (
          <span
            key={column.key}
            class={alignClass[column.align ?? 'left']}
            role="columnheader"
            aria-label={column.headerHint}
          >
            {column.headerHint ? (
              <Tooltip underline content={column.headerHint}>
                {column.header}
              </Tooltip>
            ) : (
              column.header
            )}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={rowKey(row)}
          class={styles.row}
          style={{ gridTemplateColumns }}
          role="row"
          data-tone={rowTone?.(row)}
        >
          {columns.map((column) => (
            <span
              key={column.key}
              class={alignClass[column.align ?? 'left']}
              role="cell"
            >
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
