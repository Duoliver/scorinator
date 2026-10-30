import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Save league</Button>);
    expect(screen.getByRole('button', { name: 'Save league' })).toBeTruthy();
  });

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Scorinate</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Scorinate' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Disabled' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses aria-label as the accessible name instead of the visible text', () => {
    render(<Button aria-label="First matchday">«</Button>);
    expect(screen.getByRole('button', { name: 'First matchday' })).toBeTruthy();
  });

  it('passes aria-label through in link mode too', () => {
    render(
      <Button href="/somewhere" aria-label="Go somewhere">
        »
      </Button>
    );
    expect(screen.getByRole('link', { name: 'Go somewhere' })).toBeTruthy();
  });

  it('applies the disabled attribute', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it.each([
    'primary',
    'secondary',
    'destructive',
    'destructive-outline',
    'ghost',
    'outline',
  ] as const)('renders the %s variant without throwing', (variant) => {
    render(<Button variant={variant}>Label</Button>);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it.each(['sm', 'md', 'lg'] as const)(
    'renders the %s size without throwing',
    (size) => {
      render(<Button size={size}>Label</Button>);
      expect(screen.getByRole('button')).toBeTruthy();
    }
  );

  it('defaults to type=button so it never accidentally submits a form', () => {
    render(<Button>Label</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('renders as a link instead of a button when href is given', () => {
    render(<Button href="/leagues/new">+ New League</Button>);
    expect(screen.getByRole('link', { name: '+ New League' })).toHaveAttribute(
      'href',
      '/leagues/new'
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fires onClick when the link variant is clicked', async () => {
    // `href="#"` avoids jsdom's "Not implemented: navigation" console
    // warning for a real path clicked with no `<Router>` mounted to
    // intercept it — real client-side routing on this variant is
    // `AppShell.test.tsx`'s concern, not this component's own test.
    const onClick = vi.fn();
    render(
      <Button href="#" onClick={onClick}>
        + New League
      </Button>
    );
    await userEvent.click(screen.getByRole('link'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  describe('the icon size (Task 111)', () => {
    it('renders a square icon button named by its aria-label', () => {
      render(
        <Button size="icon" aria-label="Edit team">
          ✎
        </Button>
      );
      const button = screen.getByRole('button', { name: 'Edit team' });
      expect(button.className).toMatch(/icon/);
      expect(button.className).not.toMatch(/fill/);
    });

    it('fills its container with fill (Task 169)', () => {
      render(
        <Button size="icon" aria-label="Regenerate slug" fill>
          ↻
        </Button>
      );
      const button = screen.getByRole('button', { name: 'Regenerate slug' });
      expect(button.className).toMatch(/icon/);
      expect(button.className).toMatch(/fill/);
    });

    it('passes aria-describedby through', () => {
      render(
        <>
          <Button size="icon" aria-label="Edit team" aria-describedby="hint">
            ✎
          </Button>
          <span id="hint">Edit this team for this league</span>
        </>
      );
      expect(
        screen.getByRole('button', { name: 'Edit team' })
      ).toHaveAccessibleDescription('Edit this team for this league');
    });
  });

  describe('focusableWhenDisabled (Task 111)', () => {
    it('keeps a disabled button a Tab stop, marked aria-disabled, with no click', async () => {
      const onClick = vi.fn();
      render(
        <Button disabled focusableWhenDisabled onClick={onClick}>
          Regenerate
        </Button>
      );
      const button = screen.getByRole('button', { name: 'Regenerate' });
      expect(button).not.toHaveAttribute('disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');

      await userEvent.tab();
      expect(button).toHaveFocus();

      await userEvent.click(button);
      await userEvent.keyboard('{Enter}');
      expect(onClick).not.toHaveBeenCalled();
    });

    it('changes nothing for an enabled button', async () => {
      const onClick = vi.fn();
      render(
        <Button focusableWhenDisabled onClick={onClick}>
          Regenerate
        </Button>
      );
      const button = screen.getByRole('button', { name: 'Regenerate' });
      expect(button).not.toHaveAttribute('aria-disabled');

      await userEvent.click(button);
      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});
