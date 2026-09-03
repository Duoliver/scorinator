import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';
import type { FieldHandle } from '../../field';

const FORMATS = [
  { label: 'Round robin (two-way)', value: 'round-robin-two-way' },
  { label: 'Round robin (single duels)', value: 'round-robin-single' },
];

function createRef(): { current: FieldHandle<string> | null } {
  return { current: null };
}

describe('Select', () => {
  it('associates the label with the select via htmlFor/id', () => {
    render(<Select label="Format" options={FORMATS} />);
    expect(screen.getByLabelText('Format')).toBeInTheDocument();
  });

  it('renders without a label when none is given', () => {
    render(<Select options={FORMATS} placeholder="Choose a format" />);
    expect(screen.getByText('Choose a format')).toBeInTheDocument();
  });

  it('renders a disabled placeholder option when given', () => {
    render(<Select options={FORMATS} placeholder="Choose a format" />);
    const placeholderOption = screen.getByText('Choose a format') as HTMLOptionElement;
    expect(placeholderOption.disabled).toBe(true);
  });

  it('getValue() returns defaultValue initially, and "" when omitted', () => {
    const ref = createRef();
    render(<Select label="Format" defaultValue="round-robin-single" options={FORMATS} ref={ref} />);
    expect(ref.current?.getValue()).toBe('round-robin-single');

    const emptyRef = createRef();
    render(<Select label="Other" options={FORMATS} ref={emptyRef} />);
    expect(emptyRef.current?.getValue()).toBe('');
  });

  it('getValue() reflects the option the user picked', async () => {
    const ref = createRef();
    render(
      <Select label="Format" defaultValue="round-robin-two-way" options={FORMATS} ref={ref} />,
    );
    await userEvent.selectOptions(screen.getByLabelText('Format'), 'round-robin-single');
    expect(ref.current?.getValue()).toBe('round-robin-single');
  });

  it('calls onChange with the value the user picked', async () => {
    const onChange = vi.fn();
    render(
      <Select
        label="Format"
        defaultValue="round-robin-two-way"
        options={FORMATS}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText('Format'), 'round-robin-single');
    expect(onChange).toHaveBeenCalledWith('round-robin-single');
  });

  it('setValue() updates the rendered select value and is immediately reflected by getValue()', () => {
    const ref = createRef();
    render(<Select label="Format" options={FORMATS} ref={ref} />);
    ref.current?.setValue('round-robin-single');
    expect(screen.getByLabelText('Format')).toHaveValue('round-robin-single');
    expect(ref.current?.getValue()).toBe('round-robin-single');
  });

  it('setValue() does not call onChange', () => {
    const onChange = vi.fn();
    const ref = createRef();
    render(<Select label="Format" options={FORMATS} onChange={onChange} ref={ref} />);
    ref.current?.setValue('round-robin-single');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('subscribe() fires on user selection', async () => {
    const listener = vi.fn();
    const ref = createRef();
    render(
      <Select label="Format" defaultValue="round-robin-two-way" options={FORMATS} ref={ref} />,
    );
    ref.current?.subscribe(listener);
    await userEvent.selectOptions(screen.getByLabelText('Format'), 'round-robin-single');
    expect(listener).toHaveBeenCalledWith('round-robin-single');
  });

  it('subscribe() also fires on setValue()', () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Select label="Format" options={FORMATS} ref={ref} />);
    ref.current?.subscribe(listener);
    ref.current?.setValue('round-robin-single');
    expect(listener).toHaveBeenCalledWith('round-robin-single');
  });

  it('the function returned by subscribe() unsubscribes the listener', () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Select label="Format" options={FORMATS} ref={ref} />);
    const unsubscribe = ref.current!.subscribe(listener);
    unsubscribe();
    ref.current?.setValue('round-robin-single');
    expect(listener).not.toHaveBeenCalled();
  });

  it('focus() moves focus to the select', () => {
    const ref = createRef();
    render(<Select label="Format" options={FORMATS} ref={ref} />);
    ref.current?.focus();
    expect(screen.getByLabelText('Format')).toHaveFocus();
  });
});
