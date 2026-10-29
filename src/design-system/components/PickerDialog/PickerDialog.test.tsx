import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { PickerDialog } from './PickerDialog';
import type { PickerItem } from './types';

const ITEMS: PickerItem[] = [
  { id: 'a', label: 'Ashfield Rovers', searchText: 'Ashfield Rovers Ashfield' },
  { id: 'h', label: 'Harborview SC', searchText: 'Harborview SC Port Lea' },
  { id: 's', label: 'Salt Marsh United', searchText: 'Salt Marsh United Ashby' },
];

/** The names in one panel, in order. */
function namesIn(panel: 'Available' | RegExp): string[] {
  const region = screen.getByRole('region', { name: panel });
  return within(region)
    .queryAllByRole('listitem')
    .map((item) => item.textContent?.replace('✕', '').trim() ?? '');
}

/** A multi-mode picker whose selection lives in the test, as a screen
 * holds it (choice 2). */
function MultiPicker(props: {
  initial?: string[];
  onConfirm?: (ids: string[]) => void;
  onCancel?: () => void;
  onCreate?: () => void;
}): JSX.Element {
  const [selected, setSelected] = useState<string[]>(props.initial ?? []);
  return (
    <PickerDialog
      mode="multi"
      title="Add teams"
      description="Pick from your saved blueprints, or create new ones."
      items={ITEMS}
      selected={selected}
      onSelectedChange={setSelected}
      confirmLabel={`Add ${selected.length} teams`}
      onConfirm={() => props.onConfirm?.(selected)}
      onCancel={props.onCancel ?? vi.fn()}
      availableAction={
        props.onCreate
          ? { label: '+ Create new team', onClick: props.onCreate }
          : undefined
      }
    />
  );
}

describe('PickerDialog, multi mode', () => {
  it('is a lg modal with the title, the description, and a close button', () => {
    render(<MultiPicker />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('Add teams');
    expect(dialog).toHaveAccessibleDescription(
      'Pick from your saved blueprints, or create new ones.'
    );
    expect(dialog.firstElementChild).toHaveAttribute('data-size', 'lg');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('starts with focus in the search field, and lists every item as Available', () => {
    render(<MultiPicker />);
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();
    expect(namesIn('Available')).toEqual([
      'Ashfield Rovers',
      'Harborview SC',
      'Salt Marsh United',
    ]);
    expect(namesIn(/^Selected/)).toEqual([]);
  });

  it('filters Available by the search text, with no regard to case', async () => {
    render(<MultiPicker />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'ASH');

    expect(namesIn('Available')).toEqual(['Ashfield Rovers', 'Salt Marsh United']);
  });

  it('says so when the search matches nothing', async () => {
    render(<MultiPicker />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'zzz');

    expect(namesIn('Available')).toEqual([]);
    expect(screen.getByText('No match.')).toBeInTheDocument();
  });

  it('moves a clicked item to Selected, at the end, and counts it', async () => {
    render(<MultiPicker />);
    await userEvent.click(screen.getByRole('button', { name: 'Salt Marsh United' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ashfield Rovers' }));

    expect(namesIn(/^Selected/)).toEqual(['Salt Marsh United', 'Ashfield Rovers']);
    expect(namesIn('Available')).toEqual(['Harborview SC']);
    expect(screen.getByRole('region', { name: 'Selected (2)' })).toBeInTheDocument();
  });

  it('takes an item out of Selected with its ✕, back to Available', async () => {
    render(<MultiPicker initial={['h', 's']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Harborview SC' }));

    expect(namesIn(/^Selected/)).toEqual(['Salt Marsh United']);
    expect(namesIn('Available')).toEqual(['Ashfield Rovers', 'Harborview SC']);
  });

  it('disables the confirm button with no selection, and confirms the selection in order', async () => {
    const onConfirm = vi.fn();
    render(<MultiPicker onConfirm={onConfirm} />);
    expect(screen.getByRole('button', { name: 'Add 0 teams' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Harborview SC' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ashfield Rovers' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add 2 teams' }));

    expect(onConfirm).toHaveBeenCalledWith(['h', 'a']);
  });

  it('cancels from Cancel, the close button, and Escape', async () => {
    const onCancel = vi.fn();
    render(<MultiPicker onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  it('shows the optional action under Available, and calls it', async () => {
    const onCreate = vi.fn();
    render(<MultiPicker onCreate={onCreate} />);

    await userEvent.click(screen.getByRole('button', { name: '+ Create new team' }));

    expect(onCreate).toHaveBeenCalledOnce();
  });

  it('has no optional action unless the caller gives one', () => {
    render(<MultiPicker />);
    expect(
      screen.queryByRole('button', { name: '+ Create new team' })
    ).not.toBeInTheDocument();
  });

  it('renders the content of an item in place of its label, and keeps the label as its name', () => {
    render(
      <PickerDialog
        mode="multi"
        title="Add teams"
        items={[
          { id: 'a', label: 'Ashfield Rovers', content: <strong>ASH · Tier B</strong> },
        ]}
        selected={[]}
        onSelectedChange={vi.fn()}
        confirmLabel="Add"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const row = screen.getByRole('button', { name: 'Ashfield Rovers' });
    expect(within(row).getByText('ASH · Tier B')).toBeInTheDocument();
  });

  it('searches the label when an item has no search text', async () => {
    render(
      <PickerDialog
        mode="multi"
        title="Add teams"
        items={[
          { id: 'a', label: 'Ashfield Rovers' },
          { id: 'h', label: 'Harborview SC' },
        ]}
        selected={[]}
        onSelectedChange={vi.fn()}
        confirmLabel="Add"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'harbor');
    expect(namesIn('Available')).toEqual(['Harborview SC']);
  });
});

describe('PickerDialog, single mode', () => {
  const renderSingle = (): { onPick: () => void; onCancel: () => void } => {
    const onPick = vi.fn();
    const onCancel = vi.fn();
    render(
      <PickerDialog
        mode="single"
        title="Switch team"
        description="Pick a replacement for this slot."
        items={ITEMS.slice(1)}
        current={ITEMS[0]}
        onPick={onPick}
        onCancel={onCancel}
      />
    );
    return { onPick, onCancel };
  };

  it('shows the current item under Currently in slot, with no ✕', () => {
    renderSingle();
    expect(namesIn(/^Currently in slot$/)).toEqual(['Ashfield Rovers']);
    expect(
      screen.queryByRole('button', { name: 'Remove Ashfield Rovers' })
    ).not.toBeInTheDocument();
  });

  it('says that a pick closes the dialog, and has no Cancel or confirm button', () => {
    renderSingle();
    expect(
      screen.getByText(
        'Pick a replacement from Available — this closes the dialog right away.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('calls onPick with the id of the clicked item', async () => {
    const { onPick, onCancel } = renderSingle();
    await userEvent.click(screen.getByRole('button', { name: 'Salt Marsh United' }));

    expect(onPick).toHaveBeenCalledWith('s');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('filters with the search, as in multi mode', async () => {
    renderSingle();
    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'port lea');
    expect(namesIn('Available')).toEqual(['Harborview SC']);
  });

  it('cancels from the close button and Escape', async () => {
    const { onCancel } = renderSingle();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
