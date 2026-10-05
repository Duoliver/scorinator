import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { SwatchPicker } from './SwatchPicker';
import type { FieldHandle } from '@/design-system/field';

const COLOURS = [
  { label: 'Red', value: '#E53935' },
  { label: 'Gold', value: '#F9A825' },
  { label: 'Navy', value: '#1A237E' },
];

function createRef(): { current: FieldHandle<string> | null } {
  return { current: null };
}

describe('SwatchPicker', () => {
  it('names the radiogroup with its label', () => {
    render(<SwatchPicker label="Colour" options={COLOURS} />);
    expect(screen.getByRole('radiogroup', { name: 'Colour' })).toBeInTheDocument();
  });

  it('renders one radio for each option, named by the option label', () => {
    render(<SwatchPicker label="Colour" options={COLOURS} />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Red' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Gold' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Navy' })).toBeInTheDocument();
  });

  it('checks the option that matches defaultValue', () => {
    render(<SwatchPicker label="Colour" options={COLOURS} defaultValue="#F9A825" />);
    expect(screen.getByRole('radio', { name: 'Gold' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Red' })).not.toBeChecked();
  });

  it('matches defaultValue against an option ignoring case', () => {
    const ref = createRef();
    render(
      <SwatchPicker label="Colour" options={COLOURS} defaultValue="#f9a825" ref={ref} />
    );
    expect(screen.getByRole('radio', { name: 'Gold' })).toBeChecked();
    expect(ref.current?.getValue()).toBe('#f9a825');
  });

  it('checks no radio, and keeps the value, when defaultValue matches no option', () => {
    const ref = createRef();
    render(
      <SwatchPicker label="Colour" options={COLOURS} defaultValue="#123456" ref={ref} />
    );
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toBeChecked();
    }
    expect(ref.current?.getValue()).toBe('#123456');
  });

  it('getValue() returns "" when defaultValue is omitted', () => {
    const ref = createRef();
    render(<SwatchPicker label="Colour" options={COLOURS} ref={ref} />);
    expect(ref.current?.getValue()).toBe('');
  });

  it('a click checks the swatch, and getValue() returns its value', async () => {
    const ref = createRef();
    render(
      <SwatchPicker label="Colour" options={COLOURS} defaultValue="#E53935" ref={ref} />
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Navy' }));
    expect(screen.getByRole('radio', { name: 'Navy' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Red' })).not.toBeChecked();
    expect(ref.current?.getValue()).toBe('#1A237E');
  });

  it('calls onChange with the value the user picked', async () => {
    const onChange = vi.fn();
    render(<SwatchPicker label="Colour" options={COLOURS} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Gold' }));
    expect(onChange).toHaveBeenCalledWith('#F9A825');
  });

  it('the arrow keys move the selection to the next swatch', async () => {
    const ref = createRef();
    render(
      <SwatchPicker label="Colour" options={COLOURS} defaultValue="#E53935" ref={ref} />
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Red' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Gold' })).toBeChecked();
    expect(ref.current?.getValue()).toBe('#F9A825');
  });

  it('setValue() checks the matching swatch and is reflected by getValue()', () => {
    const ref = createRef();
    render(<SwatchPicker label="Colour" options={COLOURS} ref={ref} />);
    ref.current?.setValue('#1A237E');
    expect(screen.getByRole('radio', { name: 'Navy' })).toBeChecked();
    expect(ref.current?.getValue()).toBe('#1A237E');
  });

  it('setValue() does not call onChange', () => {
    const onChange = vi.fn();
    const ref = createRef();
    render(
      <SwatchPicker label="Colour" options={COLOURS} onChange={onChange} ref={ref} />
    );
    ref.current?.setValue('#1A237E');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('subscribe() fires on a user pick and on setValue()', async () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<SwatchPicker label="Colour" options={COLOURS} ref={ref} />);
    ref.current?.subscribe(listener);
    await userEvent.click(screen.getByRole('radio', { name: 'Gold' }));
    expect(listener).toHaveBeenCalledWith('#F9A825');
    ref.current?.setValue('#1A237E');
    expect(listener).toHaveBeenCalledWith('#1A237E');
  });

  it('the function returned by subscribe() unsubscribes the listener', () => {
    const listener = vi.fn();
    const ref = createRef();
    render(<SwatchPicker label="Colour" options={COLOURS} ref={ref} />);
    const unsubscribe = ref.current!.subscribe(listener);
    unsubscribe();
    ref.current?.setValue('#1A237E');
    expect(listener).not.toHaveBeenCalled();
  });

  it('focus() moves focus to the checked swatch', () => {
    const ref = createRef();
    render(
      <SwatchPicker label="Colour" options={COLOURS} defaultValue="#F9A825" ref={ref} />
    );
    ref.current?.focus();
    expect(screen.getByRole('radio', { name: 'Gold' })).toHaveFocus();
  });

  it('focus() moves focus to the first swatch when none is checked', () => {
    const ref = createRef();
    render(<SwatchPicker label="Colour" options={COLOURS} ref={ref} />);
    ref.current?.focus();
    expect(screen.getByRole('radio', { name: 'Red' })).toHaveFocus();
  });

  it('two pickers on one page do not share a radio group', async () => {
    render(
      <>
        <SwatchPicker label="Home" options={COLOURS} defaultValue="#E53935" />
        <SwatchPicker label="Away" options={COLOURS} defaultValue="#E53935" />
      </>
    );
    const [, awayRed] = screen.getAllByRole('radio', { name: 'Red' });
    const [homeGold] = screen.getAllByRole('radio', { name: 'Gold' });
    await userEvent.click(homeGold);
    expect(awayRed).toBeChecked();
  });
});
