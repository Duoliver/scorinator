import { createRef } from 'preact';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { DetailsStep, type DetailsStepHandle } from './DetailsStep';
import type { LeagueDraftDetails } from '@/app/state/leagueDraftStore';

const baseDetails: LeagueDraftDetails = {
  name: '',
  points: { win: 3, draw: 1, loss: 0 },
  homeAdvantage: false,
};

describe('DetailsStep', () => {
  it('pre-fills name, points, and home advantage from initial', () => {
    render(
      <DetailsStep
        initial={{ ...baseDetails, name: 'Coastal Premier', homeAdvantage: true }}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByLabelText('League name')).toHaveValue('Coastal Premier');
    expect(screen.getByLabelText('Points (win)')).toHaveValue(3);
    expect(screen.getByLabelText('Points (draw)')).toHaveValue(1);
    expect(screen.getByLabelText('Points (loss)')).toHaveValue(0);
    expect(screen.getByLabelText('Home advantage')).toBeChecked();
  });

  it('does not call onNext while typing — values are pulled via the ref instead', async () => {
    const ref = createRef<DetailsStepHandle>();
    render(<DetailsStep initial={baseDetails} onNext={vi.fn()} ref={ref} />);

    await userEvent.type(screen.getByLabelText('League name'), 'Coastal');

    expect(ref.current?.getValues().name).toBe('Coastal');
  });

  it('getValues reflects an edited home-advantage switch', async () => {
    const ref = createRef<DetailsStepHandle>();
    render(<DetailsStep initial={baseDetails} onNext={vi.fn()} ref={ref} />);

    await userEvent.click(screen.getByLabelText('Home advantage'));

    expect(ref.current?.getValues().homeAdvantage).toBe(true);
  });

  it('getValues falls back to initial for an unparsable points field', async () => {
    const ref = createRef<DetailsStepHandle>();
    render(
      <DetailsStep
        initial={{ ...baseDetails, points: { win: 3, draw: 1, loss: 0 } }}
        onNext={vi.fn()}
        ref={ref}
      />
    );

    const winField = screen.getByLabelText('Points (win)');
    await userEvent.clear(winField);

    expect(ref.current?.getValues().points.win).toBe(3);
  });

  it('calls onNext when Next is clicked', async () => {
    const onNext = vi.fn();
    render(<DetailsStep initial={baseDetails} onNext={onNext} />);
    await userEvent.click(screen.getByText('Next: Teams →'));
    expect(onNext).toHaveBeenCalled();
  });
});
