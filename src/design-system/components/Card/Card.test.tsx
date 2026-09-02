import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { Card } from './Card';

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card>
        <p>League summary</p>
      </Card>
    );
    expect(screen.getByText('League summary')).toBeInTheDocument();
  });

  it.each(['sm', 'md', 'lg'] as const)(
    'renders the %s padding without throwing',
    (padding) => {
      render(
        <Card padding={padding}>
          <span>content</span>
        </Card>
      );
      expect(screen.getByText('content')).toBeInTheDocument();
    }
  );
});
