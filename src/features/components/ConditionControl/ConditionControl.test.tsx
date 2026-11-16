import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { ConditionControl } from './ConditionControl';
import { CONDITION_OPTIONS, getConditionName } from './helpers';

const radio = (name: string): HTMLElement => screen.getByRole('radio', { name });

describe('the condition levels (US-14.1, Task 229)', () => {
  it('lists the five levels from the crisis to the peak, with their icons', () => {
    expect(CONDITION_OPTIONS.map((option) => [option.value, option.label])).toEqual([
      [-2, '↓'],
      [-1, '↘'],
      [0, '–'],
      [1, '↗'],
      [2, '↑'],
    ]);
  });

  it('names each level', () => {
    expect([-2, -1, 0, 1, 2].map((level) => getConditionName(level as never))).toEqual([
      'Crisis, level -2',
      'Level -1',
      'Level 0',
      'Level +1',
      'Peak, level +2',
    ]);
  });
});

describe('ConditionControl (Task 229)', () => {
  it('is a radio group of the five levels, named by its label', () => {
    render(<ConditionControl label="Condition of Porto Velho SC" defaultLevel={0} />);
    expect(
      screen.getByRole('radiogroup', { name: 'Condition of Porto Velho SC' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(radio('Level 0')).toHaveAttribute('aria-checked', 'true');
  });

  it('shows "Crisis" and "Peak" at the ends', () => {
    render(<ConditionControl label="Condition" defaultLevel={1} />);
    expect(screen.getByText('Crisis')).toBeVisible();
    expect(screen.getByText('Peak')).toBeVisible();
  });

  it('hides the end labels with hideEnds', () => {
    render(<ConditionControl label="Condition" defaultLevel={1} hideEnds />);
    expect(screen.queryByText('Crisis')).not.toBeInTheDocument();
    expect(screen.queryByText('Peak')).not.toBeInTheDocument();
  });

  it('calls onChange with the level of a click', async () => {
    const onChange = vi.fn();
    render(<ConditionControl label="Condition" defaultLevel={0} onChange={onChange} />);
    await userEvent.click(radio('Peak, level +2'));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('turns every level off with disabled', () => {
    render(<ConditionControl label="Condition" defaultLevel={0} disabled />);
    for (const el of screen.getAllByRole('radio')) expect(el).toBeDisabled();
  });
});
