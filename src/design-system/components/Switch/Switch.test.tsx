import type { JSX } from 'preact';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders as checked when checked is true', () => {
    render(<Switch label="Home advantage" checked onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Home advantage' })).toBeChecked();
  });

  it('renders as unchecked when checked is false', () => {
    render(<Switch label="Home advantage" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Home advantage' })).not.toBeChecked();
  });

  it('calls onChange with the new checked value when clicked', async () => {
    const onChange = vi.fn();
    function Controlled(): JSX.Element {
      return <Switch label="Home advantage" checked={false} onChange={onChange} />;
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('switch', { name: 'Home advantage' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('associates the label with the switch via htmlFor/id', () => {
    render(<Switch label="Home advantage" checked={false} onChange={() => {}} />);
    expect(screen.getByLabelText('Home advantage')).toBeInTheDocument();
  });
});
