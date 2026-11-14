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

describe('PickerDialog, the search placeholder (Task 165)', () => {
  it('says "Search…" when the caller gives no placeholder', () => {
    render(<MultiPicker />);
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveAttribute(
      'placeholder',
      'Search…'
    );
  });

  it('shows the placeholder of the caller', () => {
    render(
      <PickerDialog
        mode="single"
        title="Switch team"
        items={ITEMS}
        searchPlaceholder="Search by name or location…"
        onPick={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveAttribute(
      'placeholder',
      'Search by name or location…'
    );
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

describe('PickerDialog groups (Task 218 choice 5)', () => {
  const GROUPED: PickerItem[] = [
    { id: 'r', label: 'Riverside FC', group: 'Season teams', highlight: true },
    { id: 'u', label: 'Union Leste', group: 'Season teams', highlight: true },
    { id: 'd', label: 'Dragões do Sul', group: 'Other teams' },
  ];

  /** The names in one group list, in order. */
  function namesInGroup(group: string): string[] {
    const list = screen.getByRole('list', { name: group });
    return within(list)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? '');
  }

  function renderGrouped(onPick = vi.fn()): void {
    render(
      <PickerDialog
        mode="single"
        title="Switch team"
        items={GROUPED}
        onPick={onPick}
        onCancel={vi.fn()}
      />
    );
  }

  it('lists the items under their group titles, in the item order', () => {
    renderGrouped();

    expect(screen.getByText('Season teams')).toBeInTheDocument();
    expect(screen.getByText('Other teams')).toBeInTheDocument();
    expect(namesInGroup('Season teams')).toEqual(['Riverside FC', 'Union Leste']);
    expect(namesInGroup('Other teams')).toEqual(['Dragões do Sul']);
  });

  it('marks a highlighted item, and only that one', () => {
    renderGrouped();

    expect(screen.getByRole('button', { name: 'Riverside FC' })).toHaveAttribute(
      'data-highlight'
    );
    expect(screen.getByRole('button', { name: 'Dragões do Sul' })).not.toHaveAttribute(
      'data-highlight'
    );
  });

  it('hides a group with no match for the search', async () => {
    renderGrouped();

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'drag');

    expect(screen.queryByText('Season teams')).toBeNull();
    expect(namesInGroup('Other teams')).toEqual(['Dragões do Sul']);
  });

  it('picks an item of a group', async () => {
    const onPick = vi.fn();
    renderGrouped(onPick);

    await userEvent.click(screen.getByRole('button', { name: 'Union Leste' }));

    expect(onPick).toHaveBeenCalledWith('u');
  });

  it('keeps one plain list when no item has a group', () => {
    render(
      <PickerDialog
        mode="single"
        title="Switch team"
        items={ITEMS}
        onPick={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(namesIn('Available')).toEqual([
      'Ashfield Rovers',
      'Harborview SC',
      'Salt Marsh United',
    ]);
  });
});
