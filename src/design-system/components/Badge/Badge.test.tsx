import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its content', () => {
    render(<Badge tone="dark">S</Badge>);
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it.each(['dark', 'accent', 'neutral', 'error', 'warning'] as const)(
    'renders the %s tone without throwing',
    (tone) => {
      render(<Badge tone={tone}>Label</Badge>);
      expect(screen.getByText('Label')).toBeInTheDocument();
    }
  );
});
