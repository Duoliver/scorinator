import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { TeamLabel } from './TeamLabel';

describe('TeamLabel (Task 120 review)', () => {
  it('puts the name above the Location, as two lines', () => {
    render(<TeamLabel name="Ashfield Rovers" location="Ashfield" />);
    const name = screen.getByText('Ashfield Rovers');
    const location = screen.getByText('Ashfield');
    expect(name).not.toContainElement(location);
    expect(
      name.compareDocumentPosition(location) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(name.parentElement).toBe(location.parentElement);
  });

  it('shows the name alone for an empty Location', () => {
    const { container } = render(<TeamLabel name="Old Town" location="" />);
    expect(container.textContent).toBe('Old Town');
  });
});
