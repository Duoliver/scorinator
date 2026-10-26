import { describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook, type RenderHookResult } from '@testing-library/preact';
import { createRef, type RefObject } from 'preact';
import type { FieldHandle, FieldHandleState } from '@/design-system/field';
import { useFieldHandle } from './useFieldHandle';

interface FieldProps {
  onChange?: (value: string) => void;
}

interface RenderedField extends RenderHookResult<FieldHandleState<string>, FieldProps> {
  ref: RefObject<FieldHandle<string>>;
  syncDom: Mock;
  focus: Mock;
}

function renderField(onChange?: (value: string) => void): RenderedField {
  const ref = createRef<FieldHandle<string>>();
  const syncDom = vi.fn();
  const focus = vi.fn();
  const initialProps: FieldProps = { onChange };
  const view = renderHook(
    (props: FieldProps) =>
      useFieldHandle(ref, {
        defaultValue: 'start',
        onChange: props.onChange,
        syncDom,
        focus,
      }),
    { initialProps }
  );
  return { ...view, ref, syncDom, focus };
}

describe('useFieldHandle', () => {
  it('starts at the default value', () => {
    const { result, ref } = renderField();

    expect(result.current.value).toBe('start');
    expect(ref.current?.getValue()).toBe('start');
  });

  it('gives the new value from getValue at once after setValue', () => {
    const { ref } = renderField();

    ref.current?.setValue('next');

    expect(ref.current?.getValue()).toBe('next');
  });

  it('writes the value to the DOM and renders it after setValue', () => {
    const { result, ref, syncDom } = renderField();

    act(() => ref.current?.setValue('next'));

    expect(syncDom).toHaveBeenCalledWith('next');
    expect(result.current.value).toBe('next');
  });

  it('calls onChange for a user change, but not for setValue', () => {
    const onChange = vi.fn();
    const { result, ref } = renderField(onChange);

    act(() => ref.current?.setValue('from code'));
    act(() => result.current.commitValue('from user', true));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('from user');
  });

  it('calls the onChange of the latest render', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderField(first);

    rerender({ onChange: second });
    act(() => result.current.commitValue('typed', true));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('typed');
  });

  it('tells each subscriber about every change until it unsubscribes', () => {
    const { result, ref } = renderField();
    const listener = vi.fn();

    const unsubscribe = ref.current?.subscribe(listener);
    act(() => ref.current?.setValue('from code'));
    act(() => result.current.commitValue('from user', true));
    unsubscribe?.();
    act(() => ref.current?.setValue('after'));

    expect(listener.mock.calls).toEqual([['from code'], ['from user']]);
  });

  it('calls the focus option with the current value from focus', () => {
    const { ref, focus } = renderField();

    ref.current?.setValue('next');
    ref.current?.focus();

    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith('next');
  });
});
