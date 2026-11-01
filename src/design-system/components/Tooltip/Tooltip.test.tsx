import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { Tooltip } from './Tooltip';

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

describe('Tooltip', () => {
  it('hides its content until hover or focus', () => {
    render(<Tooltip content="Position">#</Tooltip>);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows on hover, at once', async () => {
    render(<Tooltip content="Position">#</Tooltip>);
    await userEvent.hover(screen.getByText('#'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Position');
  });

  it('makes a text trigger a Tab stop that the tooltip describes', async () => {
    render(<Tooltip content="Goal difference">GD</Tooltip>);
    await userEvent.tab();

    const trigger = screen.getByText('GD');
    expect(trigger).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Goal difference');
    expect(trigger).toHaveAccessibleDescription('Goal difference');
  });

  it('hides when focus leaves the trigger', async () => {
    render(
      <>
        <Tooltip content="Points">Pts</Tooltip>
        <button type="button">Next</button>
      </>
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides on Escape', async () => {
    render(<Tooltip content="Played">P</Tooltip>);
    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('closes first inside a Modal: the first Escape hides the hint only', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Edit team" onClose={onClose}>
        <Tooltip content="Regenerate slug from name">↻</Tooltip>
      </Modal>
    );
    expect(screen.getByText('↻')).toHaveFocus();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows rich content', async () => {
    render(
      <Tooltip
        content={
          <span>
            <strong>ASH</strong> · H · 2–1 · MD 7
          </span>
        }
      >
        W
      </Tooltip>
    );
    await userEvent.hover(screen.getByText('W'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('ASH · H · 2–1 · MD 7');
  });

  it('gives a text trigger the dotted underline and the help cursor with underline', () => {
    const { unmount } = render(<Tooltip content="Won">W</Tooltip>);
    expect(screen.getByText('W')).not.toHaveAttribute('data-underline');
    unmount();

    render(
      <Tooltip content="Won" underline>
        W
      </Tooltip>
    );
    expect(screen.getByText('W')).toHaveAttribute('data-underline');
  });

  it('gives a button trigger the description through a render function, with no extra Tab stop', async () => {
    render(
      <Tooltip content="Regenerate slug from name">
        {(describedBy) => (
          <Button
            size="icon"
            aria-label="Regenerate slug"
            aria-describedby={describedBy}
          >
            ↻
          </Button>
        )}
      </Tooltip>
    );
    await userEvent.tab();

    const button = screen.getByRole('button', { name: 'Regenerate slug' });
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleDescription('Regenerate slug from name');
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it('shows on hover over a disabled icon button that stays focusable', async () => {
    render(
      <Tooltip content="The slug already matches the name.">
        {(describedBy) => (
          <Button
            size="icon"
            aria-label="Regenerate slug"
            aria-describedby={describedBy}
            disabled
            focusableWhenDisabled
          >
            ↻
          </Button>
        )}
      </Tooltip>
    );
    await userEvent.hover(screen.getByRole('button', { name: 'Regenerate slug' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'The slug already matches the name.'
    );
  });

  describe('the hide delay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('hides 100 ms after the pointer leaves', () => {
      render(<Tooltip content="Lost">L</Tooltip>);
      fireEvent.mouseEnter(screen.getByText('L').parentElement!);
      fireEvent.mouseLeave(screen.getByText('L').parentElement!);

      act(() => {
        vi.advanceTimersByTime(99);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('with notHoverable, hides at once and lets the pointer through to the item under it', () => {
      render(
        <Tooltip content="Gold" notHoverable>
          G
        </Tooltip>
      );
      const anchor = screen.getByText('G').parentElement!;
      fireEvent.mouseEnter(anchor);
      expect(screen.getByRole('tooltip')).toHaveAttribute('data-not-hoverable');

      fireEvent.mouseLeave(anchor);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('stays while the pointer moves onto the tooltip', () => {
      render(<Tooltip content="Drawn">D</Tooltip>);
      const anchor = screen.getByText('D').parentElement!;
      fireEvent.mouseEnter(anchor);
      fireEvent.mouseLeave(anchor);
      fireEvent.mouseEnter(screen.getByRole('tooltip'));

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('the place on the screen', () => {
    it('shows above the trigger, centered, when the window has room', async () => {
      render(<Tooltip content="Goal difference">GD</Tooltip>);
      placeAt(screen.getByText('GD'), {
        top: 200,
        left: 100,
        width: 40,
        height: 20,
      });
      await userEvent.hover(screen.getByText('GD'));
      // The tooltip box is measured after it renders.
      const tooltip = screen.getByRole('tooltip');
      placeAt(tooltip, { top: 0, left: 0, width: 120, height: 30 });
      fireEvent(window, new Event('resize'));

      expect(tooltip).toHaveAttribute('data-side', 'top');
      expect(tooltip.style.top).toBe(`${200 - 30 - 6}px`);
      expect(tooltip.style.left).toBe(`${100 + 20 - 60}px`);
    });

    it('shows below the trigger when the window has no room above', async () => {
      render(<Tooltip content="Position">#</Tooltip>);
      placeAt(screen.getByText('#'), {
        top: 10,
        left: 100,
        width: 20,
        height: 20,
      });
      await userEvent.hover(screen.getByText('#'));
      const tooltip = screen.getByRole('tooltip');
      placeAt(tooltip, { top: 0, left: 0, width: 80, height: 30 });
      fireEvent(window, new Event('resize'));

      expect(tooltip).toHaveAttribute('data-side', 'bottom');
      expect(tooltip.style.top).toBe(`${10 + 20 + 6}px`);
    });

    it('places the hint from the trigger, not from a taller wrapper in a flex row', async () => {
      render(<Tooltip content="Goal difference">GD</Tooltip>);
      const trigger = screen.getByText('GD');
      // A flex row stretches the wrapper to the height of its tallest item.
      placeAt(trigger.parentElement!, { top: 150, left: 100, width: 40, height: 70 });
      placeAt(trigger, { top: 200, left: 100, width: 40, height: 20 });
      await userEvent.hover(trigger);
      const tooltip = screen.getByRole('tooltip');
      placeAt(tooltip, { top: 0, left: 0, width: 120, height: 30 });
      fireEvent(window, new Event('resize'));

      expect(tooltip.style.top).toBe(`${200 - 30 - 6}px`);
    });

    it('keeps the tooltip inside the window at the left edge', async () => {
      render(<Tooltip content="A long hint near the edge">X</Tooltip>);
      placeAt(screen.getByText('X'), {
        top: 200,
        left: 0,
        width: 10,
        height: 20,
      });
      await userEvent.hover(screen.getByText('X'));
      const tooltip = screen.getByRole('tooltip');
      placeAt(tooltip, { top: 0, left: 0, width: 200, height: 30 });
      fireEvent(window, new Event('resize'));

      expect(tooltip.style.left).toBe('8px');
    });
  });
});
