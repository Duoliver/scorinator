import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/design-system/components/Modal';
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu';

/** Gives an element a fixed box, as jsdom does no layout. */
function placeAt(
  element: Element,
  box: { top: number; left: number; width: number; height: number }
): void {
  element.getBoundingClientRect = (): DOMRect =>
    ({
      ...box,
      bottom: box.top + box.height,
      right: box.left + box.width,
      x: box.left,
      y: box.top,
      toJSON: () => box,
    }) as DOMRect;
}

function teamItems(): {
  items: DropdownMenuItem[];
  edit: () => void;
  remove: () => void;
} {
  const edit = vi.fn();
  const remove = vi.fn();
  return {
    edit,
    remove,
    items: [
      { label: 'Edit', icon: '✎', onSelect: edit },
      { label: 'Switch', icon: '⇄', disabled: true, onSelect: vi.fn() },
      { label: 'Move to Group B', onSelect: vi.fn() },
      { label: 'Remove', icon: '✕', tone: 'danger', onSelect: remove },
    ],
  };
}

const trigger = (name = 'Team options'): HTMLElement =>
  screen.getByRole('button', { name });
const items = (): HTMLElement[] => screen.getAllByRole('menuitem');

describe('DropdownMenu', () => {
  describe('the trigger (choice 1)', () => {
    it('is an icon button with the label as its name, closed at first', () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      expect(trigger()).toHaveTextContent('⋮');
      expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('is a small icon button with compact (Task 178)', () => {
      const { unmount } = render(
        <DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />
      );
      expect(trigger().className).not.toMatch(/icon-sm/);
      unmount();
      render(
        <DropdownMenu label="Team options" icon="⋮" compact items={teamItems().items} />
      );
      expect(trigger().className).toMatch(/icon-sm/);
    });

    it('is a text button with ▾ when it has no icon', () => {
      render(<DropdownMenu label="Export" items={teamItems().items} />);
      expect(screen.getByRole('button', { name: /Export/ })).toHaveTextContent(
        'Export ▾'
      );
    });
  });

  describe('the mouse', () => {
    it('opens on a click, with a menu of menu items, on the first item', async () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      await userEvent.click(trigger());
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
      expect(items().map((item) => item.textContent)).toEqual([
        '✎Edit',
        '⇄Switch',
        'Move to Group B',
        '✕Remove',
      ]);
      expect(items()[0]).toHaveFocus();
    });

    it('closes on a second click of the trigger', async () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      await userEvent.click(trigger());
      await userEvent.click(trigger());
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('calls onSelect on an item click, closes, and puts the focus back on the trigger', async () => {
      const { items: list, edit } = teamItems();
      render(<DropdownMenu label="Team options" icon="⋮" items={list} />);
      await userEvent.click(trigger());
      await userEvent.click(screen.getByRole('menuitem', { name: /Edit/ }));
      expect(edit).toHaveBeenCalledOnce();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });

    it('does nothing on a click of a disabled item', async () => {
      const { items: list } = teamItems();
      render(<DropdownMenu label="Team options" icon="⋮" items={list} />);
      await userEvent.click(trigger());
      const switchItem = screen.getByRole('menuitem', { name: /Switch/ });
      expect(switchItem).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(switchItem);
      expect(list[1].onSelect).not.toHaveBeenCalled();
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('closes on a click outside the menu', async () => {
      render(
        <>
          <DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />
          <p>Outside</p>
        </>
      );
      await userEvent.click(trigger());
      await userEvent.click(screen.getByText('Outside'));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes on a scroll', async () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      await userEvent.click(trigger());
      fireEvent.scroll(window);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('keeps the icon column on an item with no icon when another item has one', async () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      await userEvent.click(trigger());
      const move = screen.getByRole('menuitem', { name: 'Move to Group B' });
      expect(move.querySelector('[data-icon]')).toBeInTheDocument();
    });

    it('has no icon column when no item has an icon', async () => {
      render(
        <DropdownMenu
          label="Export"
          items={[{ label: 'Export league (.json)', onSelect: vi.fn() }]}
        />
      );
      await userEvent.click(screen.getByRole('button', { name: /Export/ }));
      expect(
        screen.getByRole('menuitem').querySelector('[data-icon]')
      ).not.toBeInTheDocument();
    });

    it('marks a danger item with its tone', async () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      await userEvent.click(trigger());
      expect(screen.getByRole('menuitem', { name: /Remove/ })).toHaveAttribute(
        'data-tone',
        'danger'
      );
      expect(screen.getByRole('menuitem', { name: /Edit/ })).not.toHaveAttribute(
        'data-tone'
      );
    });
  });

  describe('the keyboard (choice 4)', () => {
    it('opens on Arrow Down, Enter, or Space, on the first item', async () => {
      for (const key of ['{ArrowDown}', '{Enter}', ' ']) {
        const { unmount } = render(
          <DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />
        );
        trigger().focus();
        await userEvent.keyboard(key);
        expect(items()[0]).toHaveFocus();
        unmount();
      }
    });

    it('opens on Arrow Up, on the last item', async () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      trigger().focus();
      await userEvent.keyboard('{ArrowUp}');
      expect(items()[3]).toHaveFocus();
    });

    it('moves with the arrows, skips a disabled item, and wraps', async () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      trigger().focus();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
      expect(items()[2]).toHaveFocus(); // Switch (disabled) is skipped
      await userEvent.keyboard('{ArrowDown}');
      expect(items()[3]).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(items()[0]).toHaveFocus(); // wraps
      await userEvent.keyboard('{ArrowUp}');
      expect(items()[3]).toHaveFocus(); // wraps back
    });

    it('goes to the first and the last item on Home and End', async () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      trigger().focus();
      await userEvent.keyboard('{ArrowDown}{End}');
      expect(items()[3]).toHaveFocus();
      await userEvent.keyboard('{Home}');
      expect(items()[0]).toHaveFocus();
    });

    it('selects on Enter, closes, and puts the focus back on the trigger', async () => {
      const { items: list, remove } = teamItems();
      render(<DropdownMenu label="Team options" icon="⋮" items={list} />);
      trigger().focus();
      await userEvent.keyboard('{ArrowUp}{Enter}');
      expect(remove).toHaveBeenCalledOnce();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });

    it('closes on Escape and puts the focus back on the trigger', async () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      trigger().focus();
      await userEvent.keyboard('{ArrowDown}{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });

    it('closes on Tab', async () => {
      render(
        <>
          <DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />
          <button type="button">Next</button>
        </>
      );
      trigger().focus();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.tab();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes first inside a Modal: the first Escape closes the menu only', async () => {
      const onClose = vi.fn();
      render(
        <Modal title="Teams" onClose={onClose}>
          <DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />
        </Modal>
      );
      trigger().focus();
      await userEvent.keyboard('{ArrowDown}{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('the placement (choice 3)', () => {
    // The window in jsdom is 1024 x 768.
    function openAt(
      triggerBox: { top: number; left: number; width: number; height: number },
      align?: 'start' | 'end'
    ): HTMLElement {
      render(
        <DropdownMenu
          label="Team options"
          icon="⋮"
          items={teamItems().items}
          align={align}
        />
      );
      placeAt(trigger(), triggerBox);
      // The menu box is measured when it opens: give every menu 150 x 120.
      const original = HTMLElement.prototype.getBoundingClientRect;
      HTMLElement.prototype.getBoundingClientRect = function (
        this: HTMLElement
      ): DOMRect {
        if (this.getAttribute('role') === 'menu') {
          return {
            top: 0,
            left: 0,
            width: 150,
            height: 120,
            bottom: 120,
            right: 150,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          } as DOMRect;
        }
        return original.call(this);
      };
      fireEvent.click(trigger());
      HTMLElement.prototype.getBoundingClientRect = original;
      return screen.getByRole('menu');
    }

    it('opens below the trigger, on its end edge', () => {
      const menu = openAt({ top: 100, left: 500, width: 22, height: 22 });
      expect(menu.style.top).toBe('126px');
      expect(menu.style.left).toBe(`${522 - 150}px`);
    });

    it('opens on the start edge with align start', () => {
      const menu = openAt({ top: 100, left: 500, width: 22, height: 22 }, 'start');
      expect(menu.style.left).toBe('500px');
    });

    it('opens above the trigger when the window has no room below', () => {
      const menu = openAt({ top: 700, left: 500, width: 22, height: 22 });
      expect(menu.style.top).toBe(`${700 - 4 - 120}px`);
    });

    it('keeps the trigger edge near the window edge, when the menu still fits', () => {
      // The trigger is 3px from the left edge: the menu lines up with it,
      // and does not move 8px in.
      const menu = openAt({ top: 100, left: 3, width: 90, height: 35 }, 'start');
      expect(menu.style.left).toBe('3px');
    });

    it('measures the trigger without its hover move', () => {
      render(<DropdownMenu label="Team options" icon="⋮" items={teamItems().items} />);
      placeAt(trigger(), { top: 99, left: 499, width: 22, height: 22 });
      // The hover move of Button: 1px up and 1px left.
      trigger().style.transform = 'translate(-1px, -1px)';
      fireEvent.click(trigger());
      const menu = screen.getByRole('menu');
      // As if the trigger were at 100, 500: the end edge 522, the menu 150 wide
      // (jsdom gives the menu a 0 box, so its width here is 0).
      expect(menu.style.left).toBe('522px');
      expect(menu.style.top).toBe('126px');
    });

    it('stays inside the window on the left', () => {
      const menu = openAt({ top: 100, left: 10, width: 22, height: 22 });
      expect(menu.style.left).toBe('8px');
    });
  });
});
