import type { JSX } from 'preact';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const FORMATS = [
  { label: 'Round robin (two-way)', value: 'round-robin-two-way' },
  { label: 'Round robin (single duels)', value: 'round-robin-single' },
];

describe('Select', () => {
  it('renders the current value as selected', () => {
    render(
      <Select label="Format" value="round-robin-single" onChange={() => {}} options={FORMATS} />,
    );
    expect(screen.getByLabelText('Format')).toHaveValue('round-robin-single');
  });

  it('calls onChange with the new value when the user picks an option', async () => {
    const onChange = vi.fn();
    function Controlled(): JSX.Element {
      return (
        <Select
          label="Format"
          value="round-robin-two-way"
          onChange={onChange}
          options={FORMATS}
        />
      );
    }
    render(<Controlled />);
    await userEvent.selectOptions(screen.getByLabelText('Format'), 'round-robin-single');
    expect(onChange).toHaveBeenCalledWith('round-robin-single');
  });

  it('associates the label with the select via htmlFor/id', () => {
    render(<Select label="Format" value="" onChange={() => {}} options={FORMATS} />);
    expect(screen.getByLabelText('Format')).toBeInTheDocument();
  });

  it('renders without a label when none is given', () => {
    render(
      <Select
        value="round-robin-two-way"
        onChange={() => {}}
        options={FORMATS}
        placeholder="Choose a format"
      />,
    );
    expect(screen.getByText('Choose a format')).toBeInTheDocument();
  });

  it('renders a disabled placeholder option when given', () => {
    render(
      <Select value="" onChange={() => {}} options={FORMATS} placeholder="Choose a format" />,
    );
    const placeholderOption = screen.getByText('Choose a format') as HTMLOptionElement;
    expect(placeholderOption.disabled).toBe(true);
  });
});
