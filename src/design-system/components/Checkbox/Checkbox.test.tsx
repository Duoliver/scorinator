import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';
import type { FieldHandle } from '../../field';

function createRef(): { current: FieldHandle<boolean> | null } {
  return { current: null };
}

describe('Checkbox', () => {
  it('renders as checked when defaultChecked is true', () => {
    render(<Checkbox label="Include byes" defaultChecked />);
    expect(screen.getByLabelText('Include byes')).toBeChecked();
  });

  it('renders as unchecked by default', () => {
    render(<Checkbox label="Include byes" />);
    expect(screen.getByLabelText('Include byes')).not.toBeChecked();
  });

  it('associates the label with the checkbox via htmlFor/id', () => {
    render(<Checkbox label="Include byes" />);
    expect(screen.getByLabelText('Include byes')).toBeInTheDocument();
  });

  it('getValue() returns defaultChecked initially', () => {
    const ref = createRef();
    render(<Checkbox label="Include byes" defaultChecked ref={ref} />);
    expect(ref.current?.getValue()).toBe(true);
  });

  it('getValue() reflects the user clicking the checkbox', async () => {
    const ref = createRef();
    render(<Checkbox label="Include byes" ref={ref} />);
    await userEvent.click(screen.getByLabelText('Include byes'));
    expect(ref.current?.getValue()).toBe(true);
  });

  it('calls onChange with the new checked value when clicked', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Include byes" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Include byes'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('setValue() updates the rendered checked state and is immediately reflected by getValue()', () => {
    const ref = createRef();
    render(<Checkbox label="Include byes" ref={ref} />);
    ref.current?.setValue(true);
    expect(screen.getByLabelText('Include byes')).toBeChecked();
    expect(ref.current?.getValue()).toBe(true);
  });

  it('setValue() does not call onChange', () => {
    const onChange = vi.fn();
    const ref = createRef();
    render(<Checkbox label="Include byes" onChange={onChange} ref={ref} />);
    ref.current?.setValue(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('subscribe() fires on user click', async () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Checkbox label="Include byes" ref={ref} />);
    ref.current?.subscribe(listener);
    await userEvent.click(screen.getByLabelText('Include byes'));
    expect(listener).toHaveBeenCalledWith(true);
  });

  it('subscribe() also fires on setValue()', () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Checkbox label="Include byes" ref={ref} />);
    ref.current?.subscribe(listener);
    ref.current?.setValue(true);
    expect(listener).toHaveBeenCalledWith(true);
  });

  it('the function returned by subscribe() unsubscribes the listener', () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Checkbox label="Include byes" ref={ref} />);
    const unsubscribe = ref.current!.subscribe(listener);
    unsubscribe();
    ref.current?.setValue(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it('focus() moves focus to the checkbox', () => {
    const ref = createRef();
    render(<Checkbox label="Include byes" ref={ref} />);
    ref.current?.focus();
    expect(screen.getByLabelText('Include byes')).toHaveFocus();
  });
});
