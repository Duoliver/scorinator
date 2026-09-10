import { createRef } from 'preact';
import { act } from 'preact/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Tabs } from './Tabs';
import type { FieldHandle } from '../../field';

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

  it('exposes the active tab id through the ref, matching the clicked tab', async () => {
    const ref = createRef<FieldHandle<string>>();
    render(<Tabs tabs={tabs} defaultTab="standings" ref={ref} />);
    expect(ref.current?.getValue()).toBe('standings');
    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    expect(ref.current?.getValue()).toBe('fixtures');
  });

  it('switches the active tab from outside via ref.setValue, with no onChange call', () => {
    const onChange = vi.fn();
    const ref = createRef<FieldHandle<string>>();
    render(<Tabs tabs={tabs} defaultTab="standings" onChange={onChange} ref={ref} />);

    act(() => ref.current?.setValue('fixtures'));

    expect(screen.getByRole('tab', { name: 'Fixtures' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('Fixtures content')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('notifies a ref subscriber on every tab change, from a click or from setValue', async () => {
    const ref = createRef<FieldHandle<string>>();
    render(<Tabs tabs={tabs} defaultTab="standings" ref={ref} />);
    const listener = vi.fn();
    const unsubscribe = ref.current?.subscribe(listener);

    await userEvent.click(screen.getByRole('tab', { name: 'Fixtures' }));
    ref.current?.setValue('standings');

    expect(listener).toHaveBeenNthCalledWith(1, 'fixtures');
    expect(listener).toHaveBeenNthCalledWith(2, 'standings');

    unsubscribe?.();
    ref.current?.setValue('fixtures');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('moves focus to the active tab button on ref.focus()', () => {
    const ref = createRef<FieldHandle<string>>();
    render(<Tabs tabs={tabs} defaultTab="fixtures" ref={ref} />);
    ref.current?.focus();
    expect(screen.getByRole('tab', { name: 'Fixtures' })).toHaveFocus();
  });

  it('stretches the tablist to fill its container when fullWidth is set', () => {
    render(<Tabs tabs={tabs} defaultTab="standings" fullWidth />);
    expect(screen.getByRole('tablist').className).toMatch(/tabsFullWidth/);
  });

  it('does not stretch the tablist by default', () => {
    render(<Tabs tabs={tabs} defaultTab="standings" />);
    expect(screen.getByRole('tablist').className).not.toMatch(/tabsFullWidth/);
  });
});
