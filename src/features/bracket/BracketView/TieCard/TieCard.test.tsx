import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';
import type { TieCardModel, TieCardRow } from '../types';
import { TieCard } from './TieCard';

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
