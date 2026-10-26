import { describe, expect, it } from 'vitest';
import type { JSX } from 'preact';
import { render } from '@testing-library/preact';
import { TeamSwatch } from './TeamSwatch';

const renderSwatch = (ui: JSX.Element): HTMLElement => {
  const { container } = render(ui);
  return container.firstElementChild as HTMLElement;
};

describe('TeamSwatch', () => {
  it('shows the team colour', () => {
    const swatch = renderSwatch(<TeamSwatch colour="#E53935" />);
    expect(swatch).toHaveStyle({ background: '#E53935' });
  });

  it('is transparent for a team with no colour', () => {
    const swatch = renderSwatch(<TeamSwatch colour="" />);
    expect(swatch).toHaveStyle({ background: 'transparent' });
  });

  it('is hidden from screen readers, since the team name sits next to it', () => {
    const swatch = renderSwatch(<TeamSwatch colour="#E53935" />);
    expect(swatch).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the class a screen gives it, for a layout rule of that screen', () => {
    const swatch = renderSwatch(<TeamSwatch colour="#E53935" class="homeSwatch" />);
    expect(swatch).toHaveClass('homeSwatch');
  });
});
