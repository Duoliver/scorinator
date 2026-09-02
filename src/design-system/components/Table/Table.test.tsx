import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { Table, type TableColumn } from './Table';

interface StandingsRow {
  id: string;
  pos: number;
  name: string;
  pts: number;
}

const columns: TableColumn<StandingsRow>[] = [
  { key: 'pos', header: '#', width: '40px' },
  { key: 'name', header: 'Team' },
  { key: 'pts', header: 'Pts', width: '56px', align: 'right' },
];

const rows: StandingsRow[] = [
  { id: 'a', pos: 1, name: 'Salt Marsh United', pts: 19 },
  { id: 'b', pos: 2, name: 'Harborview SC', pts: 16 },
];

describe('Table', () => {
  it('renders a header cell per column', () => {
    render(<Table columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Pts')).toBeInTheDocument();
  });

  it('renders one row per data entry, cell values stringified from the row', () => {
    render(<Table columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getByText('Salt Marsh United')).toBeInTheDocument();
    expect(screen.getByText('Harborview SC')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();
  });

  it('renders no data rows, only the header row, when given an empty list', () => {
    render(<Table columns={columns} rows={[]} rowKey={(r) => r.id} />);
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it("uses a column's custom render function instead of the raw value", () => {
    const customColumns: TableColumn<StandingsRow>[] = [
      ...columns.slice(0, 2),
      {
        key: 'pts',
        header: 'Pts',
        render: (row) => `${row.pts} pts`,
      },
    ];
    render(<Table columns={customColumns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getByText('19 pts')).toBeInTheDocument();
  });
});
