import type { JSX } from 'preact';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders the current value', () => {
    render(<Input label="League name" value="Coastal Premier" onChange={() => {}} />);
    expect(screen.getByLabelText('League name')).toHaveValue('Coastal Premier');
  });

  it('calls onChange with the new value as the user types', async () => {
    const onChange = vi.fn();
    function Controlled(): JSX.Element {
      return <Input label="League name" value="" onChange={onChange} />;
    }
    render(<Controlled />);
    await userEvent.type(screen.getByLabelText('League name'), 'A');
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('associates the label with the input via htmlFor/id', () => {
    render(<Input label="Points (W)" value="3" onChange={() => {}} />);
    const input = screen.getByLabelText('Points (W)');
    expect(input).toBeInTheDocument();
  });

  it('renders without a label when none is given', () => {
    render(<Input value="3" onChange={() => {}} placeholder="W" />);
    expect(screen.getByPlaceholderText('W')).toBeInTheDocument();
  });
});
