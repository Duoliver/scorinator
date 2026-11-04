import { describe, expect, it, vi } from 'vitest';
import { render, screen, type RenderResult } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';
import type { FieldHandle } from '@/design-system/field';

type Format = 'single-match' | 'two-legged' | 'mixed';

const OPTIONS: { value: Format; label: string }[] = [
  { value: 'single-match', label: 'Single match' },
  { value: 'two-legged', label: 'Two-legged' },
  { value: 'mixed', label: 'Mixed' },
];

function createRef(): { current: FieldHandle<Format> | null } {
  return { current: null };
}

function renderControl(
  props: Partial<Parameters<typeof SegmentedControl<Format>>[0]> = {}
): RenderResult {
  return render(
    <SegmentedControl<Format>
      label="Tie format"
      options={OPTIONS}
      defaultValue="single-match"
      {...props}
    />
  );
}

const radio = (name: string): HTMLElement => screen.getByRole('radio', { name });

describe('SegmentedControl', () => {
  it('renders a radio group named by its label, with one radio for each option', () => {
    renderControl();
    expect(screen.getByRole('radiogroup', { name: 'Tie format' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((el) => el.textContent)).toEqual([
      'Single match',
      'Two-legged',
      'Mixed',
    ]);
  });

  it('shows the label above the options', () => {
    renderControl();
    expect(screen.getByText('Tie format')).toBeVisible();
  });

  it('with hideLabel, shows no label text but keeps the group name', () => {
    renderControl({ hideLabel: true });
    expect(screen.queryByText('Tie format')).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Tie format' })).toBeInTheDocument();
  });

  it('checks the defaultValue option on mount', () => {
    renderControl({ defaultValue: 'two-legged' });
    expect(radio('Two-legged')).toHaveAttribute('aria-checked', 'true');
    expect(radio('Single match')).toHaveAttribute('aria-checked', 'false');
  });

  it('selects an option on a click, and calls onChange with its value', async () => {
    const onChange = vi.fn();
    renderControl({ onChange });
    await userEvent.click(radio('Two-legged'));
    expect(radio('Two-legged')).toHaveAttribute('aria-checked', 'true');
    expect(radio('Single match')).toHaveAttribute('aria-checked', 'false');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('two-legged');
  });

  it('does nothing on a click of the selected option', async () => {
    const onChange = vi.fn();
    renderControl({ onChange });
    await userEvent.click(radio('Single match'));
    expect(onChange).not.toHaveBeenCalled();
  });

  describe('the ref', () => {
    it('getValue gives the defaultValue, then the clicked value', async () => {
      const ref = createRef();
      renderControl({ ref });
      expect(ref.current?.getValue()).toBe('single-match');
      await userEvent.click(radio('Mixed'));
      expect(ref.current?.getValue()).toBe('mixed');
    });

    it('setValue checks the option, with no onChange call', () => {
      const onChange = vi.fn();
      const ref = createRef();
      renderControl({ ref, onChange });
      ref.current?.setValue('mixed');
      expect(ref.current?.getValue()).toBe('mixed');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('setValue shows the new option as checked', async () => {
      const ref = createRef();
      renderControl({ ref });
      ref.current?.setValue('mixed');
      expect(
        await screen.findByRole('radio', { name: 'Mixed', checked: true })
      ).toBeInTheDocument();
    });

    it('subscribe hears a click and a setValue', async () => {
      const ref = createRef();
      const listener = vi.fn();
      renderControl({ ref });
      ref.current?.subscribe(listener);
      await userEvent.click(radio('Two-legged'));
      ref.current?.setValue('mixed');
      expect(listener.mock.calls).toEqual([['two-legged'], ['mixed']]);
    });

    it('focus moves the focus to the checked option', () => {
      const ref = createRef();
      renderControl({ ref, defaultValue: 'two-legged' });
      ref.current?.focus();
      expect(radio('Two-legged')).toHaveFocus();
    });
  });

  describe('the keyboard (WAI-ARIA radio group)', () => {
    it('has one Tab stop: the checked option', async () => {
      render(
        <>
          <button type="button">Before</button>
          <SegmentedControl<Format>
            label="Tie format"
            options={OPTIONS}
            defaultValue="two-legged"
          />
          <button type="button">After</button>
        </>
      );
      await userEvent.click(screen.getByRole('button', { name: 'Before' }));
      await userEvent.tab();
      expect(radio('Two-legged')).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    });

    it.each([
      ['{ArrowRight}', 'Two-legged', 'two-legged'],
      ['{ArrowDown}', 'Two-legged', 'two-legged'],
      ['{ArrowLeft}', 'Mixed', 'mixed'],
      ['{ArrowUp}', 'Mixed', 'mixed'],
      ['{End}', 'Mixed', 'mixed'],
      ['{Home}', 'Single match', 'single-match'],
    ])(
      '%s from the first option moves to and selects %s, and wraps',
      async (key, name, value) => {
        const onChange = vi.fn();
        const ref = createRef();
        renderControl({ ref, onChange });
        ref.current?.focus();
        await userEvent.keyboard(key);
        expect(radio(name)).toHaveFocus();
        expect(radio(name)).toHaveAttribute('aria-checked', 'true');
        expect(ref.current?.getValue()).toBe(value);
        if (value === 'single-match') expect(onChange).not.toHaveBeenCalled();
        else expect(onChange).toHaveBeenCalledExactlyOnceWith(value);
      }
    );

    it('ArrowRight from the last option wraps to the first', async () => {
      const ref = createRef();
      renderControl({ ref, defaultValue: 'mixed' });
      ref.current?.focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(radio('Single match')).toHaveFocus();
      expect(ref.current?.getValue()).toBe('single-match');
    });
  });

  describe('disabled', () => {
    it('disables each option, and a click changes nothing', async () => {
      const onChange = vi.fn();
      const ref = createRef();
      renderControl({ disabled: true, onChange, ref });
      for (const el of screen.getAllByRole('radio')) expect(el).toBeDisabled();
      await userEvent.click(radio('Two-legged'));
      expect(onChange).not.toHaveBeenCalled();
      expect(ref.current?.getValue()).toBe('single-match');
    });

    it('is off by default', () => {
      renderControl();
      for (const el of screen.getAllByRole('radio')) expect(el).toBeEnabled();
    });
  });
});
