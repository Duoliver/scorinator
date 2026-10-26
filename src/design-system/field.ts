export interface FieldHandle<T> {
  getValue: () => T;
  setValue: (value: T) => void;
  // Fires on every change (typed or via setValue) — remove via the returned unsubscribe fn, e.g. in a useEffect cleanup.
  subscribe: (listener: (value: T) => void) => () => void;
  focus: () => void;
}

export interface FieldHandleOptions<T> {
  defaultValue: T;
  onChange?: (value: T) => void;
  // Writes the value to the DOM element(s) of the field. Optional, for a field
  // whose value is not held by a DOM element (Tabs).
  syncDom?: (value: T) => void;
  // Gets the current value, for a field that focuses the element of its value.
  focus: (value: T) => void;
}

export interface FieldHandleState<T> {
  value: T;
  // fromUser: true calls onChange. A setValue call from code does not.
  commitValue: (next: T, fromUser: boolean) => void;
}
