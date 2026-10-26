import type { Ref } from 'preact';
import { useCallback, useImperativeHandle, useRef, useState } from 'preact/hooks';
import type {
  FieldHandle,
  FieldHandleOptions,
  FieldHandleState,
} from '@/design-system/field';

/** The `FieldHandle` code that every field primitive shares: the value state,
 * the listener set, and the ref API. The primitive gives only what differs:
 * how to write the value to its DOM, and what to focus. */
export function useFieldHandle<T>(
  ref: Ref<FieldHandle<T>>,
  { defaultValue, onChange, syncDom, focus }: FieldHandleOptions<T>
): FieldHandleState<T> {
  const [value, setInternalValue] = useState(defaultValue);
  const valueRef = useRef(value);
  const listenersRef = useRef(new Set<(value: T) => void>());
  // Refs, so commitValue and the handle stay stable across renders and still
  // call the callbacks of the latest render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const syncDomRef = useRef(syncDom);
  syncDomRef.current = syncDom;
  const focusRef = useRef(focus);
  focusRef.current = focus;

  const commitValue = useCallback((next: T, fromUser: boolean): void => {
    valueRef.current = next;
    // Preact's setState is batched/async — write the DOM synchronously too so
    // setValue() is immediately reflected, not just on the next render flush.
    syncDomRef.current?.(next);
    setInternalValue(next);
    listenersRef.current.forEach((listener) => listener(next));
    if (fromUser) onChangeRef.current?.(next);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getValue: (): T => valueRef.current,
      setValue: (next: T): void => commitValue(next, false),
      subscribe: (listener: (value: T) => void): (() => void) => {
        listenersRef.current.add(listener);
        return () => listenersRef.current.delete(listener);
      },
      focus: (): void => focusRef.current(valueRef.current),
    }),
    [commitValue]
  );

  return { value, commitValue };
}
