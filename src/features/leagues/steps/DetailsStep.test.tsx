import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { DetailsStep } from './DetailsStep';

const baseProps = {
  name: '',
  points: { win: 3, draw: 1, loss: 0 },
  homeAdvantage: false,
  onNameChange: vi.fn(),
  onPointsChange: vi.fn(),
  onHomeAdvantageChange: vi.fn(),
  onNext: vi.fn(),
};

describe('DetailsStep', () => {
  it('pre-fills name, points, and home advantage from props', () => {
    render(
      <DetailsStep
        {...baseProps}
        name="Coastal Premier"
        points={{ win: 3, draw: 1, loss: 0 }}
        homeAdvantage
      />
    );
    expect(screen.getByLabelText('League name')).toHaveValue('Coastal Premier');
    expect(screen.getByLabelText('Points (win)')).toHaveValue(3);
    expect(screen.getByLabelText('Points (draw)')).toHaveValue(1);
    expect(screen.getByLabelText('Points (loss)')).toHaveValue(0);
    expect(screen.getByLabelText('Home advantage')).toBeChecked();
  });

  it('calls onNameChange as the user types', async () => {
    const onNameChange = vi.fn();
    render(<DetailsStep {...baseProps} onNameChange={onNameChange} />);
    await userEvent.type(screen.getByLabelText('League name'), 'Coastal');
    expect(onNameChange).toHaveBeenLastCalledWith('Coastal');
  });

  it('calls onHomeAdvantageChange when the switch is toggled', async () => {
    const onHomeAdvantageChange = vi.fn();
    render(<DetailsStep {...baseProps} onHomeAdvantageChange={onHomeAdvantageChange} />);
    await userEvent.click(screen.getByLabelText('Home advantage'));
    expect(onHomeAdvantageChange).toHaveBeenCalledWith(true);
  });

  it('calls onNext when Next is clicked', async () => {
    const onNext = vi.fn();
    render(<DetailsStep {...baseProps} onNext={onNext} />);
    await userEvent.click(screen.getByText('Next: Teams →'));
    expect(onNext).toHaveBeenCalled();
  });
});
