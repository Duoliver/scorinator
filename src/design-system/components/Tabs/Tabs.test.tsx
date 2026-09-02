import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';

const tabs = [
  { id: 'standings', label: 'Standings', content: <p>Standings content</p> },
  { id: 'fixtures', label: 'Fixtures', content: <p>Fixtures content</p> },
];

describe('Tabs', () => {
  it('renders a tab button per item', () => {
    render(<Tabs tabs={tabs} defaultTab="standings" />);
    expect(screen.getByRole('tab', { name: 'Standings' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Fixtures' })).toBeInTheDocument();
  });

  it('marks the defaultTab as selected and renders its content on mount', () => {
    render(<Tabs tabs={tabs} defaultTab="fixtures" />);
    expect(screen.getByRole('tab', { name: 'Fixtures' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Standings' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
    expect(screen.getByText('Fixtures content')).toBeInTheDocument();
    expect(screen.queryByText('Standings content')).not.toBeInTheDocument();
  });

  it('switches the selected tab and rendered content when a tab is clicked', async () => {
    render(<Tabs tabs={tabs} defaultTab="standings" />);
    expect(screen.getByText('Standings content')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));

    expect(screen.getByRole('tab', { name: 'Fixtures' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('Fixtures content')).toBeInTheDocument();
    expect(screen.queryByText('Standings content')).not.toBeInTheDocument();
  });

  it("calls onChange with the clicked tab's id", async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} defaultTab="standings" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    expect(onChange).toHaveBeenCalledWith('fixtures');
  });

  it('works without an onChange handler', async () => {
    render(<Tabs tabs={tabs} defaultTab="standings" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    expect(screen.getByText('Fixtures content')).toBeInTheDocument();
  });
});
