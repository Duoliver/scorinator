import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
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
    render(
      <Table label="Standings" columns={columns} rows={rows} rowKey={(r) => r.id} />
    );
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Pts')).toBeInTheDocument();
  });

  it('renders one row per data entry, cell values stringified from the row', () => {
    render(
      <Table label="Standings" columns={columns} rows={rows} rowKey={(r) => r.id} />
    );
    expect(screen.getByText('Salt Marsh United')).toBeInTheDocument();
    expect(screen.getByText('Harborview SC')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();
  });

  it('renders no data rows, only the header row, when given an empty list', () => {
    render(
      <Table label="Standings" columns={columns} rows={[]} rowKey={(r) => r.id} />
    );
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('gives screen readers a table, with a column header for each column', () => {
    render(
      <Table label="Standings" columns={columns} rows={rows} rowKey={(r) => r.id} />
    );
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual(['#', 'Team', 'Pts']);
  });

  it('names the table with its label, for screen readers', () => {
    render(
      <Table label="Standings" columns={columns} rows={rows} rowKey={(r) => r.id} />
    );
    expect(screen.getByRole('table', { name: 'Standings' })).toBeInTheDocument();
  });

  it('gives each data row one cell for each column, and no column header', () => {
    render(
      <Table label="Standings" columns={columns} rows={rows} rowKey={(r) => r.id} />
    );
    const [, first] = screen.getAllByRole('row');
    expect(
      within(first)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual(['1', 'Salt Marsh United', '19']);
    expect(within(first).queryByRole('columnheader')).not.toBeInTheDocument();
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
    render(
      <Table
        label="Standings"
        columns={customColumns}
        rows={rows}
        rowKey={(r) => r.id}
      />
    );
    expect(screen.getByText('19 pts')).toBeInTheDocument();
  });
});
