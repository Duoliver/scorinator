import type { JSX } from 'preact';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders as checked when checked is true', () => {
    render(<Checkbox label="Include byes" checked onChange={() => {}} />);
    expect(screen.getByLabelText('Include byes')).toBeChecked();
  });

  it('renders as unchecked when checked is false', () => {
    render(<Checkbox label="Include byes" checked={false} onChange={() => {}} />);
    expect(screen.getByLabelText('Include byes')).not.toBeChecked();
  });

  it('calls onChange with the new checked value when clicked', async () => {
    const onChange = vi.fn();
    function Controlled(): JSX.Element {
      return <Checkbox label="Include byes" checked={false} onChange={onChange} />;
    }
    render(<Controlled />);
    await userEvent.click(screen.getByLabelText('Include byes'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('associates the label with the checkbox via htmlFor/id', () => {
    render(<Checkbox label="Include byes" checked={false} onChange={() => {}} />);
    expect(screen.getByLabelText('Include byes')).toBeInTheDocument();
  });
});
