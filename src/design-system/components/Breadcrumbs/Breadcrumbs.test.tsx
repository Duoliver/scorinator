import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
import { Breadcrumbs } from './Breadcrumbs';

describe('Breadcrumbs (Task 218 choice 4)', () => {
  const items = [
    { label: 'Seasons', href: '/seasons' },
    { label: 'Liga Norte 2026-27', href: '/seasons/s-1' },
    { label: 'New league' },
  ];

  it('is a navigation landmark with the items in order', () => {
    render(<Breadcrumbs items={items} />);

    const nav = screen.getByRole('navigation', { name: 'Breadcrumbs' });
    const entries = within(nav).getAllByRole('listitem');
    expect(entries.map((entry) => entry.textContent)).toEqual([
      'Seasons',
      'Liga Norte 2026-27',
      'New league',
    ]);
  });

  it('links each item with a path, and marks the last item as the current page', () => {
    render(<Breadcrumbs items={items} />);

    expect(screen.getByRole('link', { name: 'Seasons' })).toHaveAttribute(
      'href',
      '/seasons'
    );
    expect(screen.getByRole('link', { name: 'Liga Norte 2026-27' })).toHaveAttribute(
      'href',
      '/seasons/s-1'
    );
    expect(screen.queryByRole('link', { name: 'New league' })).toBeNull();
    expect(screen.getByText('New league')).toHaveAttribute('aria-current', 'page');
  });
});
