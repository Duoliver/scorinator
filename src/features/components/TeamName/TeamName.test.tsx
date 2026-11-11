import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { mockTextWidth, resizeText, setTextWidth } from '@/test/textWidth';
import { TeamName } from './TeamName';

const hint = (): string | null | undefined =>
  screen.queryByRole('tooltip')?.textContent;
/** The name text. The bold name of a hint also holds the name. */
const nameText = (): HTMLElement =>
  document.querySelector<HTMLElement>('[data-part="name"]') as HTMLElement;

describe('TeamName, the hint of a cut name (Task 180)', () => {
  beforeEach(() => mockTextWidth());

  it('gives a whole name with a Location the Location hint', async () => {
    setTextWidth(80, 100);
    render(<TeamName name="Ashfield Rovers" location="Ashfield" />);
    await userEvent.hover(nameText());
    expect(hint()).toBe('Ashfield');
  });

  it('gives a whole name with no Location no hint and no Tab stop', async () => {
    setTextWidth(80, 100);
    const { container } = render(<TeamName name="Ashfield Rovers" location="" />);
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    expect(container.querySelector('[tabindex]')).toBeNull();
  });

  it('gives a cut name the name and the Location in its hint', async () => {
    setTextWidth(140, 100);
    render(<TeamName name="Ashfield Rovers" location="Ashfield" />);
    await userEvent.hover(nameText());
    expect(hint()).toBe('Ashfield Rovers · Ashfield');
    // The team name is bold in the hint (Task 180 review).
    expect(screen.getByRole('tooltip').querySelector('strong')).toHaveTextContent(
      /^Ashfield Rovers$/
    );
  });

  it('gives the trigram hint the team name in bold too (Task 180 review)', () => {
    render(<TeamName name="Ashfield Rovers" location="Ashfield" trigram="ASH" />);
    const hints = screen.getAllByRole('tooltip', { hidden: true });
    const trigramHint = hints.find(
      (h) => h.textContent === 'Ashfield Rovers · Ashfield'
    );
    expect(trigramHint?.querySelector('strong')).toHaveTextContent(/^Ashfield Rovers$/);
  });

  it('gives a cut name with no Location the name in its hint, and a Tab stop', async () => {
    setTextWidth(140, 100);
    const { container } = render(<TeamName name="Ashfield Rovers" location="" />);
    await userEvent.tab();
    expect(container.querySelector('[tabindex]')).toHaveFocus();
    expect(container.querySelector('[tabindex]')).toHaveTextContent('Ashfield Rovers');
    expect(hint()).toBe('Ashfield Rovers');
  });

  it('drops the hint when a resize makes the name whole again', () => {
    setTextWidth(140, 100);
    const { container } = render(<TeamName name="Ashfield Rovers" location="" />);
    expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument();
    resizeText(140, 160);
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    expect(container.querySelector('[tabindex]')).toBeNull();
  });

  it('marks the name text as the part that the screen CSS cuts', () => {
    const { container } = render(<TeamName name="Ashfield Rovers" location="" />);
    expect(container.querySelector('[data-part="name"]')).toHaveTextContent(
      'Ashfield Rovers'
    );
  });
});
