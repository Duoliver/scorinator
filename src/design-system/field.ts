export interface FieldHandle<T> {
  getValue: () => T;
  setValue: (value: T) => void;
  // Fires on every change (typed or via setValue) — remove via the returned unsubscribe fn, e.g. in a useEffect cleanup.
  subscribe: (listener: (value: T) => void) => () => void;
  focus: () => void;
}
