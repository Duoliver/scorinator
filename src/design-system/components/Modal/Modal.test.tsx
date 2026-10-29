import type { JSX } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Drawer } from '@/design-system/components/Drawer';
import { Modal } from './Modal';

/** A button that opens the modal, so a test can check where focus goes on
 * close. */
function Opener({ onClose }: { onClose?: () => void }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open && (
        <Modal
          title="Pick teams"
          onClose={() => {
            onClose?.();
            setOpen(false);
          }}
        >
          <button type="button">Inside</button>
        </Modal>
      )}
    </>
  );
}

describe('Modal', () => {
  it('renders its title and children', () => {
    render(
      <Modal title="Pick teams" onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole('heading', { name: 'Pick teams' })).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('opens as a modal dialog, named by its title and described by its description', () => {
    render(
      <Modal
        title="Delete Ashfield?"
        description="This cannot be undone."
        onClose={vi.fn()}
      >
        <p>Content</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Delete Ashfield?');
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
  });

  it('has no description and no close button unless the caller asks', () => {
    render(
      <Modal title="Pick teams" onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('calls onClose from the close button, when the caller shows it', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Pick teams" showClose onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on a backdrop click, but not on a click inside', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Pick teams" onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    await userEvent.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();

    // A click on the dialog element itself is a backdrop click: every
    // visible part is a descendant.
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape, and stays open until the caller unmounts it', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Pick teams" onClose={onClose}>
        <p>Content</p>
      </Modal>
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
  });

  it('gives the sm size by default, and the lg size on request', () => {
    const { unmount } = render(
      <Modal title="Confirm" onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog').firstElementChild).toHaveAttribute(
      'data-size',
      'sm'
    );
    unmount();

    render(
      <Modal title="Pick teams" size="lg" onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole('dialog').firstElementChild).toHaveAttribute(
      'data-size',
      'lg'
    );
  });

  it('moves focus to the first control on open', () => {
    render(
      <Modal title="Pick teams" onClose={vi.fn()}>
        <p>Text first</p>
        <button type="button">First</button>
        <button type="button">Second</button>
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('moves focus to the element the caller names, when it names one', () => {
    function WithInitialFocus(): JSX.Element {
      const second = useRef<HTMLButtonElement>(null);
      return (
        <Modal title="Pick teams" initialFocus={second} onClose={vi.fn()}>
          <button type="button">First</button>
          <button type="button" ref={second}>
            Second
          </button>
        </Modal>
      );
    }
    render(<WithInitialFocus />);
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
  });

  it('gives focus back to the opener on close', async () => {
    render(<Opener />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('closes only itself on Escape when it opens over a Drawer', async () => {
    const onDrawerClose = vi.fn();
    const onModalClose = vi.fn();
    // The Drawer opens first, and a button in it opens the Modal, as the
    // slug regenerate confirm does (US-09.5).
    function DrawerWithModal(): JSX.Element {
      const [open, setOpen] = useState(false);
      return (
        <Drawer title="Edit team" onClose={onDrawerClose}>
          <button type="button" onClick={() => setOpen(true)}>
            Regenerate
          </button>
          {open && (
            <Modal
              title="Regenerate slug?"
              onClose={() => {
                onModalClose();
                setOpen(false);
              }}
            >
              <button type="button">Inside</button>
            </Modal>
          )}
        </Drawer>
      );
    }
    render(<DrawerWithModal />);
    await userEvent.click(screen.getByRole('button', { name: 'Regenerate' }));

    await userEvent.keyboard('{Escape}');

    expect(onModalClose).toHaveBeenCalledOnce();
    expect(onDrawerClose).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Edit team' })).toBeInTheDocument();
    // Focus goes back to the button in the Drawer.
    expect(screen.getByRole('button', { name: 'Regenerate' })).toHaveFocus();
  });
});
