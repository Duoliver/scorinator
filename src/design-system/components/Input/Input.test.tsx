import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';
import type { FieldHandle } from '../../field';

function createRef(): { current: FieldHandle<string> | null } {
  return { current: null };
}

describe('Input', () => {
  it('associates the label with the input via htmlFor/id', () => {
    render(<Input label="League name" defaultValue="Coastal Premier" />);
    expect(screen.getByLabelText('League name')).toBeInTheDocument();
  });

  it('renders without a label when none is given', () => {
    render(<Input defaultValue="3" placeholder="W" />);
    expect(screen.getByPlaceholderText('W')).toBeInTheDocument();
  });

  it('getValue() returns defaultValue initially, and "" when omitted', () => {
    const ref = createRef();
    render(<Input label="League name" defaultValue="Coastal Premier" ref={ref} />);
    expect(ref.current?.getValue()).toBe('Coastal Premier');

    const emptyRef = createRef();
    render(<Input label="Other" ref={emptyRef} />);
    expect(emptyRef.current?.getValue()).toBe('');
  });

  it('getValue() reflects what the user typed', async () => {
    const ref = createRef();
    render(<Input label="League name" ref={ref} />);
    await userEvent.type(screen.getByLabelText('League name'), 'Redbrick');
    expect(ref.current?.getValue()).toBe('Redbrick');
  });

  it('calls onChange with each user-typed value', async () => {
    const onChange = vi.fn();
    render(<Input label="League name" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('League name'), 'AB');
    expect(onChange).toHaveBeenCalledWith('A');
    expect(onChange).toHaveBeenLastCalledWith('AB');
  });

  it('setValue() updates the rendered DOM value and is immediately reflected by getValue()', () => {
    const ref = createRef();
    render(<Input label="League name" ref={ref} />);
    ref.current?.setValue('Harborview SC');
    expect(screen.getByLabelText('League name')).toHaveValue('Harborview SC');
    expect(ref.current?.getValue()).toBe('Harborview SC');
  });

  it('setValue() does not call onChange', () => {
    const onChange = vi.fn();
    const ref = createRef();
    render(<Input label="League name" onChange={onChange} ref={ref} />);
    ref.current?.setValue('Harborview SC');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('subscribe() fires on user typing', async () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Input label="League name" ref={ref} />);
    ref.current?.subscribe(listener);
    await userEvent.type(screen.getByLabelText('League name'), 'A');
    expect(listener).toHaveBeenCalledWith('A');
  });

  it('subscribe() also fires on setValue()', () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Input label="League name" ref={ref} />);
    ref.current?.subscribe(listener);
    ref.current?.setValue('Harborview SC');
    expect(listener).toHaveBeenCalledWith('Harborview SC');
  });

  it('the function returned by subscribe() unsubscribes the listener', () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<Input label="League name" ref={ref} />);
    const unsubscribe = ref.current!.subscribe(listener);
    unsubscribe();
    ref.current?.setValue('Harborview SC');
    expect(listener).not.toHaveBeenCalled();
  });

  it('focus() moves focus to the input', () => {
    const ref = createRef();
    render(<Input label="League name" ref={ref} />);
    ref.current?.focus();
    expect(screen.getByLabelText('League name')).toHaveFocus();
  });
});
