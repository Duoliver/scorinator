import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';
import type { FieldHandle } from '../../field';

function createRef(): { current: FieldHandle<boolean> | null } {
  return { current: null };
}

describe('Switch', () => {
  it('renders as checked when defaultChecked is true', () => {
    render(<Switch label="Home advantage" defaultChecked />);
    expect(screen.getByRole('switch', { name: 'Home advantage' })).toBeChecked();
  });

  it('renders as unchecked by default', () => {
    render(<Switch label="Home advantage" />);
    expect(screen.getByRole('switch', { name: 'Home advantage' })).not.toBeChecked();
  });

  it('associates the label with the switch via htmlFor/id', () => {
    render(<Switch label="Home advantage" />);
    expect(screen.getByLabelText('Home advantage')).toBeInTheDocument();
  });

  it('getValue() returns defaultChecked initially', () => {
    const ref = createRef();
    render(<Switch label="Home advantage" defaultChecked ref={ref} />);
    expect(ref.current?.getValue()).toBe(true);
  });

  it('getValue() reflects the user clicking the switch', async () => {
    const ref = createRef();
    render(<Switch label="Home advantage" ref={ref} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Home advantage' }));
    expect(ref.current?.getValue()).toBe(true);
  });

  it('calls onChange with the new checked value when clicked', async () => {
    const onChange = vi.fn();
    render(<Switch label="Home advantage" onChange={onChange} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Home advantage' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('setValue() updates the rendered checked state and is immediately reflected by getValue()', () => {
    const ref = createRef();
    render(<Switch label="Home advantage" ref={ref} />);
    ref.current?.setValue(true);
    expect(screen.getByRole('switch', { name: 'Home advantage' })).toBeChecked();
    expect(ref.current?.getValue()).toBe(true);
  });

  it('setValue() does not call onChange', () => {
    const onChange = vi.fn();
    const ref = createRef();
    render(<Switch label="Home advantage" onChange={onChange} ref={ref} />);
    ref.current?.setValue(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('subscribe() fires on user click', async () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Switch label="Home advantage" ref={ref} />);
    ref.current?.subscribe(listener);
    await userEvent.click(screen.getByRole('switch', { name: 'Home advantage' }));
    expect(listener).toHaveBeenCalledWith(true);
  });

  it('subscribe() also fires on setValue()', () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Switch label="Home advantage" ref={ref} />);
    ref.current?.subscribe(listener);
    ref.current?.setValue(true);
    expect(listener).toHaveBeenCalledWith(true);
  });

  it('the function returned by subscribe() unsubscribes the listener', () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Switch label="Home advantage" ref={ref} />);
    const unsubscribe = ref.current!.subscribe(listener);
    unsubscribe();
    ref.current?.setValue(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it('focus() moves focus to the switch', () => {
    const ref = createRef();
    render(<Switch label="Home advantage" ref={ref} />);
    ref.current?.focus();
    expect(screen.getByRole('switch', { name: 'Home advantage' })).toHaveFocus();
  });
});
