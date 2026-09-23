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

  it("uses aria-label as the accessible name instead of the visible text", () => {
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

  it.each(['primary', 'secondary', 'destructive', 'ghost', 'outline'] as const)(
    'renders the %s variant without throwing',
    (variant) => {
      render(<Button variant={variant}>Label</Button>);
      expect(screen.getByRole('button')).toBeTruthy();
    }
  );

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
});
