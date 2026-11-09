import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/preact';
import type { TieCardModel, TieCardRow } from '../types';
import { TieCard } from './TieCard';
import { getTextWithoutHints } from '@/test/textWithoutHints';

const row = (key: string, scores: string[]): TieCardRow => ({
  key,
  name: `Team ${key}`,
  colour: '#123456',
  isTbd: false,
  isWinner: false,
  scores,
});

const final = (columns: string[], scores: string[]): TieCardModel => ({
  id: 'p1.r2.t1',
  title: 'Final',
  isBye: false,
  rows: [row('a', scores), row('b', scores)],
  columns,
  footer: 'Not played',
  aggregate: null,
  hasResult: false,
  canScorinate: true,
});

describe('TieCard: the place of the title (Tasks 187, 188)', () => {
  it('a single-match final shows "Final" in a title row', () => {
    render(<TieCard card={final([], [''])} onScorinate={() => {}} />);
    expect(screen.getByText('Final').tagName).toBe('P');
  });

  it('a replayed single-match final shows "Final" beside "L1" and "Rep"', () => {
    render(<TieCard card={final(['L1', 'Rep'], ['0', '2'])} onScorinate={() => {}} />);
    const header = screen.getByText('Final').parentElement as HTMLElement;
    expect(header).not.toHaveAttribute('role', 'group');
    expect(header).toHaveTextContent(/^FinalL1Rep$/);
  });
});

describe('TieCard: the aggregate hint (US-12.3, Task 154)', () => {
  const played: TieCardModel = {
    ...final(['L1', 'L2'], ['1', '2']),
    aggregate: '3–1',
    footer: 'Pens 4-5',
    hasResult: true,
  };

  it('writes the aggregate before the other tags', () => {
    render(<TieCard card={played} onScorinate={() => {}} />);
    expect(getTextWithoutHints(screen.getByRole('group'))).toContain(
      'Agg 3–1 · Pens 4-5'
    );
  });

  it('writes only the aggregate when the card has no other tag', () => {
    render(<TieCard card={{ ...played, footer: '' }} onScorinate={() => {}} />);
    const text = getTextWithoutHints(screen.getByRole('group'));
    expect(text).toContain('Agg 3–1');
    expect(text).not.toContain('·');
  });

  it('shows the full name on hover', async () => {
    render(<TieCard card={played} onScorinate={() => {}} />);
    await userEvent.hover(screen.getByText('Agg'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Aggregate');
  });

  it('has no "Agg" without an aggregate', () => {
    render(<TieCard card={final([], [''])} onScorinate={() => {}} />);
    expect(screen.queryByText('Agg')).not.toBeInTheDocument();
    expect(screen.getByText('Not played')).toBeInTheDocument();
  });
});
