import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/design-system/components/Modal';
import { Popover } from './Popover';
import type PopoverProps from './types';

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

const LABEL = 'Condition of Porto Velho SC: Level +1';
const PANEL = 'Condition of Porto Velho SC';

/** A Popover with two buttons in its panel: "Pick" closes it. */
function renderPopover(props: Partial<PopoverProps> = {}): { pick: () => void } {
  const pick = vi.fn();
  render(
    <>
      <Popover label={LABEL} icon="↗" panelLabel={PANEL} {...props}>
        {(close) => (
          <>
            <button type="button" tabIndex={-1}>
              Skipped
            </button>
            <button
              type="button"
              onClick={() => {
                pick();
                close();
              }}
            >
              Pick
            </button>
            <button type="button">Stay</button>
          </>
        )}
      </Popover>
      <button type="button">Outside</button>
    </>
  );
  return { pick };
}

const trigger = (): HTMLElement => screen.getByRole('button', { name: LABEL });
const panel = (): HTMLElement | null => screen.queryByRole('dialog', { name: PANEL });

describe('Popover (Task 268)', () => {
  describe('the trigger', () => {
    it('is an icon button with the label as its name, closed at first', () => {
      renderPopover();
      expect(trigger()).toHaveTextContent('↗');
      expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      expect(panel()).not.toBeInTheDocument();
    });
  });

  describe('open and close', () => {
    it('opens a panel named by panelLabel on a click, with the content', async () => {
      renderPopover();
      await userEvent.click(trigger());
      expect(panel()).toBeInTheDocument();
      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: 'Pick' })).toBeInTheDocument();
    });

    it('is not a modal dialog', async () => {
      renderPopover();
      await userEvent.click(trigger());
      expect(panel()).not.toHaveAttribute('aria-modal', 'true');
    });

    it('closes on a second click of the trigger', async () => {
      renderPopover();
      await userEvent.click(trigger());
      await userEvent.click(trigger());
      expect(panel()).not.toBeInTheDocument();
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('moves the focus to the first element that takes it, on open', async () => {
      renderPopover();
      await userEvent.click(trigger());
      expect(screen.getByRole('button', { name: 'Pick' })).toHaveFocus();
    });

    it('lets the content close it, and puts the focus back on the trigger', async () => {
      const { pick } = renderPopover();
      await userEvent.click(trigger());
      await userEvent.click(screen.getByRole('button', { name: 'Pick' }));
      expect(pick).toHaveBeenCalledOnce();
      expect(panel()).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });

    it('stays open on a click inside the panel that does not close it', async () => {
      renderPopover();
      await userEvent.click(trigger());
      await userEvent.click(screen.getByRole('button', { name: 'Stay' }));
      expect(panel()).toBeInTheDocument();
    });

    it('closes on Escape, and puts the focus back on the trigger', async () => {
      renderPopover();
      await userEvent.click(trigger());
      await userEvent.keyboard('{Escape}');
      expect(panel()).not.toBeInTheDocument();
      expect(trigger()).toHaveFocus();
    });

    it('closes on a click outside', async () => {
      renderPopover();
      await userEvent.click(trigger());
      await userEvent.click(screen.getByRole('button', { name: 'Outside' }));
      expect(panel()).not.toBeInTheDocument();
    });

    it('closes on a scroll', async () => {
      renderPopover();
      await userEvent.click(trigger());
      fireEvent.scroll(window);
      expect(panel()).not.toBeInTheDocument();
    });

    it('stays open on Tab inside the panel, and closes on Tab out of it', async () => {
      renderPopover();
      await userEvent.click(trigger());
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Stay' })).toHaveFocus();
      expect(panel()).toBeInTheDocument();
      await userEvent.tab();
      expect(panel()).not.toBeInTheDocument();
    });

    it('closes first inside a Modal: the first Escape closes the panel only', async () => {
      const onClose = vi.fn();
      render(
        <Modal title="Playoff" onClose={onClose}>
          <Popover label={LABEL} icon="↗" panelLabel={PANEL}>
            {() => <button type="button">Pick</button>}
          </Popover>
        </Modal>
      );
      await userEvent.click(trigger());
      await userEvent.keyboard('{Escape}');
      expect(panel()).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      await userEvent.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('the placement', () => {
    // The window in jsdom is 1024 x 768. The panel is 150 x 40.
    function openAt(
      triggerBox: { top: number; left: number; width: number; height: number },
      align?: PopoverProps['align']
    ): HTMLElement {
      renderPopover({ align });
      placeAt(trigger(), triggerBox);
      const original = HTMLElement.prototype.getBoundingClientRect;
      HTMLElement.prototype.getBoundingClientRect = function (
        this: HTMLElement
      ): DOMRect {
        if (this.getAttribute('role') === 'dialog') {
          return {
            top: 0,
            left: 0,
            width: 150,
            height: 40,
            bottom: 40,
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
      return panel()!;
    }

    it('opens below the trigger, centred on it by default', () => {
      const box = openAt({ top: 100, left: 500, width: 32, height: 32 });
      expect(box.style.top).toBe('136px');
      expect(box.style.left).toBe(`${516 - 75}px`);
    });

    it('lines up with the start or the end edge of the trigger', () => {
      expect(
        openAt({ top: 100, left: 500, width: 32, height: 32 }, 'start').style.left
      ).toBe('500px');
    });

    it('lines up with the end edge with align end', () => {
      const box = openAt({ top: 100, left: 500, width: 32, height: 32 }, 'end');
      expect(box.style.left).toBe(`${532 - 150}px`);
    });

    it('opens above the trigger when the window has no room below', () => {
      const box = openAt({ top: 740, left: 500, width: 32, height: 24 });
      expect(box.style.top).toBe(`${740 - 4 - 40}px`);
    });

    it('stays inside the window on the left', () => {
      const box = openAt({ top: 100, left: 10, width: 32, height: 32 });
      expect(box.style.left).toBe('8px');
    });
  });
});
