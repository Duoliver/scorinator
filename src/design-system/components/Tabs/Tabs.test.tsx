import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

const tabs = [
  { id: 'standings', label: 'Standings' },
  { id: 'fixtures', label: 'Fixtures' },
];

describe('Tabs', () => {
  it('renders a tab per item', () => {
    render(<Tabs tabs={tabs} activeId="standings" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Standings' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Fixtures' })).toBeInTheDocument();
  });

  it('marks the active tab as selected', () => {
    render(<Tabs tabs={tabs} activeId="fixtures" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Fixtures' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Standings' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it("calls onChange with the clicked tab's id", async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeId="standings" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    expect(onChange).toHaveBeenCalledWith('fixtures');
  });
});
