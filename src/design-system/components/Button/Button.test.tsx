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

  it('applies the disabled attribute', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it.each(['primary', 'secondary', 'destructive', 'ghost'] as const)(
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
});
